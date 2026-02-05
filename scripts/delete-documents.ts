/**
 * Script to delete professional documents from the database
 * 
 * Usage:
 *   npx tsx scripts/delete-documents.ts --professional-id <id> [--type <document_type>] [--all]
 * 
 * Examples:
 *   # Delete all documents for a professional
 *   npx tsx scripts/delete-documents.ts --professional-id 1a448f86-17b7-4432-88d9-368bb89c8200 --all
 * 
 *   # Delete only ID documents (front, back, selfie)
 *   npx tsx scripts/delete-documents.ts --professional-id 1a448f86-17b7-4432-88d9-368bb89c8200 --type id_front
 *   npx tsx scripts/delete-documents.ts --professional-id 1a448f86-17b7-4432-88d9-368bb89c8200 --type id_back
 *   npx tsx scripts/delete-documents.ts --professional-id 1a448f86-17b7-4432-88d9-368bb89c8200 --type selfie
 * 
 *   # Delete all ID-related documents at once
 *   npx tsx scripts/delete-documents.ts --professional-id 1a448f86-17b7-4432-88d9-368bb89c8200 --type id_all
 */

import { db } from "../server/db";
import { professionalDocuments } from "../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

async function deleteDocuments() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let professionalId: string | null = null;
  let documentType: string | null = null;
  let deleteAll = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--professional-id" && args[i + 1]) {
      professionalId = args[i + 1];
      i++;
    } else if (args[i] === "--type" && args[i + 1]) {
      documentType = args[i + 1];
      i++;
    } else if (args[i] === "--all") {
      deleteAll = true;
    }
  }

  if (!professionalId) {
    console.error("Error: --professional-id is required");
    console.log("\nUsage:");
    console.log("  npx tsx scripts/delete-documents.ts --professional-id <id> [--type <document_type>] [--all]");
    console.log("\nDocument types:");
    console.log("  id_front, id_back, selfie, id_all (all ID docs)");
    console.log("  professional_license, npi_number, malpractice_insurance");
    console.log("  background_check, immunization_records, cpr_bls_certification");
    console.log("  w9_form, void_check");
    process.exit(1);
  }

  try {
    // First, list current documents
    const currentDocs = await db.select()
      .from(professionalDocuments)
      .where(eq(professionalDocuments.professionalId, professionalId));

    console.log(`\nFound ${currentDocs.length} documents for professional ${professionalId}:`);
    currentDocs.forEach(doc => {
      console.log(`  - ${doc.documentType}: ${doc.documentName} (${doc.id})`);
    });

    if (currentDocs.length === 0) {
      console.log("\nNo documents to delete.");
      process.exit(0);
    }

    let deleted;

    if (deleteAll) {
      // Delete all documents for this professional
      deleted = await db.delete(professionalDocuments)
        .where(eq(professionalDocuments.professionalId, professionalId))
        .returning();
      console.log(`\nDeleted ALL ${deleted.length} documents.`);
    } else if (documentType === "id_all") {
      // Delete all ID-related documents (front, back, selfie)
      deleted = await db.delete(professionalDocuments)
        .where(and(
          eq(professionalDocuments.professionalId, professionalId),
          inArray(professionalDocuments.documentType, ["id_front", "id_back", "selfie"])
        ))
        .returning();
      console.log(`\nDeleted ${deleted.length} ID documents (front, back, selfie).`);
    } else if (documentType) {
      // Delete specific document type
      deleted = await db.delete(professionalDocuments)
        .where(and(
          eq(professionalDocuments.professionalId, professionalId),
          eq(professionalDocuments.documentType, documentType)
        ))
        .returning();
      console.log(`\nDeleted ${deleted.length} document(s) of type "${documentType}".`);
    } else {
      console.error("\nError: Please specify --type <document_type> or --all");
      process.exit(1);
    }

    if (deleted && deleted.length > 0) {
      console.log("\nDeleted documents:");
      deleted.forEach(doc => {
        console.log(`  - ${doc.documentType}: ${doc.documentName}`);
        console.log(`    URL: ${doc.documentUrl}`);
      });
      console.log("\nNote: The files in object storage are not automatically deleted.");
      console.log("You can manually delete them from the Object Storage tool pane if needed.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error deleting documents:", error);
    process.exit(1);
  }
}

deleteDocuments();
