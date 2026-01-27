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

export async function getPracticeAdmins(practiceId: string) {
  const admins = await db
    .select({
      id: practiceAdmins.id,
      email: practiceAdmins.email,
      firstName: practiceAdmins.firstName,
      lastName: practiceAdmins.lastName,
      phone: practiceAdmins.phone,
      role: practiceAdmins.role,
      isActive: practiceAdmins.isActive,
      createdAt: practiceAdmins.createdAt,
      updatedAt: practiceAdmins.updatedAt,
    })
    .from(practiceAdmins)
    .where(eq(practiceAdmins.practiceId, practiceId))
    .orderBy(practiceAdmins.createdAt);

  return admins;
}

export async function updatePracticeAdmin(
  adminId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  }
) {
  const result = await db
    .update(practiceAdmins)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(practiceAdmins.id, adminId))
    .returning({
      id: practiceAdmins.id,
      email: practiceAdmins.email,
      firstName: practiceAdmins.firstName,
      lastName: practiceAdmins.lastName,
      phone: practiceAdmins.phone,
      role: practiceAdmins.role,
      isActive: practiceAdmins.isActive,
    });

  return result[0];
}

export async function getPracticeAdminById(adminId: string) {
  const admins = await db
    .select()
    .from(practiceAdmins)
    .where(eq(practiceAdmins.id, adminId))
    .limit(1);

  return admins[0] || null;
}
