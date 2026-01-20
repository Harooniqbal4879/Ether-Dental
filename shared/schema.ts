import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Insurance Carriers
export const insuranceCarriers = pgTable("insurance_carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  website: text("website"),
  logoUrl: text("logo_url"),
  clearinghouseCompatible: boolean("clearinghouse_compatible").default(false),
});

export const insertInsuranceCarrierSchema = createInsertSchema(insuranceCarriers).omit({ id: true });
export type InsertInsuranceCarrier = z.infer<typeof insertInsuranceCarrierSchema>;
export type InsuranceCarrier = typeof insuranceCarriers.$inferSelect;

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
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
  method: text("method"), // clearinghouse, phone, manual
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"), // user id or "System - AI"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  name: text("name").notNull(), // Change Healthcare, Availity, etc.
  provider: text("provider").notNull(), // change_healthcare, availity, trizetto, office_ally, waystar
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
  CHANGE_HEALTHCARE: "change_healthcare",
  AVAILITY: "availity",
  TRIZETTO: "trizetto",
  OFFICE_ALLY: "office_ally",
  WAYSTAR: "waystar",
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

// Staff Shifts - for staffing management
export const staffShifts = pgTable("staff_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
});
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionals.$inferSelect;

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
