import { db } from "../server/db";
import { professionals } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function updatePassword() {
  const email = "j.chen@sunnypines.dental";
  const newPassword = "Test123!";

  console.log(`Updating password for: ${email}`);

  const [professional] = await db
    .select({ id: professionals.id, email: professionals.email })
    .from(professionals)
    .where(eq(professionals.email, email));

  if (!professional) {
    console.error(`Professional not found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Found professional ID: ${professional.id}`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await db
    .update(professionals)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(professionals.email, email));

  console.log(`Password updated successfully for ${email}`);
  console.log(`New password: ${newPassword}`);
  
  process.exit(0);
}

updatePassword().catch((error) => {
  console.error("Error updating password:", error);
  process.exit(1);
});
