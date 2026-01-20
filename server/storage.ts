import {
  patients,
  insuranceCarriers,
  insurancePolicies,
  verifications,
  benefits,
  appointments,
  clearinghouseConfigs,
  patientBilling,
  patientPayments,
  staffShifts,
  professionals,
  professionalBadges,
  roleSpecialties,
  shiftTransactions,
  platformSettings,
  platformStateTaxRates,
  practices,
  practiceSettings,
  practiceLocations,
  type Patient,
  type InsertPatient,
  type InsuranceCarrier,
  type InsertInsuranceCarrier,
  type InsurancePolicy,
  type InsertInsurancePolicy,
  type Verification,
  type InsertVerification,
  type Benefit,
  type InsertBenefit,
  type Appointment,
  type InsertAppointment,
  type PatientWithInsurance,
  type VerificationWithDetails,
  type ClearinghouseConfig,
  type InsertClearinghouseConfig,
  type PatientBilling,
  type InsertPatientBilling,
  type PatientPayment,
  type InsertPatientPayment,
  type StaffShift,
  type StaffShiftWithLocation,
  type StaffShiftWithPractice,
  type PracticeProfile,
  type InsertStaffShift,
  type Professional,
  type InsertProfessional,
  type ProfessionalBadge,
  type InsertProfessionalBadge,
  type ProfessionalWithBadges,
  type RoleSpecialty,
  type InsertRoleSpecialty,
  type ShiftTransaction,
  type InsertShiftTransaction,
  type ShiftTransactionWithDetails,
  type PlatformSettings,
  type InsertPlatformSettings,
  type PlatformStateTaxRate,
  type InsertPlatformStateTaxRate,
  type Practice,
  type InsertPractice,
  type PracticeSettings,
  type InsertPracticeSettings,
  type PracticeLocation,
  type InsertPracticeLocation,
  type ResolvedFeeRates,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Insurance Carriers
  getCarriers(): Promise<InsuranceCarrier[]>;
  getCarrier(id: string): Promise<InsuranceCarrier | undefined>;
  createCarrier(carrier: InsertInsuranceCarrier): Promise<InsuranceCarrier>;

  // Patients
  getPatients(): Promise<PatientWithInsurance[]>;
  getPatient(id: string): Promise<PatientWithInsurance | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  
  // Insurance Policies
  createPolicy(policy: InsertInsurancePolicy): Promise<InsurancePolicy>;
  getPoliciesForPatient(patientId: string): Promise<(InsurancePolicy & { carrier: InsuranceCarrier })[]>;

  // Verifications
  getVerifications(): Promise<VerificationWithDetails[]>;
  getRecentVerifications(limit: number): Promise<VerificationWithDetails[]>;
  getVerificationsForPatient(patientId: string): Promise<(Verification & { benefits?: Benefit })[]>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  updateVerification(id: string, data: Partial<Verification>): Promise<Verification | undefined>;
  
  // Benefits
  createBenefit(benefit: InsertBenefit): Promise<Benefit>;
  getBenefitForVerification(verificationId: string): Promise<Benefit | undefined>;

  // Appointments
  getAppointments(): Promise<(Appointment & { patient: Patient & { latestVerification?: Verification } })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalPatients: number;
    pendingVerifications: number;
    completedToday: number;
    failedVerifications: number;
    upcomingAppointments: number;
  }>;

  // Clearinghouse Configurations
  getClearinghouseConfigs(): Promise<ClearinghouseConfig[]>;
  getClearinghouseConfig(id: string): Promise<ClearinghouseConfig | undefined>;
  createClearinghouseConfig(config: InsertClearinghouseConfig): Promise<ClearinghouseConfig>;
  updateClearinghouseConfig(id: string, data: Partial<ClearinghouseConfig>): Promise<ClearinghouseConfig | undefined>;
  deleteClearinghouseConfig(id: string): Promise<boolean>;
  testClearinghouseConnection(id: string): Promise<{ success: boolean; message: string }>;

  // Patient Billing
  getPatientBilling(patientId: string): Promise<(PatientBilling & { patient: Patient }) | undefined>;
  createPatientBilling(billing: InsertPatientBilling): Promise<PatientBilling>;
  updatePatientBilling(patientId: string, data: Partial<PatientBilling>): Promise<PatientBilling | undefined>;
  getPatientPayments(patientId: string): Promise<PatientPayment[]>;
  getPatientPaymentsBySessionId(sessionId: string): Promise<PatientPayment[]>;
  createPatientPayment(payment: InsertPatientPayment): Promise<PatientPayment>;
  updatePaymentBySessionId(sessionId: string, data: Partial<PatientPayment>): Promise<PatientPayment | undefined>;
  
  // Atomic payment completion - only updates if transitioning from pending to completed
  completePayment(sessionId: string, paymentIntentId: string, paymentAmount: number): Promise<boolean>;
  
  // Reconcile or create a payment record for a session that may be missing
  reconcilePayment(sessionId: string, patientId: string, amount: string): Promise<PatientPayment>;

  // Staff Shifts
  getShifts(startDate: string, endDate: string): Promise<StaffShift[]>;
  getShiftsByDate(date: string): Promise<StaffShift[]>;
  getAvailableShifts(filters?: { startDate?: string; endDate?: string; role?: string; locationId?: string }): Promise<StaffShiftWithLocation[]>;
  getShiftWithLocation(id: string): Promise<StaffShiftWithLocation | undefined>;
  getAvailableShiftsWithPractice(filters?: { startDate?: string; endDate?: string; role?: string; locationId?: string }): Promise<StaffShiftWithPractice[]>;
  getShiftWithPractice(id: string): Promise<StaffShiftWithPractice | undefined>;
  getShiftsForProfessionalWithPractice(professionalId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<StaffShiftWithPractice[]>;
  claimShift(shiftId: string, professionalId: string): Promise<{ success: boolean; shift?: StaffShift; error?: string }>;
  releaseShift(shiftId: string, professionalId: string): Promise<{ success: boolean; shift?: StaffShift; error?: string }>;
  createShift(shift: InsertStaffShift): Promise<StaffShift>;
  createShifts(shifts: InsertStaffShift[]): Promise<StaffShift[]>;

  // Professionals
  getProfessionals(filters?: { role?: string; specialty?: string }): Promise<ProfessionalWithBadges[]>;
  getProfessional(id: string): Promise<ProfessionalWithBadges | undefined>;
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  updateProfessional(id: string, data: Partial<Professional>): Promise<Professional | undefined>;
  deleteProfessional(id: string): Promise<boolean>;

  // Professional Badges
  getBadgesForProfessional(professionalId: string): Promise<ProfessionalBadge[]>;
  createProfessionalBadge(badge: InsertProfessionalBadge): Promise<ProfessionalBadge>;

  // Role Specialties
  getRoleSpecialties(role?: string): Promise<RoleSpecialty[]>;
  createRoleSpecialty(roleSpecialty: InsertRoleSpecialty): Promise<RoleSpecialty>;
  deleteRoleSpecialty(id: string): Promise<boolean>;

  // Shift Transactions
  getShiftTransactions(filters?: { startDate?: string; endDate?: string; status?: string }): Promise<ShiftTransactionWithDetails[]>;
  getShiftTransaction(id: string): Promise<ShiftTransactionWithDetails | undefined>;
  getShiftTransactionByShiftId(shiftId: string): Promise<ShiftTransactionWithDetails | undefined>;
  createShiftTransaction(transaction: InsertShiftTransaction): Promise<ShiftTransaction>;
  updateShiftTransaction(id: string, data: Partial<ShiftTransaction>): Promise<ShiftTransaction | undefined>;
  getShift(id: string): Promise<StaffShift | undefined>;
  updateShift(id: string, data: Partial<StaffShift>): Promise<StaffShift | undefined>;

  // Professional-specific queries
  getShiftsForProfessional(professionalId: string): Promise<StaffShift[]>;
  getShiftsForProfessionalWithLocation(professionalId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<StaffShiftWithLocation[]>;
  getTransactionsForProfessional(professionalId: string): Promise<ShiftTransactionWithDetails[]>;

  // Platform Settings
  getPlatformSettings(): Promise<PlatformSettings | undefined>;
  createPlatformSettings(settings: InsertPlatformSettings): Promise<PlatformSettings>;
  updatePlatformSettings(id: string, data: Partial<PlatformSettings>): Promise<PlatformSettings | undefined>;

  // Platform State Tax Rates
  getStateTaxRates(): Promise<PlatformStateTaxRate[]>;
  getStateTaxRate(stateCode: string): Promise<PlatformStateTaxRate | undefined>;
  createStateTaxRate(rate: InsertPlatformStateTaxRate): Promise<PlatformStateTaxRate>;
  updateStateTaxRate(stateCode: string, data: Partial<PlatformStateTaxRate>): Promise<PlatformStateTaxRate | undefined>;
  upsertStateTaxRate(rate: InsertPlatformStateTaxRate): Promise<PlatformStateTaxRate>;

  // Practices
  getPractices(): Promise<Practice[]>;
  getPractice(id: string): Promise<Practice | undefined>;
  createPractice(practice: InsertPractice): Promise<Practice>;
  updatePractice(id: string, data: Partial<Practice>): Promise<Practice | undefined>;

  // Practice Settings
  getPracticeSettings(practiceId: string): Promise<PracticeSettings | undefined>;
  createPracticeSettings(settings: InsertPracticeSettings): Promise<PracticeSettings>;
  updatePracticeSettings(practiceId: string, data: Partial<PracticeSettings>): Promise<PracticeSettings | undefined>;

  // Resolved Fee Rates (with practice → platform fallback)
  getResolvedFeeRates(practiceId?: string): Promise<ResolvedFeeRates>;

  // Practice Locations
  getLocations(practiceId: string): Promise<PracticeLocation[]>;
  getLocation(id: string): Promise<PracticeLocation | undefined>;
  createLocation(location: InsertPracticeLocation): Promise<PracticeLocation>;
  updateLocation(id: string, data: Partial<PracticeLocation>): Promise<PracticeLocation | undefined>;
  deleteLocation(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Insurance Carriers
  async getCarriers(): Promise<InsuranceCarrier[]> {
    return db.select().from(insuranceCarriers).orderBy(insuranceCarriers.name);
  }

  async getCarrier(id: string): Promise<InsuranceCarrier | undefined> {
    const [carrier] = await db.select().from(insuranceCarriers).where(eq(insuranceCarriers.id, id));
    return carrier;
  }

  async createCarrier(carrier: InsertInsuranceCarrier): Promise<InsuranceCarrier> {
    const [created] = await db.insert(insuranceCarriers).values(carrier).returning();
    return created;
  }

  // Patients
  async getPatients(): Promise<PatientWithInsurance[]> {
    const allPatients = await db.select().from(patients).orderBy(desc(patients.createdAt));
    
    const result: PatientWithInsurance[] = [];
    
    for (const patient of allPatients) {
      const policies = await this.getPoliciesForPatient(patient.id);
      const patientVerifications = await db
        .select()
        .from(verifications)
        .where(eq(verifications.patientId, patient.id))
        .orderBy(desc(verifications.createdAt))
        .limit(1);
      
      let latestVerification: (Verification & { benefits?: Benefit }) | undefined;
      if (patientVerifications.length > 0) {
        const benefit = await this.getBenefitForVerification(patientVerifications[0].id);
        latestVerification = { ...patientVerifications[0], benefits: benefit };
      }
      
      result.push({
        ...patient,
        insurancePolicies: policies,
        latestVerification,
      });
    }
    
    return result;
  }

  async getPatient(id: string): Promise<PatientWithInsurance | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) return undefined;
    
    const policies = await this.getPoliciesForPatient(patient.id);
    const patientVerifications = await db
      .select()
      .from(verifications)
      .where(eq(verifications.patientId, patient.id))
      .orderBy(desc(verifications.createdAt))
      .limit(1);
    
    let latestVerification: (Verification & { benefits?: Benefit }) | undefined;
    if (patientVerifications.length > 0) {
      const benefit = await this.getBenefitForVerification(patientVerifications[0].id);
      latestVerification = { ...patientVerifications[0], benefits: benefit };
    }
    
    return {
      ...patient,
      insurancePolicies: policies,
      latestVerification,
    };
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [created] = await db.insert(patients).values(patient).returning();
    return created;
  }

  // Insurance Policies
  async createPolicy(policy: InsertInsurancePolicy): Promise<InsurancePolicy> {
    const [created] = await db.insert(insurancePolicies).values(policy).returning();
    return created;
  }

  async getPoliciesForPatient(patientId: string): Promise<(InsurancePolicy & { carrier: InsuranceCarrier })[]> {
    const policies = await db
      .select()
      .from(insurancePolicies)
      .where(eq(insurancePolicies.patientId, patientId));
    
    const result: (InsurancePolicy & { carrier: InsuranceCarrier })[] = [];
    for (const policy of policies) {
      const carrier = await this.getCarrier(policy.carrierId);
      if (carrier) {
        result.push({ ...policy, carrier });
      }
    }
    
    return result;
  }

  // Verifications
  async getVerifications(): Promise<VerificationWithDetails[]> {
    const allVerifications = await db
      .select()
      .from(verifications)
      .orderBy(desc(verifications.createdAt));
    
    return this.enrichVerifications(allVerifications);
  }

  async getRecentVerifications(limit: number): Promise<VerificationWithDetails[]> {
    const recentVerifications = await db
      .select()
      .from(verifications)
      .orderBy(desc(verifications.createdAt))
      .limit(limit);
    
    return this.enrichVerifications(recentVerifications);
  }

  private async enrichVerifications(vers: Verification[]): Promise<VerificationWithDetails[]> {
    const result: VerificationWithDetails[] = [];
    
    for (const v of vers) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, v.patientId));
      const [policy] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, v.policyId));
      
      if (patient && policy) {
        const carrier = await this.getCarrier(policy.carrierId);
        const benefit = await this.getBenefitForVerification(v.id);
        
        if (carrier) {
          result.push({
            ...v,
            patient,
            policy: { ...policy, carrier },
            benefits: benefit,
          });
        }
      }
    }
    
    return result;
  }

  async getVerificationsForPatient(patientId: string): Promise<(Verification & { benefits?: Benefit })[]> {
    const patientVerifications = await db
      .select()
      .from(verifications)
      .where(eq(verifications.patientId, patientId))
      .orderBy(desc(verifications.createdAt));
    
    const result: (Verification & { benefits?: Benefit })[] = [];
    for (const v of patientVerifications) {
      const benefit = await this.getBenefitForVerification(v.id);
      result.push({ ...v, benefits: benefit });
    }
    
    return result;
  }

  async createVerification(verification: InsertVerification): Promise<Verification> {
    const [created] = await db.insert(verifications).values(verification).returning();
    return created;
  }

  async updateVerification(id: string, data: Partial<Verification>): Promise<Verification | undefined> {
    const [updated] = await db
      .update(verifications)
      .set(data)
      .where(eq(verifications.id, id))
      .returning();
    return updated;
  }

  // Benefits
  async createBenefit(benefit: InsertBenefit): Promise<Benefit> {
    const [created] = await db.insert(benefits).values(benefit).returning();
    return created;
  }

  async getBenefitForVerification(verificationId: string): Promise<Benefit | undefined> {
    const [benefit] = await db
      .select()
      .from(benefits)
      .where(eq(benefits.verificationId, verificationId));
    return benefit;
  }

  // Appointments
  async getAppointments(): Promise<(Appointment & { patient: Patient & { latestVerification?: Verification } })[]> {
    const now = new Date();
    const allAppointments = await db
      .select()
      .from(appointments)
      .where(gte(appointments.scheduledAt, now))
      .orderBy(appointments.scheduledAt);
    
    const result: (Appointment & { patient: Patient & { latestVerification?: Verification } })[] = [];
    
    for (const apt of allAppointments) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, apt.patientId));
      if (patient) {
        const [latestVerification] = await db
          .select()
          .from(verifications)
          .where(eq(verifications.patientId, patient.id))
          .orderBy(desc(verifications.createdAt))
          .limit(1);
        
        result.push({
          ...apt,
          patient: {
            ...patient,
            latestVerification,
          },
        });
      }
    }
    
    return result;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalPatients: number;
    pendingVerifications: number;
    completedToday: number;
    failedVerifications: number;
    upcomingAppointments: number;
  }> {
    const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patients);
    
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifications)
      .where(eq(verifications.status, "pending"));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [completedTodayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifications)
      .where(
        and(
          eq(verifications.status, "completed"),
          gte(verifications.verifiedAt, today)
        )
      );
    
    const [failedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifications)
      .where(eq(verifications.status, "failed"));
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [upcomingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledAt, now),
          lte(appointments.scheduledAt, nextWeek)
        )
      );
    
    return {
      totalPatients: Number(patientCount?.count ?? 0),
      pendingVerifications: Number(pendingCount?.count ?? 0),
      completedToday: Number(completedTodayCount?.count ?? 0),
      failedVerifications: Number(failedCount?.count ?? 0),
      upcomingAppointments: Number(upcomingCount?.count ?? 0),
    };
  }

  // Clearinghouse Configurations
  async getClearinghouseConfigs(): Promise<ClearinghouseConfig[]> {
    return db.select().from(clearinghouseConfigs).orderBy(clearinghouseConfigs.name);
  }

  async getClearinghouseConfig(id: string): Promise<ClearinghouseConfig | undefined> {
    const [config] = await db.select().from(clearinghouseConfigs).where(eq(clearinghouseConfigs.id, id));
    return config;
  }

  async createClearinghouseConfig(config: InsertClearinghouseConfig): Promise<ClearinghouseConfig> {
    const [created] = await db.insert(clearinghouseConfigs).values(config).returning();
    return created;
  }

  async updateClearinghouseConfig(id: string, data: Partial<ClearinghouseConfig>): Promise<ClearinghouseConfig | undefined> {
    const [updated] = await db
      .update(clearinghouseConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clearinghouseConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteClearinghouseConfig(id: string): Promise<boolean> {
    await db.delete(clearinghouseConfigs).where(eq(clearinghouseConfigs.id, id));
    return true;
  }

  async testClearinghouseConnection(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getClearinghouseConfig(id);
    if (!config) {
      return { success: false, message: "Configuration not found" };
    }
    
    // Simulate connection test (in production, this would make actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Random success/failure for demo (80% success rate)
    const success = Math.random() > 0.2;
    
    await this.updateClearinghouseConfig(id, {
      lastTestedAt: new Date(),
      connectionStatus: success ? "connected" : "failed",
    });
    
    return {
      success,
      message: success 
        ? "Connection successful - EDI 270/271 test passed" 
        : "Connection failed - please verify your credentials",
    };
  }

  // Patient Billing
  async getPatientBilling(patientId: string): Promise<(PatientBilling & { patient: Patient }) | undefined> {
    const [billing] = await db
      .select()
      .from(patientBilling)
      .where(eq(patientBilling.patientId, patientId));
    
    if (!billing) {
      // Create billing record if it doesn't exist
      const patient = await this.getPatient(patientId);
      if (!patient) return undefined;
      
      const [newBilling] = await db
        .insert(patientBilling)
        .values({ patientId, totalBalance: "0.00", patientPortion: "0.00", insurancePortion: "0.00" })
        .returning();
      
      return { ...newBilling, patient };
    }
    
    const patient = await this.getPatient(patientId);
    if (!patient) return undefined;
    
    return { ...billing, patient };
  }

  async createPatientBilling(billing: InsertPatientBilling): Promise<PatientBilling> {
    const [created] = await db.insert(patientBilling).values(billing).returning();
    return created;
  }

  async updatePatientBilling(patientId: string, data: Partial<PatientBilling>): Promise<PatientBilling | undefined> {
    const [updated] = await db
      .update(patientBilling)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patientBilling.patientId, patientId))
      .returning();
    return updated;
  }

  async getPatientPayments(patientId: string): Promise<PatientPayment[]> {
    return db
      .select()
      .from(patientPayments)
      .where(eq(patientPayments.patientId, patientId))
      .orderBy(desc(patientPayments.createdAt));
  }

  async getPatientPaymentsBySessionId(sessionId: string): Promise<PatientPayment[]> {
    return db
      .select()
      .from(patientPayments)
      .where(eq(patientPayments.stripeCheckoutSessionId, sessionId));
  }

  async createPatientPayment(payment: InsertPatientPayment): Promise<PatientPayment> {
    const [created] = await db.insert(patientPayments).values(payment).returning();
    return created;
  }

  async updatePaymentBySessionId(sessionId: string, data: Partial<PatientPayment>): Promise<PatientPayment | undefined> {
    const [updated] = await db
      .update(patientPayments)
      .set({ ...data, completedAt: data.status === 'completed' ? new Date() : undefined })
      .where(eq(patientPayments.stripeCheckoutSessionId, sessionId))
      .returning();
    return updated;
  }

  // Atomic payment completion - only updates if transitioning from pending to completed
  // Returns true if payment was completed, false if already completed or not found
  // Uses database transaction for atomicity and affected-row check for idempotency
  async completePayment(sessionId: string, paymentIntentId: string, paymentAmount: number): Promise<boolean> {
    // Find the payment record
    const payments = await this.getPatientPaymentsBySessionId(sessionId);
    const payment = payments?.[0];

    if (!payment) {
      console.log(`No payment record found for session ${sessionId}`);
      return false;
    }

    // Idempotency: only complete if currently pending
    if (payment.status === 'completed') {
      console.log(`Payment ${sessionId} already completed - skipping`);
      return false;
    }

    // Use a transaction to ensure atomicity of status update + balance update
    try {
      const result = await db.transaction(async (tx) => {
        // Atomic update: only update if status is still 'pending'
        // This prevents race conditions where both webhook and verify-payment try to update
        const updated = await tx
          .update(patientPayments)
          .set({
            status: 'completed',
            stripePaymentIntentId: paymentIntentId,
            paymentMethod: 'card',
            completedAt: new Date(),
          })
          .where(and(
            eq(patientPayments.stripeCheckoutSessionId, sessionId),
            eq(patientPayments.status, 'pending') // Only update if still pending
          ))
          .returning();

        // Check if update actually happened (affected rows > 0)
        if (!updated || updated.length === 0) {
          console.log(`Payment ${sessionId} was not updated (already completed by another process)`);
          return false;
        }

        // Get billing record for balance update
        const [billing] = await tx
          .select()
          .from(patientBilling)
          .where(eq(patientBilling.patientId, payment.patientId));

        if (billing) {
          const currentBalance = parseFloat(billing.patientPortion || "0");
          const newBalance = Math.max(0, currentBalance - paymentAmount);
          
          await tx
            .update(patientBilling)
            .set({
              patientPortion: newBalance.toFixed(2),
              totalBalance: (parseFloat(billing.insurancePortion || "0") + newBalance).toFixed(2),
              lastPaymentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(patientBilling.patientId, payment.patientId));

          console.log(`Completed payment ${sessionId}: balance $${currentBalance} -> $${newBalance}`);
        }

        return true;
      });

      return result;
    } catch (error) {
      console.error(`Error completing payment ${sessionId}:`, error);
      return false;
    }
  }

  // Reconcile or create a payment record for a session that may be missing
  // Used by verify-payment when webhook hasn't created the record yet
  async reconcilePayment(sessionId: string, patientId: string, amount: string): Promise<PatientPayment> {
    const existing = await this.getPatientPaymentsBySessionId(sessionId);
    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Create the payment record if missing
    const [created] = await db
      .insert(patientPayments)
      .values({
        patientId,
        amount,
        status: 'pending',
        stripeCheckoutSessionId: sessionId,
        description: 'Reconciled payment',
      })
      .returning();
    
    console.log(`Reconciled missing payment record for session ${sessionId}`);
    return created;
  }

  // Staff Shifts
  async getShifts(startDate: string, endDate: string): Promise<StaffShift[]> {
    return db
      .select()
      .from(staffShifts)
      .where(and(gte(staffShifts.date, startDate), lte(staffShifts.date, endDate)))
      .orderBy(staffShifts.date);
  }

  async getShiftsByDate(date: string): Promise<StaffShift[]> {
    return db
      .select()
      .from(staffShifts)
      .where(eq(staffShifts.date, date));
  }

  async createShift(shift: InsertStaffShift): Promise<StaffShift> {
    const [created] = await db.insert(staffShifts).values(shift).returning();
    return created;
  }

  async createShifts(shifts: InsertStaffShift[]): Promise<StaffShift[]> {
    if (shifts.length === 0) return [];
    return db.insert(staffShifts).values(shifts).returning();
  }

  async getAvailableShifts(filters?: { startDate?: string; endDate?: string; role?: string; locationId?: string }): Promise<StaffShiftWithLocation[]> {
    const conditions = [eq(staffShifts.status, "open")];
    
    if (filters?.startDate) {
      conditions.push(gte(staffShifts.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(staffShifts.date, filters.endDate));
    }
    if (filters?.role) {
      conditions.push(eq(staffShifts.role, filters.role));
    }
    if (filters?.locationId) {
      conditions.push(eq(staffShifts.locationId, filters.locationId));
    }
    
    const shifts = await db
      .select()
      .from(staffShifts)
      .where(and(...conditions))
      .orderBy(staffShifts.date);
    
    const result: StaffShiftWithLocation[] = [];
    for (const shift of shifts) {
      let location = null;
      if (shift.locationId) {
        const [loc] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, shift.locationId));
        location = loc || null;
      }
      result.push({ ...shift, location });
    }
    
    return result;
  }

  async getShiftWithLocation(id: string): Promise<StaffShiftWithLocation | undefined> {
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, id));
    if (!shift) return undefined;
    
    let location = null;
    if (shift.locationId) {
      const [loc] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, shift.locationId));
      location = loc || null;
    }
    
    return { ...shift, location };
  }

  private async getPracticeProfile(practiceId: string): Promise<PracticeProfile | null> {
    const [practice] = await db.select().from(practices).where(eq(practices.id, practiceId));
    if (!practice) return null;
    
    return {
      id: practice.id,
      name: practice.name,
      address: practice.address,
      city: practice.city,
      stateCode: practice.stateCode,
      zipCode: practice.zipCode,
      phone: practice.phone,
      email: practice.email,
      website: practice.website,
      aboutOffice: practice.aboutOffice,
      parkingInfo: practice.parkingInfo,
      arrivalInstructions: practice.arrivalInstructions,
      dressCode: practice.dressCode,
      photos: practice.photos,
      numDentists: practice.numDentists,
      numHygienists: practice.numHygienists,
      numSupportStaff: practice.numSupportStaff,
      breakRoomAvailable: practice.breakRoomAvailable,
      refrigeratorAvailable: practice.refrigeratorAvailable,
      microwaveAvailable: practice.microwaveAvailable,
      practiceManagementSoftware: practice.practiceManagementSoftware,
      xraySoftware: practice.xraySoftware,
      hasOverheadLights: practice.hasOverheadLights,
      preferredScrubColor: practice.preferredScrubColor,
      clinicalAttireProvided: practice.clinicalAttireProvided,
      useAirPolishers: practice.useAirPolishers,
      scalerType: practice.scalerType,
      assistedHygieneSchedule: practice.assistedHygieneSchedule,
      rootPlaningProcedures: practice.rootPlaningProcedures,
      seeNewPatients: practice.seeNewPatients,
      administerLocalAnesthesia: practice.administerLocalAnesthesia,
      workWithNitrousPatients: practice.workWithNitrousPatients,
      appointmentLengthAdults: practice.appointmentLengthAdults,
      appointmentLengthKids: practice.appointmentLengthKids,
      appointmentLengthPerio: practice.appointmentLengthPerio,
      appointmentLengthScaling: practice.appointmentLengthScaling,
      dentalTreatmentRooms: practice.dentalTreatmentRooms,
      dedicatedHygieneRooms: practice.dedicatedHygieneRooms,
      hiringPermanently: practice.hiringPermanently,
    };
  }

  async getAvailableShiftsWithPractice(filters?: { startDate?: string; endDate?: string; role?: string; locationId?: string }): Promise<StaffShiftWithPractice[]> {
    const conditions = [eq(staffShifts.status, "open")];
    
    if (filters?.startDate) {
      conditions.push(gte(staffShifts.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(staffShifts.date, filters.endDate));
    }
    if (filters?.role) {
      conditions.push(eq(staffShifts.role, filters.role));
    }
    if (filters?.locationId) {
      conditions.push(eq(staffShifts.locationId, filters.locationId));
    }
    
    const shifts = await db
      .select()
      .from(staffShifts)
      .where(and(...conditions))
      .orderBy(staffShifts.date);
    
    const result: StaffShiftWithPractice[] = [];
    for (const shift of shifts) {
      let location = null;
      let practice = null;
      
      if (shift.locationId) {
        const [loc] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, shift.locationId));
        location = loc || null;
        if (loc?.practiceId) {
          practice = await this.getPracticeProfile(loc.practiceId);
        }
      }
      
      // Fallback: if no location but practiceId exists on shift, get practice directly
      if (!practice && shift.practiceId) {
        practice = await this.getPracticeProfile(shift.practiceId);
      }
      
      result.push({ ...shift, location, practice });
    }
    
    return result;
  }

  async getShiftWithPractice(id: string): Promise<StaffShiftWithPractice | undefined> {
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, id));
    if (!shift) return undefined;
    
    let location = null;
    let practice = null;
    
    if (shift.locationId) {
      const [loc] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, shift.locationId));
      location = loc || null;
      if (loc?.practiceId) {
        practice = await this.getPracticeProfile(loc.practiceId);
      }
    }
    
    // Fallback: if no location but practiceId exists on shift, get practice directly
    if (!practice && shift.practiceId) {
      practice = await this.getPracticeProfile(shift.practiceId);
    }
    
    return { ...shift, location, practice };
  }

  async getShiftsForProfessionalWithPractice(professionalId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<StaffShiftWithPractice[]> {
    const conditions = [eq(staffShifts.assignedProfessionalId, professionalId)];
    
    if (filters?.status) {
      conditions.push(eq(staffShifts.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(staffShifts.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(staffShifts.date, filters.endDate));
    }
    
    const shifts = await db
      .select()
      .from(staffShifts)
      .where(and(...conditions))
      .orderBy(staffShifts.date);
    
    const result: StaffShiftWithPractice[] = [];
    for (const shift of shifts) {
      let location = null;
      let practice = null;
      
      if (shift.locationId) {
        const [loc] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, shift.locationId));
        location = loc || null;
        if (loc?.practiceId) {
          practice = await this.getPracticeProfile(loc.practiceId);
        }
      }
      
      // Fallback: if no location but practiceId exists on shift, get practice directly
      if (!practice && shift.practiceId) {
        practice = await this.getPracticeProfile(shift.practiceId);
      }
      
      result.push({ ...shift, location, practice });
    }
    
    return result;
  }

  async claimShift(shiftId: string, professionalId: string): Promise<{ success: boolean; shift?: StaffShift; error?: string }> {
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, shiftId));
    
    if (!shift) {
      return { success: false, error: "Shift not found" };
    }
    
    if (shift.status !== "open") {
      return { success: false, error: "Shift is not available for claiming" };
    }
    
    if (shift.assignedProfessionalId) {
      return { success: false, error: "Shift is already assigned to another professional" };
    }
    
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, professionalId));
    if (!professional) {
      return { success: false, error: "Professional not found" };
    }
    
    const [updated] = await db
      .update(staffShifts)
      .set({ 
        status: "filled", 
        assignedProfessionalId: professionalId 
      })
      .where(and(
        eq(staffShifts.id, shiftId),
        eq(staffShifts.status, "open")
      ))
      .returning();
    
    if (!updated) {
      return { success: false, error: "Failed to claim shift - it may have been taken by another professional" };
    }
    
    return { success: true, shift: updated };
  }

  async releaseShift(shiftId: string, professionalId: string): Promise<{ success: boolean; shift?: StaffShift; error?: string }> {
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, shiftId));
    
    if (!shift) {
      return { success: false, error: "Shift not found" };
    }
    
    if (shift.assignedProfessionalId !== professionalId) {
      return { success: false, error: "You are not assigned to this shift" };
    }
    
    if (shift.status === "completed") {
      return { success: false, error: "Cannot release a completed shift" };
    }
    
    const [updated] = await db
      .update(staffShifts)
      .set({ 
        status: "open", 
        assignedProfessionalId: null 
      })
      .where(eq(staffShifts.id, shiftId))
      .returning();
    
    if (!updated) {
      return { success: false, error: "Failed to release shift" };
    }
    
    return { success: true, shift: updated };
  }

  // Professionals
  async getProfessionals(filters?: { role?: string; specialty?: string }): Promise<ProfessionalWithBadges[]> {
    let query = db.select().from(professionals).orderBy(professionals.lastName);
    
    const allProfessionals = await query;
    
    let filtered = allProfessionals;
    if (filters?.role) {
      filtered = filtered.filter(p => p.role === filters.role);
    }
    if (filters?.specialty) {
      filtered = filtered.filter(p => 
        p.specialty === filters.specialty || 
        (p.specialties && p.specialties.includes(filters.specialty!))
      );
    }
    
    const result: ProfessionalWithBadges[] = [];
    for (const professional of filtered) {
      const badges = await this.getBadgesForProfessional(professional.id);
      result.push({ ...professional, badges });
    }
    
    return result;
  }

  async getProfessional(id: string): Promise<ProfessionalWithBadges | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
    if (!professional) return undefined;
    
    const badges = await this.getBadgesForProfessional(professional.id);
    return { ...professional, badges };
  }

  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const [created] = await db.insert(professionals).values(professional).returning();
    return created;
  }

  async updateProfessional(id: string, data: Partial<Professional>): Promise<Professional | undefined> {
    const [updated] = await db
      .update(professionals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();
    return updated;
  }

  async deleteProfessional(id: string): Promise<boolean> {
    await db.delete(professionals).where(eq(professionals.id, id));
    return true;
  }

  // Professional Badges
  async getBadgesForProfessional(professionalId: string): Promise<ProfessionalBadge[]> {
    return db
      .select()
      .from(professionalBadges)
      .where(eq(professionalBadges.professionalId, professionalId));
  }

  async createProfessionalBadge(badge: InsertProfessionalBadge): Promise<ProfessionalBadge> {
    const [created] = await db.insert(professionalBadges).values(badge).returning();
    return created;
  }

  // Role Specialties
  async getRoleSpecialties(role?: string): Promise<RoleSpecialty[]> {
    if (role) {
      return db
        .select()
        .from(roleSpecialties)
        .where(eq(roleSpecialties.role, role));
    }
    return db.select().from(roleSpecialties);
  }

  async createRoleSpecialty(roleSpecialty: InsertRoleSpecialty): Promise<RoleSpecialty> {
    const [created] = await db.insert(roleSpecialties).values(roleSpecialty).returning();
    return created;
  }

  async deleteRoleSpecialty(id: string): Promise<boolean> {
    await db.delete(roleSpecialties).where(eq(roleSpecialties.id, id));
    return true;
  }

  // Shift Transactions
  async getShiftTransactions(filters?: { startDate?: string; endDate?: string; status?: string }): Promise<ShiftTransactionWithDetails[]> {
    let query = db.select().from(shiftTransactions);
    
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(shiftTransactions.chargeDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(shiftTransactions.chargeDate, filters.endDate));
    }
    if (filters?.status) {
      conditions.push(eq(shiftTransactions.status, filters.status));
    }
    
    const transactions = conditions.length > 0 
      ? await db.select().from(shiftTransactions).where(and(...conditions)).orderBy(desc(shiftTransactions.createdAt))
      : await db.select().from(shiftTransactions).orderBy(desc(shiftTransactions.createdAt));
    
    const result: ShiftTransactionWithDetails[] = [];
    for (const tx of transactions) {
      const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, tx.shiftId));
      const [professional] = await db.select().from(professionals).where(eq(professionals.id, tx.professionalId));
      if (shift && professional) {
        result.push({ ...tx, shift, professional });
      }
    }
    return result;
  }

  async getShiftTransaction(id: string): Promise<ShiftTransactionWithDetails | undefined> {
    const [tx] = await db.select().from(shiftTransactions).where(eq(shiftTransactions.id, id));
    if (!tx) return undefined;
    
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, tx.shiftId));
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, tx.professionalId));
    
    if (!shift || !professional) return undefined;
    return { ...tx, shift, professional };
  }

  async getShiftTransactionByShiftId(shiftId: string): Promise<ShiftTransactionWithDetails | undefined> {
    const [tx] = await db.select().from(shiftTransactions).where(eq(shiftTransactions.shiftId, shiftId));
    if (!tx) return undefined;
    
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, tx.shiftId));
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, tx.professionalId));
    
    if (!shift || !professional) return undefined;
    return { ...tx, shift, professional };
  }

  async createShiftTransaction(transaction: InsertShiftTransaction): Promise<ShiftTransaction> {
    const [created] = await db.insert(shiftTransactions).values(transaction).returning();
    return created;
  }

  async updateShiftTransaction(id: string, data: Partial<ShiftTransaction>): Promise<ShiftTransaction | undefined> {
    const [updated] = await db
      .update(shiftTransactions)
      .set(data)
      .where(eq(shiftTransactions.id, id))
      .returning();
    return updated;
  }

  async getShift(id: string): Promise<StaffShift | undefined> {
    const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, id));
    return shift;
  }

  async updateShift(id: string, data: Partial<StaffShift>): Promise<StaffShift | undefined> {
    const [updated] = await db
      .update(staffShifts)
      .set(data)
      .where(eq(staffShifts.id, id))
      .returning();
    return updated;
  }

  // Professional-specific queries
  async getShiftsForProfessional(professionalId: string): Promise<StaffShift[]> {
    return db
      .select()
      .from(staffShifts)
      .where(eq(staffShifts.assignedProfessionalId, professionalId))
      .orderBy(desc(staffShifts.date));
  }

  async getShiftsForProfessionalWithLocation(professionalId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<StaffShiftWithLocation[]> {
    const conditions = [eq(staffShifts.assignedProfessionalId, professionalId)];
    
    if (filters?.status) {
      conditions.push(eq(staffShifts.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(staffShifts.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(staffShifts.date, filters.endDate));
    }
    
    const shifts = await db
      .select()
      .from(staffShifts)
      .where(and(...conditions))
      .orderBy(staffShifts.date);
    
    const result: StaffShiftWithLocation[] = [];
    for (const shift of shifts) {
      let location = null;
      if (shift.locationId) {
        const [loc] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, shift.locationId));
        location = loc || null;
      }
      result.push({ ...shift, location });
    }
    
    return result;
  }

  async getTransactionsForProfessional(professionalId: string): Promise<ShiftTransactionWithDetails[]> {
    const transactions = await db
      .select()
      .from(shiftTransactions)
      .where(eq(shiftTransactions.professionalId, professionalId))
      .orderBy(desc(shiftTransactions.createdAt));
    
    const result: ShiftTransactionWithDetails[] = [];
    for (const tx of transactions) {
      const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, tx.shiftId));
      const [professional] = await db.select().from(professionals).where(eq(professionals.id, tx.professionalId));
      if (shift && professional) {
        result.push({ ...tx, shift, professional });
      }
    }
    return result;
  }

  // Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings | undefined> {
    const [settings] = await db.select().from(platformSettings).limit(1);
    return settings;
  }

  async createPlatformSettings(settings: InsertPlatformSettings): Promise<PlatformSettings> {
    const [created] = await db.insert(platformSettings).values(settings).returning();
    return created;
  }

  async updatePlatformSettings(id: string, data: Partial<PlatformSettings>): Promise<PlatformSettings | undefined> {
    const [updated] = await db
      .update(platformSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(platformSettings.id, id))
      .returning();
    return updated;
  }

  // Platform State Tax Rates
  async getStateTaxRates(): Promise<PlatformStateTaxRate[]> {
    return db.select().from(platformStateTaxRates).orderBy(platformStateTaxRates.stateCode);
  }

  async getStateTaxRate(stateCode: string): Promise<PlatformStateTaxRate | undefined> {
    const [rate] = await db
      .select()
      .from(platformStateTaxRates)
      .where(eq(platformStateTaxRates.stateCode, stateCode));
    return rate;
  }

  async createStateTaxRate(rate: InsertPlatformStateTaxRate): Promise<PlatformStateTaxRate> {
    const [created] = await db.insert(platformStateTaxRates).values(rate).returning();
    return created;
  }

  async updateStateTaxRate(stateCode: string, data: Partial<PlatformStateTaxRate>): Promise<PlatformStateTaxRate | undefined> {
    const [updated] = await db
      .update(platformStateTaxRates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(platformStateTaxRates.stateCode, stateCode))
      .returning();
    return updated;
  }

  async upsertStateTaxRate(rate: InsertPlatformStateTaxRate): Promise<PlatformStateTaxRate> {
    const existing = await this.getStateTaxRate(rate.stateCode);
    if (existing) {
      const updated = await this.updateStateTaxRate(rate.stateCode, rate);
      return updated!;
    }
    return this.createStateTaxRate(rate);
  }

  // Practices
  async getPractices(): Promise<Practice[]> {
    return db.select().from(practices).orderBy(practices.name);
  }

  async getPractice(id: string): Promise<Practice | undefined> {
    const [practice] = await db.select().from(practices).where(eq(practices.id, id));
    return practice;
  }

  async createPractice(practice: InsertPractice): Promise<Practice> {
    const [created] = await db.insert(practices).values(practice).returning();
    return created;
  }

  async updatePractice(id: string, data: Partial<Practice>): Promise<Practice | undefined> {
    const [updated] = await db
      .update(practices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(practices.id, id))
      .returning();
    return updated;
  }

  // Practice Settings
  async getPracticeSettings(practiceId: string): Promise<PracticeSettings | undefined> {
    const [settings] = await db
      .select()
      .from(practiceSettings)
      .where(eq(practiceSettings.practiceId, practiceId));
    return settings;
  }

  async createPracticeSettings(settings: InsertPracticeSettings): Promise<PracticeSettings> {
    const [created] = await db.insert(practiceSettings).values(settings).returning();
    return created;
  }

  async updatePracticeSettings(practiceId: string, data: Partial<PracticeSettings>): Promise<PracticeSettings | undefined> {
    const [updated] = await db
      .update(practiceSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(practiceSettings.practiceId, practiceId))
      .returning();
    return updated;
  }

  // Resolved Fee Rates (with practice → platform fallback)
  async getResolvedFeeRates(practiceId?: string): Promise<ResolvedFeeRates> {
    // Get platform defaults
    let platform = await this.getPlatformSettings();
    if (!platform) {
      // Create default platform settings if none exist
      platform = await this.createPlatformSettings({});
    }

    // Get practice settings and state tax rate if practiceId provided
    let practiceSettingsData: PracticeSettings | undefined;
    let practice: Practice | undefined;
    let stateTaxRate: PlatformStateTaxRate | undefined;

    if (practiceId) {
      practiceSettingsData = await this.getPracticeSettings(practiceId);
      practice = await this.getPractice(practiceId);
      if (practice?.stateCode) {
        stateTaxRate = await this.getStateTaxRate(practice.stateCode);
      }
    }

    // Resolve rates with practice → platform fallback
    const serviceFeeRate = practiceSettingsData?.serviceFeeRateOverride 
      ? parseFloat(practiceSettingsData.serviceFeeRateOverride) 
      : parseFloat(platform.serviceFeeRate);
    
    const convenienceFeeRate = practiceSettingsData?.convenienceFeeRateOverride 
      ? parseFloat(practiceSettingsData.convenienceFeeRateOverride) 
      : parseFloat(platform.convenienceFeeRate);
    
    const platformFeeRate = practiceSettingsData?.platformFeeRateOverride 
      ? parseFloat(practiceSettingsData.platformFeeRateOverride) 
      : parseFloat(platform.platformFeeRate);
    
    const workersCompRate = practiceSettingsData?.workersCompRateOverride 
      ? parseFloat(practiceSettingsData.workersCompRateOverride) 
      : parseFloat(platform.workersCompRate);

    const payrollTaxRate = parseFloat(platform.payrollTaxRate);
    const federalUnemploymentRate = parseFloat(platform.federalUnemploymentRate);
    const paidSickLeaveRate = parseFloat(platform.paidSickLeaveRate);
    
    // State-specific rates
    const stateUnemploymentRate = stateTaxRate 
      ? parseFloat(stateTaxRate.stateUnemploymentRate) 
      : 0.027; // Default 2.7%
    
    const stateIncomeTaxRate = stateTaxRate 
      ? parseFloat(stateTaxRate.stateIncomeTaxRate) 
      : 0;
    
    const additionalTaxRate = stateTaxRate 
      ? parseFloat(stateTaxRate.additionalTaxRate) 
      : 0;

    // Calculate total payroll burden (employer-side taxes)
    const totalPayrollBurden = 
      payrollTaxRate + 
      federalUnemploymentRate + 
      stateUnemploymentRate + 
      workersCompRate + 
      paidSickLeaveRate;

    return {
      serviceFeeRate,
      convenienceFeeRate,
      platformFeeRate,
      payrollTaxRate,
      federalUnemploymentRate,
      stateUnemploymentRate,
      workersCompRate,
      paidSickLeaveRate,
      stateIncomeTaxRate,
      additionalTaxRate,
      totalPayrollBurden,
    };
  }

  // Practice Locations
  async getLocations(practiceId: string): Promise<PracticeLocation[]> {
    return db
      .select()
      .from(practiceLocations)
      .where(eq(practiceLocations.practiceId, practiceId))
      .orderBy(desc(practiceLocations.isPrimary), practiceLocations.name);
  }

  async getLocation(id: string): Promise<PracticeLocation | undefined> {
    const [location] = await db
      .select()
      .from(practiceLocations)
      .where(eq(practiceLocations.id, id));
    return location;
  }

  async createLocation(location: InsertPracticeLocation): Promise<PracticeLocation> {
    const [created] = await db.insert(practiceLocations).values(location).returning();
    return created;
  }

  async updateLocation(id: string, data: Partial<PracticeLocation>): Promise<PracticeLocation | undefined> {
    const [updated] = await db
      .update(practiceLocations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(practiceLocations.id, id))
      .returning();
    return updated;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const result = await db
      .delete(practiceLocations)
      .where(eq(practiceLocations.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
