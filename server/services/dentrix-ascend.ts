import { db } from "../db";
import { dentrixAscendConfig, dentrixSyncLog, dentrixPatientMapping, patients } from "@shared/schema";
import type { DentrixAscendConfig, InsertDentrixSyncLog, InsertPatient } from "@shared/schema";
import { eq } from "drizzle-orm";

interface DentrixPatient {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  ssn?: string;
  gender?: string;
  email?: string;
  homePhone?: string;
  cellPhone?: string;
  workPhone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insurances?: DentrixInsurance[];
}

interface DentrixInsurance {
  payerId: string;
  payerName: string;
  subscriberId: string;
  groupNumber?: string;
  subscriberName: string;
  relationshipToSubscriber: string;
  effectiveDate?: string;
  terminationDate?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface PatientListResponse {
  data: DentrixPatient[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

export class DentrixAscendService {
  private config: DentrixAscendConfig | null = null;
  private baseUrl: string = "https://api.dentrixascend.com";
  private currentPracticeId: string | null = null;

  async loadConfig(practiceId?: string): Promise<DentrixAscendConfig | null> {
    if (practiceId) {
      this.currentPracticeId = practiceId;
      const configs = await db.select().from(dentrixAscendConfig)
        .where(eq(dentrixAscendConfig.practiceId, practiceId))
        .limit(1);
      this.config = configs[0] || null;
    } else {
      const configs = await db.select().from(dentrixAscendConfig).limit(1);
      this.config = configs[0] || null;
    }
    if (this.config?.baseUrl) {
      this.baseUrl = this.config.baseUrl;
    }
    return this.config;
  }

  async saveConfig(config: Partial<DentrixAscendConfig>, practiceId?: string): Promise<DentrixAscendConfig> {
    const targetPracticeId = practiceId || this.currentPracticeId;
    const existing = await this.loadConfig(targetPracticeId || undefined);
    
    if (existing) {
      const [updated] = await db
        .update(dentrixAscendConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(dentrixAscendConfig.id, existing.id))
        .returning();
      this.config = updated;
      return updated;
    } else {
      const [created] = await db
        .insert(dentrixAscendConfig)
        .values({ ...config, practiceId: targetPracticeId } as any)
        .returning();
      this.config = created;
      return created;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await this.loadConfig();
    
    if (!config?.clientId || !config?.clientSecret) {
      return { success: false, message: "Missing OAuth credentials (Client ID and Client Secret)" };
    }

    if (!config?.apiKey) {
      return { success: false, message: "Missing API Key" };
    }

    try {
      const tokenResult = await this.refreshAccessToken();
      if (!tokenResult.success) {
        return { success: false, message: tokenResult.message || "Failed to authenticate" };
      }
      
      return { success: true, message: "Successfully connected to Dentrix Ascend" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return { success: false, message };
    }
  }

  private async refreshAccessToken(): Promise<{ success: boolean; message?: string }> {
    if (!this.config?.clientId || !this.config?.clientSecret) {
      return { success: false, message: "Missing OAuth credentials" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-API-Key": this.config.apiKey || "",
        },
        body: new URLSearchParams({
          grant_type: this.config.refreshToken ? "refresh_token" : "client_credentials",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          ...(this.config.refreshToken ? { refresh_token: this.config.refreshToken } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `OAuth error: ${response.status} - ${errorText}` };
      }

      const tokenData: TokenResponse = await response.json();
      
      await this.saveConfig({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Token refresh failed";
      return { success: false, message };
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    await this.loadConfig();
    
    if (!this.config?.accessToken) {
      const result = await this.refreshAccessToken();
      return result.success;
    }

    if (this.config.tokenExpiresAt && new Date(this.config.tokenExpiresAt) < new Date()) {
      const result = await this.refreshAccessToken();
      return result.success;
    }

    return true;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const hasValidToken = await this.ensureValidToken();
    if (!hasValidToken) {
      throw new Error("Unable to authenticate with Dentrix Ascend");
    }

    await this.loadConfig();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.config?.accessToken}`,
        "X-API-Key": this.config?.apiKey || "",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dentrix API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getPatient(dentrixPatientId: string): Promise<DentrixPatient | null> {
    try {
      const patient = await this.makeRequest<DentrixPatient>(`/api/v1/patients/${dentrixPatientId}`);
      return patient;
    } catch (error) {
      console.error(`Error fetching patient ${dentrixPatientId}:`, error);
      return null;
    }
  }

  async getPatients(page: number = 1, pageSize: number = 100): Promise<PatientListResponse> {
    return this.makeRequest<PatientListResponse>(
      `/api/v1/patients?page=${page}&pageSize=${pageSize}`
    );
  }

  async syncSinglePatient(dentrixPatientId: string): Promise<{
    success: boolean;
    action: "created" | "updated" | "skipped";
    localPatientId?: string;
    message?: string;
  }> {
    const dentrixPatient = await this.getPatient(dentrixPatientId);
    
    if (!dentrixPatient) {
      return { success: false, action: "skipped", message: "Patient not found in Dentrix" };
    }

    const existingMapping = await db
      .select()
      .from(dentrixPatientMapping)
      .where(eq(dentrixPatientMapping.dentrixPatientId, dentrixPatientId))
      .limit(1);

    const patientData: InsertPatient = {
      firstName: dentrixPatient.firstName,
      lastName: dentrixPatient.lastName,
      dateOfBirth: dentrixPatient.dateOfBirth,
      ssnLast4: dentrixPatient.ssn?.slice(-4),
      phone: dentrixPatient.cellPhone || dentrixPatient.homePhone || dentrixPatient.workPhone,
      email: dentrixPatient.email,
      address: [dentrixPatient.address1, dentrixPatient.address2].filter(Boolean).join(", "),
      city: dentrixPatient.city,
      state: dentrixPatient.state,
      zipCode: dentrixPatient.zipCode,
      emergencyContactName: dentrixPatient.emergencyContactName,
      emergencyContactPhone: dentrixPatient.emergencyContactPhone,
    };

    if (existingMapping.length > 0) {
      await db
        .update(patients)
        .set(patientData)
        .where(eq(patients.id, existingMapping[0].localPatientId));

      await db
        .update(dentrixPatientMapping)
        .set({
          lastSyncedAt: new Date(),
          dentrixData: JSON.stringify(dentrixPatient),
        })
        .where(eq(dentrixPatientMapping.id, existingMapping[0].id));

      return {
        success: true,
        action: "updated",
        localPatientId: existingMapping[0].localPatientId,
      };
    } else {
      const [newPatient] = await db
        .insert(patients)
        .values(patientData)
        .returning();

      await db.insert(dentrixPatientMapping).values({
        dentrixPatientId: dentrixPatientId,
        localPatientId: newPatient.id,
        dentrixData: JSON.stringify(dentrixPatient),
      });

      return {
        success: true,
        action: "created",
        localPatientId: newPatient.id,
      };
    }
  }

  async syncAllPatients(syncType: "full" | "incremental" = "full"): Promise<string> {
    const config = await this.loadConfig();
    
    if (!config?.isEnabled) {
      throw new Error("Dentrix Ascend integration is not enabled");
    }

    const [syncLog] = await db
      .insert(dentrixSyncLog)
      .values({
        configId: config.id,
        syncType,
        status: "in_progress",
      })
      .returning();

    await this.saveConfig({ lastSyncStatus: "in_progress" });

    this.runSync(syncLog.id, syncType).catch(console.error);

    return syncLog.id;
  }

  private async runSync(syncLogId: string, syncType: string): Promise<void> {
    let patientsProcessed = 0;
    let patientsCreated = 0;
    let patientsUpdated = 0;
    let patientsSkipped = 0;

    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.getPatients(page, 100);
        
        for (const dentrixPatient of response.data) {
          patientsProcessed++;
          
          try {
            const result = await this.syncSinglePatient(dentrixPatient.id);
            
            if (result.action === "created") patientsCreated++;
            else if (result.action === "updated") patientsUpdated++;
            else patientsSkipped++;
          } catch (error) {
            patientsSkipped++;
            console.error(`Error syncing patient ${dentrixPatient.id}:`, error);
          }
        }

        hasMore = page < response.pagination.totalPages;
        page++;
      }

      await db
        .update(dentrixSyncLog)
        .set({
          status: "completed",
          patientsProcessed,
          patientsCreated,
          patientsUpdated,
          patientsSkipped,
          completedAt: new Date(),
        })
        .where(eq(dentrixSyncLog.id, syncLogId));

      await this.saveConfig({
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
      
      await db
        .update(dentrixSyncLog)
        .set({
          status: "failed",
          patientsProcessed,
          patientsCreated,
          patientsUpdated,
          patientsSkipped,
          errorMessage,
          completedAt: new Date(),
        })
        .where(eq(dentrixSyncLog.id, syncLogId));

      await this.saveConfig({
        lastSyncAt: new Date(),
        lastSyncStatus: "failed",
        lastSyncError: errorMessage,
      });
    }
  }

  async getSyncStatus(syncLogId: string): Promise<typeof dentrixSyncLog.$inferSelect | null> {
    const [log] = await db
      .select()
      .from(dentrixSyncLog)
      .where(eq(dentrixSyncLog.id, syncLogId))
      .limit(1);
    
    return log || null;
  }

  async getRecentSyncLogs(limit: number = 10): Promise<typeof dentrixSyncLog.$inferSelect[]> {
    return db
      .select()
      .from(dentrixSyncLog)
      .orderBy(dentrixSyncLog.startedAt)
      .limit(limit);
  }

  async getPatientMapping(dentrixPatientId: string): Promise<typeof dentrixPatientMapping.$inferSelect | null> {
    const [mapping] = await db
      .select()
      .from(dentrixPatientMapping)
      .where(eq(dentrixPatientMapping.dentrixPatientId, dentrixPatientId))
      .limit(1);
    
    return mapping || null;
  }

  generateSimulatedPatients(count: number = 10): DentrixPatient[] {
    const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Jennifer"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `DTX-${Date.now()}-${i}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      dateOfBirth: `${1960 + (i % 40)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      email: `patient${i}@example.com`,
      cellPhone: `555-${String(100 + i).padStart(3, "0")}-${String(1000 + i).padStart(4, "0")}`,
      address1: `${100 + i} Main Street`,
      city: "Springfield",
      state: "CA",
      zipCode: "90210",
    }));
  }
}

export const dentrixAscendService = new DentrixAscendService();
