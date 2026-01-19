import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertInsuranceCarrierSchema, insertInsurancePolicySchema, insertClearinghouseConfigSchema, insertStaffShiftSchema, insertProfessionalSchema, insertProfessionalBadgeSchema, insertRoleSpecialtySchema } from "@shared/schema";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Insurance Carriers
  app.get("/api/carriers", async (req, res) => {
    try {
      const carriers = await storage.getCarriers();
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ error: "Failed to fetch carriers" });
    }
  });

  app.post("/api/carriers", async (req, res) => {
    try {
      const parsed = insertInsuranceCarrierSchema.parse(req.body);
      const carrier = await storage.createCarrier(parsed);
      res.status(201).json(carrier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating carrier:", error);
      res.status(500).json({ error: "Failed to create carrier" });
    }
  });

  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  // Combined patient and policy creation schema
  const createPatientWithInsuranceSchema = insertPatientSchema.extend({
    carrierId: z.string().min(1),
    policyNumber: z.string().min(1),
    groupNumber: z.string().optional(),
    subscriberName: z.string().min(1),
    subscriberRelationship: z.string().min(1),
    subscriberDob: z.string().optional(),
    subscriberId: z.string().optional(),
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const parsed = createPatientWithInsuranceSchema.parse(req.body);
      
      // Extract patient data
      const {
        carrierId,
        policyNumber,
        groupNumber,
        subscriberName,
        subscriberRelationship,
        subscriberDob,
        subscriberId,
        ...patientData
      } = parsed;
      
      // Create patient
      const patient = await storage.createPatient(patientData);
      
      // Create insurance policy
      await storage.createPolicy({
        patientId: patient.id,
        carrierId,
        policyNumber,
        groupNumber: groupNumber || null,
        subscriberName,
        subscriberRelationship,
        subscriberDob: subscriberDob || null,
        subscriberId: subscriberId || null,
        isPrimary: true,
      });
      
      // Create initial verification record (pending)
      const policies = await storage.getPoliciesForPatient(patient.id);
      if (policies.length > 0) {
        await storage.createVerification({
          patientId: patient.id,
          policyId: policies[0].id,
          status: "pending",
        });
      }
      
      // Return patient with policies
      const fullPatient = await storage.getPatient(patient.id);
      res.status(201).json(fullPatient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  // Patient Verifications
  app.get("/api/patients/:id/verifications", async (req, res) => {
    try {
      const verifications = await storage.getVerificationsForPatient(req.params.id);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching patient verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  // Trigger verification for a patient
  app.post("/api/patients/:id/verify", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      if (!patient.insurancePolicies || patient.insurancePolicies.length === 0) {
        return res.status(400).json({ error: "Patient has no insurance policy" });
      }
      
      const policy = patient.insurancePolicies[0];
      
      // Create verification record
      const verification = await storage.createVerification({
        patientId: patient.id,
        policyId: policy.id,
        status: "in_progress",
        method: policy.carrier.clearinghouseCompatible ? "clearinghouse" : "phone",
      });
      
      // Simulate verification process (in production, this would call clearinghouse or AI agent)
      setTimeout(async () => {
        try {
          // Update verification as completed
          await storage.updateVerification(verification.id, {
            status: "completed",
            verifiedAt: new Date(),
            verifiedBy: policy.carrier.clearinghouseCompatible ? "System - Clearinghouse" : "System - AI",
          });
          
          // Create simulated benefits data with consistent calculations
          const annualMaximum = 1500;
          const annualUsed = Math.floor(Math.random() * 800);
          const annualRemaining = Math.max(0, annualMaximum - annualUsed);
          const deductibleIndividual = 50;
          const deductibleIndividualMet = Math.min(deductibleIndividual, Math.floor(Math.random() * 60));
          const deductibleFamily = 150;
          const deductibleFamilyMet = Math.min(deductibleFamily, Math.floor(Math.random() * 160));
          
          await storage.createBenefit({
            verificationId: verification.id,
            annualMaximum: String(annualMaximum) + ".00",
            annualUsed: String(annualUsed) + ".00",
            annualRemaining: String(annualRemaining) + ".00",
            deductibleIndividual: String(deductibleIndividual) + ".00",
            deductibleIndividualMet: String(deductibleIndividualMet) + ".00",
            deductibleFamily: String(deductibleFamily) + ".00",
            deductibleFamilyMet: String(deductibleFamilyMet) + ".00",
            preventiveCoverage: 100,
            basicCoverage: 80,
            majorCoverage: 50,
            orthodonticCoverage: 50,
            orthodonticMaximum: "1500.00",
            orthodonticUsed: "0.00",
            cleaningsPerYear: 2,
            xraysFrequency: "Bitewings 1x/year, Full mouth 1x/5 years",
            fluorideAgeLimit: 18,
            planYear: "calendar",
            renewalDate: "January 1",
            inNetwork: true,
          });
        } catch (error) {
          console.error("Error completing verification:", error);
          await storage.updateVerification(verification.id, {
            status: "failed",
            notes: "Verification process failed",
          });
        }
      }, 2000);
      
      res.status(202).json({ message: "Verification started", verificationId: verification.id });
    } catch (error) {
      console.error("Error triggering verification:", error);
      res.status(500).json({ error: "Failed to start verification" });
    }
  });

  // All Verifications
  app.get("/api/verifications", async (req, res) => {
    try {
      const verifications = await storage.getVerifications();
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  app.get("/api/verifications/recent", async (req, res) => {
    try {
      const verifications = await storage.getRecentVerifications(10);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching recent verifications:", error);
      res.status(500).json({ error: "Failed to fetch recent verifications" });
    }
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Clearinghouse Configurations
  app.get("/api/clearinghouse-configs", async (req, res) => {
    try {
      const configs = await storage.getClearinghouseConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching clearinghouse configs:", error);
      res.status(500).json({ error: "Failed to fetch clearinghouse configurations" });
    }
  });

  app.get("/api/clearinghouse-configs/:id", async (req, res) => {
    try {
      const config = await storage.getClearinghouseConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching clearinghouse config:", error);
      res.status(500).json({ error: "Failed to fetch clearinghouse configuration" });
    }
  });

  app.post("/api/clearinghouse-configs", async (req, res) => {
    try {
      const parsed = insertClearinghouseConfigSchema.parse(req.body);
      const config = await storage.createClearinghouseConfig(parsed);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating clearinghouse config:", error);
      res.status(500).json({ error: "Failed to create clearinghouse configuration" });
    }
  });

  app.patch("/api/clearinghouse-configs/:id", async (req, res) => {
    try {
      const allowedFields = ["name", "clearinghouseType", "endpointUrl", "username", "secretId", "isActive"];
      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }
      
      const config = await storage.updateClearinghouseConfig(req.params.id, updateData);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error updating clearinghouse config:", error);
      res.status(500).json({ error: "Failed to update clearinghouse configuration" });
    }
  });

  app.delete("/api/clearinghouse-configs/:id", async (req, res) => {
    try {
      await storage.deleteClearinghouseConfig(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting clearinghouse config:", error);
      res.status(500).json({ error: "Failed to delete clearinghouse configuration" });
    }
  });

  app.post("/api/clearinghouse-configs/:id/test", async (req, res) => {
    try {
      const result = await storage.testClearinghouseConnection(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error testing clearinghouse connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  // Patient Portal Routes
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // Get patient billing info for portal (by email lookup for demo)
  app.get("/api/portal/billing/:patientId", async (req, res) => {
    try {
      const billing = await storage.getPatientBilling(req.params.patientId);
      if (!billing) {
        return res.status(404).json({ error: "Billing information not found" });
      }
      res.json(billing);
    } catch (error) {
      console.error("Error fetching patient billing:", error);
      res.status(500).json({ error: "Failed to fetch billing information" });
    }
  });

  // Get patient payment history
  app.get("/api/portal/payments/:patientId", async (req, res) => {
    try {
      const payments = await storage.getPatientPayments(req.params.patientId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // Create Stripe checkout session for patient payment
  const checkoutSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    amount: z.coerce.number().positive("Amount must be positive").max(100000, "Amount cannot exceed $100,000"),
    description: z.string().optional(),
  });

  app.post("/api/portal/create-checkout", async (req, res) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { patientId, amount, description } = parsed.data;

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Build base URL - use request origin as fallback
      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const baseUrl = replitDomain 
        ? `https://${replitDomain}` 
        : `${req.protocol}://${req.get('host')}`;

      // Normalize amount to fixed 2 decimal places
      const normalizedAmount = amount.toFixed(2);

      // Create checkout session for one-time payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100), // Convert to cents
            product_data: {
              name: 'Patient Balance Payment',
              description: description || `Payment for ${patient.firstName} ${patient.lastName}`,
            },
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/portal?canceled=true`,
        customer_email: patient.email || undefined,
        metadata: {
          patientId,
          type: 'patient_balance_payment',
        },
      });

      // Record pending payment
      await storage.createPatientPayment({
        patientId,
        amount: normalizedAmount,
        status: 'pending',
        stripeCheckoutSessionId: session.id,
        description: description || 'Balance payment',
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  // Verify payment status after checkout
  // This is called when user returns from Stripe checkout as a fallback
  // Reconciles missing payment records and uses atomic completePayment
  app.get("/api/portal/verify-payment/:sessionId", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      
      if (session.payment_status === 'paid') {
        const paymentAmount = session.amount_total ? session.amount_total / 100 : 0;
        const paymentIntentId = session.payment_intent as string || '';
        const patientId = session.metadata?.patientId;
        
        // Reconcile payment record if missing (e.g., webhook didn't fire)
        if (patientId && paymentAmount > 0) {
          await storage.reconcilePayment(
            req.params.sessionId,
            patientId,
            paymentAmount.toFixed(2)
          );
        }
        
        // Use centralized atomic payment completion (idempotent)
        await storage.completePayment(req.params.sessionId, paymentIntentId, paymentAmount);
      }
      
      res.json({
        status: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Staff Shifts
  app.get("/api/shifts", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: "startDate and endDate query parameters required" });
      }
      
      const shifts = await storage.getShifts(startDate, endDate);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });

  // Create shifts (accepts array of shift data with multiple dates)
  const createShiftsSchema = z.object({
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1, "At least one date required"),
    role: z.string().min(1),
    arrivalTime: z.string().min(1),
    firstPatientTime: z.string().min(1),
    endTime: z.string().min(1),
    breakDuration: z.string().min(1),
    pricingMode: z.enum(["fixed", "smart"]),
    minHourlyRate: z.coerce.number().optional().nullable(),
    maxHourlyRate: z.coerce.number().optional().nullable(),
    fixedHourlyRate: z.coerce.number().optional().nullable(),
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const parsed = createShiftsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { dates, ...shiftData } = parsed.data;
      
      // Create one shift per selected date
      const shiftsToCreate = dates.map((date) => ({
        date,
        role: shiftData.role,
        arrivalTime: shiftData.arrivalTime,
        firstPatientTime: shiftData.firstPatientTime,
        endTime: shiftData.endTime,
        breakDuration: shiftData.breakDuration,
        pricingMode: shiftData.pricingMode,
        minHourlyRate: shiftData.minHourlyRate?.toString() || null,
        maxHourlyRate: shiftData.maxHourlyRate?.toString() || null,
        fixedHourlyRate: shiftData.fixedHourlyRate?.toString() || null,
        status: "open" as const,
      }));

      const createdShifts = await storage.createShifts(shiftsToCreate);
      res.status(201).json(createdShifts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating shifts:", error);
      res.status(500).json({ error: "Failed to create shifts" });
    }
  });

  // Professionals
  app.get("/api/professionals", async (req, res) => {
    try {
      const { role, specialty } = req.query;
      const filters: { role?: string; specialty?: string } = {};
      if (typeof role === "string") filters.role = role;
      if (typeof specialty === "string") filters.specialty = specialty;
      
      const professionals = await storage.getProfessionals(filters);
      res.json(professionals);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      res.status(500).json({ error: "Failed to fetch professionals" });
    }
  });

  app.get("/api/professionals/:id", async (req, res) => {
    try {
      const professional = await storage.getProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional:", error);
      res.status(500).json({ error: "Failed to fetch professional" });
    }
  });

  app.post("/api/professionals", async (req, res) => {
    try {
      const parsed = insertProfessionalSchema.parse(req.body);
      const professional = await storage.createProfessional(parsed);
      res.status(201).json(professional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating professional:", error);
      res.status(500).json({ error: "Failed to create professional" });
    }
  });

  app.put("/api/professionals/:id", async (req, res) => {
    try {
      const professional = await storage.updateProfessional(req.params.id, req.body);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error updating professional:", error);
      res.status(500).json({ error: "Failed to update professional" });
    }
  });

  app.delete("/api/professionals/:id", async (req, res) => {
    try {
      await storage.deleteProfessional(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting professional:", error);
      res.status(500).json({ error: "Failed to delete professional" });
    }
  });

  // Professional Badges
  app.get("/api/professionals/:id/badges", async (req, res) => {
    try {
      const badges = await storage.getBadgesForProfessional(req.params.id);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.post("/api/professionals/:id/badges", async (req, res) => {
    try {
      const parsed = insertProfessionalBadgeSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const badge = await storage.createProfessionalBadge(parsed);
      res.status(201).json(badge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  // Role Specialties
  app.get("/api/role-specialties", async (req, res) => {
    try {
      const { role } = req.query;
      const roleSpecialties = await storage.getRoleSpecialties(
        typeof role === "string" ? role : undefined
      );
      res.json(roleSpecialties);
    } catch (error) {
      console.error("Error fetching role specialties:", error);
      res.status(500).json({ error: "Failed to fetch role specialties" });
    }
  });

  app.post("/api/role-specialties", async (req, res) => {
    try {
      const parsed = insertRoleSpecialtySchema.parse(req.body);
      const roleSpecialty = await storage.createRoleSpecialty(parsed);
      res.status(201).json(roleSpecialty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating role specialty:", error);
      res.status(500).json({ error: "Failed to create role specialty" });
    }
  });

  app.delete("/api/role-specialties/:id", async (req, res) => {
    try {
      await storage.deleteRoleSpecialty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role specialty:", error);
      res.status(500).json({ error: "Failed to delete role specialty" });
    }
  });

  return httpServer;
}
