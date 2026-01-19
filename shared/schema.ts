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
  status: text("status").notNull().default("open"), // open, filled, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffShiftSchema = createInsertSchema(staffShifts).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffShift = z.infer<typeof insertStaffShiftSchema>;
export type StaffShift = typeof staffShifts.$inferSelect;

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
