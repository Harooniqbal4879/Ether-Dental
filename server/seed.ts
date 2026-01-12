import { db } from "./db";
import {
  insuranceCarriers,
  patients,
  insurancePolicies,
  verifications,
  benefits,
  appointments,
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
    ])
    .returning();

  console.log(`Created ${carriers.length} insurance carriers`);

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
    const carrier = carriers[i % carriers.length];

    const [policy] = await db
      .insert(insurancePolicies)
      .values({
        patientId: patient.id,
        carrierId: carrier.id,
        policyNumber: `POL${String(100000 + i).slice(1)}`,
        groupNumber: `GRP${String(1000 + i).slice(1)}`,
        subscriberName: `${patient.firstName} ${patient.lastName}`,
        subscriberRelationship: "self",
        subscriberDob: patient.dateOfBirth,
        isPrimary: true,
        effectiveDate: "2024-01-01",
      })
      .returning();

    // Create verification records with varying statuses
    const statuses = ["completed", "completed", "pending", "completed", "pending", "in_progress"];
    const status = statuses[i % statuses.length];
    
    const [verification] = await db
      .insert(verifications)
      .values({
        patientId: patient.id,
        policyId: policy.id,
        status,
        method: carrier.clearinghouseCompatible ? "clearinghouse" : "phone",
        verifiedAt: status === "completed" ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        verifiedBy: status === "completed" 
          ? (carrier.clearinghouseCompatible ? "System - Clearinghouse" : "System - AI")
          : null,
      })
      .returning();

    // Create benefits data for completed verifications
    if (status === "completed") {
      const usedAmount = Math.floor(Math.random() * 800);
      await db.insert(benefits).values({
        verificationId: verification.id,
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
  }

  console.log("Created insurance policies and verifications");

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
