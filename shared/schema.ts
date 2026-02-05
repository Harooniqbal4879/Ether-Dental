import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Insurance Carriers
export const insuranceCarriers = pgTable("insurance_carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  insuranceType: text("insurance_type").notNull().default("dental"), // dental, medical
  phone: text("phone"),
  website: text("website"),
  logoUrl: text("logo_url"),
  clearinghouseCompatible: boolean("clearinghouse_compatible").default(false),
  payerId: text("payer_id"), // Clearinghouse payer ID (DentalXchange for dental, Availity for medical)
});

export const insertInsuranceCarrierSchema = createInsertSchema(insuranceCarriers).omit({ id: true });
export type InsertInsuranceCarrier = z.infer<typeof insertInsuranceCarrierSchema>;
export type InsuranceCarrier = typeof insuranceCarriers.$inferSelect;

// Practice Insurance Carriers - Links carriers to practices
export const practiceInsuranceCarriers = pgTable("practice_insurance_carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull(),
  carrierId: varchar("carrier_id").notNull().references(() => insuranceCarriers.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceInsuranceCarriersRelations = relations(practiceInsuranceCarriers, ({ one }) => ({
  carrier: one(insuranceCarriers, {
    fields: [practiceInsuranceCarriers.carrierId],
    references: [insuranceCarriers.id],
  }),
}));

export const insertPracticeInsuranceCarrierSchema = createInsertSchema(practiceInsuranceCarriers).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPracticeInsuranceCarrier = z.infer<typeof insertPracticeInsuranceCarrierSchema>;
export type PracticeInsuranceCarrier = typeof practiceInsuranceCarriers.$inferSelect;

// Patients
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  ssnLast4: text("ssn_last_4"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  insurancePolicies: many(insurancePolicies),
  verifications: many(verifications),
  appointments: many(appointments),
}));

export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Insurance Policies (linking patients to carriers)
export const insurancePolicies = pgTable("insurance_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  carrierId: varchar("carrier_id").notNull().references(() => insuranceCarriers.id),
  policyNumber: text("policy_number").notNull(),
  groupNumber: text("group_number"),
  subscriberName: text("subscriber_name").notNull(),
  subscriberRelationship: text("subscriber_relationship").notNull(),
  subscriberDob: text("subscriber_dob"),
  subscriberId: text("subscriber_id"),
  isPrimary: boolean("is_primary").default(true),
  effectiveDate: text("effective_date"),
  terminationDate: text("termination_date"),
  cardImageFront: text("card_image_front"),
  cardImageBack: text("card_image_back"),
});

export const insurancePoliciesRelations = relations(insurancePolicies, ({ one }) => ({
  patient: one(patients, {
    fields: [insurancePolicies.patientId],
    references: [patients.id],
  }),
  carrier: one(insuranceCarriers, {
    fields: [insurancePolicies.carrierId],
    references: [insuranceCarriers.id],
  }),
}));

export const insertInsurancePolicySchema = createInsertSchema(insurancePolicies).omit({ id: true });
export type InsertInsurancePolicy = z.infer<typeof insertInsurancePolicySchema>;
export type InsurancePolicy = typeof insurancePolicies.$inferSelect;

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  locationId: varchar("location_id"), // Will be linked to practiceLocations after table is created
  scheduledAt: timestamp("scheduled_at").notNull(),
  appointmentType: text("appointment_type").notNull(),
  notes: text("notes"),
  status: text("status").default("scheduled"),
});

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
}));

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Verifications
export const verifications = pgTable("verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  policyId: varchar("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  insuranceType: text("insurance_type").notNull().default("dental"), // dental, medical
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
  method: text("method"), // clearinghouse, phone, manual, automated
  trigger: text("trigger"), // manual, scheduled, new_patient, new_appointment, policy_change
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"), // user id or "System - Automated"
  notes: text("notes"),
  expiresAt: timestamp("expires_at"), // When this verification should be refreshed
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification Queue (for automated background verification)
export const verificationQueue = pgTable("verification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  policyId: varchar("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  priority: integer("priority").notNull().default(5), // 1=highest, 10=lowest
  trigger: text("trigger").notNull(), // scheduled, new_patient, new_appointment, policy_change
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  attempts: integer("attempts").notNull().default(0),
  lastAttempt: timestamp("last_attempt"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationQueueRelations = relations(verificationQueue, ({ one }) => ({
  patient: one(patients, {
    fields: [verificationQueue.patientId],
    references: [patients.id],
  }),
  policy: one(insurancePolicies, {
    fields: [verificationQueue.policyId],
    references: [insurancePolicies.id],
  }),
}));

export const insertVerificationQueueSchema = createInsertSchema(verificationQueue).omit({ id: true, createdAt: true });
export type InsertVerificationQueue = z.infer<typeof insertVerificationQueueSchema>;
export type VerificationQueue = typeof verificationQueue.$inferSelect;

export const verificationsRelations = relations(verifications, ({ one, many }) => ({
  patient: one(patients, {
    fields: [verifications.patientId],
    references: [patients.id],
  }),
  policy: one(insurancePolicies, {
    fields: [verifications.policyId],
    references: [insurancePolicies.id],
  }),
  benefits: many(benefits),
}));

export const insertVerificationSchema = createInsertSchema(verifications).omit({ id: true, createdAt: true });
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verifications.$inferSelect;

// Benefits (captured from verification)
export const benefits = pgTable("benefits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  verificationId: varchar("verification_id").notNull().references(() => verifications.id, { onDelete: "cascade" }),
  annualMaximum: decimal("annual_maximum", { precision: 10, scale: 2 }),
  annualUsed: decimal("annual_used", { precision: 10, scale: 2 }),
  annualRemaining: decimal("annual_remaining", { precision: 10, scale: 2 }),
  deductibleIndividual: decimal("deductible_individual", { precision: 10, scale: 2 }),
  deductibleIndividualMet: decimal("deductible_individual_met", { precision: 10, scale: 2 }),
  deductibleFamily: decimal("deductible_family", { precision: 10, scale: 2 }),
  deductibleFamilyMet: decimal("deductible_family_met", { precision: 10, scale: 2 }),
  preventiveCoverage: integer("preventive_coverage"), // percentage
  basicCoverage: integer("basic_coverage"),
  majorCoverage: integer("major_coverage"),
  orthodonticCoverage: integer("orthodontic_coverage"),
  orthodonticMaximum: decimal("orthodontic_maximum", { precision: 10, scale: 2 }),
  orthodonticUsed: decimal("orthodontic_used", { precision: 10, scale: 2 }),
  waitingPeriodBasic: text("waiting_period_basic"),
  waitingPeriodMajor: text("waiting_period_major"),
  waitingPeriodOrtho: text("waiting_period_ortho"),
  cleaningsPerYear: integer("cleanings_per_year"),
  xraysFrequency: text("xrays_frequency"),
  fluorideAgeLimit: integer("fluoride_age_limit"),
  planYear: text("plan_year"), // calendar or benefit
  renewalDate: text("renewal_date"),
  inNetwork: boolean("in_network").default(true),
});

export const benefitsRelations = relations(benefits, ({ one }) => ({
  verification: one(verifications, {
    fields: [benefits.verificationId],
    references: [verifications.id],
  }),
}));

export const insertBenefitSchema = createInsertSchema(benefits).omit({ id: true });
export type InsertBenefit = z.infer<typeof insertBenefitSchema>;
export type Benefit = typeof benefits.$inferSelect;

// Extended types for frontend use
export type PatientWithInsurance = Patient & {
  insurancePolicies: (InsurancePolicy & { carrier: InsuranceCarrier })[];
  latestVerification?: Verification & { benefits?: Benefit };
  latestDentalVerification?: Verification;
  latestMedicalVerification?: Verification;
};

export type VerificationWithDetails = Verification & {
  patient: Patient;
  policy: InsurancePolicy & { carrier: InsuranceCarrier };
  benefits?: Benefit;
};

// Clearinghouse Configurations
// Note: In production, credentials (username, apiKey) should be stored in a secure vault
// (e.g., HashiCorp Vault, AWS Secrets Manager) and only referenced by secretId here
export const clearinghouseConfigs = pgTable("clearinghouse_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Change Healthcare, Availity, DentalXchange, etc.
  provider: text("provider").notNull(), // dentalxchange, availity, office_ally, change_healthcare, trizetto, waystar
  purpose: text("purpose").notNull().default("dental_eligibility"), // dental_eligibility, medical_eligibility, claims
  submitterId: text("submitter_id"), // EDI submitter ID
  secretId: text("secret_id"), // Reference to external secrets vault (production)
  isActive: boolean("is_active").default(false),
  lastTestedAt: timestamp("last_tested_at"),
  connectionStatus: text("connection_status").default("not_tested"), // not_tested, connected, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClearinghouseConfigSchema = createInsertSchema(clearinghouseConfigs).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastTestedAt: true,
  connectionStatus: true,
});
export type InsertClearinghouseConfig = z.infer<typeof insertClearinghouseConfigSchema>;
export type ClearinghouseConfig = typeof clearinghouseConfigs.$inferSelect;

// Verification status enum for UI
export const VerificationStatus = {
  VERIFIED: "completed",
  NEEDS_VERIFICATION: "pending",
  IN_PROGRESS: "in_progress",
  FAILED: "failed",
} as const;

// Clearinghouse providers
export const ClearinghouseProviders = {
  DENTALXCHANGE: "dentalxchange",
  AVAILITY: "availity",
  OFFICE_ALLY: "office_ally",
  CHANGE_HEALTHCARE: "change_healthcare",
  TRIZETTO: "trizetto",
  WAYSTAR: "waystar",
} as const;

// Clearinghouse purposes
export const ClearinghousePurposes = {
  DENTAL_ELIGIBILITY: "dental_eligibility",
  MEDICAL_ELIGIBILITY: "medical_eligibility",
  CLAIMS: "claims",
} as const;

// Patient Billing - tracks patient balances and payment history
export const patientBilling = pgTable("patient_billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  totalBalance: decimal("total_balance", { precision: 10, scale: 2 }).default("0.00"),
  insurancePortion: decimal("insurance_portion", { precision: 10, scale: 2 }).default("0.00"),
  patientPortion: decimal("patient_portion", { precision: 10, scale: 2 }).default("0.00"),
  stripeCustomerId: text("stripe_customer_id"),
  lastPaymentAt: timestamp("last_payment_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patientBillingRelations = relations(patientBilling, ({ one }) => ({
  patient: one(patients, {
    fields: [patientBilling.patientId],
    references: [patients.id],
  }),
}));

export const insertPatientBillingSchema = createInsertSchema(patientBilling).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPatientBilling = z.infer<typeof insertPatientBillingSchema>;
export type PatientBilling = typeof patientBilling.$inferSelect;

// Patient Payments - individual payment transactions
export const patientPayments = pgTable("patient_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  billingId: varchar("billing_id").references(() => patientBilling.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  paymentMethod: text("payment_method"), // card, bank_transfer
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const patientPaymentsRelations = relations(patientPayments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientPayments.patientId],
    references: [patients.id],
  }),
  billing: one(patientBilling, {
    fields: [patientPayments.billingId],
    references: [patientBilling.id],
  }),
}));

export const insertPatientPaymentSchema = createInsertSchema(patientPayments).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true 
});
export type InsertPatientPayment = z.infer<typeof insertPatientPaymentSchema>;
export type PatientPayment = typeof patientPayments.$inferSelect;

// Patient Billing with details
export type PatientBillingWithDetails = PatientBilling & {
  patient: Patient;
  payments?: PatientPayment[];
};

// Staff Roles - configurable roles for staffing
export const staffRoles = pgTable("staff_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "hygienist", "dentist"
  label: text("label").notNull(), // e.g., "Hygienist", "Dentist"
  category: text("category").notNull(), // "clinical" or "administrative"
  badgeColor: text("badge_color"), // Tailwind classes for badge styling
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffRoleSchema = createInsertSchema(staffRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffRole = z.infer<typeof insertStaffRoleSchema>;
export type StaffRole = typeof staffRoles.$inferSelect;

// Staff Shifts - for staffing management
export const staffShifts = pgTable("staff_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").default("practice-1"), // Links to practice for profile data
  locationId: varchar("location_id"), // Will be linked to practiceLocations after table is created
  date: text("date").notNull(), // YYYY-MM-DD format
  role: text("role").notNull(), // Dentist, Hygienist, Dental Assistant, etc.
  specialties: text("specialties").array(), // Required specialties for this shift
  arrivalTime: text("arrival_time").notNull(), // e.g. "8:30 AM"
  firstPatientTime: text("first_patient_time").notNull(), // e.g. "9:00 AM"
  endTime: text("end_time").notNull(), // e.g. "5:00 PM"
  breakDuration: text("break_duration").notNull(), // e.g. "60 min"
  pricingMode: text("pricing_mode").notNull(), // "fixed" or "smart"
  minHourlyRate: decimal("min_hourly_rate", { precision: 10, scale: 2 }),
  maxHourlyRate: decimal("max_hourly_rate", { precision: 10, scale: 2 }),
  fixedHourlyRate: decimal("fixed_hourly_rate", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("open"), // open, filled, completed, cancelled
  assignedProfessionalId: varchar("assigned_professional_id").references(() => professionals.id),
  scheduledBy: text("scheduled_by"), // Name of person who scheduled the shift
  // Check-in/out tracking for mobile app
  checkInTime: timestamp("check_in_time"),
  checkInMethod: text("check_in_method"), // "manual" or "automatic" (GPS-based)
  checkInLatitude: decimal("check_in_latitude", { precision: 10, scale: 7 }),
  checkInLongitude: decimal("check_in_longitude", { precision: 10, scale: 7 }),
  checkOutTime: timestamp("check_out_time"),
  checkOutMethod: text("check_out_method"), // "manual" or "automatic"
  checkOutLatitude: decimal("check_out_latitude", { precision: 10, scale: 7 }),
  checkOutLongitude: decimal("check_out_longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staffShiftsRelations = relations(staffShifts, ({ one }) => ({
  assignedProfessional: one(professionals, {
    fields: [staffShifts.assignedProfessionalId],
    references: [professionals.id],
  }),
}));

export const insertStaffShiftSchema = createInsertSchema(staffShifts).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffShift = z.infer<typeof insertStaffShiftSchema>;
export type StaffShift = typeof staffShifts.$inferSelect;

// Staff Shift with location details for mobile API
export type StaffShiftWithLocation = StaffShift & {
  location?: PracticeLocation | null;
};

// Practice profile data for mobile API
export type PracticeProfile = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  aboutOffice: string | null;
  parkingInfo: string | null;
  arrivalInstructions: string | null;
  dressCode: string | null;
  photos: string[] | null;
  numDentists: number | null;
  numHygienists: number | null;
  numSupportStaff: number | null;
  breakRoomAvailable: boolean | null;
  refrigeratorAvailable: boolean | null;
  microwaveAvailable: boolean | null;
  practiceManagementSoftware: string | null;
  xraySoftware: string | null;
  hasOverheadLights: boolean | null;
  preferredScrubColor: string | null;
  clinicalAttireProvided: boolean | null;
  useAirPolishers: boolean | null;
  scalerType: string | null;
  assistedHygieneSchedule: boolean | null;
  rootPlaningProcedures: boolean | null;
  seeNewPatients: boolean | null;
  administerLocalAnesthesia: boolean | null;
  workWithNitrousPatients: boolean | null;
  appointmentLengthAdults: string | null;
  appointmentLengthKids: string | null;
  appointmentLengthPerio: string | null;
  appointmentLengthScaling: string | null;
  dentalTreatmentRooms: number | null;
  dedicatedHygieneRooms: number | null;
  hiringPermanently: boolean | null;
};

// Staff Shift with location and practice details for mobile API
export type StaffShiftWithPractice = StaffShift & {
  location?: PracticeLocation | null;
  practice?: PracticeProfile | null;
};

// Shift Transactions - payment records for completed shifts
export const shiftTransactions = pgTable("shift_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: varchar("shift_id").notNull().references(() => staffShifts.id, { onDelete: "cascade" }),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id),
  chargeDate: text("charge_date").notNull(), // YYYY-MM-DD
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  mealBreakMinutes: integer("meal_break_minutes").notNull().default(0),
  adjustmentMade: boolean("adjustment_made").default(false),
  adjustmentAmount: decimal("adjustment_amount", { precision: 10, scale: 2 }),
  adjustmentReason: text("adjustment_reason"),
  regularPay: decimal("regular_pay", { precision: 10, scale: 2 }).notNull(),
  serviceFeeRate: decimal("service_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.2250"), // 22.5%
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  convenienceFeeRate: decimal("convenience_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.0350"), // 3.5%
  convenienceFee: decimal("convenience_fee", { precision: 10, scale: 2 }).notNull(),
  counterCoverDiscount: decimal("counter_cover_discount", { precision: 10, scale: 2 }).default("0.00"),
  totalPay: decimal("total_pay", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, charged, failed
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shiftTransactionsRelations = relations(shiftTransactions, ({ one }) => ({
  shift: one(staffShifts, {
    fields: [shiftTransactions.shiftId],
    references: [staffShifts.id],
  }),
  professional: one(professionals, {
    fields: [shiftTransactions.professionalId],
    references: [professionals.id],
  }),
}));

export const insertShiftTransactionSchema = createInsertSchema(shiftTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertShiftTransaction = z.infer<typeof insertShiftTransactionSchema>;
export type ShiftTransaction = typeof shiftTransactions.$inferSelect;

// Shift transaction with related data
export type ShiftTransactionWithDetails = ShiftTransaction & {
  shift: StaffShift;
  professional: Professional;
};

// Shift Negotiations - rate negotiation requests from professionals
export const shiftNegotiations = pgTable("shift_negotiations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: varchar("shift_id").notNull().references(() => staffShifts.id, { onDelete: "cascade" }),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id),
  currentRate: decimal("current_rate", { precision: 10, scale: 2 }).notNull(),
  proposedRate: decimal("proposed_rate", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  practiceResponse: text("practice_response"), // Optional response message from practice
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shiftNegotiationsRelations = relations(shiftNegotiations, ({ one }) => ({
  shift: one(staffShifts, {
    fields: [shiftNegotiations.shiftId],
    references: [staffShifts.id],
  }),
  professional: one(professionals, {
    fields: [shiftNegotiations.professionalId],
    references: [professionals.id],
  }),
}));

export const insertShiftNegotiationSchema = createInsertSchema(shiftNegotiations).omit({
  id: true,
  createdAt: true,
  status: true,
  practiceResponse: true,
  respondedAt: true,
});
export type InsertShiftNegotiation = z.infer<typeof insertShiftNegotiationSchema>;
export type ShiftNegotiation = typeof shiftNegotiations.$inferSelect;

// Shift negotiation with related data
export type ShiftNegotiationWithDetails = ShiftNegotiation & {
  shift: StaffShift;
  professional: Professional;
};

// Staff Roles enum for UI
export const StaffRoles = {
  DENTIST: "Dentist",
  HYGIENIST: "Hygienist",
  DENTAL_ASSISTANT: "Dental Assistant",
  OFFICE_COORDINATOR: "Office Coordinator",
  FRONT_DESK: "Front Desk",
  BILLING_STAFF: "Billing Staff",
} as const;

// Dental Specialties enum
export const DentalSpecialties = {
  COSMETICS: "Cosmetics",
  ENDODONTICS: "Endodontics",
  GENERAL_DENTISTRY: "General Dentistry",
  ORAL_SURGERY: "Oral and Maxillofacial Surgery",
  ORTHODONTICS: "Orthodontics",
  PEDIATRICS: "Pediatrics",
  PERIODONTICS: "Periodontics",
  PROSTHODONTICS: "Prosthodontics",
} as const;

// Experience ranges
export const ExperienceRanges = {
  LESS_THAN_1: "Less than 1 year",
  ONE_TO_THREE: "1 - 3 Years",
  THREE_TO_FIVE: "3 - 5 Years",
  FIVE_TO_TEN: "5 - 10 Years",
  TEN_PLUS: "10+ Years",
} as const;

// Onboarding status enum for professionals
export const OnboardingStatus = {
  INVITED: "invited",
  IN_PROGRESS: "in_progress",
  UNDER_REVIEW: "under_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
  PAYMENT_ELIGIBLE: "payment_eligible",
  SUSPENDED: "suspended",
} as const;
export type OnboardingStatusType = typeof OnboardingStatus[keyof typeof OnboardingStatus];

// Professionals - dental professionals who can work shifts
export const professionals = pgTable("professionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  role: text("role").notNull(), // Dentist, Hygienist, etc.
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  credentialsVerified: boolean("credentials_verified").default(false),
  education: text("education"), // School name
  graduationDate: text("graduation_date"), // MM/DD/YYYY
  licenseNumber: text("license_number"),
  licenseState: text("license_state"),
  licenseYearIssued: text("license_year_issued"),
  experienceRange: text("experience_range"), // 1-3 Years, 3-5 Years, etc.
  software: text("software").array(), // Array of software skills
  specialty: text("specialty"), // Primary specialty
  specialties: text("specialties").array(), // Additional specialties
  procedures: text("procedures").array(), // Experienced procedures
  bio: text("bio"),
  passwordHash: text("password_hash"), // For self-registered professionals
  isActive: boolean("is_active").default(true),
  // Onboarding & Payment Eligibility
  onboardingStatus: text("onboarding_status").default("in_progress"), // invited, in_progress, under_review, verified, rejected, payment_eligible, suspended
  paymentEligible: boolean("payment_eligible").default(false),
  // Personal Information
  dateOfBirth: date("date_of_birth"),
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  countryOfResidence: text("country_of_residence").default("US"),
  // Email OTP Verification
  emailVerificationCode: text("email_verification_code"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  // Phone OTP Verification
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerificationExpiry: timestamp("phone_verification_expiry"),
  // Verification Status
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  identityVerified: boolean("identity_verified").default(false),
  w9Completed: boolean("w9_completed").default(false),
  agreementsSigned: boolean("agreements_signed").default(false),
  paymentMethodVerified: boolean("payment_method_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  passwordHash: true, // Never expose password hash in insert schema
});
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionals.$inferSelect;

// Professional registration schema for self-registration
export const professionalRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
});
export type ProfessionalRegister = z.infer<typeof professionalRegisterSchema>;

// Professional Badges - achievements and recognitions
export const professionalBadges = pgTable("professional_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  badgeType: text("badge_type").notNull(), // perfect_attendance, shifts_completed, timeliness, knowledge, teamwork
  level: text("level").notNull().default("bronze"), // bronze, silver, gold
  count: integer("count").default(0), // Number associated with badge (e.g., 20 shifts)
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const professionalBadgesRelations = relations(professionalBadges, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalBadges.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalBadgeSchema = createInsertSchema(professionalBadges).omit({
  id: true,
  earnedAt: true,
});
export type InsertProfessionalBadge = z.infer<typeof insertProfessionalBadgeSchema>;
export type ProfessionalBadge = typeof professionalBadges.$inferSelect;

// Role Specialties - defines which specialties are associated with each role
export const roleSpecialties = pgTable("role_specialties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // Staff role
  specialty: text("specialty").notNull(), // Specialty name
  isDefault: boolean("is_default").default(false), // Whether this is a default specialty for the role
});

export const insertRoleSpecialtySchema = createInsertSchema(roleSpecialties).omit({
  id: true,
});
export type InsertRoleSpecialty = z.infer<typeof insertRoleSpecialtySchema>;
export type RoleSpecialty = typeof roleSpecialties.$inferSelect;

// Professional Preferences - for shift matching
export const professionalPreferences = pgTable("professional_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  preferredDays: text("preferred_days").array(), // ["Monday", "Tuesday", ...]
  preferredTimeStart: text("preferred_time_start"), // "08:00"
  preferredTimeEnd: text("preferred_time_end"), // "17:00"
  minHourlyRate: decimal("min_hourly_rate", { precision: 10, scale: 2 }),
  maxHourlyRate: decimal("max_hourly_rate", { precision: 10, scale: 2 }),
  preferredShiftDurationMin: integer("preferred_shift_duration_min"), // in hours
  preferredShiftDurationMax: integer("preferred_shift_duration_max"), // in hours
  preferredLocations: text("preferred_locations").array(), // location IDs
  maxDistanceMiles: integer("max_distance_miles"),
  preferredRoles: text("preferred_roles").array(),
  preferredSpecialties: text("preferred_specialties").array(),
  acceptLastMinuteShifts: boolean("accept_last_minute_shifts").default(false),
  acceptOvertimeShifts: boolean("accept_overtime_shifts").default(false),
  preferredPracticeTypes: text("preferred_practice_types").array(), // general, pediatric, orthodontic, etc.
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const professionalPreferencesRelations = relations(professionalPreferences, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalPreferences.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalPreferencesSchema = createInsertSchema(professionalPreferences).omit({
  id: true,
  updatedAt: true,
});
export type InsertProfessionalPreferences = z.infer<typeof insertProfessionalPreferencesSchema>;
export type ProfessionalPreferences = typeof professionalPreferences.$inferSelect;

// Professional Availability - calendar availability and blackout dates
export const professionalAvailability = pgTable("professional_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: text("start_time"), // null means all day
  endTime: text("end_time"),
  status: text("status").notNull(), // available, blocked, tentative
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalAvailabilityRelations = relations(professionalAvailability, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalAvailability.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalAvailabilitySchema = createInsertSchema(professionalAvailability).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalAvailability = z.infer<typeof insertProfessionalAvailabilitySchema>;
export type ProfessionalAvailability = typeof professionalAvailability.$inferSelect;

// Professional Certifications - licenses and certifications
export const professionalCertifications = pgTable("professional_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  certificationType: text("certification_type").notNull(), // license, certification, permit
  name: text("name").notNull(), // e.g., "Dental Hygiene License", "CPR Certification"
  licenseNumber: text("license_number"),
  issuingAuthority: text("issuing_authority").notNull(),
  stateCode: text("state_code"),
  issueDate: date("issue_date"),
  expirationDate: date("expiration_date"),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, expired, revoked
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const professionalCertificationsRelations = relations(professionalCertifications, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalCertifications.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalCertificationSchema = createInsertSchema(professionalCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verificationStatus: true,
});
export type InsertProfessionalCertification = z.infer<typeof insertProfessionalCertificationSchema>;
export type ProfessionalCertification = typeof professionalCertifications.$inferSelect;

// Professional Skills - skills and proficiency levels
export const professionalSkills = pgTable("professional_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // clinical, software, equipment, soft_skills
  skillName: text("skill_name").notNull(),
  proficiencyLevel: text("proficiency_level").notNull(), // beginner, intermediate, advanced, expert
  yearsExperience: integer("years_experience"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalSkillsRelations = relations(professionalSkills, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalSkills.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalSkillSchema = createInsertSchema(professionalSkills).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalSkill = z.infer<typeof insertProfessionalSkillSchema>;
export type ProfessionalSkill = typeof professionalSkills.$inferSelect;

// Professional Experience - work history
export const professionalExperience = pgTable("professional_experience", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  employer: text("employer").notNull(),
  jobTitle: text("job_title").notNull(),
  location: text("location"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // null means current
  isCurrent: boolean("is_current").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalExperienceRelations = relations(professionalExperience, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalExperience.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalExperienceSchema = createInsertSchema(professionalExperience).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalExperience = z.infer<typeof insertProfessionalExperienceSchema>;
export type ProfessionalExperience = typeof professionalExperience.$inferSelect;

// Professional Education - educational background
export const professionalEducation = pgTable("professional_education", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study"),
  graduationDate: date("graduation_date"),
  honors: text("honors"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalEducationRelations = relations(professionalEducation, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalEducation.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalEducationSchema = createInsertSchema(professionalEducation).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalEducation = z.infer<typeof insertProfessionalEducationSchema>;
export type ProfessionalEducation = typeof professionalEducation.$inferSelect;

// Professional Awards - awards and recognitions
export const professionalAwards = pgTable("professional_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  dateReceived: date("date_received"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalAwardsRelations = relations(professionalAwards, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalAwards.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalAwardSchema = createInsertSchema(professionalAwards).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalAward = z.infer<typeof insertProfessionalAwardSchema>;
export type ProfessionalAward = typeof professionalAwards.$inferSelect;

// Professional Training - continuing education and training
export const professionalTraining = pgTable("professional_training", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  courseName: text("course_name").notNull(),
  provider: text("provider").notNull(),
  completionDate: date("completion_date"),
  ceCredits: decimal("ce_credits", { precision: 5, scale: 2 }), // Continuing Education credits
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalTrainingRelations = relations(professionalTraining, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalTraining.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalTrainingSchema = createInsertSchema(professionalTraining).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalTraining = z.infer<typeof insertProfessionalTrainingSchema>;
export type ProfessionalTraining = typeof professionalTraining.$inferSelect;

// Combined type for professional with all credentials
export type ProfessionalWithCredentials = Professional & {
  badges: ProfessionalBadge[];
  preferences?: ProfessionalPreferences;
  certifications: ProfessionalCertification[];
  skills: ProfessionalSkill[];
  experience: ProfessionalExperience[];
  education: ProfessionalEducation[];
  awards: ProfessionalAward[];
  training: ProfessionalTraining[];
};

// ==========================================
// CONTRACTOR ONBOARDING TABLES
// ==========================================

// Document types for contractor onboarding
export const ContractorDocumentType = {
  GOVERNMENT_ID: "government_id", // Generic government ID (backward compatibility)
  ID_FRONT: "id_front", // Front side of government ID
  ID_BACK: "id_back", // Back side of government ID
  SELFIE: "selfie", // Live photo verification / liveness check
  W9_FORM: "w9_form", // W-9 tax form
  RESUME: "resume", // Resume/CV
  CONTRACTOR_AGREEMENT: "contractor_agreement",
  NDA: "nda",
  OTHER: "other",
} as const;

// ID Types for KYC verification
export const GovernmentIdType = {
  DRIVERS_LICENSE: "drivers_license",
  PASSPORT: "passport",
  NATIONAL_ID: "national_id",
  RESIDENCE_PERMIT: "residence_permit",
} as const;
export type GovernmentIdTypeValue = typeof GovernmentIdType[keyof typeof GovernmentIdType];
export type ContractorDocumentTypeValue = typeof ContractorDocumentType[keyof typeof ContractorDocumentType];

// Document verification status
export const DocumentVerificationStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  RESUBMIT_REQUIRED: "resubmit_required",
} as const;
export type DocumentVerificationStatusValue = typeof DocumentVerificationStatus[keyof typeof DocumentVerificationStatus];

// Contractor Documents - stores uploaded documents for verification
export const contractorDocuments = pgTable("contractor_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // government_id, selfie, w9_form, resume, contractor_agreement, nda
  documentName: text("document_name"), // Original filename or description
  documentUrl: text("document_url").notNull(), // Secure URL to stored document
  verificationStatus: text("verification_status").default("pending"), // pending, approved, rejected, expired, resubmit_required
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"), // Admin who verified
  rejectionReason: text("rejection_reason"),
  expiresAt: timestamp("expires_at"), // For documents that expire
  metadata: text("metadata"), // JSON string for additional document-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractorDocumentsRelations = relations(contractorDocuments, ({ one }) => ({
  professional: one(professionals, {
    fields: [contractorDocuments.professionalId],
    references: [professionals.id],
  }),
}));

export const insertContractorDocumentSchema = createInsertSchema(contractorDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  verifiedBy: true,
});
export type InsertContractorDocument = z.infer<typeof insertContractorDocumentSchema>;
export type ContractorDocument = typeof contractorDocuments.$inferSelect;

// Tax Classification options
export const TaxClassification = {
  INDIVIDUAL: "individual", // Individual/Sole Proprietor
  LLC_SINGLE: "llc_single", // LLC - Single Member
  LLC_C_CORP: "llc_c_corp", // LLC - C Corporation
  LLC_S_CORP: "llc_s_corp", // LLC - S Corporation
  LLC_PARTNERSHIP: "llc_partnership", // LLC - Partnership
  C_CORPORATION: "c_corporation",
  S_CORPORATION: "s_corporation",
  PARTNERSHIP: "partnership",
  TRUST_ESTATE: "trust_estate",
} as const;
export type TaxClassificationValue = typeof TaxClassification[keyof typeof TaxClassification];

// Contractor Tax Forms - W-9 data with encrypted sensitive fields
export const contractorTaxForms = pgTable("contractor_tax_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  formType: text("form_type").notNull().default("w9"), // w9, 1099, etc.
  // W-9 Fields
  legalName: text("legal_name").notNull(),
  businessName: text("business_name"), // DBA or business name if different
  taxClassification: text("tax_classification").notNull(), // individual, llc_single, llc_c_corp, etc.
  // Sensitive data - only last 4 stored in plaintext, full value encrypted
  ssnLast4: text("ssn_last4"), // Last 4 digits of SSN (for display)
  encryptedSsn: text("encrypted_ssn"), // Encrypted full SSN
  einLast4: text("ein_last4"), // Last 4 digits of EIN (for display)
  encryptedEin: text("encrypted_ein"), // Encrypted full EIN
  useSsn: boolean("use_ssn").default(true), // true = SSN, false = EIN
  // Address on tax form
  taxAddressStreet: text("tax_address_street").notNull(),
  taxAddressCity: text("tax_address_city").notNull(),
  taxAddressState: text("tax_address_state").notNull(),
  taxAddressZip: text("tax_address_zip").notNull(),
  // Signature
  signatureDate: timestamp("signature_date"),
  signatureIp: text("signature_ip"),
  electronicSignature: boolean("electronic_signature").default(false),
  // Status
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractorTaxFormsRelations = relations(contractorTaxForms, ({ one }) => ({
  professional: one(professionals, {
    fields: [contractorTaxForms.professionalId],
    references: [professionals.id],
  }),
}));

export const insertContractorTaxFormSchema = createInsertSchema(contractorTaxForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  verifiedBy: true,
  encryptedSsn: true, // Never accept encrypted values from client
  encryptedEin: true,
});
export type InsertContractorTaxForm = z.infer<typeof insertContractorTaxFormSchema>;
export type ContractorTaxForm = typeof contractorTaxForms.$inferSelect;

// Payment method types
export const PaymentMethodType = {
  BANK_ACCOUNT: "bank_account", // ACH direct deposit
  STRIPE_CONNECT: "stripe_connect", // Stripe Connect account
  PAYPAL: "paypal",
  VENMO: "venmo",
  CHECK: "check", // Paper check
} as const;
export type PaymentMethodTypeValue = typeof PaymentMethodType[keyof typeof PaymentMethodType];

// Professional Payment Methods - bank accounts and payment destinations
export const professionalPaymentMethods = pgTable("professional_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  methodType: text("method_type").notNull(), // bank_account, stripe_connect, paypal, etc.
  // Bank account fields (ACH)
  bankName: text("bank_name"),
  accountType: text("account_type"), // checking, savings
  accountLast4: text("account_last4"), // Last 4 digits for display
  routingLast4: text("routing_last4"), // Last 4 of routing number
  encryptedAccountNumber: text("encrypted_account_number"),
  encryptedRoutingNumber: text("encrypted_routing_number"),
  // Stripe Connect
  stripeAccountId: text("stripe_account_id"),
  stripeAccountStatus: text("stripe_account_status"), // pending, active, restricted
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  // Digital wallet
  paymentEmail: text("payment_email"), // For PayPal/Venmo
  // Status
  isDefault: boolean("is_default").default(false),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, failed
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const professionalPaymentMethodsRelations = relations(professionalPaymentMethods, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalPaymentMethods.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalPaymentMethodSchema = createInsertSchema(professionalPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  encryptedAccountNumber: true,
  encryptedRoutingNumber: true,
});
export type InsertProfessionalPaymentMethod = z.infer<typeof insertProfessionalPaymentMethodSchema>;
export type ProfessionalPaymentMethod = typeof professionalPaymentMethods.$inferSelect;

// Agreement types
export const AgreementType = {
  CONTRACTOR_AGREEMENT: "contractor_agreement",
  NDA: "nda",
  TERMS_OF_SERVICE: "terms_of_service",
  CODE_OF_CONDUCT: "code_of_conduct",
  HIPAA_ACKNOWLEDGMENT: "hipaa_acknowledgment",
} as const;
export type AgreementTypeValue = typeof AgreementType[keyof typeof AgreementType];

// Professional Agreements - signed agreements and acceptances
export const professionalAgreements = pgTable("professional_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  agreementType: text("agreement_type").notNull(), // contractor_agreement, nda, terms_of_service, code_of_conduct
  agreementVersion: text("agreement_version").notNull(), // e.g., "1.0", "2024-01"
  agreementUrl: text("agreement_url"), // URL to the agreement document
  // Signature details
  signedAt: timestamp("signed_at"),
  signatureIp: text("signature_ip"),
  signatureName: text("signature_name"), // Typed name as signature
  signatureUrl: text("signature_url"), // If using drawn signature
  // Status
  isActive: boolean("is_active").default(true), // False if superseded by newer version
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalAgreementsRelations = relations(professionalAgreements, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalAgreements.professionalId],
    references: [professionals.id],
  }),
}));

export const insertProfessionalAgreementSchema = createInsertSchema(professionalAgreements).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessionalAgreement = z.infer<typeof insertProfessionalAgreementSchema>;
export type ProfessionalAgreement = typeof professionalAgreements.$inferSelect;

// Onboarding Audit Log - tracks all verification actions
export const onboardingAuditLog = pgTable("onboarding_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // status_change, document_upload, document_approved, document_rejected, agreement_signed, etc.
  actorType: text("actor_type").notNull(), // professional, admin, system
  actorId: varchar("actor_id"), // ID of the actor
  actorEmail: text("actor_email"),
  previousValue: text("previous_value"), // JSON string of previous state
  newValue: text("new_value"), // JSON string of new state
  documentId: varchar("document_id"), // Reference to document if applicable
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingAuditLogRelations = relations(onboardingAuditLog, ({ one }) => ({
  professional: one(professionals, {
    fields: [onboardingAuditLog.professionalId],
    references: [professionals.id],
  }),
}));

export const insertOnboardingAuditLogSchema = createInsertSchema(onboardingAuditLog).omit({
  id: true,
  createdAt: true,
});
export type InsertOnboardingAuditLog = z.infer<typeof insertOnboardingAuditLogSchema>;
export type OnboardingAuditLog = typeof onboardingAuditLog.$inferSelect;

// Extended type for professional with onboarding data
export type ProfessionalWithOnboarding = Professional & {
  documents: ContractorDocument[];
  taxForm?: ContractorTaxForm;
  paymentMethods: ProfessionalPaymentMethod[];
  agreements: ProfessionalAgreement[];
  onboardingProgress: {
    identityVerified: boolean;
    w9Completed: boolean;
    paymentMethodVerified: boolean;
    agreementsSigned: boolean;
    percentComplete: number;
  };
};

// Badge types enum
export const BadgeTypes = {
  PERFECT_ATTENDANCE: "perfect_attendance",
  SHIFTS_COMPLETED: "shifts_completed",
  TIMELINESS: "timeliness",
  KNOWLEDGE: "knowledge",
  TEAMWORK: "teamwork",
} as const;

// Badge levels
export const BadgeLevels = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
} as const;

// Dental procedures by category
export const DentalProcedures = {
  GENERAL: [
    "Cleanings",
    "Hygiene/Oral Examinations",
    "X-Rays",
    "Fluoride",
    "Sealants",
  ],
  RESTORATIVE: [
    "Fillings",
    "Crown & Bridge Procedures",
    "Deliver of Crown & Bridge",
    "Dental Implant Procedures",
    "Fixed Retainers",
  ],
  COSMETIC: [
    "Whitening",
    "Veneers",
    "Bonding",
    "Invisalign/Clear Retainers",
  ],
  SURGICAL: [
    "Extractions",
    "Root Canal (Molar)",
    "Root Canal (Pre-Molar)",
    "Oral Sedation/Nitrous Oxide Administration",
  ],
  PERIODONTAL: [
    "Gum Disease Treatment (Scaling & Root Planing)",
    "Periodontal Charting",
    "SRP",
  ],
  SPECIALTY: [
    "Dentures",
    "X-Ray Interpretation/ Treatment Planning",
  ],
  HYGIENE: [
    "Air Polisher",
    "Digital Impressions/ Intraoral Scanning",
    "Instrument Sterilization",
    "Local Anesthesia",
    "Nitrous Oxide Administration",
    "Oral Hygiene Instruction",
    "Prophy",
  ],
} as const;

// Professional with badges type
export type ProfessionalWithBadges = Professional & {
  badges: ProfessionalBadge[];
};

// Practice Invitations - invitations sent by practices to professionals
export const practiceInvitations = pgTable("practice_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  invitedByAdminId: varchar("invited_by_admin_id").notNull().references(() => practiceAdmins.id),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull(), // Hygienist, Dentist, Dental Assistant
  message: text("message"), // Optional personal message
  token: text("token").notNull().unique(), // Unique token for invitation link
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired
  professionalId: varchar("professional_id").references(() => professionals.id), // Set when accepted
  expiresAt: timestamp("expires_at").notNull(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceInvitationsRelations = relations(practiceInvitations, ({ one }) => ({
  practice: one(practices, {
    fields: [practiceInvitations.practiceId],
    references: [practices.id],
  }),
  invitedBy: one(practiceAdmins, {
    fields: [practiceInvitations.invitedByAdminId],
    references: [practiceAdmins.id],
  }),
  professional: one(professionals, {
    fields: [practiceInvitations.professionalId],
    references: [professionals.id],
  }),
}));

export const insertPracticeInvitationSchema = createInsertSchema(practiceInvitations).omit({
  id: true,
  token: true,
  status: true,
  professionalId: true,
  respondedAt: true,
  createdAt: true,
});
export type InsertPracticeInvitation = z.infer<typeof insertPracticeInvitationSchema>;
export type PracticeInvitation = typeof practiceInvitations.$inferSelect;

// Practice-Professional Connections - links between practices and professionals
export const practiceProfessionals = pgTable("practice_professionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  invitationId: varchar("invitation_id").references(() => practiceInvitations.id),
  status: text("status").notNull().default("active"), // active, inactive, blocked
  addedAt: timestamp("added_at").defaultNow(),
  lastShiftDate: timestamp("last_shift_date"),
  totalShifts: integer("total_shifts").default(0),
  notes: text("notes"), // Practice-specific notes about the professional
});

export const practiceProfessionalsRelations = relations(practiceProfessionals, ({ one }) => ({
  practice: one(practices, {
    fields: [practiceProfessionals.practiceId],
    references: [practices.id],
  }),
  professional: one(professionals, {
    fields: [practiceProfessionals.professionalId],
    references: [professionals.id],
  }),
  invitation: one(practiceInvitations, {
    fields: [practiceProfessionals.invitationId],
    references: [practiceInvitations.id],
  }),
}));

export const insertPracticeProfessionalSchema = createInsertSchema(practiceProfessionals).omit({
  id: true,
  addedAt: true,
  lastShiftDate: true,
  totalShifts: true,
});
export type InsertPracticeProfessional = z.infer<typeof insertPracticeProfessionalSchema>;
export type PracticeProfessional = typeof practiceProfessionals.$inferSelect;

// Extended types for invitations with related data
export type PracticeInvitationWithDetails = PracticeInvitation & {
  practice: Practice;
  invitedBy: PracticeAdmin;
  professional?: Professional;
};

export type PracticeProfessionalWithDetails = PracticeProfessional & {
  professional: Professional;
  practice: Practice;
};

// Platform Settings - Global fee and tax configuration
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceFeeRate: decimal("service_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.2250"), // 22.5%
  convenienceFeeRate: decimal("convenience_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.0350"), // 3.5%
  platformFeeRate: decimal("platform_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.1200"), // 12% EtherAI fee
  payrollTaxRate: decimal("payroll_tax_rate", { precision: 5, scale: 4 }).notNull().default("0.0765"), // 7.65% (Social Security + Medicare)
  federalUnemploymentRate: decimal("federal_unemployment_rate", { precision: 5, scale: 4 }).notNull().default("0.0060"), // 0.6% FUTA
  workersCompRate: decimal("workers_comp_rate", { precision: 5, scale: 4 }).notNull().default("0.0100"), // 1% default
  paidSickLeaveRate: decimal("paid_sick_leave_rate", { precision: 5, scale: 4 }).notNull().default("0.0050"), // 0.5% default
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({ 
  id: true, 
  updatedAt: true 
});
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettings.$inferSelect;

// Platform State Tax Rates - State-specific unemployment and tax rates
export const platformStateTaxRates = pgTable("platform_state_tax_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stateCode: varchar("state_code", { length: 2 }).notNull().unique(),
  stateName: text("state_name").notNull(),
  stateUnemploymentRate: decimal("state_unemployment_rate", { precision: 5, scale: 4 }).notNull().default("0.0270"), // State unemployment rate
  stateIncomeTaxRate: decimal("state_income_tax_rate", { precision: 5, scale: 4 }).notNull().default("0.0000"), // State income tax withholding
  additionalTaxRate: decimal("additional_tax_rate", { precision: 5, scale: 4 }).notNull().default("0.0000"), // Any additional state-specific taxes
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformStateTaxRateSchema = createInsertSchema(platformStateTaxRates).omit({ 
  id: true, 
  updatedAt: true 
});
export type InsertPlatformStateTaxRate = z.infer<typeof insertPlatformStateTaxRateSchema>;
export type PlatformStateTaxRate = typeof platformStateTaxRates.$inferSelect;

// Practices - Dental practices/offices that use the platform
export const practices = pgTable("practices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  stateCode: varchar("state_code", { length: 2 }),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  npiNumber: text("npi_number"),
  taxId: text("tax_id"),
  // Owner information (for self-registration)
  ownerFirstName: text("owner_first_name"),
  ownerLastName: text("owner_last_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  // Registration status
  registrationStatus: varchar("registration_status", { length: 20 }).default("approved").notNull(), // pending, approved, rejected
  registrationSource: varchar("registration_source", { length: 20 }).default("admin"), // admin, self_registration
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Office Profile fields
  website: text("website"),
  aboutOffice: text("about_office"),
  parkingInfo: text("parking_info"),
  numDentists: integer("num_dentists").default(0),
  numHygienists: integer("num_hygienists").default(0),
  numSupportStaff: integer("num_support_staff").default(0),
  breakRoomAvailable: boolean("break_room_available").default(false),
  refrigeratorAvailable: boolean("refrigerator_available").default(false),
  microwaveAvailable: boolean("microwave_available").default(false),
  hiringPermanently: boolean("hiring_permanently").default(false),
  photos: text("photos").array(), // Array of photo URLs
  
  // Practice Information fields
  practiceManagementSoftware: text("practice_management_software"),
  xraySoftware: text("xray_software"),
  hasOverheadLights: boolean("has_overhead_lights").default(true),
  preferredScrubColor: text("preferred_scrub_color"),
  clinicalAttireProvided: boolean("clinical_attire_provided").default(false),
  useAirPolishers: boolean("use_air_polishers").default(false),
  scalerType: text("scaler_type"),
  assistedHygieneSchedule: boolean("assisted_hygiene_schedule").default(false),
  rootPlaningProcedures: boolean("root_planing_procedures").default(true),
  seeNewPatients: boolean("see_new_patients").default(true),
  administerLocalAnesthesia: boolean("administer_local_anesthesia").default(true),
  workWithNitrousPatients: boolean("work_with_nitrous_patients").default(false),
  appointmentLengthAdults: text("appointment_length_adults"),
  appointmentLengthKids: text("appointment_length_kids"),
  appointmentLengthPerio: text("appointment_length_perio"),
  appointmentLengthScaling: text("appointment_length_scaling"),
  dentalTreatmentRooms: integer("dental_treatment_rooms").default(0),
  dedicatedHygieneRooms: integer("dedicated_hygiene_rooms").default(0),
  
  // Arrival/Setup instructions for hygienists
  arrivalInstructions: text("arrival_instructions"),
  dressCode: text("dress_code"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPracticeSchema = createInsertSchema(practices).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertPractice = z.infer<typeof insertPracticeSchema>;
export type Practice = typeof practices.$inferSelect;

// Registration-specific schema with required fields and validation
export const practiceRegistrationSchema = z.object({
  name: z.string().min(2, "Practice name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().min(2, "City is required"),
  stateCode: z.string().length(2, "Please select a state"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  npiNumber: z.string().optional(),
  taxId: z.string().optional(),
  ownerFirstName: z.string().min(1, "Owner first name is required"),
  ownerLastName: z.string().min(1, "Owner last name is required"),
  ownerEmail: z.string().email("Please enter a valid owner email"),
  ownerPhone: z.string().min(10, "Owner phone is required"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type PracticeRegistration = z.infer<typeof practiceRegistrationSchema>;

// Practice Admins - Users who can manage a practice
export const practiceAdmins = pgTable("practice_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Bcrypt hashed password
  phone: text("phone"),
  role: text("role").default("admin"), // admin, manager, staff
  isSuperAdmin: boolean("is_super_admin").default(false), // Platform-level super admin with access to all practices
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const practiceAdminsRelations = relations(practiceAdmins, ({ one }) => ({
  practice: one(practices, {
    fields: [practiceAdmins.practiceId],
    references: [practices.id],
  }),
}));

export const insertPracticeAdminSchema = createInsertSchema(practiceAdmins).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertPracticeAdmin = z.infer<typeof insertPracticeAdminSchema>;
export type PracticeAdmin = typeof practiceAdmins.$inferSelect;

// Practice Locations - Multiple office locations for a practice
export const practiceLocations = pgTable("practice_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Main Office", "Downtown Branch"
  address: text("address"),
  city: text("city"),
  stateCode: varchar("state_code", { length: 2 }),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Location-specific profile fields (override practice-level defaults)
  aboutOffice: text("about_office"),
  parkingInfo: text("parking_info"),
  arrivalInstructions: text("arrival_instructions"),
  dressCode: text("dress_code"),
  photos: text("photos").array(),
  
  // Staffing info for this location
  numDentists: integer("num_dentists"),
  numHygienists: integer("num_hygienists"),
  numSupportStaff: integer("num_support_staff"),
  
  // Amenities at this location
  breakRoomAvailable: boolean("break_room_available"),
  refrigeratorAvailable: boolean("refrigerator_available"),
  microwaveAvailable: boolean("microwave_available"),
  
  // Software used at this location (may vary by location)
  practiceManagementSoftware: text("practice_management_software"),
  xraySoftware: text("xray_software"),
  
  // Clinical info for this location
  hasOverheadLights: boolean("has_overhead_lights"),
  preferredScrubColor: text("preferred_scrub_color"),
  clinicalAttireProvided: boolean("clinical_attire_provided"),
  useAirPolishers: boolean("use_air_polishers"),
  scalerType: text("scaler_type"),
  assistedHygieneSchedule: boolean("assisted_hygiene_schedule"),
  rootPlaningProcedures: boolean("root_planing_procedures"),
  seeNewPatients: boolean("see_new_patients"),
  administerLocalAnesthesia: boolean("administer_local_anesthesia"),
  workWithNitrousPatients: boolean("work_with_nitrous_patients"),
  
  // Appointment settings for this location
  appointmentLengthAdults: text("appointment_length_adults"),
  appointmentLengthKids: text("appointment_length_kids"),
  appointmentLengthPerio: text("appointment_length_perio"),
  appointmentLengthScaling: text("appointment_length_scaling"),
  
  // Room setup at this location
  dentalTreatmentRooms: integer("dental_treatment_rooms"),
  dedicatedHygieneRooms: integer("dedicated_hygiene_rooms"),
  hiringPermanently: boolean("hiring_permanently"),
});

export const practiceLocationsRelations = relations(practiceLocations, ({ one }) => ({
  practice: one(practices, {
    fields: [practiceLocations.practiceId],
    references: [practices.id],
  }),
}));

export const insertPracticeLocationSchema = createInsertSchema(practiceLocations).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertPracticeLocation = z.infer<typeof insertPracticeLocationSchema>;
export type PracticeLocation = typeof practiceLocations.$inferSelect;

// Practice Settings - Practice-specific fee overrides (inherits from platform if null)
export const practiceSettings = pgTable("practice_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }).unique(),
  serviceFeeRateOverride: decimal("service_fee_rate_override", { precision: 5, scale: 4 }), // null = use platform default
  convenienceFeeRateOverride: decimal("convenience_fee_rate_override", { precision: 5, scale: 4 }),
  platformFeeRateOverride: decimal("platform_fee_rate_override", { precision: 5, scale: 4 }),
  workersCompRateOverride: decimal("workers_comp_rate_override", { precision: 5, scale: 4 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const practiceSettingsRelations = relations(practiceSettings, ({ one }) => ({
  practice: one(practices, {
    fields: [practiceSettings.practiceId],
    references: [practices.id],
  }),
}));

export const insertPracticeSettingsSchema = createInsertSchema(practiceSettings).omit({ 
  id: true, 
  updatedAt: true 
});
export type InsertPracticeSettings = z.infer<typeof insertPracticeSettingsSchema>;
export type PracticeSettings = typeof practiceSettings.$inferSelect;

// Resolved fee rates type (computed from practice → platform fallback)
export type ResolvedFeeRates = {
  serviceFeeRate: number;
  convenienceFeeRate: number;
  platformFeeRate: number;
  payrollTaxRate: number;
  federalUnemploymentRate: number;
  stateUnemploymentRate: number;
  workersCompRate: number;
  paidSickLeaveRate: number;
  stateIncomeTaxRate: number;
  additionalTaxRate: number;
  totalPayrollBurden: number; // Sum of all employer-side taxes
};

// DentalXchange Eligibility Verifications - Stores eligibility check results
export const eligibilityVerifications = pgTable("eligibility_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  policyId: varchar("policy_id").references(() => insurancePolicies.id, { onDelete: "set null" }),
  practiceId: varchar("practice_id"),
  locationId: varchar("location_id"),
  
  // Request details
  requestedBy: varchar("requested_by"), // User who initiated the request
  requestedAt: timestamp("requested_at").defaultNow(),
  
  // Payer information
  payerIdCode: text("payer_id_code").notNull(),
  payerName: text("payer_name").notNull(),
  
  // Provider used for verification
  providerNpi: text("provider_npi"),
  providerName: text("provider_name"),
  
  // Subscriber information
  subscriberMemberId: text("subscriber_member_id"),
  subscriberFirstName: text("subscriber_first_name"),
  subscriberLastName: text("subscriber_last_name"),
  subscriberDob: text("subscriber_dob"),
  
  // Patient information from response
  patientFirstName: text("patient_first_name"),
  patientLastName: text("patient_last_name"),
  patientDob: text("patient_dob"),
  patientRelationship: text("patient_relationship"),
  
  // Coverage status
  coverageStatus: text("coverage_status").notNull(), // active, inactive, unknown
  groupNumber: text("group_number"),
  groupName: text("group_name"),
  effectiveDateFrom: text("effective_date_from"),
  effectiveDateTo: text("effective_date_to"),
  planCoverageDescription: text("plan_coverage_description"),
  insuranceType: text("insurance_type"), // PPO, HMO, etc.
  
  // Response metadata
  transactionId: text("transaction_id"),
  responseCode: integer("response_code"),
  responseDescription: text("response_description"),
  responseMessages: text("response_messages").array(),
  
  // Full response stored as JSON for reference
  rawResponse: text("raw_response"), // JSON string of full response
  
  // Status
  status: text("status").default("completed"), // pending, completed, error
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const eligibilityVerificationsRelations = relations(eligibilityVerifications, ({ one, many }) => ({
  patient: one(patients, {
    fields: [eligibilityVerifications.patientId],
    references: [patients.id],
  }),
  policy: one(insurancePolicies, {
    fields: [eligibilityVerifications.policyId],
    references: [insurancePolicies.id],
  }),
  benefits: many(eligibilityBenefits),
}));

export const insertEligibilityVerificationSchema = createInsertSchema(eligibilityVerifications).omit({
  id: true,
  createdAt: true,
});
export type InsertEligibilityVerification = z.infer<typeof insertEligibilityVerificationSchema>;
export type EligibilityVerification = typeof eligibilityVerifications.$inferSelect;

// Eligibility Benefits - Stores detailed benefits breakdown from eligibility response
export const eligibilityBenefits = pgTable("eligibility_benefits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  verificationId: varchar("verification_id").notNull().references(() => eligibilityVerifications.id, { onDelete: "cascade" }),
  
  // Benefit category
  benefitType: text("benefit_type").notNull(), // coInsurance, deductible, maximum, limitation
  serviceType: text("service_type"), // Preventive, Basic, Major, etc.
  procedureCode: text("procedure_code"), // CDT code if specific
  
  // Network breakdown
  network: text("network").notNull(), // In-Network, Out-Of-Network
  coverageLevel: text("coverage_level"), // Individual, Family
  
  // Values
  percent: text("percent"), // For co-insurance
  amount: text("amount"), // For deductibles/maximums
  remaining: text("remaining"), // Remaining amount
  
  // Limitations
  quantity: text("quantity"),
  quantityQualifier: text("quantity_qualifier"),
  timePeriod: text("time_period"), // Calendar Year, Benefit Year, etc.
  
  // Additional info
  authorizationRequired: boolean("authorization_required").default(false),
  message: text("message"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const eligibilityBenefitsRelations = relations(eligibilityBenefits, ({ one }) => ({
  verification: one(eligibilityVerifications, {
    fields: [eligibilityBenefits.verificationId],
    references: [eligibilityVerifications.id],
  }),
}));

export const insertEligibilityBenefitSchema = createInsertSchema(eligibilityBenefits).omit({
  id: true,
  createdAt: true,
});
export type InsertEligibilityBenefit = z.infer<typeof insertEligibilityBenefitSchema>;
export type EligibilityBenefit = typeof eligibilityBenefits.$inferSelect;

// DentalXchange Payer Directory - Cache of supported payers
export const dentalxchangePayers = pgTable("dentalxchange_payers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payerIdCode: text("payer_id_code").notNull().unique(),
  name: text("name").notNull(),
  eligibilitySupported: boolean("eligibility_supported").default(true),
  claimsSupported: boolean("claims_supported").default(true),
  attachmentsSupported: boolean("attachments_supported").default(false),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertDentalxchangePayerSchema = createInsertSchema(dentalxchangePayers).omit({
  id: true,
  lastUpdated: true,
});
export type InsertDentalxchangePayer = z.infer<typeof insertDentalxchangePayerSchema>;
export type DentalxchangePayer = typeof dentalxchangePayers.$inferSelect;

// Messaging - Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceAdminId: varchar("practice_admin_id").notNull(), // Practice admin user ID
  professionalId: varchar("professional_id").notNull().references(() => professionals.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  professional: one(professionals, {
    fields: [conversations.professionalId],
    references: [professionals.id],
  }),
  messages: many(messages),
}));

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messaging - Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull(), // Can be practice admin or professional
  senderType: text("sender_type").notNull(), // "practice_admin" or "professional"
  content: text("content").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, readAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// User Online Status - tracks when users were last active
export const userOnlineStatus = pgTable("user_online_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // professional ID or admin identifier
  userType: text("user_type").notNull(), // "practice_admin" or "professional"
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  isOnline: boolean("is_online").default(false),
});

export const insertUserOnlineStatusSchema = createInsertSchema(userOnlineStatus).omit({ id: true });
export type InsertUserOnlineStatus = z.infer<typeof insertUserOnlineStatusSchema>;
export type UserOnlineStatus = typeof userOnlineStatus.$inferSelect;

// Conversation with related data for UI
export type ConversationWithDetails = Conversation & {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    role: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  isOnline: boolean;
};

// Dentrix Ascend Integration Configuration
export const dentrixAscendConfig = pgTable("dentrix_ascend_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id"), // Links to practice if multi-tenant
  clientId: text("client_id"), // OAuth client ID
  clientSecret: text("client_secret"), // OAuth client secret (encrypted)
  apiKey: text("api_key"), // API key from Dentrix Developer Program
  baseUrl: text("base_url").default("https://api.dentrixascend.com"),
  accessToken: text("access_token"), // Current OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"), // Token expiration
  isEnabled: boolean("is_enabled").default(false),
  autoSyncEnabled: boolean("auto_sync_enabled").default(false),
  syncIntervalMinutes: integer("sync_interval_minutes").default(60),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"), // success, failed, in_progress
  lastSyncError: text("last_sync_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDentrixAscendConfigSchema = createInsertSchema(dentrixAscendConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDentrixAscendConfig = z.infer<typeof insertDentrixAscendConfigSchema>;
export type DentrixAscendConfig = typeof dentrixAscendConfig.$inferSelect;

// Dentrix Ascend Sync Log - tracks individual sync operations
export const dentrixSyncLog = pgTable("dentrix_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configId: varchar("config_id").references(() => dentrixAscendConfig.id, { onDelete: "cascade" }),
  syncType: text("sync_type").notNull(), // full, incremental, single_patient
  status: text("status").notNull(), // pending, in_progress, completed, failed
  patientsProcessed: integer("patients_processed").default(0),
  patientsCreated: integer("patients_created").default(0),
  patientsUpdated: integer("patients_updated").default(0),
  patientsSkipped: integer("patients_skipped").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertDentrixSyncLogSchema = createInsertSchema(dentrixSyncLog).omit({ id: true, startedAt: true });
export type InsertDentrixSyncLog = z.infer<typeof insertDentrixSyncLogSchema>;
export type DentrixSyncLog = typeof dentrixSyncLog.$inferSelect;

// Dentrix Patient Mapping - links Dentrix patient IDs to local patient IDs
export const dentrixPatientMapping = pgTable("dentrix_patient_mapping", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dentrixPatientId: text("dentrix_patient_id").notNull().unique(),
  localPatientId: varchar("local_patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  dentrixData: text("dentrix_data"), // JSON snapshot of last synced Dentrix data
});

export const dentrixPatientMappingRelations = relations(dentrixPatientMapping, ({ one }) => ({
  patient: one(patients, {
    fields: [dentrixPatientMapping.localPatientId],
    references: [patients.id],
  }),
}));

export const insertDentrixPatientMappingSchema = createInsertSchema(dentrixPatientMapping).omit({ id: true, lastSyncedAt: true });
export type InsertDentrixPatientMapping = z.infer<typeof insertDentrixPatientMappingSchema>;
export type DentrixPatientMapping = typeof dentrixPatientMapping.$inferSelect;

// Service Subscriptions - tracks which services a practice has subscribed to
export const serviceSubscriptions = pgTable("service_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  service: text("service").notNull(), // verification, insurance_billing, patient_billing
  status: text("status").notNull().default("inactive"), // active, inactive, pending
  tier: text("tier"), // per_patient, flat_rate, percentage
  monthlyProduction: integer("monthly_production"),
  subscribedAt: timestamp("subscribed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceSubscriptionsRelations = relations(serviceSubscriptions, ({ one }) => ({
  practice: one(practices, {
    fields: [serviceSubscriptions.practiceId],
    references: [practices.id],
  }),
}));

export const insertServiceSubscriptionSchema = createInsertSchema(serviceSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceSubscription = z.infer<typeof insertServiceSubscriptionSchema>;
export type ServiceSubscription = typeof serviceSubscriptions.$inferSelect;

// US States for dropdown
export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;
