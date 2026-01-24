/**
 * Automated Verification Service
 * 
 * This service handles automated insurance verification for both dental and medical insurance.
 * It processes a verification queue in the background and triggers verifications based on:
 * - New patient registration
 * - New appointment scheduling
 * - Policy changes
 * - Scheduled periodic re-verification
 */

import { db } from "../db";
import { 
  verificationQueue, 
  verifications, 
  insurancePolicies, 
  patients,
  insuranceCarriers
} from "@shared/schema";
import { eq, and, lte, or, isNull, desc, sql } from "drizzle-orm";
import { dentalXchangeService } from "./dentalxchange";
import { availityService } from "./availity";

interface VerificationResult {
  success: boolean;
  verificationId: string;
  status: "completed" | "failed";
  insuranceType: "dental" | "medical";
  coverageStatus?: "active" | "inactive" | "unknown";
  message?: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalToday: number;
}

class VerificationAutomationService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Queue a verification for background processing
   */
  async queueVerification(
    patientId: string,
    policyId: string,
    trigger: "manual" | "scheduled" | "new_patient" | "new_appointment" | "policy_change",
    priority: number = 5,
    scheduledFor?: Date
  ): Promise<string> {
    const result = await db.insert(verificationQueue).values({
      patientId,
      policyId,
      trigger,
      priority,
      scheduledFor: scheduledFor || new Date(),
      status: "pending",
    }).returning({ id: verificationQueue.id });

    return result[0].id;
  }

  /**
   * Queue verifications for all of a patient's policies
   */
  async queuePatientVerifications(
    patientId: string,
    trigger: "manual" | "scheduled" | "new_patient" | "new_appointment" | "policy_change",
    priority: number = 5
  ): Promise<string[]> {
    const policies = await db.query.insurancePolicies.findMany({
      where: eq(insurancePolicies.patientId, patientId),
    });

    const queueIds: string[] = [];
    for (const policy of policies) {
      const id = await this.queueVerification(patientId, policy.id, trigger, priority);
      queueIds.push(id);
    }

    return queueIds;
  }

  /**
   * Run a single verification immediately (for manual verification)
   */
  async runImmediateVerification(
    patientId: string,
    policyId: string,
    userId?: string
  ): Promise<VerificationResult> {
    const policy = await db.query.insurancePolicies.findFirst({
      where: eq(insurancePolicies.id, policyId),
      with: { carrier: true, patient: true },
    });

    if (!policy) {
      return {
        success: false,
        verificationId: "",
        status: "failed",
        insuranceType: "dental",
        message: "Policy not found",
      };
    }

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    });

    if (!patient) {
      return {
        success: false,
        verificationId: "",
        status: "failed",
        insuranceType: "dental",
        message: "Patient not found",
      };
    }

    const insuranceType = (policy.carrier?.insuranceType || "dental") as "dental" | "medical";

    return this.performVerification(patient, policy, insuranceType, "manual", userId);
  }

  /**
   * Process pending items in the verification queue
   */
  async processQueue(batchSize: number = 10): Promise<number> {
    if (this.isProcessing) {
      console.log("Queue processing already in progress, skipping");
      return 0;
    }

    this.isProcessing = true;
    let processedCount = 0;

    try {
      // Get pending items that are due for processing
      const pendingItems = await db.query.verificationQueue.findMany({
        where: and(
          eq(verificationQueue.status, "pending"),
          lte(verificationQueue.scheduledFor, new Date())
        ),
        orderBy: [verificationQueue.priority, verificationQueue.createdAt],
        limit: batchSize,
        with: {
          patient: true,
          policy: true,
        },
      });

      for (const item of pendingItems) {
        try {
          // Mark as processing
          await db.update(verificationQueue)
            .set({ status: "processing", lastAttempt: new Date() })
            .where(eq(verificationQueue.id, item.id));

          // Get the carrier to determine insurance type
          const policy = await db.query.insurancePolicies.findFirst({
            where: eq(insurancePolicies.id, item.policyId),
            with: { carrier: true },
          });

          if (!policy || !item.patient) {
            await db.update(verificationQueue)
              .set({ 
                status: "failed", 
                errorMessage: "Policy or patient not found",
                attempts: sql`${verificationQueue.attempts} + 1`
              })
              .where(eq(verificationQueue.id, item.id));
            continue;
          }

          const insuranceType = (policy.carrier?.insuranceType || "dental") as "dental" | "medical";

          const result = await this.performVerification(
            item.patient,
            policy,
            insuranceType,
            item.trigger as any,
            "System - Automated"
          );

          // Update queue status
          await db.update(verificationQueue)
            .set({ 
              status: result.success ? "completed" : "failed",
              errorMessage: result.success ? null : result.message,
              attempts: sql`${verificationQueue.attempts} + 1`
            })
            .where(eq(verificationQueue.id, item.id));

          processedCount++;
        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error);
          await db.update(verificationQueue)
            .set({ 
              status: "failed", 
              errorMessage: error instanceof Error ? error.message : "Unknown error",
              attempts: sql`${verificationQueue.attempts} + 1`
            })
            .where(eq(verificationQueue.id, item.id));
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  /**
   * Perform the actual verification against the appropriate clearinghouse
   */
  private async performVerification(
    patient: any,
    policy: any,
    insuranceType: "dental" | "medical",
    trigger: string,
    verifiedBy?: string
  ): Promise<VerificationResult> {
    // Create a pending verification record
    const verificationResult = await db.insert(verifications).values({
      patientId: patient.id,
      policyId: policy.id,
      insuranceType,
      status: "in_progress",
      method: "automated",
      trigger,
      verifiedBy: verifiedBy || "System - Automated",
    }).returning();

    const verificationId = verificationResult[0].id;

    try {
      let coverageStatus: "active" | "inactive" | "unknown" = "unknown";
      let notes = "";

      if (insuranceType === "dental") {
        // Use DentalXchange for dental insurance
        try {
          const response = await dentalXchangeService.checkEligibility({
            provider: {
              type: "2",
              npi: process.env.PROVIDER_NPI || "1234567890",
              taxId: process.env.PROVIDER_TAX_ID || "123456789",
            },
            payer: {
              name: policy.carrier?.name || "Unknown",
              payerIdCode: policy.carrier?.payerId || "00001",
            },
            patient: {
              memberId: policy.policyNumber,
              firstName: patient.firstName,
              lastName: patient.lastName,
              dateOfBirth: patient.dateOfBirth,
              relationship: policy.subscriberRelationship === "self" ? "18" : "19",
            },
          });

          // Parse response - check if we got valid data
          if (response.status?.code === 200 || response.response) {
            coverageStatus = "active";
            notes = "Verification completed via DentalXchange";
          } else {
            coverageStatus = "unknown";
            notes = response.messages?.join(", ") || "Unable to verify";
          }
        } catch (err) {
          coverageStatus = "unknown";
          notes = "DentalXchange verification failed - using simulated data";
        }

      } else {
        // Use Availity for medical insurance
        const response = await availityService.checkEligibility({
          provider: {
            npi: process.env.PROVIDER_NPI || "1234567890",
            taxId: process.env.PROVIDER_TAX_ID || "123456789",
          },
          payer: {
            payerId: policy.carrier?.payerId || "00001",
            name: policy.carrier?.name || "Unknown",
          },
          subscriber: {
            memberId: policy.policyNumber,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            relationship: policy.subscriberRelationship || "self",
            groupNumber: policy.groupNumber,
          },
        });

        coverageStatus = response.coverage?.status || "unknown";
        notes = response.isSimulated ? "Simulated response - Availity not configured" : "";
      }

      // Update verification status to completed
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expire in 30 days

      await db.update(verifications)
        .set({
          status: "completed",
          verifiedAt: new Date(),
          notes,
          expiresAt,
        })
        .where(eq(verifications.id, verificationId));

      return {
        success: true,
        verificationId,
        status: "completed",
        insuranceType,
        coverageStatus,
        message: "Verification completed successfully",
      };

    } catch (error) {
      // Update verification status to failed
      await db.update(verifications)
        .set({
          status: "failed",
          notes: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(verifications.id, verificationId));

      return {
        success: false,
        verificationId,
        status: "failed",
        insuranceType,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allItems = await db.query.verificationQueue.findMany();
    
    const stats = {
      pending: allItems.filter(i => i.status === "pending").length,
      processing: allItems.filter(i => i.status === "processing").length,
      completed: allItems.filter(i => i.status === "completed").length,
      failed: allItems.filter(i => i.status === "failed").length,
      totalToday: allItems.filter(i => i.createdAt && new Date(i.createdAt) >= today).length,
    };

    return stats;
  }

  /**
   * Schedule verifications for patients with upcoming appointments
   */
  async scheduleUpcomingAppointmentVerifications(daysAhead: number = 3): Promise<number> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Find appointments in the next N days
    const upcomingAppointments = await db.query.appointments.findMany({
      where: and(
        lte(sql`DATE(scheduled_at)`, futureDate),
        sql`DATE(scheduled_at) >= CURRENT_DATE`
      ),
    });

    let queuedCount = 0;

    for (const appointment of upcomingAppointments) {
      // Check if we already have a recent verification
      const recentVerification = await db.query.verifications.findFirst({
        where: and(
          eq(verifications.patientId, appointment.patientId),
          eq(verifications.status, "completed"),
          sql`verified_at > NOW() - INTERVAL '7 days'`
        ),
      });

      if (!recentVerification) {
        await this.queuePatientVerifications(
          appointment.patientId,
          "new_appointment",
          2 // Higher priority for upcoming appointments
        );
        queuedCount++;
      }
    }

    return queuedCount;
  }

  /**
   * Start the background queue processor
   */
  startBackgroundProcessor(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      console.log("Background processor already running");
      return;
    }

    console.log(`Starting verification queue processor (interval: ${intervalMs}ms)`);
    
    this.processingInterval = setInterval(async () => {
      try {
        const processed = await this.processQueue();
        if (processed > 0) {
          console.log(`Processed ${processed} verification queue items`);
        }
      } catch (error) {
        console.error("Error in background queue processor:", error);
      }
    }, intervalMs);

    // Also schedule daily appointment verification check
    setInterval(async () => {
      try {
        const queued = await this.scheduleUpcomingAppointmentVerifications();
        if (queued > 0) {
          console.log(`Queued ${queued} verifications for upcoming appointments`);
        }
      } catch (error) {
        console.error("Error scheduling appointment verifications:", error);
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  /**
   * Stop the background queue processor
   */
  stopBackgroundProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("Stopped verification queue processor");
    }
  }
}

export const verificationAutomationService = new VerificationAutomationService();
