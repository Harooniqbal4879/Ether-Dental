import bcrypt from "bcryptjs";
import { db } from "../db";
import { practiceAdmins, practices } from "@shared/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticatePracticeAdmin(email: string, password: string) {
  const admins = await db
    .select()
    .from(practiceAdmins)
    .where(eq(practiceAdmins.email, email.toLowerCase()))
    .limit(1);

  const admin = admins[0];
  
  if (!admin || !admin.passwordHash) {
    return null;
  }

  if (!admin.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.passwordHash);
  
  if (!isValid) {
    return null;
  }

  const practiceList = await db
    .select()
    .from(practices)
    .where(eq(practices.id, admin.practiceId))
    .limit(1);

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      practiceId: admin.practiceId,
    },
    practice: practiceList[0] || null,
  };
}

export async function createPracticeAdminWithPassword(
  practiceId: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone?: string,
  role: string = "admin"
) {
  const passwordHash = await hashPassword(password);
  
  const result = await db
    .insert(practiceAdmins)
    .values({
      practiceId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role,
    })
    .returning();

  return result[0];
}

export async function updateAdminPassword(adminId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  
  await db
    .update(practiceAdmins)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(practiceAdmins.id, adminId));
}

export async function getPracticeAdminByEmail(email: string) {
  const admins = await db
    .select()
    .from(practiceAdmins)
    .where(eq(practiceAdmins.email, email.toLowerCase()))
    .limit(1);

  return admins[0] || null;
}
