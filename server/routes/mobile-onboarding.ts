import { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { 
  verifyMobileToken, 
  extractBearerToken, 
  authenticateProfessionalMobile,
  generateMobileToken,
  MobileTokenPayload 
} from "../services/mobile-auth";
import { hashPassword } from "../services/auth";
import {
  professionals,
  contractorDocuments,
  contractorTaxForms,
  professionalPaymentMethods,
  professionalAgreements,
  onboardingAuditLog,
} from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      mobileAuth?: MobileTokenPayload;
    }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/heic",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: JPEG, PNG, HEIC, PDF"));
    }
  },
});

function mobileAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const payload = verifyMobileToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.mobileAuth = payload;
  next();
}

export function registerMobileOnboardingRoutes(app: Express) {

  app.post("/api/mobile/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await authenticateProfessionalMobile(email, password);

      if (!result) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({
        success: true,
        token: result.token,
        professional: result.professional,
      });
    } catch (error) {
      console.error("Mobile login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/mobile/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, phone } = req.body;

      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ 
          error: "First name, last name, email, password, and role are required" 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const [existingProfessional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.email, email.toLowerCase()));

      if (existingProfessional) {
        return res.status(409).json({ error: "A professional with this email already exists" });
      }

      const passwordHash = await hashPassword(password);

      const professionalData = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
        role,
        phone: phone || null,
        onboardingStatus: "invited" as const,
        isAvailable: false,
        rating: "0",
      };

      const [newProfessional] = await db.insert(professionals).values(professionalData).returning();

      const token = generateMobileToken({
        professionalId: newProfessional.id,
        email: newProfessional.email,
        type: "professional",
      });

      res.status(201).json({
        success: true,
        token,
        professional: {
          id: newProfessional.id,
          email: newProfessional.email,
          firstName: newProfessional.firstName,
          lastName: newProfessional.lastName,
          role: newProfessional.role,
          onboardingStatus: newProfessional.onboardingStatus,
        },
      });
    } catch (error) {
      console.error("Mobile registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.get("/api/mobile/auth/verify", mobileAuthMiddleware, async (req, res) => {
    try {
      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, req.mobileAuth!.professionalId));

      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      res.json({
        valid: true,
        professional: {
          id: professional.id,
          email: professional.email,
          firstName: professional.firstName,
          lastName: professional.lastName,
          role: professional.role,
          onboardingStatus: professional.onboardingStatus,
          paymentEligible: professional.paymentEligible,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/mobile/onboarding", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { storage } = await import("../storage");

      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      const documents = await db.select()
        .from(contractorDocuments)
        .where(eq(contractorDocuments.professionalId, professionalId));

      const taxForms = await db.select()
        .from(contractorTaxForms)
        .where(eq(contractorTaxForms.professionalId, professionalId));

      const paymentMethods = await db.select()
        .from(professionalPaymentMethods)
        .where(eq(professionalPaymentMethods.professionalId, professionalId));

      const agreements = await db.select()
        .from(professionalAgreements)
        .where(eq(professionalAgreements.professionalId, professionalId));

      const hasGovernmentId = documents.some(d => d.documentType === "government_id" && d.verificationStatus !== "rejected");
      const hasApprovedW9 = taxForms.some(t => t.verificationStatus === "approved");
      const hasSignedAgreements = agreements.filter(a => a.signedAt !== null).length >= 2;
      const hasVerifiedPayment = paymentMethods.some(p => p.verificationStatus === "verified");

      const steps = [
        { name: "Personal Info", complete: !!professional.dateOfBirth && !!professional.phone },
        { name: "Identity & W-9", complete: hasGovernmentId && (hasApprovedW9 || taxForms.length > 0) },
        { name: "Agreements", complete: hasSignedAgreements },
        { name: "Payment Setup", complete: hasVerifiedPayment },
      ];

      const completedSteps = steps.filter(s => s.complete).length;

      res.json({
        professional: {
          id: professional.id,
          firstName: professional.firstName,
          lastName: professional.lastName,
          email: professional.email,
          phone: professional.phone,
          dateOfBirth: professional.dateOfBirth,
          addressStreet: professional.addressStreet,
          addressCity: professional.addressCity,
          addressState: professional.addressState,
          addressZip: professional.addressZip,
          onboardingStatus: professional.onboardingStatus,
          identityVerified: professional.identityVerified,
          w9Completed: professional.w9Completed,
          agreementsSigned: professional.agreementsSigned,
          paymentMethodVerified: professional.paymentMethodVerified,
          paymentEligible: professional.paymentEligible,
        },
        documents,
        taxForms: taxForms.map(t => ({
          id: t.id,
          formType: t.formType,
          legalName: t.legalName,
          businessName: t.businessName,
          taxClassification: t.taxClassification,
          ssnLast4: t.ssnLast4,
          einLast4: t.einLast4,
          taxAddressStreet: t.taxAddressStreet,
          taxAddressCity: t.taxAddressCity,
          taxAddressState: t.taxAddressState,
          taxAddressZip: t.taxAddressZip,
          verificationStatus: t.verificationStatus,
          createdAt: t.createdAt,
        })),
        paymentMethods: paymentMethods.map(p => ({
          id: p.id,
          methodType: p.methodType,
          bankName: p.bankName,
          accountType: p.accountType,
          accountLast4: p.accountLast4,
          routingLast4: p.routingLast4,
          stripeAccountId: p.stripeAccountId,
          stripeOnboardingComplete: p.stripeOnboardingComplete,
          verificationStatus: p.verificationStatus,
          isDefault: p.isDefault,
          createdAt: p.createdAt,
        })),
        agreements,
        progress: {
          steps,
          completedSteps,
          totalSteps: steps.length,
          percentComplete: Math.round((completedSteps / steps.length) * 100),
        },
      });
    } catch (error) {
      console.error("Error fetching mobile onboarding status:", error);
      res.status(500).json({ error: "Failed to fetch onboarding status" });
    }
  });

  app.patch("/api/mobile/onboarding/personal-info", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { dateOfBirth, phone, addressStreet, addressCity, addressState, addressZip } = req.body;

      await db.update(professionals)
        .set({
          dateOfBirth,
          phone,
          addressStreet,
          addressCity,
          addressState,
          addressZip,
          onboardingStatus: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(professionals.id, professionalId));

      await db.insert(onboardingAuditLog).values({
        professionalId,
        action: "personal_info_updated",
        actorType: "professional",
        actorId: professionalId,
        newValue: JSON.stringify({ fields: Object.keys(req.body) }),
        ipAddress: req.ip || "mobile",
      });

      res.json({ success: true, message: "Personal info updated" });
    } catch (error) {
      console.error("Error updating personal info:", error);
      res.status(500).json({ error: "Failed to update personal info" });
    }
  });

  app.post("/api/mobile/onboarding/documents/upload", mobileAuthMiddleware, upload.single("file"), async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const file = req.file;
      const { documentType, documentName } = req.body;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!documentType) {
        return res.status(400).json({ error: "Document type is required" });
      }

      const { Client } = await import("@replit/object-storage");
      const client = new Client();

      const fileExtension = file.originalname.split(".").pop() || "bin";
      const objectKey = `.private/documents/${professionalId}/${documentType}_${Date.now()}.${fileExtension}`;

      const { ok, error: uploadError } = await client.uploadFromBytes(objectKey, file.buffer);

      if (!ok) {
        console.error("Object storage upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload file to storage" });
      }

      const documentUrl = objectKey;

      const [document] = await db.insert(contractorDocuments)
        .values({
          professionalId,
          documentType,
          documentName: documentName || file.originalname,
          documentUrl,
          metadata: JSON.stringify({
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedFrom: "mobile",
          }),
          verificationStatus: "pending",
        })
        .returning();

      await db.insert(onboardingAuditLog).values({
        professionalId,
        action: "document_uploaded",
        actorType: "professional",
        actorId: professionalId,
        documentId: document.id,
        newValue: JSON.stringify({ 
          documentId: document.id, 
          documentType,
          uploadedFrom: "mobile",
        }),
        ipAddress: req.ip || "mobile",
      });

      res.json({
        success: true,
        document: {
          id: document.id,
          documentType: document.documentType,
          documentName: document.documentName,
          verificationStatus: document.verificationStatus,
          createdAt: document.createdAt,
        },
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/mobile/onboarding/documents", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;

      const documents = await db.select()
        .from(contractorDocuments)
        .where(eq(contractorDocuments.professionalId, professionalId));

      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete a document by type or by ID
  app.delete("/api/mobile/onboarding/documents/:documentTypeOrId", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { documentTypeOrId } = req.params;

      // Check if it's a UUID (document ID) or a document type
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentTypeOrId);

      let deletedDocs;

      if (isUuid) {
        // Delete by document ID
        const { and } = await import("drizzle-orm");
        deletedDocs = await db.delete(contractorDocuments)
          .where(and(
            eq(contractorDocuments.id, documentTypeOrId),
            eq(contractorDocuments.professionalId, professionalId)
          ))
          .returning();
      } else {
        // Delete by document type
        const { and } = await import("drizzle-orm");
        deletedDocs = await db.delete(contractorDocuments)
          .where(and(
            eq(contractorDocuments.documentType, documentTypeOrId),
            eq(contractorDocuments.professionalId, professionalId)
          ))
          .returning();
      }

      if (deletedDocs.length === 0) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Audit log
      await db.insert(onboardingAuditLog).values({
        professionalId,
        action: "document_deleted",
        actorType: "professional",
        actorId: professionalId,
        documentId: deletedDocs[0].id,
        previousValue: JSON.stringify({ 
          documentType: deletedDocs[0].documentType,
          documentName: deletedDocs[0].documentName,
        }),
        ipAddress: req.ip || "mobile",
      });

      res.json({ 
        success: true, 
        message: "Document deleted",
        deletedCount: deletedDocs.length,
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.post("/api/mobile/onboarding/w9", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { 
        legalName, businessName, taxClassification, 
        ssn, ein, useSsn,
        taxAddressStreet, taxAddressCity, taxAddressState, taxAddressZip,
        electronicSignature 
      } = req.body;

      if (!legalName || !taxClassification || !taxAddressStreet || !taxAddressCity || !taxAddressState || !taxAddressZip) {
        return res.status(400).json({ error: "Required W-9 fields are missing" });
      }

      if (!electronicSignature) {
        return res.status(400).json({ error: "Electronic signature is required" });
      }

      const taxId = useSsn ? ssn : ein;
      if (!taxId || taxId.replace(/\D/g, "").length !== 9) {
        return res.status(400).json({ error: "Valid SSN or EIN is required" });
      }

      const crypto = await import("crypto");
      const encryptionKey = process.env.SESSION_SECRET || "default-key-change-me";
      
      const encrypt = (text: string): string => {
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(encryptionKey, "salt", 32);
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
      };

      const cleanTaxId = taxId.replace(/\D/g, "");
      const encryptedTaxId = encrypt(cleanTaxId);
      const lastFour = cleanTaxId.slice(-4);

      const [taxForm] = await db.insert(contractorTaxForms)
        .values({
          professionalId,
          formType: "w9",
          legalName,
          businessName: businessName || null,
          taxClassification,
          encryptedSsn: useSsn ? encryptedTaxId : null,
          ssnLast4: useSsn ? lastFour : null,
          encryptedEin: !useSsn ? encryptedTaxId : null,
          einLast4: !useSsn ? lastFour : null,
          useSsn: useSsn !== false,
          taxAddressStreet,
          taxAddressCity,
          taxAddressState,
          taxAddressZip,
          electronicSignature: true,
          verificationStatus: "pending",
        })
        .returning();

      await db.update(professionals)
        .set({
          onboardingStatus: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(professionals.id, professionalId));

      await db.insert(onboardingAuditLog).values({
        professionalId,
        action: "w9_submitted",
        actorType: "professional",
        actorId: professionalId,
        newValue: JSON.stringify({ 
          taxFormId: taxForm.id,
          taxClassification,
          submittedFrom: "mobile",
        }),
        ipAddress: req.ip || "mobile",
      });

      res.json({
        success: true,
        taxForm: {
          id: taxForm.id,
          legalName: taxForm.legalName,
          taxClassification: taxForm.taxClassification,
          verificationStatus: taxForm.verificationStatus,
          createdAt: taxForm.createdAt,
        },
      });
    } catch (error) {
      console.error("Error submitting W-9:", error);
      res.status(500).json({ error: "Failed to submit W-9" });
    }
  });

  app.get("/api/mobile/onboarding/w9", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;

      const taxForms = await db.select()
        .from(contractorTaxForms)
        .where(eq(contractorTaxForms.professionalId, professionalId));

      res.json(taxForms.map(t => ({
        id: t.id,
        formType: t.formType,
        legalName: t.legalName,
        businessName: t.businessName,
        taxClassification: t.taxClassification,
        ssnLast4: t.ssnLast4,
        einLast4: t.einLast4,
        taxAddressStreet: t.taxAddressStreet,
        taxAddressCity: t.taxAddressCity,
        taxAddressState: t.taxAddressState,
        taxAddressZip: t.taxAddressZip,
        verificationStatus: t.verificationStatus,
        rejectionReason: t.rejectionReason,
        createdAt: t.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching W-9:", error);
      res.status(500).json({ error: "Failed to fetch W-9" });
    }
  });

  app.post("/api/mobile/onboarding/agreements/sign", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { agreementType, agreementVersion } = req.body;

      if (!agreementType) {
        return res.status(400).json({ error: "Agreement type is required" });
      }

      const validTypes = ["contractor_agreement", "hipaa_acknowledgment", "nda", "terms_of_service", "code_of_conduct"];
      if (!validTypes.includes(agreementType)) {
        return res.status(400).json({ error: "Invalid agreement type" });
      }

      const existingAgreements = await db.select()
        .from(professionalAgreements)
        .where(eq(professionalAgreements.professionalId, professionalId));

      const alreadySigned = existingAgreements.find(a => a.agreementType === agreementType && a.signedAt);
      if (alreadySigned) {
        return res.status(400).json({ error: "Agreement already signed" });
      }

      const [agreement] = await db.insert(professionalAgreements)
        .values({
          professionalId,
          agreementType,
          agreementVersion: agreementVersion || "1.0",
          signedAt: new Date(),
          signatureIp: req.ip || "mobile",
        })
        .returning();

      const allAgreements = await db.select()
        .from(professionalAgreements)
        .where(eq(professionalAgreements.professionalId, professionalId));

      const signedCount = allAgreements.filter(a => a.signedAt !== null).length;
      const requiredAgreements = ["contractor_agreement", "hipaa_acknowledgment"];
      const hasAllRequired = requiredAgreements.every(type => 
        allAgreements.some(a => a.agreementType === type && a.signedAt)
      );

      if (hasAllRequired) {
        await db.update(professionals)
          .set({
            agreementsSigned: true,
            updatedAt: new Date(),
          })
          .where(eq(professionals.id, professionalId));
      }

      await db.insert(onboardingAuditLog).values({
        professionalId,
        action: "agreement_signed",
        actorType: "professional",
        actorId: professionalId,
        newValue: JSON.stringify({ 
          agreementId: agreement.id, 
          agreementType,
          signedFrom: "mobile",
        }),
        ipAddress: req.ip || "mobile",
      });

      res.json({
        success: true,
        agreement: {
          id: agreement.id,
          agreementType: agreement.agreementType,
          signedAt: agreement.signedAt,
        },
        allRequiredSigned: hasAllRequired,
        signedCount,
      });
    } catch (error) {
      console.error("Error signing agreement:", error);
      res.status(500).json({ error: "Failed to sign agreement" });
    }
  });

  app.get("/api/mobile/onboarding/agreements", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;

      const agreements = await db.select()
        .from(professionalAgreements)
        .where(eq(professionalAgreements.professionalId, professionalId));

      const agreementTypes = [
        { type: "contractor_agreement", title: "Independent Contractor Agreement", required: true },
        { type: "hipaa_acknowledgment", title: "HIPAA Business Associate Agreement", required: true },
        { type: "nda", title: "Non-Disclosure Agreement", required: false },
        { type: "terms_of_service", title: "Terms of Service", required: false },
      ];

      const agreementsWithStatus = agreementTypes.map(at => {
        const signed = agreements.find(a => a.agreementType === at.type);
        return {
          ...at,
          signed: !!signed?.signedAt,
          signedAt: signed?.signedAt || null,
          agreementId: signed?.id || null,
        };
      });

      res.json({
        agreements: agreementsWithStatus,
        requiredComplete: agreementsWithStatus.filter(a => a.required && a.signed).length === 
                         agreementsWithStatus.filter(a => a.required).length,
      });
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ error: "Failed to fetch agreements" });
    }
  });

  app.post("/api/mobile/onboarding/payment-methods", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { methodType, bankName, accountType, routingNumber, accountNumber } = req.body;

      if (!methodType) {
        return res.status(400).json({ error: "Payment method type is required" });
      }

      if (methodType === "bank_account") {
        if (!bankName || !accountType || !routingNumber || !accountNumber) {
          return res.status(400).json({ error: "Bank account details are required" });
        }

        const crypto = await import("crypto");
        const encryptionKey = process.env.SESSION_SECRET || "default-key-change-me";
        
        const encrypt = (text: string): string => {
          const iv = crypto.randomBytes(16);
          const key = crypto.scryptSync(encryptionKey, "salt", 32);
          const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
          let encrypted = cipher.update(text, "utf8", "hex");
          encrypted += cipher.final("hex");
          return iv.toString("hex") + ":" + encrypted;
        };

        const [paymentMethod] = await db.insert(professionalPaymentMethods)
          .values({
            professionalId,
            methodType,
            bankName,
            accountType,
            encryptedRoutingNumber: encrypt(routingNumber),
            encryptedAccountNumber: encrypt(accountNumber),
            routingLast4: routingNumber.slice(-4),
            accountLast4: accountNumber.slice(-4),
            verificationStatus: "pending",
          })
          .returning();

        await db.insert(onboardingAuditLog).values({
          professionalId,
          action: "payment_method_added",
          actorType: "professional",
          actorId: professionalId,
          newValue: JSON.stringify({ 
            methodId: paymentMethod.id, 
            methodType,
            addedFrom: "mobile",
          }),
          ipAddress: req.ip || "mobile",
        });

        res.json({
          success: true,
          paymentMethod: {
            id: paymentMethod.id,
            methodType: paymentMethod.methodType,
            bankName: paymentMethod.bankName,
            accountType: paymentMethod.accountType,
            accountLast4: paymentMethod.accountLast4,
            verificationStatus: paymentMethod.verificationStatus,
          },
        });
      } else if (methodType === "stripe_connect") {
        const { getUncachableStripeClient } = await import("../stripeClient");
        const stripe = await getUncachableStripeClient();

        const { storage } = await import("../storage");
        const professional = await storage.getProfessional(professionalId);

        if (!professional) {
          return res.status(404).json({ error: "Professional not found" });
        }

        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: professional.email,
          capabilities: {
            transfers: { requested: true },
          },
          business_type: "individual",
          metadata: {
            professionalId,
          },
        });

        const [paymentMethod] = await db.insert(professionalPaymentMethods)
          .values({
            professionalId,
            methodType: "stripe_connect",
            stripeAccountId: account.id,
            stripeOnboardingComplete: false,
            verificationStatus: "pending",
          })
          .returning();

        const origin = req.headers.origin || `https://${req.headers.host}`;
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${origin}/app/onboarding?stripe_refresh=true`,
          return_url: `${origin}/app/onboarding?stripe_success=true`,
          type: "account_onboarding",
        });

        await db.insert(onboardingAuditLog).values({
          professionalId,
          action: "stripe_connect_started",
          actorType: "professional",
          actorId: professionalId,
          newValue: JSON.stringify({ 
            stripeAccountId: account.id,
            initiatedFrom: "mobile",
          }),
          ipAddress: req.ip || "mobile",
        });

        res.json({
          success: true,
          paymentMethod: {
            id: paymentMethod.id,
            methodType: paymentMethod.methodType,
            stripeAccountId: paymentMethod.stripeAccountId,
            verificationStatus: paymentMethod.verificationStatus,
          },
          stripeOnboardingUrl: accountLink.url,
        });
      } else {
        return res.status(400).json({ error: "Invalid payment method type" });
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ error: "Failed to add payment method" });
    }
  });

  app.get("/api/mobile/onboarding/payment-methods", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;

      const methods = await db.select()
        .from(professionalPaymentMethods)
        .where(eq(professionalPaymentMethods.professionalId, professionalId));

      res.json(methods.map(m => ({
        id: m.id,
        methodType: m.methodType,
        bankName: m.bankName,
        accountType: m.accountType,
        accountLast4: m.accountLast4,
        routingLast4: m.routingLast4,
        stripeAccountId: m.stripeAccountId,
        stripeOnboardingComplete: m.stripeOnboardingComplete,
        verificationStatus: m.verificationStatus,
        isDefault: m.isDefault,
        createdAt: m.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.get("/api/mobile/onboarding/payment-eligibility", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { storage } = await import("../storage");

      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      const paymentMethods = await db.select()
        .from(professionalPaymentMethods)
        .where(eq(professionalPaymentMethods.professionalId, professionalId));

      const hasVerifiedPaymentMethod = paymentMethods.some(pm => pm.verificationStatus === "verified");
      const hasStripeAccount = paymentMethods.some(pm => pm.stripeAccountId && pm.stripeOnboardingComplete);

      const eligibilityChecks = {
        identityVerified: !!professional.identityVerified,
        w9Completed: !!professional.w9Completed,
        agreementsSigned: !!professional.agreementsSigned,
        paymentMethodVerified: hasVerifiedPaymentMethod,
        stripeAccountComplete: hasStripeAccount,
        adminApproved: professional.onboardingStatus === "verified" || professional.onboardingStatus === "payment_eligible",
        notSuspended: professional.onboardingStatus !== "suspended" && professional.onboardingStatus !== "rejected",
      };

      const isEligible = Object.values(eligibilityChecks).every(Boolean);

      res.json({
        eligible: isEligible,
        paymentEligible: professional.paymentEligible,
        checks: eligibilityChecks,
        onboardingStatus: professional.onboardingStatus,
      });
    } catch (error) {
      console.error("Error checking payment eligibility:", error);
      res.status(500).json({ error: "Failed to check payment eligibility" });
    }
  });

  app.get("/api/mobile/shifts/available", mobileAuthMiddleware, async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const today = new Date().toISOString().split("T")[0];
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const shifts = await storage.getShifts(today, futureDate);
      const openShifts = shifts.filter(s => s.status === "open");
      res.json(openShifts);
    } catch (error) {
      console.error("Error fetching available shifts:", error);
      res.status(500).json({ error: "Failed to fetch available shifts" });
    }
  });

  app.get("/api/mobile/shifts/my", mobileAuthMiddleware, async (req, res) => {
    try {
      const professionalId = req.mobileAuth!.professionalId;
      const { storage } = await import("../storage");
      const shifts = await storage.getShiftsForProfessional(professionalId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching my shifts:", error);
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });
}
