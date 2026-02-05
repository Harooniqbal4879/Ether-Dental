import { db } from "./db";
import {
  insuranceCarriers,
  patients,
  insurancePolicies,
  verifications,
  benefits,
  appointments,
  professionals,
  professionalBadges,
  staffShifts,
  shiftTransactions,
  platformSettings,
  platformStateTaxRates,
  practices,
  conversations,
  messages,
  StaffRoles,
  DentalSpecialties,
} from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed Insurance Carriers
  const carriers = await db
    .insert(insuranceCarriers)
    .values([
      {
        name: "Delta Dental",
        phone: "1-800-765-6003",
        website: "https://www.deltadental.com",
        clearinghouseCompatible: true,
      },
      {
        name: "Cigna Dental",
        phone: "1-800-244-6224",
        website: "https://www.cigna.com/dental",
        clearinghouseCompatible: true,
      },
      {
        name: "MetLife Dental",
        phone: "1-800-942-0854",
        website: "https://www.metlife.com/dental",
        clearinghouseCompatible: true,
      },
      {
        name: "Aetna Dental",
        phone: "1-800-872-3862",
        website: "https://www.aetna.com/dental",
        clearinghouseCompatible: true,
      },
      {
        name: "Guardian Dental",
        phone: "1-800-541-7846",
        website: "https://www.guardiandirect.com",
        clearinghouseCompatible: false,
      },
      {
        name: "United Healthcare Dental",
        phone: "1-800-332-0366",
        website: "https://www.uhc.com/dental",
        clearinghouseCompatible: true,
      },
      {
        name: "Humana Dental",
        phone: "1-800-233-4013",
        website: "https://www.humana.com/dental",
        clearinghouseCompatible: false,
      },
      {
        name: "Principal Dental",
        phone: "1-800-247-4695",
        website: "https://www.principal.com",
        clearinghouseCompatible: true,
      },
      // Medical Insurance Carriers
      {
        name: "Blue Cross Blue Shield",
        phone: "1-800-262-2583",
        website: "https://www.bcbs.com",
        clearinghouseCompatible: true,
        insuranceType: "medical",
      },
      {
        name: "Aetna Medical",
        phone: "1-800-872-3862",
        website: "https://www.aetna.com",
        clearinghouseCompatible: true,
        insuranceType: "medical",
      },
      {
        name: "UnitedHealthcare",
        phone: "1-800-328-5979",
        website: "https://www.uhc.com",
        clearinghouseCompatible: true,
        insuranceType: "medical",
      },
    ])
    .returning();

  // Separate carriers by type
  const dentalCarriers = carriers.filter(c => c.insuranceType !== "medical");
  const medicalCarriers = carriers.filter(c => c.insuranceType === "medical");
  
  console.log(`Created ${dentalCarriers.length} dental and ${medicalCarriers.length} medical insurance carriers`);

  // Seed Platform Settings (global fee configuration)
  const [platformSettingsCreated] = await db.insert(platformSettings).values({
    serviceFeeRate: "0.2250",      // 22.5%
    convenienceFeeRate: "0.0350",  // 3.5%
    platformFeeRate: "0.1200",     // 12% EtherAI-Dental fee
    payrollTaxRate: "0.0765",      // 7.65% (Social Security + Medicare)
    federalUnemploymentRate: "0.0060", // 0.6% FUTA
    workersCompRate: "0.0100",     // 1% default
    paidSickLeaveRate: "0.0050",   // 0.5% default
  }).returning();
  console.log("Created platform settings with configurable fee rates");

  // Seed State Tax Rates (key states for demonstration)
  const stateTaxData = [
    { stateCode: "CA", stateName: "California", stateUnemploymentRate: "0.0340", stateIncomeTaxRate: "0.0725", additionalTaxRate: "0.0010" },
    { stateCode: "TX", stateName: "Texas", stateUnemploymentRate: "0.0270", stateIncomeTaxRate: "0.0000", additionalTaxRate: "0.0000" },
    { stateCode: "FL", stateName: "Florida", stateUnemploymentRate: "0.0270", stateIncomeTaxRate: "0.0000", additionalTaxRate: "0.0000" },
    { stateCode: "NY", stateName: "New York", stateUnemploymentRate: "0.0420", stateIncomeTaxRate: "0.0685", additionalTaxRate: "0.0015" },
    { stateCode: "IL", stateName: "Illinois", stateUnemploymentRate: "0.0350", stateIncomeTaxRate: "0.0495", additionalTaxRate: "0.0000" },
    { stateCode: "PA", stateName: "Pennsylvania", stateUnemploymentRate: "0.0300", stateIncomeTaxRate: "0.0307", additionalTaxRate: "0.0000" },
    { stateCode: "OH", stateName: "Ohio", stateUnemploymentRate: "0.0280", stateIncomeTaxRate: "0.0400", additionalTaxRate: "0.0000" },
    { stateCode: "GA", stateName: "Georgia", stateUnemploymentRate: "0.0270", stateIncomeTaxRate: "0.0549", additionalTaxRate: "0.0000" },
    { stateCode: "NC", stateName: "North Carolina", stateUnemploymentRate: "0.0250", stateIncomeTaxRate: "0.0499", additionalTaxRate: "0.0000" },
    { stateCode: "MI", stateName: "Michigan", stateUnemploymentRate: "0.0300", stateIncomeTaxRate: "0.0425", additionalTaxRate: "0.0000" },
  ];
  await db.insert(platformStateTaxRates).values(stateTaxData);
  console.log(`Created ${stateTaxData.length} state tax rate configurations`);

  // Seed a sample practice
  const [samplePractice] = await db.insert(practices).values({
    name: "Sunrise Dental Care",
    address: "456 Healthcare Blvd",
    city: "Los Angeles",
    stateCode: "CA",
    zipCode: "90210",
    phone: "(555) 987-6543",
    email: "info@sunrisedentalcare.com",
    npiNumber: "1234567890",
    taxId: "12-3456789",
  }).returning();
  console.log("Created sample practice: Sunrise Dental Care");

  // Seed Patients
  const patientData = [
    {
      firstName: "Sarah",
      lastName: "Johnson",
      dateOfBirth: "1985-03-15",
      ssnLast4: "4532",
      phone: "(555) 123-4567",
      email: "sarah.johnson@email.com",
      address: "123 Oak Street",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      emergencyContactName: "Michael Johnson",
      emergencyContactPhone: "(555) 123-4568",
    },
    {
      firstName: "James",
      lastName: "Williams",
      dateOfBirth: "1978-07-22",
      ssnLast4: "7821",
      phone: "(555) 234-5678",
      email: "james.williams@email.com",
      address: "456 Maple Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90211",
      emergencyContactName: "Linda Williams",
      emergencyContactPhone: "(555) 234-5679",
    },
    {
      firstName: "Emily",
      lastName: "Chen",
      dateOfBirth: "1992-11-08",
      ssnLast4: "3456",
      phone: "(555) 345-6789",
      email: "emily.chen@email.com",
      address: "789 Pine Road",
      city: "Santa Monica",
      state: "CA",
      zipCode: "90401",
    },
    {
      firstName: "Robert",
      lastName: "Martinez",
      dateOfBirth: "1968-05-30",
      ssnLast4: "9012",
      phone: "(555) 456-7890",
      email: "robert.martinez@email.com",
      address: "321 Cedar Lane",
      city: "Beverly Hills",
      state: "CA",
      zipCode: "90212",
      emergencyContactName: "Maria Martinez",
      emergencyContactPhone: "(555) 456-7891",
    },
    {
      firstName: "Jennifer",
      lastName: "Davis",
      dateOfBirth: "2001-09-12",
      ssnLast4: "5678",
      phone: "(555) 567-8901",
      email: "jennifer.davis@email.com",
      address: "654 Birch Street",
      city: "Pasadena",
      state: "CA",
      zipCode: "91101",
    },
    {
      firstName: "Michael",
      lastName: "Thompson",
      dateOfBirth: "1990-02-28",
      ssnLast4: "2345",
      phone: "(555) 678-9012",
      email: "michael.thompson@email.com",
      address: "987 Elm Drive",
      city: "Glendale",
      state: "CA",
      zipCode: "91201",
    },
  ];

  const createdPatients = await db.insert(patients).values(patientData).returning();
  console.log(`Created ${createdPatients.length} patients`);

  // Create insurance policies for each patient
  for (let i = 0; i < createdPatients.length; i++) {
    const patient = createdPatients[i];
    const dentalCarrier = dentalCarriers[i % dentalCarriers.length];

    // Create dental insurance policy
    const [dentalPolicy] = await db
      .insert(insurancePolicies)
      .values({
        patientId: patient.id,
        carrierId: dentalCarrier.id,
        policyNumber: `POL${String(100000 + i).slice(1)}`,
        groupNumber: `GRP${String(1000 + i).slice(1)}`,
        subscriberName: `${patient.firstName} ${patient.lastName}`,
        subscriberRelationship: "self",
        subscriberDob: patient.dateOfBirth,
        isPrimary: true,
        effectiveDate: "2024-01-01",
      })
      .returning();

    // Create dental verification records with varying statuses
    const statuses = ["completed", "completed", "pending", "completed", "pending", "in_progress"];
    const status = statuses[i % statuses.length];
    
    const [dentalVerification] = await db
      .insert(verifications)
      .values({
        patientId: patient.id,
        policyId: dentalPolicy.id,
        insuranceType: "dental",
        status,
        method: dentalCarrier.clearinghouseCompatible ? "clearinghouse" : "phone",
        verifiedAt: status === "completed" ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        verifiedBy: status === "completed" 
          ? (dentalCarrier.clearinghouseCompatible ? "System - Clearinghouse" : "System - AI")
          : null,
      })
      .returning();

    // Create dental benefits data for completed verifications
    if (status === "completed") {
      const usedAmount = Math.floor(Math.random() * 800);
      await db.insert(benefits).values({
        verificationId: dentalVerification.id,
        annualMaximum: "1500.00",
        annualUsed: String(usedAmount),
        annualRemaining: String(1500 - usedAmount),
        deductibleIndividual: "50.00",
        deductibleIndividualMet: String(Math.min(50, Math.floor(Math.random() * 60))),
        deductibleFamily: "150.00",
        deductibleFamilyMet: String(Math.min(150, Math.floor(Math.random() * 160))),
        preventiveCoverage: 100,
        basicCoverage: 80,
        majorCoverage: 50,
        orthodonticCoverage: i % 2 === 0 ? 50 : null,
        orthodonticMaximum: i % 2 === 0 ? "1500.00" : null,
        orthodonticUsed: i % 2 === 0 ? "0.00" : null,
        cleaningsPerYear: 2,
        xraysFrequency: "Bitewings 1x/year, Full mouth 1x/5 years",
        fluorideAgeLimit: 18,
        planYear: "calendar",
        renewalDate: "January 1",
        inNetwork: true,
      });
    }

    // Add medical insurance for the first 3 patients (dual insurance)
    if (i < 3 && medicalCarriers.length > 0) {
      const medicalCarrier = medicalCarriers[i % medicalCarriers.length];
      
      // Create medical insurance policy
      const [medicalPolicy] = await db
        .insert(insurancePolicies)
        .values({
          patientId: patient.id,
          carrierId: medicalCarrier.id,
          policyNumber: `MED${String(200000 + i).slice(1)}`,
          groupNumber: `MGRP${String(2000 + i).slice(1)}`,
          subscriberName: `${patient.firstName} ${patient.lastName}`,
          subscriberRelationship: "self",
          subscriberDob: patient.dateOfBirth,
          isPrimary: false,
          effectiveDate: "2024-01-01",
        })
        .returning();

      // Create medical verification (completed)
      const [medicalVerification] = await db
        .insert(verifications)
        .values({
          patientId: patient.id,
          policyId: medicalPolicy.id,
          insuranceType: "medical",
          status: "completed",
          method: "clearinghouse",
          verifiedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
          verifiedBy: "System - Availity",
        })
        .returning();

      // Create medical benefits data
      const medicalUsed = Math.floor(Math.random() * 2000);
      await db.insert(benefits).values({
        verificationId: medicalVerification.id,
        annualMaximum: "5000.00",
        annualUsed: String(medicalUsed),
        annualRemaining: String(5000 - medicalUsed),
        deductibleIndividual: "500.00",
        deductibleIndividualMet: String(Math.min(500, Math.floor(Math.random() * 600))),
        deductibleFamily: "1500.00",
        deductibleFamilyMet: String(Math.min(1500, Math.floor(Math.random() * 1600))),
        preventiveCoverage: 80,
        basicCoverage: 60,
        majorCoverage: null,
        orthodonticCoverage: null,
        orthodonticMaximum: null,
        orthodonticUsed: null,
        cleaningsPerYear: null,
        xraysFrequency: null,
        fluorideAgeLimit: null,
        planYear: "calendar",
        renewalDate: "January 1",
        inNetwork: true,
      });
    }
  }

  console.log("Created insurance policies and verifications (dental + medical)");

  // Create upcoming appointments
  const appointmentTypes = ["Cleaning", "Exam", "Filling", "Crown", "Root Canal", "Extraction"];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const patient = createdPatients[i % createdPatients.length];
    const daysFromNow = i;
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
    scheduledDate.setHours(9 + (i % 8), (i % 4) * 15, 0, 0);

    await db.insert(appointments).values({
      patientId: patient.id,
      scheduledAt: scheduledDate,
      appointmentType: appointmentTypes[i % appointmentTypes.length],
      status: "scheduled",
    });
  }

  console.log("Created appointments");

  // Seed Professionals
  const professionalsData = [
    {
      firstName: "Dr. Amanda",
      lastName: "Rodriguez",
      email: "a.rodriguez@sunnypines.dental",
      phone: "(555) 111-2222",
      role: StaffRoles.DENTIST,
      specialty: DentalSpecialties.GENERAL_DENTISTRY,
      specialties: [DentalSpecialties.COSMETICS, DentalSpecialties.PROSTHODONTICS],
      education: "UCLA School of Dentistry",
      graduationDate: "2012",
      licenseNumber: "DEN-78432",
      licenseState: "California",
      licenseYearIssued: "2012",
      experienceRange: "10-15 years",
      software: ["Dentrix", "Eaglesoft", "Open Dental"],
      procedures: ["Crowns", "Bridges", "Veneers", "Composite Fillings", "Extractions", "Root Canal Therapy"],
      rating: "4.9",
      credentialsVerified: true,
    },
    {
      firstName: "Jessica",
      lastName: "Chen",
      email: "j.chen@sunnypines.dental",
      phone: "(555) 222-3333",
      role: StaffRoles.HYGIENIST,
      specialty: DentalSpecialties.PERIODONTICS,
      specialties: [],
      education: "USC Herman Ostrow School of Dentistry",
      graduationDate: "2018",
      licenseNumber: "RDH-56789",
      licenseState: "California",
      licenseYearIssued: "2018",
      experienceRange: "5-10 years",
      software: ["Dentrix", "Curve Dental"],
      procedures: ["Prophylaxis", "Scaling and Root Planing", "Fluoride Treatment", "Sealants", "Periodontal Maintenance"],
      rating: "4.8",
      credentialsVerified: true,
    },
    {
      firstName: "Marcus",
      lastName: "Thompson",
      email: "m.thompson@sunnypines.dental",
      phone: "(555) 333-4444",
      role: StaffRoles.DENTAL_ASSISTANT,
      specialty: DentalSpecialties.ORAL_SURGERY,
      specialties: [DentalSpecialties.ENDODONTICS],
      education: "Pasadena City College Dental Assisting Program",
      graduationDate: "2019",
      licenseNumber: "RDA-34567",
      licenseState: "California",
      licenseYearIssued: "2019",
      experienceRange: "3-5 years",
      software: ["Dentrix", "Eaglesoft"],
      procedures: ["Chairside Assistance", "X-ray Taking", "Impression Taking", "Sterilization Protocols"],
      rating: "4.7",
      credentialsVerified: true,
    },
    {
      firstName: "Dr. Benjamin",
      lastName: "Park",
      email: "b.park@sunnypines.dental",
      phone: "(555) 444-5555",
      role: StaffRoles.DENTIST,
      specialty: DentalSpecialties.ORTHODONTICS,
      specialties: [DentalSpecialties.PEDIATRICS],
      education: "University of the Pacific Arthur A. Dugoni School of Dentistry",
      graduationDate: "2015",
      licenseNumber: "DEN-92145",
      licenseState: "California",
      licenseYearIssued: "2015",
      experienceRange: "5-10 years",
      software: ["Dolphin Imaging", "Invisalign Provider Portal", "Dentrix"],
      procedures: ["Invisalign", "Traditional Braces", "Retainers", "Space Maintainers", "Palatal Expanders"],
      rating: "4.9",
      credentialsVerified: true,
    },
    {
      firstName: "Patricia",
      lastName: "Williams",
      email: "p.williams@sunnypines.dental",
      phone: "(555) 555-6666",
      role: StaffRoles.OFFICE_COORDINATOR,
      specialty: null,
      specialties: [],
      education: "California State University, Long Beach",
      graduationDate: "2016",
      licenseNumber: null,
      licenseState: null,
      licenseYearIssued: null,
      experienceRange: "5-10 years",
      software: ["Dentrix", "QuickBooks", "Microsoft Office"],
      procedures: [],
      rating: "4.6",
      credentialsVerified: true,
    },
    {
      firstName: "David",
      lastName: "Garcia",
      email: "d.garcia@sunnypines.dental",
      phone: "(555) 666-7777",
      role: StaffRoles.BILLING_STAFF,
      specialty: null,
      specialties: [],
      education: "Cerritos College Medical Billing & Coding",
      graduationDate: "2017",
      licenseNumber: null,
      licenseState: null,
      licenseYearIssued: null,
      experienceRange: "5-10 years",
      software: ["Dentrix", "Dentrix Ascend", "CDT Coding", "Practice Management Systems"],
      procedures: [],
      rating: "4.8",
      credentialsVerified: true,
    },
  ];

  const createdProfessionals = await db.insert(professionals).values(professionalsData).returning();
  console.log(`Created ${createdProfessionals.length} professionals`);

  // Create badges for professionals
  const badgeData = [
    { professionalId: createdProfessionals[0].id, badgeType: "perfect_attendance", level: "gold", count: 52 },
    { professionalId: createdProfessionals[0].id, badgeType: "shifts_completed", level: "gold", count: 156 },
    { professionalId: createdProfessionals[0].id, badgeType: "knowledge", level: "silver", count: 24 },
    { professionalId: createdProfessionals[1].id, badgeType: "timeliness", level: "gold", count: 98 },
    { professionalId: createdProfessionals[1].id, badgeType: "teamwork", level: "silver", count: 45 },
    { professionalId: createdProfessionals[1].id, badgeType: "shifts_completed", level: "silver", count: 87 },
    { professionalId: createdProfessionals[2].id, badgeType: "teamwork", level: "bronze", count: 12 },
    { professionalId: createdProfessionals[2].id, badgeType: "shifts_completed", level: "bronze", count: 34 },
    { professionalId: createdProfessionals[3].id, badgeType: "perfect_attendance", level: "silver", count: 28 },
    { professionalId: createdProfessionals[3].id, badgeType: "knowledge", level: "gold", count: 67 },
    { professionalId: createdProfessionals[3].id, badgeType: "shifts_completed", level: "silver", count: 72 },
    { professionalId: createdProfessionals[4].id, badgeType: "timeliness", level: "bronze", count: 15 },
    { professionalId: createdProfessionals[5].id, badgeType: "knowledge", level: "silver", count: 38 },
    { professionalId: createdProfessionals[5].id, badgeType: "shifts_completed", level: "bronze", count: 45 },
  ];

  await db.insert(professionalBadges).values(badgeData);
  console.log(`Created ${badgeData.length} professional badges`);

  // Create sample shifts (including some completed ones)
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const shiftsData = [
    {
      date: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), // 14 days ago
      role: StaffRoles.HYGIENIST,
      specialties: [DentalSpecialties.GENERAL_DENTISTRY],
      arrivalTime: "07:45",
      firstPatientTime: "08:00",
      endTime: "17:00",
      breakDuration: "60 min",
      pricingMode: "fixed",
      fixedHourlyRate: "52.00",
      status: "completed",
      assignedProfessionalId: createdProfessionals[1].id,
    },
    {
      date: formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      role: StaffRoles.DENTAL_ASSISTANT,
      specialties: [DentalSpecialties.GENERAL_DENTISTRY],
      arrivalTime: "07:30",
      firstPatientTime: "08:00",
      endTime: "16:00",
      breakDuration: "30 min",
      pricingMode: "fixed",
      fixedHourlyRate: "28.00",
      status: "completed",
      assignedProfessionalId: createdProfessionals[2].id,
    },
    {
      date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      role: StaffRoles.DENTIST,
      specialties: [DentalSpecialties.GENERAL_DENTISTRY, DentalSpecialties.COSMETICS],
      arrivalTime: "08:00",
      firstPatientTime: "08:30",
      endTime: "17:30",
      breakDuration: "60 min",
      pricingMode: "smart",
      minHourlyRate: "85.00",
      maxHourlyRate: "110.00",
      status: "completed",
      assignedProfessionalId: createdProfessionals[0].id,
    },
    {
      date: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
      role: StaffRoles.HYGIENIST,
      specialties: null,
      arrivalTime: "08:00",
      firstPatientTime: "08:30",
      endTime: "16:30",
      breakDuration: "30 min",
      pricingMode: "fixed",
      fixedHourlyRate: "50.00",
      status: "open",
    },
    {
      date: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
      role: StaffRoles.FRONT_DESK,
      specialties: null,
      arrivalTime: "07:30",
      firstPatientTime: "08:00",
      endTime: "17:00",
      breakDuration: "60 min",
      pricingMode: "fixed",
      fixedHourlyRate: "22.00",
      status: "open",
    },
  ];

  const createdShifts = await db.insert(staffShifts).values(shiftsData).returning();
  console.log(`Created ${createdShifts.length} staff shifts`);

  // Create transactions for completed shifts using configurable rates
  // Note: In production, these rates come from platform_settings table
  const completedShifts = createdShifts.filter(s => s.status === "completed");
  
  // Get platform settings for fee rates (or use defaults)
  const [platformSettingsRow] = await db.select().from(platformSettings).limit(1);
  const serviceFeeRate = platformSettingsRow ? parseFloat(platformSettingsRow.serviceFeeRate) : 0.225;
  const convenienceFeeRate = platformSettingsRow ? parseFloat(platformSettingsRow.convenienceFeeRate) : 0.035;
  
  const transactionsData = [];
  for (const shift of completedShifts) {
    const hoursWorked = 8.0;
    const hourlyRate = parseFloat(shift.fixedHourlyRate || shift.maxHourlyRate || "50.00");
    const regularPay = hoursWorked * hourlyRate;
    const serviceFee = regularPay * serviceFeeRate;
    const convenienceFee = (regularPay + serviceFee) * convenienceFeeRate;
    const totalPay = regularPay + serviceFee + convenienceFee;
    
    // Parse break duration from string format like "60 min"
    const breakMinutes = parseInt(shift.breakDuration?.replace(/\D/g, '') || '0', 10);

    transactionsData.push({
      shiftId: shift.id,
      professionalId: shift.assignedProfessionalId!,
      chargeDate: shift.date,
      hoursWorked: hoursWorked.toFixed(2),
      hourlyRate: hourlyRate.toFixed(2),
      mealBreakMinutes: breakMinutes,
      adjustmentMade: false,
      regularPay: regularPay.toFixed(2),
      serviceFeeRate: serviceFeeRate.toFixed(4),
      serviceFee: serviceFee.toFixed(2),
      convenienceFeeRate: convenienceFeeRate.toFixed(4),
      convenienceFee: convenienceFee.toFixed(2),
      counterCoverDiscount: "0.00",
      totalPay: totalPay.toFixed(2),
      status: "charged",
    });
  }

  if (transactionsData.length > 0) {
    await db.insert(shiftTransactions).values(transactionsData);
    console.log(`Created ${transactionsData.length} shift transactions`);
  }

  // Seed Messaging Test Data
  // Find Jessica Chen (hygienist) for messaging
  const jessicaChen = createdProfessionals.find(p => p.email === "j.chen@sunnypines.dental");
  const sarahMiller = createdProfessionals.find(p => p.email === "s.miller@sunnypines.dental");
  
  if (jessicaChen) {
    const practiceAdminId = "admin-sunny-pines"; // Mock admin ID for Sunny Pines Dental
    
    // Create conversation between Jessica Chen and practice admin
    const [jessicaConversation] = await db.insert(conversations).values({
      practiceAdminId: practiceAdminId,
      professionalId: jessicaChen.id,
    }).returning();
    
    // Add test messages in the conversation
    await db.insert(messages).values([
      {
        conversationId: jessicaConversation.id,
        senderId: practiceAdminId,
        senderType: "practice_admin",
        content: "Hi Jessica! We have an open shift this Friday from 8 AM to 4 PM. Would you be interested?",
      },
      {
        conversationId: jessicaConversation.id,
        senderId: jessicaChen.id,
        senderType: "professional",
        content: "Hi! Yes, I'm available on Friday. What's the hourly rate for this shift?",
      },
      {
        conversationId: jessicaConversation.id,
        senderId: practiceAdminId,
        senderType: "practice_admin",
        content: "Great! The rate is $55/hour. We'll also provide lunch. Does that work for you?",
      },
      {
        conversationId: jessicaConversation.id,
        senderId: jessicaChen.id,
        senderType: "professional",
        content: "That sounds perfect! I'll take it. Should I arrive 15 minutes early?",
      },
      {
        conversationId: jessicaConversation.id,
        senderId: practiceAdminId,
        senderType: "practice_admin",
        content: "Yes, please arrive at 7:45 AM. Looking forward to having you on the team!",
      },
    ]);
    
    console.log("Created messaging test data for Jessica Chen");
    
    // Create another conversation with Sarah Miller
    if (sarahMiller) {
      const [sarahConversation] = await db.insert(conversations).values({
        practiceAdminId: practiceAdminId,
        professionalId: sarahMiller.id,
      }).returning();
      
      await db.insert(messages).values([
        {
          conversationId: sarahConversation.id,
          senderId: practiceAdminId,
          senderType: "practice_admin",
          content: "Dr. Miller, we'd love to have you cover some complex restorative cases next week.",
        },
        {
          conversationId: sarahConversation.id,
          senderId: sarahMiller.id,
          senderType: "professional",
          content: "I'd be happy to help! What days are you looking at?",
        },
      ]);
      
      console.log("Created messaging test data for Sarah Miller");
    }
  }

  console.log("Database seeding complete!");
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
