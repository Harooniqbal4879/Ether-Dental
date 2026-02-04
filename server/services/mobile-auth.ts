import jwt from "jsonwebtoken";
import { db } from "../db";
import { professionals } from "@shared/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./auth";

const JWT_SECRET = process.env.SESSION_SECRET || "mobile-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface MobileTokenPayload {
  professionalId: string;
  email: string;
  type: "professional";
}

export function generateMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateProfessionalMobile(email: string, password: string) {
  const [professional] = await db
    .select()
    .from(professionals)
    .where(eq(professionals.email, email.toLowerCase()));

  if (!professional || !professional.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, professional.passwordHash);
  if (!isValid) {
    return null;
  }

  const token = generateMobileToken({
    professionalId: professional.id,
    email: professional.email,
    type: "professional",
  });

  return {
    token,
    professional: {
      id: professional.id,
      email: professional.email,
      firstName: professional.firstName,
      lastName: professional.lastName,
      role: professional.role,
      onboardingStatus: professional.onboardingStatus,
      paymentEligible: professional.paymentEligible,
    },
  };
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
