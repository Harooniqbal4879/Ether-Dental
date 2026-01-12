import {
  patients,
  insuranceCarriers,
  insurancePolicies,
  verifications,
  benefits,
  appointments,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

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
          gte(nextWeek, appointments.scheduledAt)
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
}

export const storage = new DatabaseStorage();
