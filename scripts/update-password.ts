import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { professionals } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Configuration - modify these values as needed
const EMAIL = "j.chen@sunnypines.dental";
const NEW_PASSWORD = "Test123!";

async function updatePassword() {
  // Use DATABASE_URL from environment (can be overridden for production)
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log(`Connecting to database...`);
  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log(`Looking for professional: ${EMAIL}`);

  const [professional] = await db
    .select({ id: professionals.id, email: professionals.email, firstName: professionals.firstName, lastName: professionals.lastName })
    .from(professionals)
    .where(eq(professionals.email, EMAIL));

  if (!professional) {
    console.error(`Professional not found with email: ${EMAIL}`);
    process.exit(1);
  }

  console.log(`Found: ${professional.firstName} ${professional.lastName} (ID: ${professional.id})`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);

  await db
    .update(professionals)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(professionals.email, EMAIL));

  console.log(`\n✅ Password updated successfully!`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   New Password: ${NEW_PASSWORD}`);
  
  process.exit(0);
}

updatePassword().catch((error) => {
  console.error("Error updating password:", error);
  process.exit(1);
});
