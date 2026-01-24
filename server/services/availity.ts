/**
 * Availity Medical Insurance Eligibility Service
 * 
 * This service handles real-time eligibility verification for medical insurance
 * using the Availity API. Similar to DentalXchange for dental, Availity is
 * a leading clearinghouse for medical insurance verification.
 * 
 * When AVAILITY_CLIENT_ID and AVAILITY_CLIENT_SECRET are not configured,
 * the service returns simulated data for development and testing.
 */

import { db } from "../db";
import { insuranceCarriers } from "@shared/schema";
import { eq } from "drizzle-orm";

interface AvailityConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
}

interface MedicalEligibilityRequest {
  patientId?: string;
  policyId?: string;
  provider: {
    npi: string;
    taxId: string;
    organizationName?: string;
    firstName?: string;
    lastName?: string;
  };
  payer: {
    payerId: string;
    name: string;
  };
  subscriber: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    relationship: string;
    groupNumber?: string;
  };
  serviceType?: string; // Medical service type code
}

interface MedicalBenefit {
  serviceType: string;
  serviceTypeName: string;
  benefitType: string;
  coverageLevel: string;
  inNetwork: boolean;
  coinsurancePercent?: number;
  copayAmount?: string;
  deductibleAmount?: string;
  deductibleRemaining?: string;
  outOfPocketMax?: string;
  outOfPocketRemaining?: string;
  notes?: string;
}

interface MedicalEligibilityResponse {
  success: boolean;
  transactionId: string;
  timestamp: string;
  isSimulated: boolean;
  subscriber: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    groupNumber?: string;
  };
  payer: {
    payerId: string;
    name: string;
  };
  coverage: {
    status: "active" | "inactive" | "unknown";
    effectiveDate?: string;
    terminationDate?: string;
    planName?: string;
    planType?: string;
  };
  benefits: MedicalBenefit[];
  messages: string[];
}

// Common medical service types (HIPAA X12 270/271)
export const MEDICAL_SERVICE_TYPES = [
  { code: "30", name: "Health Benefit Plan Coverage" },
  { code: "1", name: "Medical Care" },
  { code: "2", name: "Surgical" },
  { code: "3", name: "Consultation" },
  { code: "4", name: "Diagnostic X-Ray" },
  { code: "5", name: "Diagnostic Lab" },
  { code: "6", name: "Radiation Therapy" },
  { code: "7", name: "Anesthesia" },
  { code: "8", name: "Surgical Assistance" },
  { code: "12", name: "Durable Medical Equipment" },
  { code: "14", name: "Renal Supplies" },
  { code: "23", name: "Diagnostic Dental" },
  { code: "24", name: "Periodontics" },
  { code: "25", name: "Restorative" },
  { code: "26", name: "Endodontics" },
  { code: "27", name: "Maxillofacial Prosthetics" },
  { code: "28", name: "Oral Surgery" },
  { code: "33", name: "Chiropractic" },
  { code: "35", name: "Dental Care" },
  { code: "36", name: "Dental Crowns" },
  { code: "37", name: "Dental Accident" },
  { code: "38", name: "Orthodontics" },
  { code: "39", name: "Prosthodontics" },
  { code: "40", name: "Oral Surgery - Medical" },
  { code: "42", name: "Home Health Care" },
  { code: "45", name: "Hospice" },
  { code: "48", name: "Hospital Inpatient" },
  { code: "50", name: "Hospital Outpatient" },
  { code: "51", name: "Hospital Emergency" },
  { code: "52", name: "Hospital Ambulatory Surgical" },
  { code: "54", name: "Long Term Care" },
  { code: "56", name: "Medically Related Transportation" },
  { code: "73", name: "General Benefits" },
  { code: "86", name: "Emergency Services" },
  { code: "88", name: "Pharmacy" },
  { code: "98", name: "Professional Physician Visit - Office" },
  { code: "AL", name: "Vision (Optometry)" },
  { code: "MH", name: "Mental Health" },
  { code: "UC", name: "Urgent Care" },
];

// Simulated medical payers (major medical insurance companies)
export const MEDICAL_PAYERS = [
  { payerId: "00001", name: "Aetna", clearinghouseId: "60054" },
  { payerId: "00002", name: "Anthem Blue Cross Blue Shield", clearinghouseId: "47198" },
  { payerId: "00003", name: "Cigna", clearinghouseId: "62308" },
  { payerId: "00004", name: "UnitedHealthcare", clearinghouseId: "87726" },
  { payerId: "00005", name: "Humana", clearinghouseId: "61101" },
  { payerId: "00006", name: "Kaiser Permanente", clearinghouseId: "94135" },
  { payerId: "00007", name: "Blue Cross Blue Shield", clearinghouseId: "00060" },
  { payerId: "00008", name: "Molina Healthcare", clearinghouseId: "20934" },
  { payerId: "00009", name: "Centene", clearinghouseId: "68069" },
  { payerId: "00010", name: "Health Care Service Corporation", clearinghouseId: "00621" },
  { payerId: "00011", name: "Medicare", clearinghouseId: "CMS" },
  { payerId: "00012", name: "Medicaid", clearinghouseId: "XXXXX" },
  { payerId: "00013", name: "Tricare", clearinghouseId: "99726" },
  { payerId: "00014", name: "Wellpoint", clearinghouseId: "47171" },
  { payerId: "00015", name: "Highmark", clearinghouseId: "54771" },
];

class AvailityService {
  private config: AvailityConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const clientId = process.env.AVAILITY_CLIENT_ID;
    const clientSecret = process.env.AVAILITY_CLIENT_SECRET;

    if (clientId && clientSecret) {
      this.config = {
        clientId,
        clientSecret,
        environment: (process.env.AVAILITY_ENVIRONMENT as "sandbox" | "production") || "sandbox",
      };
    }
  }

  public isConfigured(): boolean {
    return this.config !== null;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error("Availity is not configured");
    }

    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // OAuth2 token request to Availity
    const baseUrl = this.config.environment === "production"
      ? "https://api.availity.com"
      : "https://api.sandbox.availity.com";

    const response = await fetch(`${baseUrl}/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: "hipaa",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Availity access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

    return this.accessToken!;
  }

  public async checkEligibility(request: MedicalEligibilityRequest): Promise<MedicalEligibilityResponse> {
    if (!this.isConfigured()) {
      return this.getSimulatedResponse(request);
    }

    try {
      const token = await this.getAccessToken();
      const baseUrl = this.config!.environment === "production"
        ? "https://api.availity.com"
        : "https://api.sandbox.availity.com";

      // Build the eligibility request
      const eligibilityRequest = {
        payerId: request.payer.payerId,
        providerNpi: request.provider.npi,
        providerTaxId: request.provider.taxId,
        memberId: request.subscriber.memberId,
        patientFirstName: request.subscriber.firstName,
        patientLastName: request.subscriber.lastName,
        patientBirthDate: request.subscriber.dateOfBirth,
        serviceType: request.serviceType || "30", // Health Benefit Plan Coverage
      };

      const response = await fetch(`${baseUrl}/v1/coverages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eligibilityRequest),
      });

      if (!response.ok) {
        throw new Error(`Availity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAvailityResponse(data, request);
    } catch (error) {
      console.error("Availity API error:", error);
      // Fall back to simulated response on error
      const simulated = this.getSimulatedResponse(request);
      simulated.messages.push(`API Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      return simulated;
    }
  }

  private parseAvailityResponse(data: any, request: MedicalEligibilityRequest): MedicalEligibilityResponse {
    // Parse the actual Availity response
    // This is a simplified implementation - real responses are more complex
    return {
      success: true,
      transactionId: data.transactionId || `AVL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isSimulated: false,
      subscriber: {
        memberId: request.subscriber.memberId,
        firstName: request.subscriber.firstName,
        lastName: request.subscriber.lastName,
        dateOfBirth: request.subscriber.dateOfBirth,
        groupNumber: request.subscriber.groupNumber,
      },
      payer: {
        payerId: request.payer.payerId,
        name: request.payer.name,
      },
      coverage: {
        status: data.coverageStatus || "active",
        effectiveDate: data.effectiveDate,
        terminationDate: data.terminationDate,
        planName: data.planName,
        planType: data.planType,
      },
      benefits: data.benefits || [],
      messages: data.messages || [],
    };
  }

  private getSimulatedResponse(request: MedicalEligibilityRequest): MedicalEligibilityResponse {
    // Generate realistic simulated medical benefits
    const isActive = Math.random() > 0.1; // 90% chance of active coverage
    const hasDeductibleMet = Math.random() > 0.5;
    const deductibleAmount = [500, 1000, 1500, 2000, 2500][Math.floor(Math.random() * 5)];
    const deductibleMet = hasDeductibleMet ? deductibleAmount : Math.floor(Math.random() * deductibleAmount);
    const outOfPocketMax = deductibleAmount * 4;
    const outOfPocketUsed = Math.floor(Math.random() * outOfPocketMax * 0.4);

    const benefits: MedicalBenefit[] = [
      {
        serviceType: "30",
        serviceTypeName: "Health Benefit Plan Coverage",
        benefitType: "Active Coverage",
        coverageLevel: "Individual",
        inNetwork: true,
        deductibleAmount: `$${deductibleAmount}`,
        deductibleRemaining: `$${deductibleAmount - deductibleMet}`,
        outOfPocketMax: `$${outOfPocketMax}`,
        outOfPocketRemaining: `$${outOfPocketMax - outOfPocketUsed}`,
      },
      {
        serviceType: "40",
        serviceTypeName: "Oral Surgery - Medical",
        benefitType: "Co-Insurance",
        coverageLevel: "Individual",
        inNetwork: true,
        coinsurancePercent: 80,
        deductibleAmount: `$${deductibleAmount}`,
        notes: "Subject to annual deductible. Pre-authorization required for surgical procedures.",
      },
      {
        serviceType: "40",
        serviceTypeName: "Oral Surgery - Medical",
        benefitType: "Co-Insurance",
        coverageLevel: "Individual",
        inNetwork: false,
        coinsurancePercent: 60,
        notes: "Out-of-network benefits. Higher out-of-pocket costs apply.",
      },
      {
        serviceType: "7",
        serviceTypeName: "Anesthesia",
        benefitType: "Co-Insurance",
        coverageLevel: "Individual",
        inNetwork: true,
        coinsurancePercent: 80,
        notes: "Covered when medically necessary for oral surgery.",
      },
      {
        serviceType: "48",
        serviceTypeName: "Hospital Inpatient",
        benefitType: "Co-Pay",
        coverageLevel: "Individual",
        inNetwork: true,
        copayAmount: "$250",
        coinsurancePercent: 80,
        notes: "Per admission. Pre-authorization required.",
      },
      {
        serviceType: "52",
        serviceTypeName: "Hospital Ambulatory Surgical",
        benefitType: "Co-Pay",
        coverageLevel: "Individual",
        inNetwork: true,
        copayAmount: "$150",
        coinsurancePercent: 80,
        notes: "Outpatient surgery facility fee.",
      },
    ];

    const effectiveDate = new Date();
    effectiveDate.setMonth(effectiveDate.getMonth() - 8);

    return {
      success: true,
      transactionId: `SIM-MED-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isSimulated: true,
      subscriber: {
        memberId: request.subscriber.memberId,
        firstName: request.subscriber.firstName,
        lastName: request.subscriber.lastName,
        dateOfBirth: request.subscriber.dateOfBirth,
        groupNumber: request.subscriber.groupNumber || "GRP" + Math.floor(Math.random() * 100000),
      },
      payer: {
        payerId: request.payer.payerId,
        name: request.payer.name,
      },
      coverage: {
        status: isActive ? "active" : "inactive",
        effectiveDate: effectiveDate.toISOString().split("T")[0],
        planName: `${request.payer.name} PPO Plan`,
        planType: "PPO",
      },
      benefits: isActive ? benefits : [],
      messages: isActive
        ? ["SIMULATED RESPONSE - Availity credentials not configured", "Pre-authorization may be required for surgical procedures"]
        : ["SIMULATED RESPONSE - Coverage is inactive"],
    };
  }

  public async getMedicalPayers(): Promise<typeof MEDICAL_PAYERS> {
    // In production, this would fetch from Availity's payer list API
    return MEDICAL_PAYERS;
  }

  public async syncMedicalPayersToDatabase(): Promise<number> {
    let count = 0;
    
    for (const payer of MEDICAL_PAYERS) {
      // Check if carrier already exists
      const existing = await db.query.insuranceCarriers.findFirst({
        where: eq(insuranceCarriers.name, payer.name),
      });

      if (!existing) {
        await db.insert(insuranceCarriers).values({
          name: payer.name,
          insuranceType: "medical",
          payerId: payer.payerId,
          clearinghouseCompatible: true,
        });
        count++;
      }
    }

    return count;
  }
}

export const availityService = new AvailityService();
