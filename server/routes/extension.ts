import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { insuranceCarriers, staffShifts, practiceAdmins, practices, practiceLocations } from "@shared/schema";
import { eq, and, gte, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "etherai-extension-secret";

interface ExtensionAuth {
  adminId: string;
  practiceId: string;
  email: string;
}

function extensionAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization required. Please log in." });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as ExtensionAuth;
    (req as any).extensionAuth = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
  }
}

router.get("/status", async (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "EtherAI-Dental Extension API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [admin] = await db
      .select()
      .from(practiceAdmins)
      .where(eq(practiceAdmins.email, email.toLowerCase()))
      .limit(1);

    if (!admin) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const [practice] = await db
      .select()
      .from(practices)
      .where(eq(practices.id, admin.practiceId))
      .limit(1);

    const token = jwt.sign(
      {
        adminId: admin.id,
        practiceId: admin.practiceId,
        email: admin.email,
      } as ExtensionAuth,
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        practiceId: admin.practiceId,
      },
      practice: practice
        ? { id: practice.id, name: practice.name }
        : null,
    });
  } catch (error) {
    console.error("Extension login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/payers", async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    let carriers;
    if (type) {
      carriers = await db
        .select()
        .from(insuranceCarriers)
        .where(eq(insuranceCarriers.insuranceType, type));
    } else {
      carriers = await db.select().from(insuranceCarriers);
    }

    const payers = carriers.map((c) => ({
      id: c.id,
      name: c.name,
      payerId: c.payerId,
      type: c.insuranceType,
      clearinghouseCompatible: c.clearinghouseCompatible,
    }));

    res.json({ payers });
  } catch (error) {
    console.error("Extension payers error:", error);
    res.status(500).json({ error: "Failed to fetch payers" });
  }
});

router.post("/eligibility/check", extensionAuth, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).extensionAuth as ExtensionAuth;
    const { firstName, lastName, dateOfBirth, memberId, payerId, payerName, insuranceType } =
      req.body;

    if (!firstName || !lastName || !dateOfBirth || !memberId || !payerId) {
      return res.status(400).json({
        error: "Missing required fields: firstName, lastName, dateOfBirth, memberId, payerId",
      });
    }

    const [practice] = await db
      .select()
      .from(practices)
      .where(eq(practices.id, auth.practiceId))
      .limit(1);

    const providerName = practice?.name || "Practice";
    const providerNpi = practice?.npiNumber;
    const providerTaxId = practice?.taxId;

    if (!providerNpi || !providerTaxId) {
      return res.status(400).json({
        error: "Practice NPI number and Tax ID must be configured before running eligibility checks. Please update your practice settings.",
      });
    }

    if (insuranceType === "medical") {
      const { availityService } = await import("../services/availity");

      const result = await availityService.checkEligibility({
        provider: {
          npi: providerNpi,
          taxId: providerTaxId,
          organizationName: providerName,
        },
        payer: {
          payerId: payerId,
          name: payerName || "",
        },
        subscriber: {
          memberId,
          firstName,
          lastName,
          dateOfBirth,
          relationship: "18",
        },
      });

      return res.json({
        success: true,
        coverage: result.coverage,
        benefits: result.benefits || [],
        verification: {
          coverageStatus: result.coverage?.status || "unknown",
          planDescription: result.coverage?.planName || "",
          effectiveDate: result.coverage?.effectiveDate || null,
          groupNumber: result.coverage?.groupNumber || null,
        },
      });
    } else {
      const { dentalXchangeService } = await import("../services/dentalxchange");

      const result = await dentalXchangeService.checkEligibility({
        provider: {
          type: "2",
          organizationName: providerName,
          npi: providerNpi,
          taxId: providerTaxId,
        },
        payer: {
          name: payerName || "",
          payerIdCode: payerId,
        },
        patient: {
          firstName,
          lastName,
          dateOfBirth,
          memberId,
          relationship: "18",
        },
      });

      return res.json({
        success: true,
        verification: {
          coverageStatus: result.coverageStatus || "unknown",
          planDescription: result.planDescription || "",
          effectiveDate: result.effectiveDate || null,
          terminationDate: result.terminationDate || null,
          groupNumber: result.groupNumber || null,
        },
        benefits: result.benefits || [],
      });
    }
  } catch (error: any) {
    console.error("Extension eligibility error:", error);
    res.status(500).json({ error: error.message || "Eligibility check failed" });
  }
});

router.post("/benefits/summarize", extensionAuth, async (req: Request, res: Response) => {
  try {
    const { benefits, patientName } = req.body;

    if (!benefits || !Array.isArray(benefits)) {
      return res.status(400).json({ error: "Benefits data is required" });
    }

    const benefitsText = benefits
      .map((b: any) => {
        const parts = [];
        if (b.benefitType || b.serviceTypeName) parts.push(`Type: ${b.benefitType || b.serviceTypeName}`);
        if (b.amount) parts.push(`Amount: ${b.amount}`);
        if (b.percent || b.coinsurancePercent) parts.push(`Coverage: ${b.percent || b.coinsurancePercent}%`);
        if (b.copayAmount) parts.push(`Copay: $${b.copayAmount}`);
        if (b.deductibleAmount) parts.push(`Deductible: $${b.deductibleAmount}`);
        if (b.inNetwork !== undefined) parts.push(`Network: ${b.inNetwork ? "In-Network" : "Out-of-Network"}`);
        return parts.join(", ");
      })
      .join("\n");

    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a dental insurance benefits analyst. Summarize insurance benefits in clear, plain English for a dental office front desk staff member. Be concise but thorough. Highlight key numbers: annual maximum, remaining benefits, deductibles (met/remaining), coverage percentages by category (preventive, basic, major, orthodontics), waiting periods, and any important limitations. Format with short paragraphs, not bullet points.`,
          },
          {
            role: "user",
            content: `Summarize these dental insurance benefits${patientName ? ` for patient ${patientName}` : ""}:\n\n${benefitsText}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const summary = completion.choices[0]?.message?.content || "Unable to generate summary";
      return res.json({ summary });
    } catch (aiError) {
      console.error("AI summary error:", aiError);
      const fallbackSummary = generateFallbackSummary(benefits, patientName);
      return res.json({ summary: fallbackSummary });
    }
  } catch (error: any) {
    console.error("Benefits summarize error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize benefits" });
  }
});

function generateFallbackSummary(benefits: any[], patientName?: string): string {
  const lines: string[] = [];
  if (patientName) lines.push(`Benefits summary for ${patientName}:`);

  const deductibles = benefits.filter((b) => b.benefitType?.toLowerCase().includes("deductible") || b.deductibleAmount);
  const maximums = benefits.filter((b) => b.benefitType?.toLowerCase().includes("maximum") || b.benefitType?.toLowerCase().includes("max"));
  const coinsurance = benefits.filter((b) => b.coinsurancePercent || b.percent);

  if (maximums.length > 0) {
    lines.push(`Annual Maximum: ${maximums.map((m) => m.amount || `$${m.copayAmount || "N/A"}`).join(", ")}`);
  }
  if (deductibles.length > 0) {
    lines.push(`Deductible: ${deductibles.map((d) => d.amount || `$${d.deductibleAmount || "N/A"}`).join(", ")}`);
  }
  if (coinsurance.length > 0) {
    lines.push(`Coverage: ${coinsurance.map((c) => `${c.serviceTypeName || c.benefitType || "Service"}: ${c.coinsurancePercent || c.percent}%`).join(", ")}`);
  }

  if (lines.length <= 1) {
    lines.push(`${benefits.length} benefit items returned. Review the raw data for details.`);
  }

  return lines.join("\n\n");
}

router.get("/shifts/alerts", extensionAuth, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).extensionAuth as ExtensionAuth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const openShifts = await db
      .select()
      .from(staffShifts)
      .where(
        and(
          eq(staffShifts.practiceId, auth.practiceId),
          eq(staffShifts.status, "open"),
          gte(staffShifts.date, todayStr)
        )
      )
      .limit(20);

    const locationIds = [...new Set(openShifts.map((s) => s.locationId).filter(Boolean))] as string[];
    let locationMap: Record<string, string> = {};
    if (locationIds.length > 0) {
      const locations = await db
        .select({ id: practiceLocations.id, name: practiceLocations.name })
        .from(practiceLocations)
        .where(inArray(practiceLocations.id, locationIds));
      locationMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));
    }

    const shifts = openShifts.map((s) => ({
      id: s.id,
      role: s.role,
      date: s.date,
      startTime: s.arrivalTime,
      endTime: s.endTime,
      hourlyRate: s.fixedHourlyRate || s.minHourlyRate,
      locationId: s.locationId,
      locationName: s.locationId ? locationMap[s.locationId] || null : null,
    }));

    res.json({
      openShifts: openShifts.length,
      shifts,
    });
  } catch (error) {
    console.error("Extension shifts error:", error);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
});

export default router;
