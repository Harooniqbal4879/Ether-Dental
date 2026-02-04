import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertPatientSchema, 
  insertInsuranceCarrierSchema, 
  insertInsurancePolicySchema, 
  insertClearinghouseConfigSchema, 
  insertStaffShiftSchema, 
  insertProfessionalSchema, 
  insertProfessionalBadgeSchema, 
  insertRoleSpecialtySchema,
  insertProfessionalPreferencesSchema,
  insertProfessionalAvailabilitySchema,
  insertProfessionalCertificationSchema,
  insertProfessionalSkillSchema,
  insertProfessionalExperienceSchema,
  insertProfessionalEducationSchema,
  insertProfessionalAwardSchema,
  insertProfessionalTrainingSchema,
  practiceAdmins,
} from "@shared/schema";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { sendInvitationEmail } from "./services/email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Object Storage routes for file uploads
  registerObjectStorageRoutes(app);

  // ============================================================
  // Practice Admin Authentication API
  // ============================================================

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { authenticatePracticeAdmin } = await import("./services/auth");
      const result = await authenticatePracticeAdmin(email, password);

      if (!result) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Store admin info in session
      (req.session as any).adminId = result.admin.id;
      (req.session as any).practiceId = result.admin.practiceId;
      (req.session as any).adminEmail = result.admin.email;
      (req.session as any).isAuthenticated = true;

      // Explicitly save session before responding to ensure it's persisted
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed - session error" });
        }
        res.json({
          success: true,
          admin: result.admin,
          practice: result.practice,
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      // Clear the session cookie
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.json({ success: true });
    });
  });

  // Check session endpoint
  app.get("/api/auth/session", async (req, res) => {
    const session = req.session as any;
    
    // Debug: log session state
    console.log("[Session Check] Session ID:", req.sessionID);
    console.log("[Session Check] Session data:", JSON.stringify({
      isAuthenticated: session?.isAuthenticated,
      adminId: session?.adminId,
      adminEmail: session?.adminEmail,
      isProfessionalAuthenticated: session?.isProfessionalAuthenticated,
      professionalId: session?.professionalId,
    }));
    
    // Check for professional authentication first
    if (session?.isProfessionalAuthenticated && session?.professionalId) {
      try {
        const { db } = await import("./db");
        const { professionals } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        const profList = await db
          .select()
          .from(professionals)
          .where(eq(professionals.id, session.professionalId))
          .limit(1);
        
        const professional = profList[0];
        if (professional && professional.isActive) {
          return res.json({
            authenticated: false,
            isProfessionalAuthenticated: true,
            professional: {
              id: professional.id,
              email: professional.email,
              firstName: professional.firstName,
              lastName: professional.lastName,
              title: professional.title,
              licenseNumber: professional.licenseNumber,
            },
          });
        }
      } catch (error) {
        console.error("Professional session check error:", error);
      }
    }
    
    // Check for admin authentication
    if (!session || !session.isAuthenticated || !session.adminId) {
      return res.json({ authenticated: false });
    }

    try {
      const { db } = await import("./db");
      const { practiceAdmins, practices } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const admins = await db
        .select()
        .from(practiceAdmins)
        .where(eq(practiceAdmins.id, session.adminId))
        .limit(1);

      const admin = admins[0];
      if (!admin || !admin.isActive) {
        return res.json({ authenticated: false });
      }

      const practiceList = await db
        .select()
        .from(practices)
        .where(eq(practices.id, admin.practiceId))
        .limit(1);

      res.json({
        authenticated: true,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          practiceId: admin.practiceId,
          isSuperAdmin: admin.isSuperAdmin || false,
        },
        practice: practiceList[0] || null,
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.json({ authenticated: false });
    }
  });

  // Register practice admin with password (for setup/testing)
  app.post("/api/auth/register-admin", async (req, res) => {
    try {
      const { practiceId, firstName, lastName, email, password, phone } = req.body;

      if (!practiceId || !firstName || !lastName || !email || !password) {
        return res.status(400).json({ 
          error: "Practice ID, first name, last name, email, and password are required" 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const { getPracticeAdminByEmail, createPracticeAdminWithPassword } = await import("./services/auth");
      
      // Check if email already exists
      const existing = await getPracticeAdminByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An admin with this email already exists" });
      }

      const admin = await createPracticeAdminWithPassword(
        practiceId,
        firstName,
        lastName,
        email,
        password,
        phone
      );

      res.json({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          practiceId: admin.practiceId,
        },
      });
    } catch (error) {
      console.error("Register admin error:", error);
      res.status(500).json({ error: "Failed to register admin" });
    }
  });

  // Update password endpoint
  app.post("/api/auth/update-password", async (req, res) => {
    const session = req.session as any;
    
    if (!session || !session.isAuthenticated || !session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      const { db } = await import("./db");
      const { practiceAdmins } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { verifyPassword, updateAdminPassword } = await import("./services/auth");

      const admins = await db
        .select()
        .from(practiceAdmins)
        .where(eq(practiceAdmins.id, session.adminId))
        .limit(1);

      const admin = admins[0];
      if (!admin || !admin.passwordHash) {
        return res.status(401).json({ error: "Admin not found" });
      }

      const isValid = await verifyPassword(currentPassword, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      await updateAdminPassword(session.adminId, newPassword);

      res.json({ success: true });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Alias for update-password to support profile page
  app.post("/api/auth/change-password", async (req, res) => {
    const session = req.session as any;
    
    if (!session || !session.isAuthenticated || !session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      const { db } = await import("./db");
      const { practiceAdmins } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { verifyPassword, updateAdminPassword } = await import("./services/auth");

      const admins = await db
        .select()
        .from(practiceAdmins)
        .where(eq(practiceAdmins.id, session.adminId))
        .limit(1);

      const admin = admins[0];
      if (!admin || !admin.passwordHash) {
        return res.status(401).json({ error: "Admin not found" });
      }

      const isValid = await verifyPassword(currentPassword, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      await updateAdminPassword(session.adminId, newPassword);

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get own profile
  app.get("/api/auth/profile", async (req, res) => {
    const session = req.session as any;
    
    if (!session || !session.isAuthenticated || !session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { db } = await import("./db");
      const { practiceAdmins } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const admins = await db
        .select()
        .from(practiceAdmins)
        .where(eq(practiceAdmins.id, session.adminId))
        .limit(1);

      const admin = admins[0];
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.json({
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: admin.phone,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Update own profile
  app.patch("/api/auth/profile", async (req, res) => {
    const session = req.session as any;
    
    if (!session || !session.isAuthenticated || !session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { firstName, lastName, phone } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
      }

      const { db } = await import("./db");
      const { practiceAdmins } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [updated] = await db
        .update(practiceAdmins)
        .set({ 
          firstName, 
          lastName, 
          phone: phone || null,
          updatedAt: new Date() 
        })
        .where(eq(practiceAdmins.id, session.adminId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        admin: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
          role: updated.role,
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Set initial password for an admin (RESTRICTED: development only, or admin with no password)
  // In production, this endpoint is disabled - use authenticated password reset instead
  app.post("/api/auth/set-password", async (req, res) => {
    // SECURITY: Only allow this endpoint in development environment
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ 
        error: "This endpoint is disabled in production. Contact an admin to reset your password." 
      });
    }

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const { db } = await import("./db");
      const { practiceAdmins } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { hashPassword } = await import("./services/auth");

      // Find admin by email
      const admins = await db
        .select()
        .from(practiceAdmins)
        .where(eq(practiceAdmins.email, email.toLowerCase()))
        .limit(1);

      const admin = admins[0];
      if (!admin) {
        return res.status(404).json({ error: "Admin not found with this email" });
      }

      // SECURITY: Only allow setting password if no password is currently set
      // This prevents unauthorized password changes even in development
      if (admin.passwordHash) {
        return res.status(403).json({ 
          error: "Password already set. Use the password reset feature or contact an admin." 
        });
      }

      // Set password
      const passwordHash = await hashPassword(password);
      await db
        .update(practiceAdmins)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(practiceAdmins.id, admin.id));

      res.json({ 
        success: true, 
        message: "Password set successfully. You can now login."
      });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  // ============================================================
  // Professional Authentication API
  // ============================================================

  // Professional login endpoint
  app.post("/api/professional/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { db } = await import("./db");
      const { verifyPassword } = await import("./services/auth");
      const { professionals } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Find professional by email
      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.email, email.toLowerCase()));

      if (!professional) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!professional.passwordHash) {
        return res.status(401).json({ error: "Account not set up for login. Please register or contact support." });
      }

      // Verify password
      const isValid = await verifyPassword(password, professional.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session
      const session = req.session as any;
      session.professionalId = professional.id;
      session.isProfessionalAuthenticated = true;

      // Explicitly save session before responding to ensure it's persisted
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed - session error" });
        }
        res.json({
          success: true,
          professional: {
            id: professional.id,
            email: professional.email,
            firstName: professional.firstName,
            lastName: professional.lastName,
            role: professional.role,
          },
        });
      });
    } catch (error) {
      console.error("Professional login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Professional logout endpoint
  app.post("/api/professional/auth/logout", (req, res) => {
    const session = req.session as any;
    session.professionalId = null;
    session.isProfessionalAuthenticated = false;
    res.json({ success: true });
  });

  // Professional session endpoint
  app.get("/api/professional/auth/session", async (req, res) => {
    const session = req.session as any;
    
    if (session?.isProfessionalAuthenticated && session?.professionalId) {
      const { db } = await import("./db");
      const { professionals } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, session.professionalId));

      if (professional) {
        return res.json({
          authenticated: true,
          professional: {
            id: professional.id,
            email: professional.email,
            firstName: professional.firstName,
            lastName: professional.lastName,
            role: professional.role,
          },
        });
      }
    }

    res.json({ authenticated: false });
  });

  // Professional registration endpoint
  app.post("/api/professional/auth/register", async (req, res) => {
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

      const { db } = await import("./db");
      const { hashPassword } = await import("./services/auth");
      const { professionals } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Check if professional already exists
      const [existingProfessional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.email, email.toLowerCase()));

      if (existingProfessional) {
        // Check if they already have a password
        if (existingProfessional.passwordHash) {
          return res.status(400).json({ 
            error: "An account with this email already exists. Please sign in instead." 
          });
        }
        // Update existing record with password
        const passwordHash = await hashPassword(password);
        await db
          .update(professionals)
          .set({ 
            passwordHash,
            firstName,
            lastName,
            phone: phone || existingProfessional.phone,
            role,
            updatedAt: new Date()
          })
          .where(eq(professionals.id, existingProfessional.id));

        // Don't auto-login - user will need to log in after registration
        return res.status(201).json({
          success: true,
          professional: {
            id: existingProfessional.id,
            email: existingProfessional.email,
            firstName,
            lastName,
            role,
          },
        });
      }

      // Create new professional
      const passwordHash = await hashPassword(password);
      const [newProfessional] = await db
        .insert(professionals)
        .values({
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          role,
          passwordHash,
        })
        .returning();

      // Don't auto-login - user will need to log in after registration
      res.status(201).json({
        success: true,
        professional: {
          id: newProfessional.id,
          email: newProfessional.email,
          firstName: newProfessional.firstName,
          lastName: newProfessional.lastName,
          role: newProfessional.role,
        },
      });
    } catch (error) {
      console.error("Professional registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Practice Admin Management - List users for a practice
  app.get("/api/practice-admins", async (req, res) => {
    const session = req.session as any;
    
    if (!session?.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { getPracticeAdmins, getPracticeAdminById } = await import("./services/auth");
      
      const currentAdmin = await getPracticeAdminById(session.adminId);
      if (!currentAdmin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      // Verify current admin is active
      if (!currentAdmin.isActive) {
        return res.status(403).json({ error: "Your account is inactive" });
      }

      // Only admins can view user list
      if (currentAdmin.role !== "admin") {
        return res.status(403).json({ error: "Only admins can view the user list" });
      }

      const admins = await getPracticeAdmins(currentAdmin.practiceId);
      res.json(admins);
    } catch (error) {
      console.error("Error fetching practice admins:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create new practice admin user
  app.post("/api/practice-admins", async (req, res) => {
    const session = req.session as any;
    
    if (!session?.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { firstName, lastName, email, password, phone, role } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "First name, last name, email, and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Validate role if provided
      const validRoles = ["admin", "staff", "billing"];
      const userRole = role || "staff";
      if (!validRoles.includes(userRole)) {
        return res.status(400).json({ error: "Invalid role. Must be admin, staff, or billing" });
      }

      const { getPracticeAdminByEmail, createPracticeAdminWithPassword, getPracticeAdminById } = await import("./services/auth");
      
      const currentAdmin = await getPracticeAdminById(session.adminId);
      if (!currentAdmin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      // Verify current admin is active
      if (!currentAdmin.isActive) {
        return res.status(403).json({ error: "Your account is inactive" });
      }

      // Only admins can create new users
      if (currentAdmin.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create new users" });
      }

      const existing = await getPracticeAdminByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      const newAdmin = await createPracticeAdminWithPassword(
        currentAdmin.practiceId,
        firstName,
        lastName,
        email,
        password,
        phone,
        userRole
      );

      res.status(201).json({
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        phone: newAdmin.phone,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
      });
    } catch (error) {
      console.error("Error creating practice admin:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update practice admin user
  app.patch("/api/practice-admins/:id", async (req, res) => {
    const session = req.session as any;
    
    if (!session?.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const { firstName, lastName, phone, role, isActive } = req.body;

      const { updatePracticeAdmin, getPracticeAdminById } = await import("./services/auth");
      
      const currentAdmin = await getPracticeAdminById(session.adminId);
      if (!currentAdmin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      // Verify current admin is active
      if (!currentAdmin.isActive) {
        return res.status(403).json({ error: "Your account is inactive" });
      }

      // Only admins can update users
      if (currentAdmin.role !== "admin") {
        return res.status(403).json({ error: "Only admins can update users" });
      }

      const targetAdmin = await getPracticeAdminById(id);
      if (!targetAdmin || targetAdmin.practiceId !== currentAdmin.practiceId) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validate role if provided
      if (role) {
        const validRoles = ["admin", "staff", "billing"];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: "Invalid role. Must be admin, staff, or billing" });
        }
      }

      const updated = await updatePracticeAdmin(id, {
        firstName,
        lastName,
        phone,
        role,
        isActive,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating practice admin:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Reset password for practice admin
  app.post("/api/practice-admins/:id/reset-password", async (req, res) => {
    const session = req.session as any;
    
    if (!session?.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const { updateAdminPassword, getPracticeAdminById } = await import("./services/auth");
      
      const currentAdmin = await getPracticeAdminById(session.adminId);
      if (!currentAdmin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      // Verify current admin is active
      if (!currentAdmin.isActive) {
        return res.status(403).json({ error: "Your account is inactive" });
      }

      // Only admins can reset passwords
      if (currentAdmin.role !== "admin") {
        return res.status(403).json({ error: "Only admins can reset passwords" });
      }

      const targetAdmin = await getPracticeAdminById(id);
      if (!targetAdmin || targetAdmin.practiceId !== currentAdmin.practiceId) {
        return res.status(404).json({ error: "User not found" });
      }

      await updateAdminPassword(id, password);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Insurance Carriers
  app.get("/api/carriers", async (req, res) => {
    try {
      const carriers = await storage.getCarriers();
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ error: "Failed to fetch carriers" });
    }
  });

  app.post("/api/carriers", async (req, res) => {
    try {
      const parsed = insertInsuranceCarrierSchema.parse(req.body);
      const carrier = await storage.createCarrier(parsed);
      res.status(201).json(carrier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating carrier:", error);
      res.status(500).json({ error: "Failed to create carrier" });
    }
  });

  // Search carriers (for autocomplete)
  app.get("/api/carriers/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      if (query.length < 2) {
        return res.json([]);
      }
      const carriers = await storage.searchCarriers(query);
      res.json(carriers);
    } catch (error) {
      console.error("Error searching carriers:", error);
      res.status(500).json({ error: "Failed to search carriers" });
    }
  });

  // Practice Insurance Carriers - Get all carriers for a practice
  app.get("/api/practices/:practiceId/insurance-carriers", async (req, res) => {
    try {
      const carriers = await storage.getPracticeInsuranceCarriers(req.params.practiceId);
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching practice insurance carriers:", error);
      res.status(500).json({ error: "Failed to fetch practice insurance carriers" });
    }
  });

  // Practice Insurance Carriers - Add a carrier to a practice
  app.post("/api/practices/:practiceId/insurance-carriers", async (req, res) => {
    try {
      const { carrierId, notes } = req.body;
      if (!carrierId) {
        return res.status(400).json({ error: "carrierId is required" });
      }
      const practiceCarrier = await storage.addPracticeInsuranceCarrier({
        practiceId: req.params.practiceId,
        carrierId,
        notes: notes || null,
        isActive: true,
      });
      res.status(201).json(practiceCarrier);
    } catch (error) {
      console.error("Error adding practice insurance carrier:", error);
      res.status(500).json({ error: "Failed to add insurance carrier to practice" });
    }
  });

  // Practice Insurance Carriers - Remove a carrier from a practice
  app.delete("/api/practices/:practiceId/insurance-carriers/:id", async (req, res) => {
    try {
      await storage.removePracticeInsuranceCarrier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing practice insurance carrier:", error);
      res.status(500).json({ error: "Failed to remove insurance carrier from practice" });
    }
  });

  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  // Combined patient and policy creation schema
  const createPatientWithInsuranceSchema = insertPatientSchema.extend({
    carrierId: z.string().min(1),
    policyNumber: z.string().min(1),
    groupNumber: z.string().optional(),
    subscriberName: z.string().min(1),
    subscriberRelationship: z.string().min(1),
    subscriberDob: z.string().optional(),
    subscriberId: z.string().optional(),
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const parsed = createPatientWithInsuranceSchema.parse(req.body);
      
      // Extract patient data
      const {
        carrierId,
        policyNumber,
        groupNumber,
        subscriberName,
        subscriberRelationship,
        subscriberDob,
        subscriberId,
        ...patientData
      } = parsed;
      
      // Create patient
      const patient = await storage.createPatient(patientData);
      
      // Create insurance policy
      await storage.createPolicy({
        patientId: patient.id,
        carrierId,
        policyNumber,
        groupNumber: groupNumber || null,
        subscriberName,
        subscriberRelationship,
        subscriberDob: subscriberDob || null,
        subscriberId: subscriberId || null,
        isPrimary: true,
      });
      
      // Queue automated verification for all patient policies
      try {
        const { verificationAutomationService } = await import("./services/verification-automation");
        await verificationAutomationService.queuePatientVerifications(
          patient.id,
          "new_patient",
          1 // High priority for new patients
        );
      } catch (err) {
        console.error("Failed to queue verification for new patient:", err);
      }
      
      // Return patient with policies
      const fullPatient = await storage.getPatient(patient.id);
      res.status(201).json(fullPatient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  // Import patients from CSV
  app.post("/api/patients/import-csv", async (req, res) => {
    try {
      const { patients } = req.body;
      
      if (!Array.isArray(patients) || patients.length === 0) {
        return res.status(400).json({ error: "No patients provided" });
      }
      
      let created = 0;
      let updated = 0;
      let errors: string[] = [];
      
      for (const p of patients) {
        try {
          // Normalize field names (support both snake_case and camelCase)
          const firstName = p.first_name || p.firstname || p.firstName || "";
          const lastName = p.last_name || p.lastname || p.lastName || "";
          
          if (!firstName || !lastName) {
            errors.push(`Missing name for row: ${JSON.stringify(p)}`);
            continue;
          }
          
          const dateOfBirth = p.date_of_birth || p.dateofbirth || p.dob || p.dateOfBirth || "";
          const email = p.email || "";
          const phone = p.phone || p.phone_number || p.phoneNumber || "";
          const address = p.address || p.street_address || p.streetAddress || "";
          const city = p.city || "";
          const state = p.state || "";
          const zipCode = p.zip_code || p.zipcode || p.zip || p.zipCode || "";
          
          // Check if patient already exists (by email or name+DOB)
          const allPatients = await storage.getPatients();
          const existingPatient = allPatients.find(existing => 
            (email && existing.email?.toLowerCase() === email.toLowerCase()) ||
            (existing.firstName.toLowerCase() === firstName.toLowerCase() && 
             existing.lastName.toLowerCase() === lastName.toLowerCase() &&
             existing.dateOfBirth === dateOfBirth)
          );
          
          if (existingPatient) {
            // Skip existing patient (don't overwrite existing data)
            // Could implement update logic here if needed in future
            updated++; // "updated" here means "skipped - already exists"
          } else {
            // Create new patient
            await storage.createPatient({
              firstName,
              lastName,
              dateOfBirth: dateOfBirth || null,
              email: email || null,
              phone: phone || null,
              address: address || null,
              city: city || null,
              state: state || null,
              zipCode: zipCode || null,
            });
            created++;
          }
        } catch (err) {
          console.error("Error importing patient:", err);
          errors.push(`Failed to import: ${p.first_name || p.firstname} ${p.last_name || p.lastname}`);
        }
      }
      
      res.json({
        success: true,
        created,
        skipped: updated, // Renamed for clarity - these are existing patients that were skipped
        updated: 0, // No actual updates performed
        errors: errors.length > 0 ? errors : undefined,
        message: `Imported ${created} new patients${updated > 0 ? ` (${updated} already existed)` : ""}`,
      });
    } catch (error) {
      console.error("Error importing patients from CSV:", error);
      res.status(500).json({ error: "Failed to import patients" });
    }
  });

  // Patient Verifications
  app.get("/api/patients/:id/verifications", async (req, res) => {
    try {
      const verifications = await storage.getVerificationsForPatient(req.params.id);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching patient verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  // Trigger verification for a patient
  app.post("/api/patients/:id/verify", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      if (!patient.insurancePolicies || patient.insurancePolicies.length === 0) {
        return res.status(400).json({ error: "Patient has no insurance policy" });
      }
      
      const policy = patient.insurancePolicies[0];
      
      // Create verification record
      const verification = await storage.createVerification({
        patientId: patient.id,
        policyId: policy.id,
        status: "in_progress",
        method: policy.carrier.clearinghouseCompatible ? "clearinghouse" : "phone",
      });
      
      // Simulate verification process (in production, this would call clearinghouse or AI agent)
      setTimeout(async () => {
        try {
          // Update verification as completed
          await storage.updateVerification(verification.id, {
            status: "completed",
            verifiedAt: new Date(),
            verifiedBy: policy.carrier.clearinghouseCompatible ? "System - Clearinghouse" : "System - AI",
          });
          
          // Create simulated benefits data with consistent calculations
          const annualMaximum = 1500;
          const annualUsed = Math.floor(Math.random() * 800);
          const annualRemaining = Math.max(0, annualMaximum - annualUsed);
          const deductibleIndividual = 50;
          const deductibleIndividualMet = Math.min(deductibleIndividual, Math.floor(Math.random() * 60));
          const deductibleFamily = 150;
          const deductibleFamilyMet = Math.min(deductibleFamily, Math.floor(Math.random() * 160));
          
          await storage.createBenefit({
            verificationId: verification.id,
            annualMaximum: String(annualMaximum) + ".00",
            annualUsed: String(annualUsed) + ".00",
            annualRemaining: String(annualRemaining) + ".00",
            deductibleIndividual: String(deductibleIndividual) + ".00",
            deductibleIndividualMet: String(deductibleIndividualMet) + ".00",
            deductibleFamily: String(deductibleFamily) + ".00",
            deductibleFamilyMet: String(deductibleFamilyMet) + ".00",
            preventiveCoverage: 100,
            basicCoverage: 80,
            majorCoverage: 50,
            orthodonticCoverage: 50,
            orthodonticMaximum: "1500.00",
            orthodonticUsed: "0.00",
            cleaningsPerYear: 2,
            xraysFrequency: "Bitewings 1x/year, Full mouth 1x/5 years",
            fluorideAgeLimit: 18,
            planYear: "calendar",
            renewalDate: "January 1",
            inNetwork: true,
          });
        } catch (error) {
          console.error("Error completing verification:", error);
          await storage.updateVerification(verification.id, {
            status: "failed",
            notes: "Verification process failed",
          });
        }
      }, 2000);
      
      res.status(202).json({ message: "Verification started", verificationId: verification.id });
    } catch (error) {
      console.error("Error triggering verification:", error);
      res.status(500).json({ error: "Failed to start verification" });
    }
  });

  // All Verifications
  app.get("/api/verifications", async (req, res) => {
    try {
      const verifications = await storage.getVerifications();
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  app.get("/api/verifications/recent", async (req, res) => {
    try {
      const verifications = await storage.getRecentVerifications(10);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching recent verifications:", error);
      res.status(500).json({ error: "Failed to fetch recent verifications" });
    }
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Clearinghouse Configurations
  app.get("/api/clearinghouse-configs", async (req, res) => {
    try {
      const configs = await storage.getClearinghouseConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching clearinghouse configs:", error);
      res.status(500).json({ error: "Failed to fetch clearinghouse configurations" });
    }
  });

  app.get("/api/clearinghouse-configs/:id", async (req, res) => {
    try {
      const config = await storage.getClearinghouseConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching clearinghouse config:", error);
      res.status(500).json({ error: "Failed to fetch clearinghouse configuration" });
    }
  });

  app.post("/api/clearinghouse-configs", async (req, res) => {
    try {
      const parsed = insertClearinghouseConfigSchema.parse(req.body);
      const config = await storage.createClearinghouseConfig(parsed);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating clearinghouse config:", error);
      res.status(500).json({ error: "Failed to create clearinghouse configuration" });
    }
  });

  app.patch("/api/clearinghouse-configs/:id", async (req, res) => {
    try {
      const allowedFields = ["name", "provider", "purpose", "submitterId", "secretId", "isActive", "clearinghouseType", "endpointUrl", "username"];
      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }
      
      const config = await storage.updateClearinghouseConfig(req.params.id, updateData);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error updating clearinghouse config:", error);
      res.status(500).json({ error: "Failed to update clearinghouse configuration" });
    }
  });

  app.delete("/api/clearinghouse-configs/:id", async (req, res) => {
    try {
      await storage.deleteClearinghouseConfig(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting clearinghouse config:", error);
      res.status(500).json({ error: "Failed to delete clearinghouse configuration" });
    }
  });

  app.post("/api/clearinghouse-configs/:id/test", async (req, res) => {
    try {
      const result = await storage.testClearinghouseConnection(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error testing clearinghouse connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  // Auto-create Office Ally config from environment variables (System Admin only)
  app.post("/api/clearinghouse-configs/office-ally/auto-create", async (req, res) => {
    try {
      const { officeAllySftpService } = await import("./services/office-ally-sftp");
      
      if (!officeAllySftpService.isConfigured()) {
        return res.status(400).json({ 
          error: "Office Ally SFTP credentials are not configured in environment variables" 
        });
      }

      // Check if Office Ally config already exists
      const existingConfigs = await storage.getClearinghouseConfigs();
      const existingOfficeAlly = existingConfigs.find(c => c.provider === "office_ally");
      
      if (existingOfficeAlly) {
        return res.json({ 
          message: "Office Ally configuration already exists",
          config: existingOfficeAlly,
          created: false
        });
      }

      // Create new config - credentials are stored in environment variables, not in DB
      const config = await storage.createClearinghouseConfig({
        name: "Office Ally SFTP (Environment Credentials)",
        provider: "office_ally",
        submitterId: process.env.OFFICE_ALLY_SFTP_USERNAME || null,
        isActive: true,
      });

      res.status(201).json({ 
        message: "Office Ally configuration created successfully. SFTP credentials are managed via environment variables.",
        config,
        created: true
      });
    } catch (error) {
      console.error("Error auto-creating Office Ally config:", error);
      res.status(500).json({ error: "Failed to create Office Ally configuration" });
    }
  });

  // Submit EDI 270 eligibility request via Office Ally (Protected - requires system context)
  // Note: In production, add proper authentication middleware
  app.post("/api/clearinghouse/office-ally/submit-270", async (req, res) => {
    try {
      const { officeAllySftpService } = await import("./services/office-ally-sftp");
      
      if (!officeAllySftpService.isConfigured()) {
        return res.status(400).json({ 
          error: "Office Ally SFTP credentials are not configured" 
        });
      }

      const { subscriberId, subscriberFirstName, subscriberLastName, subscriberDob, 
              payerId, providerId, providerNpi, serviceTypeCode, dateOfService } = req.body;

      // Validate request using the service's validation
      const validation = officeAllySftpService.validateRequest({
        subscriberId: subscriberId || "",
        subscriberFirstName: subscriberFirstName || "",
        subscriberLastName: subscriberLastName || "",
        subscriberDob: subscriberDob || "",
        payerId: payerId || "",
        providerId: providerId || "",
        providerNpi: providerNpi || "",
        serviceTypeCode,
        dateOfService,
      });

      if (!validation.valid) {
        return res.status(400).json({ 
          error: "Validation failed",
          validationErrors: validation.errors
        });
      }

      const result = await officeAllySftpService.submitEligibilityRequest({
        subscriberId,
        subscriberFirstName,
        subscriberLastName,
        subscriberDob,
        payerId,
        providerId,
        providerNpi,
        serviceTypeCode,
        dateOfService,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error submitting EDI 270:", error);
      res.status(500).json({ error: "Failed to submit eligibility request" });
    }
  });

  // Retrieve EDI 271 eligibility responses from Office Ally (Protected - requires system context)
  // Note: In production, add proper authentication middleware  
  app.get("/api/clearinghouse/office-ally/responses", async (req, res) => {
    try {
      const { officeAllySftpService } = await import("./services/office-ally-sftp");
      
      if (!officeAllySftpService.isConfigured()) {
        return res.status(400).json({ 
          error: "Office Ally SFTP credentials are not configured" 
        });
      }

      const result = await officeAllySftpService.retrieveEligibilityResponses();
      
      // Don't return raw EDI content in response - parse it first
      if (result.success && result.files) {
        const parsedResponses = result.files.map(file => ({
          filename: file.filename,
          parsed: officeAllySftpService.parseEDI271Response(file.content),
        }));
        return res.json({
          success: true,
          message: result.message,
          responses: parsedResponses,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error retrieving EDI 271 responses:", error);
      res.status(500).json({ error: "Failed to retrieve eligibility responses" });
    }
  });

  // Patient Portal Routes
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // Get patient billing info for portal (by email lookup for demo)
  app.get("/api/portal/billing/:patientId", async (req, res) => {
    try {
      const billing = await storage.getPatientBilling(req.params.patientId);
      if (!billing) {
        return res.status(404).json({ error: "Billing information not found" });
      }
      res.json(billing);
    } catch (error) {
      console.error("Error fetching patient billing:", error);
      res.status(500).json({ error: "Failed to fetch billing information" });
    }
  });

  // Get patient payment history
  app.get("/api/portal/payments/:patientId", async (req, res) => {
    try {
      const payments = await storage.getPatientPayments(req.params.patientId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // Create Stripe checkout session for patient payment
  const checkoutSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    amount: z.coerce.number().positive("Amount must be positive").max(100000, "Amount cannot exceed $100,000"),
    description: z.string().optional(),
  });

  app.post("/api/portal/create-checkout", async (req, res) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { patientId, amount, description } = parsed.data;

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Build base URL - use request origin as fallback
      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const baseUrl = replitDomain 
        ? `https://${replitDomain}` 
        : `${req.protocol}://${req.get('host')}`;

      // Normalize amount to fixed 2 decimal places
      const normalizedAmount = amount.toFixed(2);

      // Create checkout session for one-time payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100), // Convert to cents
            product_data: {
              name: 'Patient Balance Payment',
              description: description || `Payment for ${patient.firstName} ${patient.lastName}`,
            },
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/portal?canceled=true`,
        customer_email: patient.email || undefined,
        metadata: {
          patientId,
          type: 'patient_balance_payment',
        },
      });

      // Record pending payment
      await storage.createPatientPayment({
        patientId,
        amount: normalizedAmount,
        status: 'pending',
        stripeCheckoutSessionId: session.id,
        description: description || 'Balance payment',
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  // Verify payment status after checkout
  // This is called when user returns from Stripe checkout as a fallback
  // Reconciles missing payment records and uses atomic completePayment
  app.get("/api/portal/verify-payment/:sessionId", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      
      if (session.payment_status === 'paid') {
        const paymentAmount = session.amount_total ? session.amount_total / 100 : 0;
        const paymentIntentId = session.payment_intent as string || '';
        const patientId = session.metadata?.patientId;
        
        // Reconcile payment record if missing (e.g., webhook didn't fire)
        if (patientId && paymentAmount > 0) {
          await storage.reconcilePayment(
            req.params.sessionId,
            patientId,
            paymentAmount.toFixed(2)
          );
        }
        
        // Use centralized atomic payment completion (idempotent)
        await storage.completePayment(req.params.sessionId, paymentIntentId, paymentAmount);
      }
      
      res.json({
        status: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Staff Shifts
  app.get("/api/shifts", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: "startDate and endDate query parameters required" });
      }
      
      const shifts = await storage.getShifts(startDate, endDate);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });

  // Get available shifts for mobile app (open shifts only) - includes practice data
  // Find matching professionals for a shift based on their preferences
  app.get("/api/shifts/:id/matching-professionals", async (req, res) => {
    try {
      const shift = await storage.getShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Get all active professionals with the matching role
      const professionals = await storage.getProfessionals({ role: shift.role });
      const matchingProfessionals = [];

      for (const professional of professionals) {
        const preferences = await storage.getProfessionalPreferences(professional.id);
        
        // If no preferences set, include as potential match
        if (!preferences) {
          matchingProfessionals.push({
            professional,
            matchScore: 50, // Neutral score for no preferences
            matchDetails: { noPreferencesSet: true },
          });
          continue;
        }

        let matchScore = 100;
        const matchDetails: Record<string, any> = {};

        // Helper function to convert time string (e.g. "8:30 AM" or "14:00") to minutes
        const timeToMinutes = (timeStr: string): number => {
          // Handle "HH:MM AM/PM" format
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (!match) return 0;
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const period = match[3]?.toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        // Check hourly rate constraints - use fixedHourlyRate or average of min/max
        const shiftRate = shift.fixedHourlyRate 
          ? parseFloat(shift.fixedHourlyRate) 
          : shift.minHourlyRate && shift.maxHourlyRate 
            ? (parseFloat(shift.minHourlyRate) + parseFloat(shift.maxHourlyRate)) / 2
            : shift.minHourlyRate 
              ? parseFloat(shift.minHourlyRate) 
              : null;

        if (shiftRate !== null) {
          if (preferences.minHourlyRate && shiftRate < parseFloat(preferences.minHourlyRate)) {
            matchDetails.rateBelowMin = true;
            matchScore -= 30;
          }
          if (preferences.maxHourlyRate && shiftRate > parseFloat(preferences.maxHourlyRate)) {
            matchDetails.rateAboveMax = true;
            matchScore -= 10; // Less penalty for rate above max
          }
        }

        // Check day preference
        if (preferences.preferredDays && preferences.preferredDays.length > 0 && shift.date) {
          const shiftDay = new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (!preferences.preferredDays.includes(shiftDay)) {
            matchDetails.dayNotPreferred = true;
            matchScore -= 15;
          }
        }

        // Check time preferences using numeric comparison (arrivalTime is the start time)
        if (preferences.preferredTimeStart && shift.arrivalTime) {
          const prefStartMinutes = timeToMinutes(preferences.preferredTimeStart);
          const shiftStartMinutes = timeToMinutes(shift.arrivalTime);
          if (shiftStartMinutes < prefStartMinutes) {
            matchDetails.startsTooEarly = true;
            matchScore -= 10;
          }
        }

        if (preferences.preferredTimeEnd && shift.endTime) {
          const prefEndMinutes = timeToMinutes(preferences.preferredTimeEnd);
          const shiftEndMinutes = timeToMinutes(shift.endTime);
          if (shiftEndMinutes > prefEndMinutes) {
            matchDetails.endsTooLate = true;
            matchScore -= 10;
          }
        }

        // Check last-minute shift acceptance
        if (shift.date) {
          const daysUntilShift = Math.ceil((new Date(shift.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilShift <= 2 && !preferences.acceptLastMinuteShifts) {
            matchDetails.isLastMinute = true;
            matchScore -= 20;
          }
        }

        // Check shift duration against preferences
        if (shift.arrivalTime && shift.endTime && (preferences.preferredShiftDurationMin || preferences.preferredShiftDurationMax)) {
          const startMinutes = timeToMinutes(shift.arrivalTime);
          const endMinutes = timeToMinutes(shift.endTime);
          const durationHours = (endMinutes - startMinutes) / 60;

          if (preferences.preferredShiftDurationMin && durationHours < preferences.preferredShiftDurationMin) {
            matchDetails.shiftTooShort = true;
            matchScore -= 10;
          }
          if (preferences.preferredShiftDurationMax && durationHours > preferences.preferredShiftDurationMax) {
            matchDetails.shiftTooLong = true;
            matchScore -= 10;
          }

          // Check overtime acceptance (shifts over 8 hours)
          if (durationHours > 8 && !preferences.acceptOvertimeShifts) {
            matchDetails.isOvertime = true;
            matchScore -= 15;
          }
        }

        // Note: Distance matching requires professional's location and shift location coordinates
        // Currently we store maxDistanceMiles preference but need location data to calculate distance
        // This can be enhanced when location geocoding is implemented
        if (preferences.maxDistanceMiles && preferences.maxDistanceMiles > 0) {
          matchDetails.distanceCheckPending = true;
          // Future: Calculate distance between professional location and shift location
          // and apply penalty if distance exceeds maxDistanceMiles
        }

        matchDetails.finalScore = Math.max(0, matchScore);
        matchingProfessionals.push({
          professional,
          matchScore: Math.max(0, matchScore),
          matchDetails,
        });
      }

      // Sort by match score descending
      matchingProfessionals.sort((a, b) => b.matchScore - a.matchScore);

      res.json(matchingProfessionals);
    } catch (error) {
      console.error("Error finding matching professionals:", error);
      res.status(500).json({ error: "Failed to find matching professionals" });
    }
  });

  app.get("/api/shifts/available", async (req, res) => {
    try {
      const { startDate, endDate, role, locationId } = req.query;
      
      const filters: { startDate?: string; endDate?: string; role?: string; locationId?: string } = {};
      if (typeof startDate === "string") filters.startDate = startDate;
      if (typeof endDate === "string") filters.endDate = endDate;
      if (typeof role === "string") filters.role = role;
      if (typeof locationId === "string") filters.locationId = locationId;
      
      const shifts = await storage.getAvailableShiftsWithPractice(filters);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching available shifts:", error);
      res.status(500).json({ error: "Failed to fetch available shifts" });
    }
  });

  // Create shifts (accepts array of shift data with multiple dates)
  const createShiftsSchema = z.object({
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1, "At least one date required"),
    role: z.string().min(1),
    locationId: z.string().optional().nullable(),
    specialties: z.array(z.string()).optional().default([]),
    arrivalTime: z.string().min(1),
    firstPatientTime: z.string().min(1),
    endTime: z.string().min(1),
    breakDuration: z.string().min(1),
    pricingMode: z.enum(["fixed", "smart"]),
    minHourlyRate: z.coerce.number().optional().nullable(),
    maxHourlyRate: z.coerce.number().optional().nullable(),
    fixedHourlyRate: z.coerce.number().optional().nullable(),
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const parsed = createShiftsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { dates, ...shiftData } = parsed.data;
      
      // Create one shift per selected date
      const shiftsToCreate = dates.map((date) => ({
        date,
        role: shiftData.role,
        locationId: shiftData.locationId || null,
        specialties: shiftData.specialties.length > 0 ? shiftData.specialties : null,
        arrivalTime: shiftData.arrivalTime,
        firstPatientTime: shiftData.firstPatientTime,
        endTime: shiftData.endTime,
        breakDuration: shiftData.breakDuration,
        pricingMode: shiftData.pricingMode,
        minHourlyRate: shiftData.minHourlyRate?.toString() || null,
        maxHourlyRate: shiftData.maxHourlyRate?.toString() || null,
        fixedHourlyRate: shiftData.fixedHourlyRate?.toString() || null,
        status: "open" as const,
      }));

      const createdShifts = await storage.createShifts(shiftsToCreate);
      res.status(201).json(createdShifts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating shifts:", error);
      res.status(500).json({ error: "Failed to create shifts" });
    }
  });

  // Get single shift
  app.get("/api/shifts/:id", async (req, res) => {
    try {
      const shift = await storage.getShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ error: "Failed to fetch shift" });
    }
  });

  // Update shift
  app.patch("/api/shifts/:id", async (req, res) => {
    try {
      const shift = await storage.updateShift(req.params.id, req.body);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ error: "Failed to update shift" });
    }
  });

  // Claim shift (professional accepts an open shift)
  const claimShiftSchema = z.object({
    professionalId: z.string().min(1, "Professional ID is required"),
  });

  app.post("/api/shifts/:id/claim", async (req, res) => {
    try {
      const parsed = claimShiftSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const result = await storage.claimShift(req.params.id, parsed.data.professionalId);
      
      if (!result.success) {
        return res.status(409).json({ error: result.error });
      }
      
      res.json({ success: true, shift: result.shift });
    } catch (error) {
      console.error("Error claiming shift:", error);
      res.status(500).json({ error: "Failed to claim shift" });
    }
  });

  // Release shift (professional releases a claimed shift)
  const releaseShiftSchema = z.object({
    professionalId: z.string().min(1, "Professional ID is required"),
  });

  app.post("/api/shifts/:id/release", async (req, res) => {
    try {
      const parsed = releaseShiftSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const result = await storage.releaseShift(req.params.id, parsed.data.professionalId);
      
      if (!result.success) {
        return res.status(409).json({ error: result.error });
      }
      
      res.json({ success: true, shift: result.shift });
    } catch (error) {
      console.error("Error releasing shift:", error);
      res.status(500).json({ error: "Failed to release shift" });
    }
  });

  // Check-in to a shift (mobile app)
  app.post("/api/shifts/:id/check-in", async (req, res) => {
    try {
      const { method, latitude, longitude } = req.body;
      
      if (!method) {
        return res.status(400).json({ error: "Check-in method is required" });
      }
      
      const result = await storage.checkInShift(req.params.id, {
        method,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      });
      
      if (!result.success) {
        return res.status(409).json({ error: result.error });
      }
      
      res.json({ success: true, shift: result.shift });
    } catch (error) {
      console.error("Error checking in to shift:", error);
      res.status(500).json({ error: "Failed to check in to shift" });
    }
  });

  // Check-out from a shift (mobile app)
  app.post("/api/shifts/:id/check-out", async (req, res) => {
    try {
      const { method, latitude, longitude } = req.body;
      
      if (!method) {
        return res.status(400).json({ error: "Check-out method is required" });
      }
      
      const result = await storage.checkOutShift(req.params.id, {
        method,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      });
      
      if (!result.success) {
        return res.status(409).json({ error: result.error });
      }
      
      res.json({ success: true, shift: result.shift });
    } catch (error) {
      console.error("Error checking out from shift:", error);
      res.status(500).json({ error: "Failed to check out from shift" });
    }
  });

  // Get shift details with practice data (for mobile app)
  app.get("/api/shifts/:id/details", async (req, res) => {
    try {
      const shift = await storage.getShiftWithPractice(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift details:", error);
      res.status(500).json({ error: "Failed to fetch shift details" });
    }
  });

  // Get professional's claimed shifts with practice data (for mobile app)
  app.get("/api/professionals/:id/shifts", async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      
      const filters: { status?: string; startDate?: string; endDate?: string } = {};
      if (typeof status === "string") filters.status = status;
      if (typeof startDate === "string") filters.startDate = startDate;
      if (typeof endDate === "string") filters.endDate = endDate;
      
      const shifts = await storage.getShiftsForProfessionalWithPractice(req.params.id, filters);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching professional's shifts:", error);
      res.status(500).json({ error: "Failed to fetch professional's shifts" });
    }
  });

  // Shift Transactions
  app.get("/api/shift-transactions", async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      const filters: { startDate?: string; endDate?: string; status?: string } = {};
      if (typeof startDate === "string") filters.startDate = startDate;
      if (typeof endDate === "string") filters.endDate = endDate;
      if (typeof status === "string") filters.status = status;
      
      const transactions = await storage.getShiftTransactions(filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching shift transactions:", error);
      res.status(500).json({ error: "Failed to fetch shift transactions" });
    }
  });

  app.get("/api/shift-transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getShiftTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching shift transaction:", error);
      res.status(500).json({ error: "Failed to fetch shift transaction" });
    }
  });

  app.get("/api/shifts/:id/transaction", async (req, res) => {
    try {
      const transaction = await storage.getShiftTransactionByShiftId(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found for this shift" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching shift transaction:", error);
      res.status(500).json({ error: "Failed to fetch shift transaction" });
    }
  });

  // Complete a shift and create transaction
  const completeShiftSchema = z.object({
    professionalId: z.string(),
    practiceId: z.string().optional(), // Optional practice ID for fee resolution
    hoursWorked: z.coerce.number(),
    hourlyRate: z.coerce.number(),
    mealBreakMinutes: z.coerce.number().default(0),
    adjustmentMade: z.boolean().default(false),
    adjustmentAmount: z.coerce.number().optional(),
    adjustmentReason: z.string().optional(),
    counterCoverDiscount: z.coerce.number().default(0),
  });

  app.post("/api/shifts/:id/complete", async (req, res) => {
    try {
      const parsed = completeShiftSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const shift = await storage.getShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      const data = parsed.data;
      
      // Get configurable fee rates from platform settings (with practice fallback if practiceId provided)
      const feeRates = await storage.getResolvedFeeRates(data.practiceId);
      
      // Calculate payment breakdown using configurable rates
      const regularPay = data.hoursWorked * data.hourlyRate;
      const serviceFeeRate = feeRates.serviceFeeRate;
      const convenienceFeeRate = feeRates.convenienceFeeRate;
      const serviceFee = regularPay * serviceFeeRate;
      const convenienceFee = (regularPay + serviceFee) * convenienceFeeRate;
      const adjustment = data.adjustmentMade ? (data.adjustmentAmount || 0) : 0;
      const totalPay = regularPay + serviceFee + convenienceFee + adjustment - data.counterCoverDiscount;

      // Create transaction with the effective rates stored for audit trail
      const transaction = await storage.createShiftTransaction({
        shiftId: req.params.id,
        professionalId: data.professionalId,
        chargeDate: new Date().toISOString().split('T')[0],
        hoursWorked: data.hoursWorked.toFixed(2),
        hourlyRate: data.hourlyRate.toFixed(2),
        mealBreakMinutes: data.mealBreakMinutes,
        adjustmentMade: data.adjustmentMade,
        adjustmentAmount: data.adjustmentAmount?.toFixed(2) || null,
        adjustmentReason: data.adjustmentReason || null,
        regularPay: regularPay.toFixed(2),
        serviceFeeRate: serviceFeeRate.toFixed(4),
        serviceFee: serviceFee.toFixed(2),
        convenienceFeeRate: convenienceFeeRate.toFixed(4),
        convenienceFee: convenienceFee.toFixed(2),
        counterCoverDiscount: data.counterCoverDiscount.toFixed(2),
        totalPay: totalPay.toFixed(2),
        status: "pending",
      });

      // Update shift status to completed
      await storage.updateShift(req.params.id, {
        status: "completed",
        assignedProfessionalId: data.professionalId,
      });

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error completing shift:", error);
      res.status(500).json({ error: "Failed to complete shift" });
    }
  });

  // Charge a pending transaction
  app.post("/api/shift-transactions/:id/charge", async (req, res) => {
    try {
      const transaction = await storage.getShiftTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction is not pending" });
      }

      // For now, just mark as charged (Stripe integration can be added later)
      const updated = await storage.updateShiftTransaction(req.params.id, {
        status: "charged",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error charging transaction:", error);
      res.status(500).json({ error: "Failed to charge transaction" });
    }
  });

  // Professionals
  app.get("/api/professionals", async (req, res) => {
    try {
      const { role, specialty } = req.query;
      const filters: { role?: string; specialty?: string } = {};
      if (typeof role === "string") filters.role = role;
      if (typeof specialty === "string") filters.specialty = specialty;
      
      const professionals = await storage.getProfessionals(filters);
      res.json(professionals);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      res.status(500).json({ error: "Failed to fetch professionals" });
    }
  });

  // Get online status for all professionals
  app.get("/api/professionals/online-status", async (req, res) => {
    try {
      const statusMap = await storage.getProfessionalsOnlineStatus();
      const statusObject: Record<string, boolean> = {};
      statusMap.forEach((isOnline, id) => {
        statusObject[id] = isOnline;
      });
      res.json(statusObject);
    } catch (error) {
      console.error("Error fetching online status:", error);
      res.status(500).json({ error: "Failed to fetch online status" });
    }
  });

  app.get("/api/professionals/:id", async (req, res) => {
    try {
      const professional = await storage.getProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional:", error);
      res.status(500).json({ error: "Failed to fetch professional" });
    }
  });

  app.post("/api/professionals", async (req, res) => {
    try {
      const parsed = insertProfessionalSchema.parse(req.body);
      const professional = await storage.createProfessional(parsed);
      res.status(201).json(professional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating professional:", error);
      res.status(500).json({ error: "Failed to create professional" });
    }
  });

  app.put("/api/professionals/:id", async (req, res) => {
    try {
      const professional = await storage.updateProfessional(req.params.id, req.body);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error updating professional:", error);
      res.status(500).json({ error: "Failed to update professional" });
    }
  });

  app.patch("/api/professionals/:id", async (req, res) => {
    try {
      const professional = await storage.updateProfessional(req.params.id, req.body);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error updating professional:", error);
      res.status(500).json({ error: "Failed to update professional" });
    }
  });

  app.delete("/api/professionals/:id", async (req, res) => {
    try {
      await storage.deleteProfessional(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting professional:", error);
      res.status(500).json({ error: "Failed to delete professional" });
    }
  });

  // ============================================================
  // Professional Onboarding API
  // ============================================================

  // Get onboarding status and progress for current professional
  app.get("/api/professional/onboarding", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const professional = await storage.getProfessional(session.professionalId);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      // Get related onboarding data
      const { contractorDocuments, contractorTaxForms, professionalPaymentMethods, professionalAgreements } = await import("@shared/schema");
      
      const documents = await db.select().from(contractorDocuments).where(eq(contractorDocuments.professionalId, session.professionalId));
      const taxForms = await db.select().from(contractorTaxForms).where(eq(contractorTaxForms.professionalId, session.professionalId));
      const paymentMethods = await db.select().from(professionalPaymentMethods).where(eq(professionalPaymentMethods.professionalId, session.professionalId));
      const agreements = await db.select().from(professionalAgreements).where(eq(professionalAgreements.professionalId, session.professionalId));

      // Calculate progress
      const requiredAgreements = ["contractor_agreement", "hipaa_acknowledgment"];
      const signedAgreementTypes = agreements.filter(a => a.signedAt).map(a => a.agreementType);
      const allRequiredAgreementsSigned = requiredAgreements.every(type => signedAgreementTypes.includes(type));
      
      const hasVerifiedPaymentMethod = paymentMethods.some(pm => pm.verificationStatus === "verified");
      const hasApprovedW9 = taxForms.some(tf => tf.verificationStatus === "verified");
      const hasApprovedId = documents.some(d => d.documentType === "government_id" && d.verificationStatus === "approved");

      // Calculate percent complete (5 steps)
      const steps = [
        { name: "personal_info", complete: !!(professional.dateOfBirth && professional.addressStreet) },
        { name: "identity_verification", complete: professional.identityVerified || hasApprovedId },
        { name: "tax_forms", complete: professional.w9Completed || hasApprovedW9 },
        { name: "agreements", complete: professional.agreementsSigned || allRequiredAgreementsSigned },
        { name: "payment_setup", complete: professional.paymentMethodVerified || hasVerifiedPaymentMethod },
      ];
      
      const completedSteps = steps.filter(s => s.complete).length;
      const percentComplete = Math.round((completedSteps / steps.length) * 100);

      res.json({
        professional: {
          id: professional.id,
          firstName: professional.firstName,
          lastName: professional.lastName,
          email: professional.email,
          onboardingStatus: professional.onboardingStatus,
          paymentEligible: professional.paymentEligible,
          emailVerified: professional.emailVerified,
          phoneVerified: professional.phoneVerified,
          identityVerified: professional.identityVerified,
          w9Completed: professional.w9Completed,
          agreementsSigned: professional.agreementsSigned,
          paymentMethodVerified: professional.paymentMethodVerified,
          dateOfBirth: professional.dateOfBirth,
          addressStreet: professional.addressStreet,
          addressCity: professional.addressCity,
          addressState: professional.addressState,
          addressZip: professional.addressZip,
        },
        documents,
        taxForms: taxForms.map(tf => ({
          ...tf,
          // Never expose encrypted values
          encryptedSsn: undefined,
          encryptedEin: undefined,
        })),
        paymentMethods: paymentMethods.map(pm => ({
          ...pm,
          // Never expose encrypted values
          encryptedAccountNumber: undefined,
          encryptedRoutingNumber: undefined,
        })),
        agreements,
        progress: {
          steps,
          completedSteps,
          totalSteps: steps.length,
          percentComplete,
        },
      });
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ error: "Failed to fetch onboarding status" });
    }
  });

  // Update professional's personal information for onboarding
  app.patch("/api/professional/onboarding/personal-info", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { dateOfBirth, addressStreet, addressCity, addressState, addressZip, phone } = req.body;
      const { professionals } = await import("@shared/schema");

      const updateData: any = { updatedAt: new Date() };
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (addressStreet !== undefined) updateData.addressStreet = addressStreet;
      if (addressCity !== undefined) updateData.addressCity = addressCity;
      if (addressState !== undefined) updateData.addressState = addressState;
      if (addressZip !== undefined) updateData.addressZip = addressZip;
      if (phone !== undefined) updateData.phone = phone;

      // Update onboarding status to in_progress if still invited
      const currentProfessional = await storage.getProfessional(session.professionalId);
      if (currentProfessional?.onboardingStatus === "invited") {
        updateData.onboardingStatus = "in_progress";
      }

      await db.update(professionals)
        .set(updateData)
        .where(eq(professionals.id, session.professionalId));

      const updated = await storage.getProfessional(session.professionalId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating personal info:", error);
      res.status(500).json({ error: "Failed to update personal information" });
    }
  });

  // Upload document for onboarding
  app.post("/api/professional/onboarding/documents", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { documentType, documentName, documentUrl, metadata } = req.body;
      
      if (!documentType || !documentUrl) {
        return res.status(400).json({ error: "Document type and URL are required" });
      }

      const { contractorDocuments, onboardingAuditLog } = await import("@shared/schema");

      // Insert document
      const [document] = await db.insert(contractorDocuments)
        .values({
          professionalId: session.professionalId,
          documentType,
          documentName,
          documentUrl,
          metadata: metadata ? JSON.stringify(metadata) : null,
          verificationStatus: "pending",
        })
        .returning();

      // Create audit log entry
      await db.insert(onboardingAuditLog).values({
        professionalId: session.professionalId,
        action: "document_uploaded",
        actorType: "professional",
        actorId: session.professionalId,
        documentId: document.id,
        newValue: JSON.stringify({ documentType, documentName }),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get documents for current professional
  app.get("/api/professional/onboarding/documents", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { contractorDocuments } = await import("@shared/schema");
      const documents = await db.select()
        .from(contractorDocuments)
        .where(eq(contractorDocuments.professionalId, session.professionalId));

      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Submit W-9 tax form
  app.post("/api/professional/onboarding/w9", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { 
        legalName, businessName, taxClassification, 
        ssn, ein, useSsn,
        taxAddressStreet, taxAddressCity, taxAddressState, taxAddressZip,
        electronicSignature
      } = req.body;

      if (!legalName || !taxClassification || !taxAddressStreet || !taxAddressCity || !taxAddressState || !taxAddressZip) {
        return res.status(400).json({ error: "Required W-9 fields missing" });
      }

      // Validate SSN or EIN is provided
      if (useSsn !== false && !ssn) {
        return res.status(400).json({ error: "SSN is required" });
      }
      if (useSsn === false && !ein) {
        return res.status(400).json({ error: "EIN is required" });
      }

      const { contractorTaxForms, onboardingAuditLog, professionals } = await import("@shared/schema");

      // Extract last 4 digits and encrypt full value
      const ssnLast4 = ssn ? ssn.slice(-4) : null;
      const einLast4 = ein ? ein.slice(-4) : null;
      
      // Note: In production, use proper encryption (e.g., AWS KMS, Vault)
      // This is a placeholder - implement with your encryption service
      const encryptedSsn = ssn ? Buffer.from(ssn).toString("base64") : null;
      const encryptedEin = ein ? Buffer.from(ein).toString("base64") : null;

      // Check if there's an existing W-9, update it if so
      const existing = await db.select()
        .from(contractorTaxForms)
        .where(eq(contractorTaxForms.professionalId, session.professionalId));

      let taxForm;
      if (existing.length > 0) {
        [taxForm] = await db.update(contractorTaxForms)
          .set({
            legalName,
            businessName,
            taxClassification,
            ssnLast4,
            encryptedSsn,
            einLast4,
            encryptedEin,
            useSsn: useSsn !== false,
            taxAddressStreet,
            taxAddressCity,
            taxAddressState,
            taxAddressZip,
            electronicSignature: !!electronicSignature,
            signatureDate: electronicSignature ? new Date() : null,
            signatureIp: electronicSignature ? req.ip : null,
            verificationStatus: "pending",
            updatedAt: new Date(),
          })
          .where(eq(contractorTaxForms.id, existing[0].id))
          .returning();
      } else {
        [taxForm] = await db.insert(contractorTaxForms)
          .values({
            professionalId: session.professionalId,
            formType: "w9",
            legalName,
            businessName,
            taxClassification,
            ssnLast4,
            encryptedSsn,
            einLast4,
            encryptedEin,
            useSsn: useSsn !== false,
            taxAddressStreet,
            taxAddressCity,
            taxAddressState,
            taxAddressZip,
            electronicSignature: !!electronicSignature,
            signatureDate: electronicSignature ? new Date() : null,
            signatureIp: electronicSignature ? req.ip : null,
            verificationStatus: "pending",
          })
          .returning();
      }

      // Update professional status
      await db.update(professionals)
        .set({ 
          onboardingStatus: "under_review",
          updatedAt: new Date(),
        })
        .where(eq(professionals.id, session.professionalId));

      // Audit log - never log sensitive data
      await db.insert(onboardingAuditLog).values({
        professionalId: session.professionalId,
        action: "w9_submitted",
        actorType: "professional",
        actorId: session.professionalId,
        newValue: JSON.stringify({ 
          legalName, 
          taxClassification, 
          ssnLast4: ssnLast4 ? `***-**-${ssnLast4}` : null,
          einLast4: einLast4 ? `**-***${einLast4}` : null,
        }),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Return without encrypted values
      res.status(201).json({
        ...taxForm,
        encryptedSsn: undefined,
        encryptedEin: undefined,
      });
    } catch (error) {
      console.error("Error submitting W-9:", error);
      res.status(500).json({ error: "Failed to submit W-9 form" });
    }
  });

  // Get W-9 form for current professional
  app.get("/api/professional/onboarding/w9", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { contractorTaxForms } = await import("@shared/schema");
      const [taxForm] = await db.select()
        .from(contractorTaxForms)
        .where(eq(contractorTaxForms.professionalId, session.professionalId));

      if (!taxForm) {
        return res.json(null);
      }

      // Never return encrypted values
      res.json({
        ...taxForm,
        encryptedSsn: undefined,
        encryptedEin: undefined,
      });
    } catch (error) {
      console.error("Error fetching W-9:", error);
      res.status(500).json({ error: "Failed to fetch W-9 form" });
    }
  });

  // Sign an agreement
  app.post("/api/professional/onboarding/agreements", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { agreementType, agreementVersion, signatureName } = req.body;
      
      if (!agreementType || !agreementVersion || !signatureName) {
        return res.status(400).json({ error: "Agreement type, version, and signature are required" });
      }

      const { professionalAgreements, onboardingAuditLog, professionals } = await import("@shared/schema");

      // Deactivate any previous version of this agreement
      await db.update(professionalAgreements)
        .set({ isActive: false })
        .where(eq(professionalAgreements.professionalId, session.professionalId));

      // Insert new signed agreement
      const [agreement] = await db.insert(professionalAgreements)
        .values({
          professionalId: session.professionalId,
          agreementType,
          agreementVersion,
          signedAt: new Date(),
          signatureIp: req.ip,
          signatureName,
          isActive: true,
        })
        .returning();

      // Check if all required agreements are now signed
      const allAgreements = await db.select()
        .from(professionalAgreements)
        .where(eq(professionalAgreements.professionalId, session.professionalId));
      
      const requiredAgreements = ["contractor_agreement", "hipaa_acknowledgment"];
      const signedTypes = allAgreements.filter(a => a.signedAt && a.isActive).map(a => a.agreementType);
      const allSigned = requiredAgreements.every(type => signedTypes.includes(type));

      if (allSigned) {
        await db.update(professionals)
          .set({ agreementsSigned: true, updatedAt: new Date() })
          .where(eq(professionals.id, session.professionalId));
      }

      // Audit log
      await db.insert(onboardingAuditLog).values({
        professionalId: session.professionalId,
        action: "agreement_signed",
        actorType: "professional",
        actorId: session.professionalId,
        newValue: JSON.stringify({ agreementType, agreementVersion }),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(agreement);
    } catch (error) {
      console.error("Error signing agreement:", error);
      res.status(500).json({ error: "Failed to sign agreement" });
    }
  });

  // Get agreements for current professional
  app.get("/api/professional/onboarding/agreements", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { professionalAgreements } = await import("@shared/schema");
      const agreements = await db.select()
        .from(professionalAgreements)
        .where(eq(professionalAgreements.professionalId, session.professionalId));

      res.json(agreements);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ error: "Failed to fetch agreements" });
    }
  });

  // Add payment method (bank account or initiate Stripe Connect)
  app.post("/api/professional/onboarding/payment-methods", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { methodType, bankName, accountType, accountNumber, routingNumber, paymentEmail } = req.body;
      
      if (!methodType) {
        return res.status(400).json({ error: "Payment method type is required" });
      }

      const { professionalPaymentMethods, onboardingAuditLog } = await import("@shared/schema");

      if (methodType === "stripe_connect") {
        // For Stripe Connect, we'll return a URL to complete onboarding
        const stripe = await getUncachableStripeClient();
        const professional = await storage.getProfessional(session.professionalId);
        
        if (!professional) {
          return res.status(404).json({ error: "Professional not found" });
        }

        // Check for existing Stripe account
        const existingMethods = await db.select()
          .from(professionalPaymentMethods)
          .where(eq(professionalPaymentMethods.professionalId, session.professionalId));
        
        let stripeAccountId = existingMethods.find(m => m.stripeAccountId)?.stripeAccountId;

        if (!stripeAccountId) {
          // Create new Stripe Connect Express account
          const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: professional.email,
            capabilities: {
              transfers: { requested: true },
            },
            business_type: "individual",
            metadata: {
              professionalId: session.professionalId,
            },
          });
          stripeAccountId = account.id;

          // Save the Stripe account ID
          await db.insert(professionalPaymentMethods).values({
            professionalId: session.professionalId,
            methodType: "stripe_connect",
            stripeAccountId,
            stripeAccountStatus: "pending",
            stripeOnboardingComplete: false,
            verificationStatus: "pending",
          });
        }

        // Create account link for onboarding
        const baseUrl = process.env.REPLIT_DEPLOYMENT_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        const accountLink = await stripe.accountLinks.create({
          account: stripeAccountId,
          refresh_url: `${baseUrl}/app/hub?stripe_refresh=true`,
          return_url: `${baseUrl}/app/hub?stripe_complete=true`,
          type: "account_onboarding",
        });

        return res.json({ 
          type: "stripe_connect",
          stripeAccountId,
          onboardingUrl: accountLink.url,
        });
      }

      // For bank account (ACH)
      if (methodType === "bank_account") {
        if (!accountNumber || !routingNumber) {
          return res.status(400).json({ error: "Account and routing numbers are required for bank account" });
        }

        const accountLast4 = accountNumber.slice(-4);
        const routingLast4 = routingNumber.slice(-4);
        
        // Placeholder encryption - use proper encryption in production
        const encryptedAccountNumber = Buffer.from(accountNumber).toString("base64");
        const encryptedRoutingNumber = Buffer.from(routingNumber).toString("base64");

        // Set any existing bank accounts to not default
        await db.update(professionalPaymentMethods)
          .set({ isDefault: false })
          .where(eq(professionalPaymentMethods.professionalId, session.professionalId));

        const [paymentMethod] = await db.insert(professionalPaymentMethods)
          .values({
            professionalId: session.professionalId,
            methodType: "bank_account",
            bankName,
            accountType,
            accountLast4,
            routingLast4,
            encryptedAccountNumber,
            encryptedRoutingNumber,
            isDefault: true,
            verificationStatus: "pending",
          })
          .returning();

        // Audit log - never log full account numbers
        await db.insert(onboardingAuditLog).values({
          professionalId: session.professionalId,
          action: "payment_method_added",
          actorType: "professional",
          actorId: session.professionalId,
          newValue: JSON.stringify({ 
            methodType, 
            bankName, 
            accountLast4: `****${accountLast4}`,
          }),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        return res.status(201).json({
          ...paymentMethod,
          encryptedAccountNumber: undefined,
          encryptedRoutingNumber: undefined,
        });
      }

      res.status(400).json({ error: "Unsupported payment method type" });
    } catch (error) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ error: "Failed to add payment method" });
    }
  });

  // Get payment methods for current professional
  app.get("/api/professional/onboarding/payment-methods", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { professionalPaymentMethods } = await import("@shared/schema");
      const methods = await db.select()
        .from(professionalPaymentMethods)
        .where(eq(professionalPaymentMethods.professionalId, session.professionalId));

      // Never return encrypted values
      res.json(methods.map(m => ({
        ...m,
        encryptedAccountNumber: undefined,
        encryptedRoutingNumber: undefined,
      })));
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  // Stripe Connect webhook callback to update onboarding status
  app.get("/api/professional/onboarding/stripe-status", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.professionalId) {
        return res.status(401).json({ error: "Not authenticated as professional" });
      }

      const { professionalPaymentMethods, professionals } = await import("@shared/schema");
      
      const [paymentMethod] = await db.select()
        .from(professionalPaymentMethods)
        .where(eq(professionalPaymentMethods.professionalId, session.professionalId));

      if (!paymentMethod?.stripeAccountId) {
        return res.json({ connected: false });
      }

      const stripe = await getUncachableStripeClient();
      const account = await stripe.accounts.retrieve(paymentMethod.stripeAccountId);

      const isComplete = account.details_submitted && account.charges_enabled;
      
      // Update status
      await db.update(professionalPaymentMethods)
        .set({
          stripeOnboardingComplete: isComplete,
          stripeAccountStatus: isComplete ? "active" : "pending",
          verificationStatus: isComplete ? "verified" : "pending",
          verifiedAt: isComplete ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(professionalPaymentMethods.id, paymentMethod.id));

      // If complete, update professional's payment method verified status
      if (isComplete) {
        await db.update(professionals)
          .set({ 
            paymentMethodVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(professionals.id, session.professionalId));
      }

      res.json({
        connected: true,
        stripeAccountId: paymentMethod.stripeAccountId,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        complete: isComplete,
      });
    } catch (error) {
      console.error("Error checking Stripe status:", error);
      res.status(500).json({ error: "Failed to check Stripe status" });
    }
  });

  // ============================================================
  // Admin Contractor Verification API
  // ============================================================

  // Get all professionals with onboarding status for admin review
  app.get("/api/admin/contractors", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated as admin" });
      }

      const { professionals, contractorDocuments, contractorTaxForms, professionalPaymentMethods, professionalAgreements } = await import("@shared/schema");
      const { desc, sql: sqlFn } = await import("drizzle-orm");

      // Get all professionals with onboarding data
      const allProfessionals = await db.select().from(professionals).orderBy(desc(professionals.createdAt));

      // Enrich with onboarding data
      const enrichedProfessionals = await Promise.all(allProfessionals.map(async (prof) => {
        const documents = await db.select().from(contractorDocuments).where(eq(contractorDocuments.professionalId, prof.id));
        const taxForms = await db.select().from(contractorTaxForms).where(eq(contractorTaxForms.professionalId, prof.id));
        const paymentMethods = await db.select().from(professionalPaymentMethods).where(eq(professionalPaymentMethods.professionalId, prof.id));
        const agreements = await db.select().from(professionalAgreements).where(eq(professionalAgreements.professionalId, prof.id));

        return {
          ...prof,
          documents,
          taxForms: taxForms.map(tf => ({
            ...tf,
            encryptedSsn: undefined,
            encryptedEin: undefined,
          })),
          paymentMethods: paymentMethods.map(pm => ({
            ...pm,
            encryptedAccountNumber: undefined,
            encryptedRoutingNumber: undefined,
          })),
          agreements,
          pendingDocuments: documents.filter(d => d.verificationStatus === "pending").length,
          pendingW9: taxForms.some(tf => tf.verificationStatus === "pending"),
        };
      }));

      res.json(enrichedProfessionals);
    } catch (error) {
      console.error("Error fetching contractors for admin:", error);
      res.status(500).json({ error: "Failed to fetch contractors" });
    }
  });

  // Get specific contractor details for admin review
  app.get("/api/admin/contractors/:id", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated as admin" });
      }

      const professional = await storage.getProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      const { contractorDocuments, contractorTaxForms, professionalPaymentMethods, professionalAgreements, onboardingAuditLog } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");

      const documents = await db.select().from(contractorDocuments).where(eq(contractorDocuments.professionalId, req.params.id));
      const taxForms = await db.select().from(contractorTaxForms).where(eq(contractorTaxForms.professionalId, req.params.id));
      const paymentMethods = await db.select().from(professionalPaymentMethods).where(eq(professionalPaymentMethods.professionalId, req.params.id));
      const agreements = await db.select().from(professionalAgreements).where(eq(professionalAgreements.professionalId, req.params.id));
      const auditLogs = await db.select().from(onboardingAuditLog).where(eq(onboardingAuditLog.professionalId, req.params.id)).orderBy(desc(onboardingAuditLog.createdAt));

      res.json({
        professional,
        documents,
        taxForms: taxForms.map(tf => ({
          ...tf,
          encryptedSsn: undefined,
          encryptedEin: undefined,
        })),
        paymentMethods: paymentMethods.map(pm => ({
          ...pm,
          encryptedAccountNumber: undefined,
          encryptedRoutingNumber: undefined,
        })),
        agreements,
        auditLogs,
      });
    } catch (error) {
      console.error("Error fetching contractor details:", error);
      res.status(500).json({ error: "Failed to fetch contractor details" });
    }
  });

  // Approve or reject a document
  app.post("/api/admin/contractors/:id/documents/:documentId/verify", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated as admin" });
      }

      const { action, rejectionReason } = req.body;
      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Valid action (approve/reject) is required" });
      }

      const { contractorDocuments, onboardingAuditLog, professionals } = await import("@shared/schema");

      const [document] = await db.select().from(contractorDocuments).where(eq(contractorDocuments.id, req.params.documentId));
      if (!document || document.professionalId !== req.params.id) {
        return res.status(404).json({ error: "Document not found" });
      }

      const admin = await storage.getPracticeAdmin(session.adminId);

      // Update document status
      await db.update(contractorDocuments)
        .set({
          verificationStatus: action === "approve" ? "approved" : "rejected",
          verifiedAt: new Date(),
          verifiedBy: session.adminId,
          rejectionReason: action === "reject" ? rejectionReason : null,
          updatedAt: new Date(),
        })
        .where(eq(contractorDocuments.id, req.params.documentId));

      // If it's a government ID being approved, update identity verified flag
      if (action === "approve" && document.documentType === "government_id") {
        await db.update(professionals)
          .set({ identityVerified: true, updatedAt: new Date() })
          .where(eq(professionals.id, req.params.id));
      }

      // Audit log
      await db.insert(onboardingAuditLog).values({
        professionalId: req.params.id,
        action: action === "approve" ? "document_approved" : "document_rejected",
        actorType: "admin",
        actorId: session.adminId,
        actorEmail: admin?.email,
        documentId: req.params.documentId,
        previousValue: JSON.stringify({ status: document.verificationStatus }),
        newValue: JSON.stringify({ status: action === "approve" ? "approved" : "rejected", rejectionReason }),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: `Document ${action}d successfully` });
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ error: "Failed to verify document" });
    }
  });

  // Approve or reject W-9 form
  app.post("/api/admin/contractors/:id/w9/verify", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated as admin" });
      }

      const { action, rejectionReason } = req.body;
      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Valid action (approve/reject) is required" });
      }

      const { contractorTaxForms, onboardingAuditLog, professionals } = await import("@shared/schema");

      const [taxForm] = await db.select().from(contractorTaxForms).where(eq(contractorTaxForms.professionalId, req.params.id));
      if (!taxForm) {
        return res.status(404).json({ error: "W-9 form not found" });
      }

      const admin = await storage.getPracticeAdmin(session.adminId);

      // Update W-9 status
      await db.update(contractorTaxForms)
        .set({
          verificationStatus: action === "approve" ? "verified" : "rejected",
          verifiedAt: new Date(),
          verifiedBy: session.adminId,
          rejectionReason: action === "reject" ? rejectionReason : null,
          updatedAt: new Date(),
        })
        .where(eq(contractorTaxForms.id, taxForm.id));

      // If approved, update professional's w9Completed flag
      if (action === "approve") {
        await db.update(professionals)
          .set({ w9Completed: true, updatedAt: new Date() })
          .where(eq(professionals.id, req.params.id));
      }

      // Audit log
      await db.insert(onboardingAuditLog).values({
        professionalId: req.params.id,
        action: action === "approve" ? "w9_approved" : "w9_rejected",
        actorType: "admin",
        actorId: session.adminId,
        actorEmail: admin?.email,
        previousValue: JSON.stringify({ status: taxForm.verificationStatus }),
        newValue: JSON.stringify({ status: action === "approve" ? "verified" : "rejected", rejectionReason }),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: `W-9 ${action}d successfully` });
    } catch (error) {
      console.error("Error verifying W-9:", error);
      res.status(500).json({ error: "Failed to verify W-9" });
    }
  });

  // Update contractor onboarding status (approve for payment, suspend, etc.)
  app.post("/api/admin/contractors/:id/status", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated as admin" });
      }

      const { status, notes } = req.body;
      const validStatuses = ["verified", "payment_eligible", "rejected", "suspended", "in_progress"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Valid status is required" });
      }

      const { professionals, onboardingAuditLog } = await import("@shared/schema");

      const professional = await storage.getProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }

      const admin = await storage.getPracticeAdmin(session.adminId);

      // Update professional status
      const updateData: any = {
        onboardingStatus: status,
        updatedAt: new Date(),
      };

      // If marking as payment_eligible, also set the flag
      if (status === "payment_eligible") {
        updateData.paymentEligible = true;
      } else if (status === "suspended" || status === "rejected") {
        updateData.paymentEligible = false;
      }

      await db.update(professionals)
        .set(updateData)
        .where(eq(professionals.id, req.params.id));

      // Audit log
      await db.insert(onboardingAuditLog).values({
        professionalId: req.params.id,
        action: "status_changed",
        actorType: "admin",
        actorId: session.adminId,
        actorEmail: admin?.email,
        previousValue: JSON.stringify({ status: professional.onboardingStatus, paymentEligible: professional.paymentEligible }),
        newValue: JSON.stringify({ status, paymentEligible: status === "payment_eligible" }),
        notes,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: `Contractor status updated to ${status}` });
    } catch (error) {
      console.error("Error updating contractor status:", error);
      res.status(500).json({ error: "Failed to update contractor status" });
    }
  });

  // ===== Practice Invitations - Invite professionals to connect =====
  
  // Get all invitations for a practice
  app.get("/api/practices/:practiceId/invitations", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify admin belongs to this practice
      const admin = await storage.getPracticeAdmin(session.adminId);
      if (!admin || admin.practiceId !== req.params.practiceId) {
        return res.status(403).json({ error: "You don't have permission to view this practice's invitations" });
      }

      const invitations = await storage.getPracticeInvitations(req.params.practiceId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching practice invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Send a new invitation to a professional
  app.post("/api/practices/:practiceId/invitations", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify admin belongs to this practice
      const admin = await storage.getPracticeAdmin(session.adminId);
      if (!admin || admin.practiceId !== req.params.practiceId) {
        return res.status(403).json({ error: "You don't have permission to invite professionals to this practice" });
      }

      const { email, firstName, lastName, role, message } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
      }

      // Check if already connected
      const existingConnection = await storage.getPracticeProfessionalByEmail(req.params.practiceId, email);
      if (existingConnection) {
        return res.status(400).json({ error: "This professional is already connected to your practice" });
      }

      // Check for pending invitation
      const existingInvitation = await storage.getPracticeInvitationByEmail(req.params.practiceId, email);
      if (existingInvitation) {
        return res.status(400).json({ error: "A pending invitation already exists for this email" });
      }

      // Generate unique token for invitation link
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const invitation = await storage.createPracticeInvitation({
        practiceId: req.params.practiceId,
        invitedByAdminId: session.adminId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        role,
        message,
        token,
        expiresAt,
      });

      const invitationLink = `${process.env.APP_URL || 'https://etherai.replit.app'}/invitation/${token}`;

      // Get practice name for email
      const practice = await storage.getPractice(req.params.practiceId);
      const practiceName = practice?.name || "A dental practice";

      // Send invitation email using Resend integration
      let emailSent = false;
      try {
        emailSent = await sendInvitationEmail({
          toEmail: email.toLowerCase(),
          practiceName,
          role,
          invitationLink,
          message,
        });
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
      }

      res.status(201).json({
        ...invitation,
        invitationLink,
        emailSent,
        message: emailSent 
          ? "Invitation sent successfully! The professional will receive an email with the invitation link."
          : "Invitation created but email could not be sent. You can share the invitation link manually.",
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Get invitation by token (for professionals to view)
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const invitation = await storage.getPracticeInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({ error: `This invitation has already been ${invitation.status}` });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        await storage.updatePracticeInvitation(invitation.id, { status: "expired" });
        return res.status(400).json({ error: "This invitation has expired" });
      }

      // Get practice details
      const practice = await storage.getPractice(invitation.practiceId);

      res.json({
        ...invitation,
        practice: practice ? { id: practice.id, name: practice.name } : null,
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  // Accept invitation
  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const invitation = await storage.getPracticeInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({ error: `This invitation has already been ${invitation.status}` });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        await storage.updatePracticeInvitation(invitation.id, { status: "expired" });
        return res.status(400).json({ error: "This invitation has expired" });
      }

      // Check if professional exists with this email
      const professionals = await storage.getProfessionals({});
      let professional = professionals.find(p => p.email.toLowerCase() === invitation.email.toLowerCase());

      // If professional doesn't exist, we need to create one or prompt registration
      if (!professional) {
        // For now, create a basic professional record
        // In production, this would redirect to professional registration
        const newProfessional = await storage.createProfessional({
          firstName: invitation.firstName || "New",
          lastName: invitation.lastName || "Professional",
          email: invitation.email,
          role: invitation.role,
        });
        professional = { ...newProfessional, badges: [] };
      }

      // Create the practice-professional connection
      await storage.createPracticeProfessional({
        practiceId: invitation.practiceId,
        professionalId: professional.id,
        invitationId: invitation.id,
        status: "active",
      });

      // Update invitation status
      await storage.updatePracticeInvitation(invitation.id, {
        status: "accepted",
        professionalId: professional.id,
        respondedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Invitation accepted! You are now connected with the practice.",
        professionalId: professional.id,
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Decline invitation
  app.post("/api/invitations/:token/decline", async (req, res) => {
    try {
      const invitation = await storage.getPracticeInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({ error: `This invitation has already been ${invitation.status}` });
      }

      await storage.updatePracticeInvitation(invitation.id, {
        status: "declined",
        respondedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Invitation declined.",
      });
    } catch (error) {
      console.error("Error declining invitation:", error);
      res.status(500).json({ error: "Failed to decline invitation" });
    }
  });

  // Resend invitation
  app.post("/api/practices/:practiceId/invitations/:id/resend", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify admin belongs to this practice
      const admin = await storage.getPracticeAdmin(session.adminId);
      if (!admin || admin.practiceId !== req.params.practiceId) {
        return res.status(403).json({ error: "You don't have permission to manage invitations for this practice" });
      }

      const invitations = await storage.getPracticeInvitations(req.params.practiceId);
      const invitation = invitations.find(i => i.id === req.params.id);

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({ error: "Can only resend pending invitations" });
      }

      // Generate new token and extend expiration
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await storage.updatePracticeInvitation(invitation.id, {
        token,
        expiresAt,
      });

      // TODO: Send email with new invitation link

      res.json({
        success: true,
        message: "Invitation resent successfully.",
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  });

  // Cancel invitation
  app.delete("/api/practices/:practiceId/invitations/:id", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify admin belongs to this practice
      const admin = await storage.getPracticeAdmin(session.adminId);
      if (!admin || admin.practiceId !== req.params.practiceId) {
        return res.status(403).json({ error: "You don't have permission to manage invitations for this practice" });
      }

      // Verify invitation belongs to this practice
      const invitations = await storage.getPracticeInvitations(req.params.practiceId);
      const invitation = invitations.find(i => i.id === req.params.id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await storage.updatePracticeInvitation(req.params.id, {
        status: "cancelled",
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ error: "Failed to cancel invitation" });
    }
  });

  // ===== Practice-Professional Connections =====
  
  // Get all connected professionals for a practice
  app.get("/api/practices/:practiceId/professionals", async (req, res) => {
    try {
      const connections = await storage.getPracticeProfessionals(req.params.practiceId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching practice professionals:", error);
      res.status(500).json({ error: "Failed to fetch connected professionals" });
    }
  });

  // Remove a professional connection
  app.delete("/api/practices/:practiceId/professionals/:connectionId", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      await storage.deletePracticeProfessional(req.params.connectionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing professional connection:", error);
      res.status(500).json({ error: "Failed to remove professional" });
    }
  });

  // Update professional connection (e.g., add notes, change status)
  app.patch("/api/practices/:practiceId/professionals/:connectionId", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { status, notes } = req.body;
      const updated = await storage.updatePracticeProfessional(req.params.connectionId, {
        status,
        notes,
      });

      if (!updated) {
        return res.status(404).json({ error: "Connection not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating professional connection:", error);
      res.status(500).json({ error: "Failed to update professional connection" });
    }
  });

  // Professional transactions (shifts endpoint moved to mobile API section with practice data)
  app.get("/api/professionals/:id/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsForProfessional(req.params.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching professional transactions:", error);
      res.status(500).json({ error: "Failed to fetch professional transactions" });
    }
  });

  // Professional Badges
  app.get("/api/professionals/:id/badges", async (req, res) => {
    try {
      const badges = await storage.getBadgesForProfessional(req.params.id);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.post("/api/professionals/:id/badges", async (req, res) => {
    try {
      const parsed = insertProfessionalBadgeSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const badge = await storage.createProfessionalBadge(parsed);
      res.status(201).json(badge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  // Professional with full credentials (preferences, certifications, etc.)
  app.get("/api/professionals/:id/full", async (req, res) => {
    try {
      const professional = await storage.getProfessionalWithCredentials(req.params.id);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional with credentials:", error);
      res.status(500).json({ error: "Failed to fetch professional" });
    }
  });

  // Update credential document URL after upload
  app.patch("/api/credentials/:type/:id/document", async (req, res) => {
    try {
      const { type, id } = req.params;
      const { documentUrl } = req.body;

      if (!documentUrl) {
        return res.status(400).json({ error: "Document URL is required" });
      }

      let result;
      switch (type) {
        case "certifications":
          result = await storage.updateProfessionalCertification(id, { documentUrl });
          break;
        case "training":
          result = await storage.updateProfessionalTraining(id, { certificateUrl: documentUrl });
          break;
        default:
          return res.status(400).json({ error: "Invalid credential type" });
      }

      if (!result) {
        return res.status(404).json({ error: "Credential not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating credential document:", error);
      res.status(500).json({ error: "Failed to update credential document" });
    }
  });

  // Professional Preferences
  app.get("/api/professionals/:id/preferences", async (req, res) => {
    try {
      const preferences = await storage.getProfessionalPreferences(req.params.id);
      res.json(preferences || null);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/professionals/:id/preferences", async (req, res) => {
    try {
      const parsed = insertProfessionalPreferencesSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const preferences = await storage.upsertProfessionalPreferences(parsed);
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Professional Availability
  app.get("/api/professionals/:id/availability", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const availability = await storage.getProfessionalAvailability(
        req.params.id,
        typeof startDate === "string" ? startDate : undefined,
        typeof endDate === "string" ? endDate : undefined
      );
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.post("/api/professionals/:id/availability", async (req, res) => {
    try {
      const parsed = insertProfessionalAvailabilitySchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const availability = await storage.createProfessionalAvailability(parsed);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating availability:", error);
      res.status(500).json({ error: "Failed to create availability" });
    }
  });

  app.put("/api/availability/:id", async (req, res) => {
    try {
      const availability = await storage.updateProfessionalAvailability(req.params.id, req.body);
      if (!availability) {
        return res.status(404).json({ error: "Availability not found" });
      }
      res.json(availability);
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.delete("/api/availability/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ error: "Failed to delete availability" });
    }
  });

  // Professional Certifications
  app.get("/api/professionals/:id/certifications", async (req, res) => {
    try {
      const certifications = await storage.getProfessionalCertifications(req.params.id);
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  app.post("/api/professionals/:id/certifications", async (req, res) => {
    try {
      const parsed = insertProfessionalCertificationSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const certification = await storage.createProfessionalCertification(parsed);
      res.status(201).json(certification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating certification:", error);
      res.status(500).json({ error: "Failed to create certification" });
    }
  });

  app.put("/api/certifications/:id", async (req, res) => {
    try {
      const certification = await storage.updateProfessionalCertification(req.params.id, req.body);
      if (!certification) {
        return res.status(404).json({ error: "Certification not found" });
      }
      res.json(certification);
    } catch (error) {
      console.error("Error updating certification:", error);
      res.status(500).json({ error: "Failed to update certification" });
    }
  });

  app.delete("/api/certifications/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalCertification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting certification:", error);
      res.status(500).json({ error: "Failed to delete certification" });
    }
  });

  // Professional Skills
  app.get("/api/professionals/:id/skills", async (req, res) => {
    try {
      const skills = await storage.getProfessionalSkills(req.params.id);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.post("/api/professionals/:id/skills", async (req, res) => {
    try {
      const parsed = insertProfessionalSkillSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const skill = await storage.createProfessionalSkill(parsed);
      res.status(201).json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating skill:", error);
      res.status(500).json({ error: "Failed to create skill" });
    }
  });

  app.put("/api/skills/:id", async (req, res) => {
    try {
      const skill = await storage.updateProfessionalSkill(req.params.id, req.body);
      if (!skill) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      console.error("Error updating skill:", error);
      res.status(500).json({ error: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalSkill(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });

  // Professional Experience
  app.get("/api/professionals/:id/experience", async (req, res) => {
    try {
      const experience = await storage.getProfessionalExperience(req.params.id);
      res.json(experience);
    } catch (error) {
      console.error("Error fetching experience:", error);
      res.status(500).json({ error: "Failed to fetch experience" });
    }
  });

  app.post("/api/professionals/:id/experience", async (req, res) => {
    try {
      const parsed = insertProfessionalExperienceSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const experience = await storage.createProfessionalExperience(parsed);
      res.status(201).json(experience);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating experience:", error);
      res.status(500).json({ error: "Failed to create experience" });
    }
  });

  app.put("/api/experience/:id", async (req, res) => {
    try {
      const experience = await storage.updateProfessionalExperience(req.params.id, req.body);
      if (!experience) {
        return res.status(404).json({ error: "Experience not found" });
      }
      res.json(experience);
    } catch (error) {
      console.error("Error updating experience:", error);
      res.status(500).json({ error: "Failed to update experience" });
    }
  });

  app.delete("/api/experience/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalExperience(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting experience:", error);
      res.status(500).json({ error: "Failed to delete experience" });
    }
  });

  // Professional Education
  app.get("/api/professionals/:id/education", async (req, res) => {
    try {
      const education = await storage.getProfessionalEducation(req.params.id);
      res.json(education);
    } catch (error) {
      console.error("Error fetching education:", error);
      res.status(500).json({ error: "Failed to fetch education" });
    }
  });

  app.post("/api/professionals/:id/education", async (req, res) => {
    try {
      const parsed = insertProfessionalEducationSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const education = await storage.createProfessionalEducation(parsed);
      res.status(201).json(education);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating education:", error);
      res.status(500).json({ error: "Failed to create education" });
    }
  });

  app.put("/api/education/:id", async (req, res) => {
    try {
      const education = await storage.updateProfessionalEducation(req.params.id, req.body);
      if (!education) {
        return res.status(404).json({ error: "Education not found" });
      }
      res.json(education);
    } catch (error) {
      console.error("Error updating education:", error);
      res.status(500).json({ error: "Failed to update education" });
    }
  });

  app.delete("/api/education/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalEducation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting education:", error);
      res.status(500).json({ error: "Failed to delete education" });
    }
  });

  // Professional Awards
  app.get("/api/professionals/:id/awards", async (req, res) => {
    try {
      const awards = await storage.getProfessionalAwards(req.params.id);
      res.json(awards);
    } catch (error) {
      console.error("Error fetching awards:", error);
      res.status(500).json({ error: "Failed to fetch awards" });
    }
  });

  app.post("/api/professionals/:id/awards", async (req, res) => {
    try {
      const parsed = insertProfessionalAwardSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const award = await storage.createProfessionalAward(parsed);
      res.status(201).json(award);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating award:", error);
      res.status(500).json({ error: "Failed to create award" });
    }
  });

  app.put("/api/awards/:id", async (req, res) => {
    try {
      const award = await storage.updateProfessionalAward(req.params.id, req.body);
      if (!award) {
        return res.status(404).json({ error: "Award not found" });
      }
      res.json(award);
    } catch (error) {
      console.error("Error updating award:", error);
      res.status(500).json({ error: "Failed to update award" });
    }
  });

  app.delete("/api/awards/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalAward(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting award:", error);
      res.status(500).json({ error: "Failed to delete award" });
    }
  });

  // Professional Training
  app.get("/api/professionals/:id/training", async (req, res) => {
    try {
      const training = await storage.getProfessionalTraining(req.params.id);
      res.json(training);
    } catch (error) {
      console.error("Error fetching training:", error);
      res.status(500).json({ error: "Failed to fetch training" });
    }
  });

  app.post("/api/professionals/:id/training", async (req, res) => {
    try {
      const parsed = insertProfessionalTrainingSchema.parse({
        ...req.body,
        professionalId: req.params.id,
      });
      const training = await storage.createProfessionalTraining(parsed);
      res.status(201).json(training);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating training:", error);
      res.status(500).json({ error: "Failed to create training" });
    }
  });

  app.put("/api/training/:id", async (req, res) => {
    try {
      const training = await storage.updateProfessionalTraining(req.params.id, req.body);
      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }
      res.json(training);
    } catch (error) {
      console.error("Error updating training:", error);
      res.status(500).json({ error: "Failed to update training" });
    }
  });

  app.delete("/api/training/:id", async (req, res) => {
    try {
      await storage.deleteProfessionalTraining(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training:", error);
      res.status(500).json({ error: "Failed to delete training" });
    }
  });

  // Role Specialties
  app.get("/api/role-specialties", async (req, res) => {
    try {
      const { role } = req.query;
      const roleSpecialties = await storage.getRoleSpecialties(
        typeof role === "string" ? role : undefined
      );
      res.json(roleSpecialties);
    } catch (error) {
      console.error("Error fetching role specialties:", error);
      res.status(500).json({ error: "Failed to fetch role specialties" });
    }
  });

  app.post("/api/role-specialties", async (req, res) => {
    try {
      const parsed = insertRoleSpecialtySchema.parse(req.body);
      const roleSpecialty = await storage.createRoleSpecialty(parsed);
      res.status(201).json(roleSpecialty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating role specialty:", error);
      res.status(500).json({ error: "Failed to create role specialty" });
    }
  });

  app.delete("/api/role-specialties/:id", async (req, res) => {
    try {
      await storage.deleteRoleSpecialty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role specialty:", error);
      res.status(500).json({ error: "Failed to delete role specialty" });
    }
  });

  // Platform Settings - Global fee and tax configuration
  app.get("/api/settings/platform", async (req, res) => {
    try {
      let settings = await storage.getPlatformSettings();
      if (!settings) {
        // Create default settings if none exist
        settings = await storage.createPlatformSettings({});
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      res.status(500).json({ error: "Failed to fetch platform settings" });
    }
  });

  app.patch("/api/settings/platform", async (req, res) => {
    try {
      let settings = await storage.getPlatformSettings();
      if (!settings) {
        settings = await storage.createPlatformSettings(req.body);
      } else {
        settings = await storage.updatePlatformSettings(settings.id, req.body);
      }
      res.json(settings);
    } catch (error) {
      console.error("Error updating platform settings:", error);
      res.status(500).json({ error: "Failed to update platform settings" });
    }
  });

  // State Tax Rates
  app.get("/api/settings/state-tax-rates", async (req, res) => {
    try {
      const rates = await storage.getStateTaxRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching state tax rates:", error);
      res.status(500).json({ error: "Failed to fetch state tax rates" });
    }
  });

  app.get("/api/settings/state-tax-rates/:stateCode", async (req, res) => {
    try {
      const rate = await storage.getStateTaxRate(req.params.stateCode);
      if (!rate) {
        return res.status(404).json({ error: "State tax rate not found" });
      }
      res.json(rate);
    } catch (error) {
      console.error("Error fetching state tax rate:", error);
      res.status(500).json({ error: "Failed to fetch state tax rate" });
    }
  });

  app.post("/api/settings/state-tax-rates", async (req, res) => {
    try {
      const rate = await storage.upsertStateTaxRate(req.body);
      res.status(201).json(rate);
    } catch (error) {
      console.error("Error creating/updating state tax rate:", error);
      res.status(500).json({ error: "Failed to create/update state tax rate" });
    }
  });

  app.patch("/api/settings/state-tax-rates/:stateCode", async (req, res) => {
    try {
      const rate = await storage.updateStateTaxRate(req.params.stateCode, req.body);
      if (!rate) {
        return res.status(404).json({ error: "State tax rate not found" });
      }
      res.json(rate);
    } catch (error) {
      console.error("Error updating state tax rate:", error);
      res.status(500).json({ error: "Failed to update state tax rate" });
    }
  });

  // Practices
  app.get("/api/practices", async (req, res) => {
    try {
      const practicesList = await storage.getPractices();
      res.json(practicesList);
    } catch (error) {
      console.error("Error fetching practices:", error);
      res.status(500).json({ error: "Failed to fetch practices" });
    }
  });

  // Public registration endpoint for practice self-registration (must come before :id route)
  app.post("/api/practices/register", async (req, res) => {
    try {
      // Validate request body using the registration schema
      const { practiceRegistrationSchema } = await import("@shared/schema");
      const parseResult = practiceRegistrationSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }
      
      const { ownerPassword, ...practiceData } = parseResult.data;
      
      // Create the practice
      const practice = await storage.createPractice({
        ...practiceData,
        registrationStatus: "pending",
        registrationSource: "self_registration",
      });
      
      // Hash the password and create the admin
      const { hashPassword } = await import("./services/auth");
      const passwordHash = await hashPassword(ownerPassword);
      
      await storage.createPracticeAdmin({
        practiceId: practice.id,
        firstName: practiceData.ownerFirstName,
        lastName: practiceData.ownerLastName,
        email: practiceData.ownerEmail,
        phone: practiceData.ownerPhone,
        passwordHash,
        role: "admin",
      });
      
      res.status(201).json(practice);
    } catch (error) {
      console.error("Error registering practice:", error);
      res.status(500).json({ error: "Failed to register practice" });
    }
  });

  app.get("/api/practices/:id", async (req, res) => {
    try {
      const practice = await storage.getPractice(req.params.id);
      if (!practice) {
        return res.status(404).json({ error: "Practice not found" });
      }
      res.json(practice);
    } catch (error) {
      console.error("Error fetching practice:", error);
      res.status(500).json({ error: "Failed to fetch practice" });
    }
  });

  app.post("/api/practices", async (req, res) => {
    try {
      const { adminFirstName, adminLastName, adminEmail, adminPhone, adminPassword, adminConfirmPassword, ...practiceData } = req.body;
      
      // Create the practice
      const practice = await storage.createPractice(practiceData);
      
      // If admin info is provided, create the practice admin
      if (adminEmail && adminFirstName && adminLastName) {
        let passwordHash = null;
        
        // Hash the password if provided
        if (adminPassword) {
          if (adminPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
          }
          if (adminPassword !== adminConfirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
          }
          const { hashPassword } = await import("./services/auth");
          passwordHash = await hashPassword(adminPassword);
        }
        
        await storage.createPracticeAdmin({
          practiceId: practice.id,
          firstName: adminFirstName,
          lastName: adminLastName,
          email: adminEmail.toLowerCase(), // Normalize email to lowercase
          phone: adminPhone || null,
          role: "admin",
          passwordHash,
        });
      }
      
      res.status(201).json(practice);
    } catch (error) {
      console.error("Error creating practice:", error);
      res.status(500).json({ error: "Failed to create practice" });
    }
  });

  // Get practice admins for a practice
  app.get("/api/practices/:id/admins", async (req, res) => {
    try {
      const admins = await storage.getPracticeAdmins(req.params.id);
      res.json(admins);
    } catch (error) {
      console.error("Error fetching practice admins:", error);
      res.status(500).json({ error: "Failed to fetch practice admins" });
    }
  });

  // Create a practice admin
  app.post("/api/practices/:id/admins", async (req, res) => {
    try {
      const admin = await storage.createPracticeAdmin({
        ...req.body,
        practiceId: req.params.id,
      });
      res.status(201).json(admin);
    } catch (error) {
      console.error("Error creating practice admin:", error);
      res.status(500).json({ error: "Failed to create practice admin" });
    }
  });

  app.patch("/api/practices/:id", async (req, res) => {
    try {
      const practice = await storage.updatePractice(req.params.id, req.body);
      if (!practice) {
        return res.status(404).json({ error: "Practice not found" });
      }
      res.json(practice);
    } catch (error) {
      console.error("Error updating practice:", error);
      res.status(500).json({ error: "Failed to update practice" });
    }
  });

  // Practice Profile - Get detailed practice profile info for mobile app
  app.get("/api/practices/:id/profile", async (req, res) => {
    try {
      const practice = await storage.getPractice(req.params.id);
      if (!practice) {
        return res.status(404).json({ error: "Practice not found" });
      }
      
      // Return profile-focused fields for hygienists/mobile app
      const profile = {
        id: practice.id,
        name: practice.name,
        address: practice.address,
        city: practice.city,
        stateCode: practice.stateCode,
        zipCode: practice.zipCode,
        phone: practice.phone,
        email: practice.email,
        website: practice.website,
        
        // Office description
        aboutOffice: practice.aboutOffice,
        parkingInfo: practice.parkingInfo,
        arrivalInstructions: practice.arrivalInstructions,
        dressCode: practice.dressCode,
        photos: practice.photos,
        
        // Team info
        numDentists: practice.numDentists,
        numHygienists: practice.numHygienists,
        numSupportStaff: practice.numSupportStaff,
        
        // Break room amenities
        breakRoomAvailable: practice.breakRoomAvailable,
        refrigeratorAvailable: practice.refrigeratorAvailable,
        microwaveAvailable: practice.microwaveAvailable,
        
        // Practice information
        practiceManagementSoftware: practice.practiceManagementSoftware,
        xraySoftware: practice.xraySoftware,
        hasOverheadLights: practice.hasOverheadLights,
        preferredScrubColor: practice.preferredScrubColor,
        clinicalAttireProvided: practice.clinicalAttireProvided,
        useAirPolishers: practice.useAirPolishers,
        scalerType: practice.scalerType,
        
        // Clinical procedures
        assistedHygieneSchedule: practice.assistedHygieneSchedule,
        rootPlaningProcedures: practice.rootPlaningProcedures,
        seeNewPatients: practice.seeNewPatients,
        administerLocalAnesthesia: practice.administerLocalAnesthesia,
        workWithNitrousPatients: practice.workWithNitrousPatients,
        
        // Appointment lengths
        appointmentLengthAdults: practice.appointmentLengthAdults,
        appointmentLengthKids: practice.appointmentLengthKids,
        appointmentLengthPerio: practice.appointmentLengthPerio,
        appointmentLengthScaling: practice.appointmentLengthScaling,
        
        // Rooms
        dentalTreatmentRooms: practice.dentalTreatmentRooms,
        dedicatedHygieneRooms: practice.dedicatedHygieneRooms,
        
        hiringPermanently: practice.hiringPermanently,
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching practice profile:", error);
      res.status(500).json({ error: "Failed to fetch practice profile" });
    }
  });

  // Update Practice Profile
  app.patch("/api/practices/:id/profile", async (req, res) => {
    try {
      const { z } = await import("zod");
      
      // Zod schema for practice profile updates
      const practiceProfileUpdateSchema = z.object({
        website: z.string().optional().nullable(),
        aboutOffice: z.string().optional().nullable(),
        parkingInfo: z.string().optional().nullable(),
        arrivalInstructions: z.string().optional().nullable(),
        dressCode: z.string().optional().nullable(),
        photos: z.array(z.string()).optional().nullable(),
        numDentists: z.number().int().min(0).optional().nullable(),
        numHygienists: z.number().int().min(0).optional().nullable(),
        numSupportStaff: z.number().int().min(0).optional().nullable(),
        breakRoomAvailable: z.boolean().optional().nullable(),
        refrigeratorAvailable: z.boolean().optional().nullable(),
        microwaveAvailable: z.boolean().optional().nullable(),
        practiceManagementSoftware: z.string().optional().nullable(),
        xraySoftware: z.string().optional().nullable(),
        hasOverheadLights: z.boolean().optional().nullable(),
        preferredScrubColor: z.string().optional().nullable(),
        clinicalAttireProvided: z.boolean().optional().nullable(),
        useAirPolishers: z.boolean().optional().nullable(),
        scalerType: z.string().optional().nullable(),
        assistedHygieneSchedule: z.boolean().optional().nullable(),
        rootPlaningProcedures: z.boolean().optional().nullable(),
        seeNewPatients: z.boolean().optional().nullable(),
        administerLocalAnesthesia: z.boolean().optional().nullable(),
        workWithNitrousPatients: z.boolean().optional().nullable(),
        appointmentLengthAdults: z.string().optional().nullable(),
        appointmentLengthKids: z.string().optional().nullable(),
        appointmentLengthPerio: z.string().optional().nullable(),
        appointmentLengthScaling: z.string().optional().nullable(),
        dentalTreatmentRooms: z.number().int().min(0).optional().nullable(),
        dedicatedHygieneRooms: z.number().int().min(0).optional().nullable(),
        hiringPermanently: z.boolean().optional().nullable(),
      }).strict();
      
      const parseResult = practiceProfileUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }
      
      // Filter out undefined values
      const updates: Record<string, any> = {};
      for (const [key, value] of Object.entries(parseResult.data)) {
        if (value !== undefined) {
          updates[key] = value;
        }
      }
      
      const practice = await storage.updatePractice(req.params.id, updates);
      if (!practice) {
        return res.status(404).json({ error: "Practice not found" });
      }
      res.json(practice);
    } catch (error) {
      console.error("Error updating practice profile:", error);
      res.status(500).json({ error: "Failed to update practice profile" });
    }
  });

  // Practice Settings
  app.get("/api/practices/:id/settings", async (req, res) => {
    try {
      const settings = await storage.getPracticeSettings(req.params.id);
      res.json(settings || { practiceId: req.params.id });
    } catch (error) {
      console.error("Error fetching practice settings:", error);
      res.status(500).json({ error: "Failed to fetch practice settings" });
    }
  });

  app.patch("/api/practices/:id/settings", async (req, res) => {
    try {
      let settings = await storage.getPracticeSettings(req.params.id);
      if (!settings) {
        settings = await storage.createPracticeSettings({
          practiceId: req.params.id,
          ...req.body,
        });
      } else {
        settings = await storage.updatePracticeSettings(req.params.id, req.body);
      }
      res.json(settings);
    } catch (error) {
      console.error("Error updating practice settings:", error);
      res.status(500).json({ error: "Failed to update practice settings" });
    }
  });

  // Resolved Fee Rates - Get effective rates with practice → platform fallback
  app.get("/api/fees/resolved", async (req, res) => {
    try {
      const { practiceId } = req.query;
      const rates = await storage.getResolvedFeeRates(
        typeof practiceId === "string" ? practiceId : undefined
      );
      res.json(rates);
    } catch (error) {
      console.error("Error resolving fee rates:", error);
      res.status(500).json({ error: "Failed to resolve fee rates" });
    }
  });

  // Staff Roles
  app.get("/api/staff-roles", async (req, res) => {
    try {
      const { staffRoles } = await import("@shared/schema");
      const { asc } = await import("drizzle-orm");
      const roles = await db
        .select()
        .from(staffRoles)
        .orderBy(asc(staffRoles.sortOrder));
      res.json(roles);
    } catch (error) {
      console.error("Error fetching staff roles:", error);
      res.status(500).json({ error: "Failed to fetch staff roles" });
    }
  });

  // Service Subscriptions
  app.get("/api/practices/:practiceId/service-subscriptions", async (req, res) => {
    try {
      const { serviceSubscriptions } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const subscriptions = await db
        .select()
        .from(serviceSubscriptions)
        .where(eq(serviceSubscriptions.practiceId, req.params.practiceId));
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching service subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch service subscriptions" });
    }
  });

  app.post("/api/practices/:practiceId/service-subscriptions", async (req, res) => {
    try {
      const { serviceSubscriptions, insertServiceSubscriptionSchema } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const parseResult = insertServiceSubscriptionSchema.safeParse({
        ...req.body,
        practiceId: req.params.practiceId,
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues });
      }
      
      // Check if subscription already exists for this service
      const existing = await db
        .select()
        .from(serviceSubscriptions)
        .where(and(
          eq(serviceSubscriptions.practiceId, req.params.practiceId),
          eq(serviceSubscriptions.service, parseResult.data.service)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing subscription
        const updated = await db
          .update(serviceSubscriptions)
          .set({
            ...parseResult.data,
            updatedAt: new Date(),
          })
          .where(eq(serviceSubscriptions.id, existing[0].id))
          .returning();
        return res.json(updated[0]);
      }
      
      // Create new subscription
      const inserted = await db
        .insert(serviceSubscriptions)
        .values({
          ...parseResult.data,
          subscribedAt: parseResult.data.status === "active" ? new Date() : null,
        })
        .returning();
      
      res.status(201).json(inserted[0]);
    } catch (error) {
      console.error("Error creating service subscription:", error);
      res.status(500).json({ error: "Failed to create service subscription" });
    }
  });

  app.patch("/api/practices/:practiceId/service-subscriptions/:id", async (req, res) => {
    try {
      const { serviceSubscriptions } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const updates: any = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      // Track subscription date changes
      if (req.body.status === "active" && !req.body.subscribedAt) {
        updates.subscribedAt = new Date();
        updates.cancelledAt = null;
      } else if (req.body.status === "inactive" && !req.body.cancelledAt) {
        updates.cancelledAt = new Date();
      }
      
      const updated = await db
        .update(serviceSubscriptions)
        .set(updates)
        .where(eq(serviceSubscriptions.id, req.params.id))
        .returning();
      
      if (updated.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating service subscription:", error);
      res.status(500).json({ error: "Failed to update service subscription" });
    }
  });

  // Practice Locations
  app.get("/api/practices/:practiceId/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations(req.params.practiceId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.post("/api/practices/:practiceId/locations", async (req, res) => {
    try {
      const { insertPracticeLocationSchema } = await import("@shared/schema");
      const parseResult = insertPracticeLocationSchema.safeParse({
        ...req.body,
        practiceId: req.params.practiceId,
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }
      
      const location = await storage.createLocation(parseResult.data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ error: "Failed to create location" });
    }
  });

  app.patch("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.updateLocation(req.params.id, req.body);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Location Profile - GET resolved profile (location data with practice defaults as fallback)
  app.get("/api/locations/:id/profile", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      
      // Get practice defaults for fallback
      const practice = await storage.getPractice(location.practiceId);
      
      // Build resolved profile: use location value if set, otherwise practice default
      const resolvedProfile = {
        locationId: location.id,
        locationName: location.name,
        address: location.address,
        city: location.city,
        stateCode: location.stateCode,
        zipCode: location.zipCode,
        phone: location.phone,
        email: location.email,
        aboutOffice: location.aboutOffice ?? practice?.aboutOffice ?? "",
        parkingInfo: location.parkingInfo ?? practice?.parkingInfo ?? "",
        arrivalInstructions: location.arrivalInstructions ?? practice?.arrivalInstructions ?? "",
        dressCode: location.dressCode ?? practice?.dressCode ?? "",
        photos: location.photos ?? practice?.photos ?? [],
        numDentists: location.numDentists ?? practice?.numDentists ?? 0,
        numHygienists: location.numHygienists ?? practice?.numHygienists ?? 0,
        numSupportStaff: location.numSupportStaff ?? practice?.numSupportStaff ?? 0,
        breakRoomAvailable: location.breakRoomAvailable ?? practice?.breakRoomAvailable ?? false,
        refrigeratorAvailable: location.refrigeratorAvailable ?? practice?.refrigeratorAvailable ?? false,
        microwaveAvailable: location.microwaveAvailable ?? practice?.microwaveAvailable ?? false,
        practiceManagementSoftware: location.practiceManagementSoftware ?? practice?.practiceManagementSoftware ?? "",
        xraySoftware: location.xraySoftware ?? practice?.xraySoftware ?? "",
        hasOverheadLights: location.hasOverheadLights ?? practice?.hasOverheadLights ?? false,
        preferredScrubColor: location.preferredScrubColor ?? practice?.preferredScrubColor ?? "",
        clinicalAttireProvided: location.clinicalAttireProvided ?? practice?.clinicalAttireProvided ?? false,
        useAirPolishers: location.useAirPolishers ?? practice?.useAirPolishers ?? false,
        scalerType: location.scalerType ?? practice?.scalerType ?? "",
        assistedHygieneSchedule: location.assistedHygieneSchedule ?? practice?.assistedHygieneSchedule ?? false,
        rootPlaningProcedures: location.rootPlaningProcedures ?? practice?.rootPlaningProcedures ?? false,
        seeNewPatients: location.seeNewPatients ?? practice?.seeNewPatients ?? false,
        administerLocalAnesthesia: location.administerLocalAnesthesia ?? practice?.administerLocalAnesthesia ?? false,
        workWithNitrousPatients: location.workWithNitrousPatients ?? practice?.workWithNitrousPatients ?? false,
        appointmentLengthAdults: location.appointmentLengthAdults ?? practice?.appointmentLengthAdults ?? "",
        appointmentLengthKids: location.appointmentLengthKids ?? practice?.appointmentLengthKids ?? "",
        appointmentLengthPerio: location.appointmentLengthPerio ?? practice?.appointmentLengthPerio ?? "",
        appointmentLengthScaling: location.appointmentLengthScaling ?? practice?.appointmentLengthScaling ?? "",
        dentalTreatmentRooms: location.dentalTreatmentRooms ?? practice?.dentalTreatmentRooms ?? 0,
        dedicatedHygieneRooms: location.dedicatedHygieneRooms ?? practice?.dedicatedHygieneRooms ?? 0,
        hiringPermanently: location.hiringPermanently ?? practice?.hiringPermanently ?? false,
      };
      
      res.json(resolvedProfile);
    } catch (error) {
      console.error("Error fetching location profile:", error);
      res.status(500).json({ error: "Failed to fetch location profile" });
    }
  });

  // Location Profile - PATCH to update profile fields
  const locationProfileSchema = z.object({
    aboutOffice: z.string().optional(),
    parkingInfo: z.string().optional(),
    arrivalInstructions: z.string().optional(),
    dressCode: z.string().optional(),
    photos: z.array(z.string()).optional(),
    numDentists: z.number().optional(),
    numHygienists: z.number().optional(),
    numSupportStaff: z.number().optional(),
    breakRoomAvailable: z.boolean().optional(),
    refrigeratorAvailable: z.boolean().optional(),
    microwaveAvailable: z.boolean().optional(),
    practiceManagementSoftware: z.string().optional(),
    xraySoftware: z.string().optional(),
    hasOverheadLights: z.boolean().optional(),
    preferredScrubColor: z.string().optional(),
    clinicalAttireProvided: z.boolean().optional(),
    useAirPolishers: z.boolean().optional(),
    scalerType: z.string().optional(),
    assistedHygieneSchedule: z.boolean().optional(),
    rootPlaningProcedures: z.boolean().optional(),
    seeNewPatients: z.boolean().optional(),
    administerLocalAnesthesia: z.boolean().optional(),
    workWithNitrousPatients: z.boolean().optional(),
    appointmentLengthAdults: z.string().optional(),
    appointmentLengthKids: z.string().optional(),
    appointmentLengthPerio: z.string().optional(),
    appointmentLengthScaling: z.string().optional(),
    dentalTreatmentRooms: z.number().optional(),
    dedicatedHygieneRooms: z.number().optional(),
    hiringPermanently: z.boolean().optional(),
  });

  app.patch("/api/locations/:id/profile", async (req, res) => {
    try {
      const parseResult = locationProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }
      
      const location = await storage.updateLocation(req.params.id, parseResult.data);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error updating location profile:", error);
      res.status(500).json({ error: "Failed to update location profile" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ error: "Failed to delete location" });
    }
  });

  // Shift Negotiations
  const createNegotiationSchema = z.object({
    shiftId: z.string().min(1, "Shift ID is required"),
    professionalId: z.string().min(1, "Professional ID is required"),
    currentRate: z.string().min(1, "Current rate is required"),
    proposedRate: z.string().min(1, "Proposed rate is required"),
    reason: z.string().optional(),
  });

  app.post("/api/negotiations", async (req, res) => {
    try {
      const parsed = createNegotiationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const negotiation = await storage.createNegotiation({
        shiftId: parsed.data.shiftId,
        professionalId: parsed.data.professionalId,
        currentRate: parsed.data.currentRate,
        proposedRate: parsed.data.proposedRate,
        reason: parsed.data.reason ?? null,
      });
      
      res.status(201).json(negotiation);
    } catch (error) {
      console.error("Error creating negotiation:", error);
      res.status(500).json({ error: "Failed to create negotiation" });
    }
  });

  app.get("/api/shifts/:id/negotiations", async (req, res) => {
    try {
      const negotiations = await storage.getNegotiationsForShift(req.params.id);
      res.json(negotiations);
    } catch (error) {
      console.error("Error fetching negotiations for shift:", error);
      res.status(500).json({ error: "Failed to fetch negotiations" });
    }
  });

  app.get("/api/professionals/:id/negotiations", async (req, res) => {
    try {
      const negotiations = await storage.getNegotiationsForProfessional(req.params.id);
      res.json(negotiations);
    } catch (error) {
      console.error("Error fetching negotiations for professional:", error);
      res.status(500).json({ error: "Failed to fetch negotiations" });
    }
  });

  const updateNegotiationSchema = z.object({
    status: z.enum(["pending", "accepted", "rejected", "expired"]).optional(),
    practiceResponse: z.string().optional(),
    respondedAt: z.date().optional(),
  });

  app.patch("/api/negotiations/:id", async (req, res) => {
    try {
      const parsed = updateNegotiationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const updates: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.status && (parsed.data.status === "accepted" || parsed.data.status === "rejected")) {
        updates.respondedAt = new Date();
      }

      const negotiation = await storage.updateNegotiation(req.params.id, updates);
      if (!negotiation) {
        return res.status(404).json({ error: "Negotiation not found" });
      }
      
      res.json(negotiation);
    } catch (error) {
      console.error("Error updating negotiation:", error);
      res.status(500).json({ error: "Failed to update negotiation" });
    }
  });

  // =====================================
  // DentalXchange Eligibility Verification
  // =====================================
  
  // Check eligibility for a patient
  const eligibilityRequestSchema = z.object({
    patientId: z.string().optional(),
    policyId: z.string().optional(),
    practiceId: z.string().optional(),
    locationId: z.string().optional(),
    
    // Provider info (required for real API calls)
    provider: z.object({
      type: z.enum(["1", "2"]), // 1 = Individual, 2 = Organization
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      organizationName: z.string().optional(),
      npi: z.string(),
      taxId: z.string(),
    }),
    
    // Payer info
    payer: z.object({
      name: z.string(),
      payerIdCode: z.string(),
    }),
    
    // Patient info
    patient: z.object({
      dateOfBirth: z.string(),
      memberId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      relationship: z.string().default("18"), // 18 = Self
    }),
    
    // Subscriber info (optional - defaults to patient if same)
    subscriber: z.object({
      dateOfBirth: z.string(),
      memberId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }).optional(),
    
    // Optional filters
    groupNumber: z.string().optional(),
    procedureCode: z.string().optional(),
    category: z.string().optional(),
  });

  app.post("/api/eligibility/check", async (req, res) => {
    try {
      const parsed = eligibilityRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const data = parsed.data;
      
      // Import the DentalXchange service
      const { dentalXchangeService, CommonDentalPayers } = await import("./services/dentalxchange");
      
      // Check if credentials are configured
      const username = process.env.DENTALXCHANGE_USERNAME;
      const password = process.env.DENTALXCHANGE_PASSWORD;
      const apiKey = process.env.DENTALXCHANGE_API_KEY;

      if (!username || !password) {
        // Return simulated response for testing when credentials not configured
        const simulatedVerification = await storage.createEligibilityVerification({
          patientId: data.patientId || null,
          policyId: data.policyId || null,
          practiceId: data.practiceId || null,
          locationId: data.locationId || null,
          payerIdCode: data.payer.payerIdCode,
          payerName: data.payer.name,
          providerNpi: data.provider.npi,
          providerName: data.provider.type === "1" 
            ? `${data.provider.firstName} ${data.provider.lastName}`
            : data.provider.organizationName || '',
          subscriberMemberId: data.subscriber?.memberId || data.patient.memberId,
          subscriberFirstName: data.subscriber?.firstName || data.patient.firstName,
          subscriberLastName: data.subscriber?.lastName || data.patient.lastName,
          subscriberDob: data.subscriber?.dateOfBirth || data.patient.dateOfBirth,
          patientFirstName: data.patient.firstName,
          patientLastName: data.patient.lastName,
          patientDob: data.patient.dateOfBirth,
          patientRelationship: data.patient.relationship,
          coverageStatus: "simulated",
          groupNumber: data.groupNumber || null,
          groupName: null,
          effectiveDateFrom: null,
          effectiveDateTo: null,
          planCoverageDescription: "Simulated response - DentalXchange credentials not configured",
          insuranceType: null,
          transactionId: `SIM-${Date.now()}`,
          responseCode: 0,
          responseDescription: "Simulated - Configure DENTALXCHANGE_USERNAME and DENTALXCHANGE_PASSWORD",
          responseMessages: ["This is a simulated response. Configure DentalXchange credentials to get real eligibility data."],
          rawResponse: null,
          status: "completed",
          errorMessage: null,
        });

        // Add simulated benefits
        const simulatedBenefits = [
          { verificationId: simulatedVerification.id, benefitType: "coInsurance", serviceType: "Preventive", network: "In-Network", percent: "0", message: "Simulated: 100% covered" },
          { verificationId: simulatedVerification.id, benefitType: "coInsurance", serviceType: "Basic", network: "In-Network", percent: "20", message: "Simulated: 80% covered" },
          { verificationId: simulatedVerification.id, benefitType: "coInsurance", serviceType: "Major", network: "In-Network", percent: "50", message: "Simulated: 50% covered" },
          { verificationId: simulatedVerification.id, benefitType: "deductible", serviceType: "Individual", network: "In-Network", amount: "50.00", remaining: "50.00" },
          { verificationId: simulatedVerification.id, benefitType: "maximum", serviceType: "Annual", network: "In-Network", amount: "1500.00", remaining: "1500.00" },
        ];

        await storage.createEligibilityBenefits(simulatedBenefits as any);

        return res.json({
          success: true,
          simulated: true,
          message: "DentalXchange credentials not configured. Returning simulated response.",
          verification: simulatedVerification,
        });
      }

      // Configure service with credentials
      dentalXchangeService.setCredentials({ username, password, apiKey });

      try {
        // Make real API call
        const eligibilityRequest = {
          provider: data.provider,
          payer: data.payer,
          patient: data.patient,
          subscriber: data.subscriber,
          groupNumber: data.groupNumber,
          procedureCode: data.procedureCode,
          category: data.category,
        };

        const response = await dentalXchangeService.checkEligibility(eligibilityRequest);

        // Determine coverage status
        const isActive = response.response.activeCoverage && response.response.activeCoverage.length > 0;
        
        // Store the verification
        const verification = await storage.createEligibilityVerification({
          patientId: data.patientId || null,
          policyId: data.policyId || null,
          practiceId: data.practiceId || null,
          locationId: data.locationId || null,
          payerIdCode: data.payer.payerIdCode,
          payerName: response.response.payer?.name || data.payer.name,
          providerNpi: data.provider.npi,
          providerName: data.provider.type === "1"
            ? `${data.provider.firstName} ${data.provider.lastName}`
            : data.provider.organizationName || '',
          subscriberMemberId: response.response.subscriber?.plan?.subscriberId || data.patient.memberId,
          subscriberFirstName: response.response.subscriber?.firstName,
          subscriberLastName: response.response.subscriber?.lastName,
          subscriberDob: response.response.subscriber?.dateOfBirth,
          patientFirstName: response.response.patient?.firstName,
          patientLastName: response.response.patient?.lastName,
          patientDob: response.response.patient?.dateOfBirth,
          patientRelationship: response.response.patient?.relationship,
          coverageStatus: isActive ? "active" : "inactive",
          groupNumber: response.response.patient?.plan?.groupNumber || data.groupNumber || null,
          groupName: response.response.patient?.plan?.groupName || null,
          effectiveDateFrom: response.response.patient?.plan?.effectiveDateFrom || null,
          effectiveDateTo: response.response.patient?.plan?.effectiveDateTo || null,
          planCoverageDescription: response.response.activeCoverage?.[0]?.planCoverageDescription || null,
          insuranceType: response.response.activeCoverage?.[0]?.insuranceType || null,
          transactionId: response.transactionId?.toString() || null,
          responseCode: response.status.code,
          responseDescription: response.status.description,
          responseMessages: response.messages || [],
          rawResponse: JSON.stringify(response),
          status: "completed",
          errorMessage: null,
        });

        // Store benefits breakdown
        const benefitsToStore: any[] = [];

        // Store co-insurance
        if (response.response.coInsurance) {
          for (const coIns of response.response.coInsurance) {
            benefitsToStore.push({
              verificationId: verification.id,
              benefitType: "coInsurance",
              serviceType: coIns.serviceType || null,
              procedureCode: coIns.code || null,
              network: coIns.network,
              coverageLevel: coIns.coverageLevel || null,
              percent: coIns.percent,
              authorizationRequired: coIns.authorizationRequired === "Yes",
              message: coIns.message || null,
            });
          }
        }

        // Store deductibles
        if (response.response.deductibles) {
          for (const ded of response.response.deductibles) {
            benefitsToStore.push({
              verificationId: verification.id,
              benefitType: "deductible",
              serviceType: ded.serviceType,
              network: ded.network,
              coverageLevel: ded.coverageLevel,
              amount: ded.amount,
              remaining: ded.remaining,
              timePeriod: ded.timePeriod || null,
            });
          }
        }

        // Store maximums
        if (response.response.maximums) {
          for (const max of response.response.maximums) {
            benefitsToStore.push({
              verificationId: verification.id,
              benefitType: "maximum",
              serviceType: max.serviceType,
              network: max.network,
              coverageLevel: max.coverageLevel,
              amount: max.amount,
              remaining: max.remaining,
              timePeriod: max.timePeriod || null,
            });
          }
        }

        // Store limitations
        if (response.response.limitations) {
          for (const lim of response.response.limitations) {
            benefitsToStore.push({
              verificationId: verification.id,
              benefitType: "limitation",
              serviceType: lim.serviceType || null,
              procedureCode: lim.code || null,
              network: "Both",
              quantity: lim.quantity,
              quantityQualifier: lim.quantityQualifier,
              timePeriod: lim.timePeriod || null,
              message: lim.message || null,
            });
          }
        }

        if (benefitsToStore.length > 0) {
          await storage.createEligibilityBenefits(benefitsToStore);
        }

        res.json({
          success: true,
          simulated: false,
          verification,
          benefits: benefitsToStore,
        });
      } catch (apiError: any) {
        // Store failed verification
        const failedVerification = await storage.createEligibilityVerification({
          patientId: data.patientId || null,
          policyId: data.policyId || null,
          practiceId: data.practiceId || null,
          locationId: data.locationId || null,
          payerIdCode: data.payer.payerIdCode,
          payerName: data.payer.name,
          providerNpi: data.provider.npi,
          providerName: data.provider.type === "1"
            ? `${data.provider.firstName} ${data.provider.lastName}`
            : data.provider.organizationName || '',
          subscriberMemberId: data.patient.memberId,
          subscriberFirstName: data.patient.firstName,
          subscriberLastName: data.patient.lastName,
          patientFirstName: data.patient.firstName,
          patientLastName: data.patient.lastName,
          patientDob: data.patient.dateOfBirth,
          patientRelationship: data.patient.relationship,
          coverageStatus: "unknown",
          status: "error",
          errorMessage: apiError.message || "API call failed",
        });

        res.status(500).json({
          success: false,
          error: apiError.message,
          verification: failedVerification,
        });
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      res.status(500).json({ error: "Failed to check eligibility" });
    }
  });

  // Get eligibility verification by ID
  app.get("/api/eligibility/verifications/:id", async (req, res) => {
    try {
      const result = await storage.getEligibilityVerificationWithBenefits(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Verification not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching verification:", error);
      res.status(500).json({ error: "Failed to fetch verification" });
    }
  });

  // Get eligibility history for a patient
  app.get("/api/patients/:id/eligibility", async (req, res) => {
    try {
      const verifications = await storage.getPatientEligibilityVerifications(req.params.id);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching patient eligibility:", error);
      res.status(500).json({ error: "Failed to fetch eligibility history" });
    }
  });

  // Get eligibility history for a policy
  app.get("/api/policies/:id/eligibility", async (req, res) => {
    try {
      const verifications = await storage.getPolicyEligibilityVerifications(req.params.id);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching policy eligibility:", error);
      res.status(500).json({ error: "Failed to fetch eligibility history" });
    }
  });

  // Get recent eligibility verifications
  app.get("/api/eligibility/verifications", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const verifications = await storage.getRecentEligibilityVerifications(limit);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  // Get supported payers
  app.get("/api/eligibility/payers", async (req, res) => {
    try {
      // First check database
      const dbPayers = await storage.getDentalxchangePayers();
      
      if (dbPayers.length > 0) {
        return res.json(dbPayers);
      }

      // Return common payers from service if none in DB
      const { CommonDentalPayers } = await import("./services/dentalxchange");
      res.json(CommonDentalPayers.map(p => ({
        payerIdCode: p.payerIdCode,
        name: p.name,
        eligibilitySupported: true,
        claimsSupported: true,
        isActive: true,
      })));
    } catch (error) {
      console.error("Error fetching payers:", error);
      res.status(500).json({ error: "Failed to fetch payers" });
    }
  });

  // Sync payers to database
  app.post("/api/eligibility/payers/sync", async (req, res) => {
    try {
      const { CommonDentalPayers } = await import("./services/dentalxchange");
      
      for (const payer of CommonDentalPayers) {
        await storage.upsertDentalxchangePayer({
          payerIdCode: payer.payerIdCode,
          name: payer.name,
          eligibilitySupported: true,
          claimsSupported: true,
          isActive: true,
        });
      }

      const payers = await storage.getDentalxchangePayers();
      res.json({ success: true, count: payers.length, payers });
    } catch (error) {
      console.error("Error syncing payers:", error);
      res.status(500).json({ error: "Failed to sync payers" });
    }
  });

  // Get service type codes reference
  app.get("/api/eligibility/service-types", async (_req, res) => {
    const { ServiceTypeCodes } = await import("./services/dentalxchange");
    res.json(ServiceTypeCodes);
  });

  // Get relationship codes reference
  app.get("/api/eligibility/relationship-codes", async (_req, res) => {
    const { RelationshipCodes } = await import("./services/dentalxchange");
    res.json(RelationshipCodes);
  });

  // ============================================
  // Automated Verification Routes
  // ============================================

  // Validation schemas for verification queue endpoints
  const queueVerificationSchema = z.object({
    patientId: z.number().int().positive(),
    policyId: z.number().int().positive().optional(),
    trigger: z.enum(["new_patient", "new_appointment", "policy_change", "scheduled", "manual"]).default("manual"),
    priority: z.number().int().min(1).max(10).default(5),
  });

  const runVerificationSchema = z.object({
    patientId: z.number().int().positive(),
    policyId: z.number().int().positive(),
    userId: z.number().int().positive().optional(),
  });

  const processQueueSchema = z.object({
    batchSize: z.number().int().min(1).max(50).default(10),
  });

  // Queue a verification for a patient's policies
  app.post("/api/verification/queue", async (req, res) => {
    try {
      const validation = queueVerificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request", details: validation.error.flatten() });
      }

      const { verificationAutomationService } = await import("./services/verification-automation");
      const { patientId, policyId, trigger, priority } = validation.data;

      if (policyId) {
        const queueId = await verificationAutomationService.queueVerification(
          patientId,
          policyId,
          trigger,
          priority
        );
        res.json({ success: true, queueId });
      } else {
        const queueIds = await verificationAutomationService.queuePatientVerifications(
          patientId,
          trigger,
          priority
        );
        res.json({ success: true, queueIds });
      }
    } catch (error) {
      console.error("Error queueing verification:", error);
      res.status(500).json({ error: "Failed to queue verification" });
    }
  });

  // Run immediate verification (manual real-time check)
  app.post("/api/verification/run", async (req, res) => {
    try {
      const validation = runVerificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request", details: validation.error.flatten() });
      }

      const { verificationAutomationService } = await import("./services/verification-automation");
      const { patientId, policyId, userId } = validation.data;

      const result = await verificationAutomationService.runImmediateVerification(
        patientId,
        policyId,
        userId
      );

      res.json(result);
    } catch (error) {
      console.error("Error running verification:", error);
      res.status(500).json({ error: "Failed to run verification" });
    }
  });

  // Get verification queue stats
  app.get("/api/verification/queue/stats", async (_req, res) => {
    try {
      const { verificationAutomationService } = await import("./services/verification-automation");
      const stats = await verificationAutomationService.getQueueStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching queue stats:", error);
      res.status(500).json({ error: "Failed to fetch queue stats" });
    }
  });

  // Process verification queue (trigger manual processing)
  app.post("/api/verification/queue/process", async (req, res) => {
    try {
      const validation = processQueueSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request", details: validation.error.flatten() });
      }

      const { verificationAutomationService } = await import("./services/verification-automation");
      const { batchSize } = validation.data;
      const processed = await verificationAutomationService.processQueue(batchSize);
      res.json({ success: true, processed });
    } catch (error) {
      console.error("Error processing queue:", error);
      res.status(500).json({ error: "Failed to process queue" });
    }
  });

  // Get medical payers list
  app.get("/api/eligibility/medical-payers", async (_req, res) => {
    try {
      const { availityService } = await import("./services/availity");
      const payers = await availityService.getMedicalPayers();
      res.json(payers);
    } catch (error) {
      console.error("Error fetching medical payers:", error);
      res.status(500).json({ error: "Failed to fetch medical payers" });
    }
  });

  // Sync medical payers to database
  app.post("/api/eligibility/medical-payers/sync", async (_req, res) => {
    try {
      const { availityService } = await import("./services/availity");
      const count = await availityService.syncMedicalPayersToDatabase();
      res.json({ success: true, synced: count });
    } catch (error) {
      console.error("Error syncing medical payers:", error);
      res.status(500).json({ error: "Failed to sync medical payers" });
    }
  });

  // Check medical insurance eligibility
  app.post("/api/eligibility/medical/check", async (req, res) => {
    try {
      const { availityService } = await import("./services/availity");
      const response = await availityService.checkEligibility(req.body);
      res.json(response);
    } catch (error) {
      console.error("Error checking medical eligibility:", error);
      res.status(500).json({ error: "Failed to check medical eligibility" });
    }
  });

  // Get carriers by type (dental or medical)
  app.get("/api/carriers/:type", async (req, res) => {
    try {
      const { type } = req.params;
      if (type !== "dental" && type !== "medical") {
        return res.status(400).json({ error: "Invalid carrier type" });
      }
      const carriers = await storage.getCarriersByType(type);
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ error: "Failed to fetch carriers" });
    }
  });

  // ========================================
  // Messaging Center API
  // ========================================

  // Get all conversations for practice admin
  app.get("/api/messaging/conversations", async (req, res) => {
    try {
      // For now, use a fixed practice admin ID (in production, use session)
      const practiceAdminId = "practice-admin-1";
      const conversations = await storage.getConversations(practiceAdminId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get or create a conversation with a professional
  app.post("/api/messaging/conversations", async (req, res) => {
    try {
      const { professionalId } = req.body;
      if (!professionalId) {
        return res.status(400).json({ error: "Professional ID is required" });
      }
      const practiceAdminId = "practice-admin-1";
      const conversation = await storage.getOrCreateConversation(practiceAdminId, professionalId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/messaging/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getMessages(id, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/messaging/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const { content, senderType } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const senderId = senderType === "professional" 
        ? req.body.senderId 
        : "practice-admin-1";

      const message = await storage.createMessage({
        conversationId: id,
        senderId,
        senderType: senderType || "practice_admin",
        content,
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.post("/api/messaging/conversations/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = "practice-admin-1"; // In production, get from session
      await storage.markMessagesAsRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // Get all hygienists with online status
  app.get("/api/messaging/hygienists", async (req, res) => {
    try {
      const hygienists = await storage.getOnlineHygienists();
      res.json(hygienists);
    } catch (error) {
      console.error("Error fetching hygienists:", error);
      res.status(500).json({ error: "Failed to fetch hygienists" });
    }
  });

  // Get all practice contacts for professionals to message
  app.get("/api/messaging/practices", async (req, res) => {
    try {
      const practices = await storage.getPracticeContacts();
      res.json(practices);
    } catch (error) {
      console.error("Error fetching practice contacts:", error);
      res.status(500).json({ error: "Failed to fetch practice contacts" });
    }
  });

  // Get conversations for a professional
  app.get("/api/messaging/professional/conversations", async (req, res) => {
    try {
      // For now, use a fixed professional ID (in production, get from session)
      const professionalId = req.query.professionalId as string || "professional-1";
      const conversations = await storage.getConversationsForProfessional(professionalId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching professional conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create a conversation from professional to practice
  app.post("/api/messaging/professional/conversations", async (req, res) => {
    try {
      const { practiceAdminId, professionalId } = req.body;
      if (!practiceAdminId) {
        return res.status(400).json({ error: "Practice admin ID is required" });
      }
      const profId = professionalId || "professional-1";
      const conversation = await storage.getOrCreateConversationFromProfessional(profId, practiceAdminId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Update user online status (heartbeat)
  app.post("/api/messaging/status", async (req, res) => {
    try {
      const { userId, userType, isOnline } = req.body;
      if (!userId || !userType) {
        return res.status(400).json({ error: "User ID and type are required" });
      }
      const status = await storage.updateUserOnlineStatus(userId, userType, isOnline ?? true);
      res.json(status);
    } catch (error) {
      console.error("Error updating online status:", error);
      res.status(500).json({ error: "Failed to update online status" });
    }
  });

  // ========================================
  // Shift Invitations API
  // ========================================

  // Send shift invitation messages to selected professionals
  app.post("/api/shifts/invite", async (req, res) => {
    try {
      // Validate request body
      const inviteSchema = z.object({
        shiftId: z.string().min(1, "Shift ID is required"),
        professionalIds: z.array(z.string()).min(1, "At least one professional ID is required"),
      });
      
      const parseResult = inviteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parseResult.error.errors 
        });
      }
      
      const { shiftId, professionalIds } = parseResult.data;

      // Get shift details
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Verify shift is open for bidding
      if (shift.status !== "open") {
        return res.status(400).json({ error: "Only open shifts can receive bid invitations" });
      }

      // In production, get practiceAdminId from session/auth context
      // For now, using a fixed ID for demo purposes
      const practiceAdminId = "practice-admin-1";
      let invitesSent = 0;

      // Format shift date
      const shiftDate = new Date(shift.date + "T00:00:00");
      const formattedDate = shiftDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Format rate info
      let rateInfo = "";
      if (shift.pricingMode === "fixed" && shift.fixedHourlyRate) {
        rateInfo = `$${parseFloat(shift.fixedHourlyRate).toFixed(2)}/hr`;
      } else if (shift.pricingMode === "smart" && shift.minHourlyRate && shift.maxHourlyRate) {
        rateInfo = `$${parseFloat(shift.minHourlyRate).toFixed(2)} - $${parseFloat(shift.maxHourlyRate).toFixed(2)}/hr`;
      }

      // Create invitation message
      const invitationMessage = `You're invited to bid on a ${shift.role} shift!\n\n` +
        `Date: ${formattedDate}\n` +
        `Time: ${shift.arrivalTime} - ${shift.endTime}\n` +
        (rateInfo ? `Rate: ${rateInfo}\n` : "") +
        (shift.specialties && shift.specialties.length > 0 
          ? `Specialties needed: ${shift.specialties.join(", ")}\n` 
          : "") +
        `\nPlease respond if you're interested in this opportunity!`;

      // Verify professionals exist and send invitations
      for (const professionalId of professionalIds) {
        try {
          // Verify professional exists
          const professional = await storage.getProfessional(professionalId);
          if (!professional) {
            console.warn(`Professional ${professionalId} not found, skipping`);
            continue;
          }
          
          // Get or create conversation with the professional
          const conversation = await storage.getOrCreateConversation(practiceAdminId, professionalId);
          
          // Send the invitation message
          await storage.createMessage({
            conversationId: conversation.id,
            senderId: practiceAdminId,
            senderType: "practice_admin",
            content: invitationMessage,
          });
          
          invitesSent++;
        } catch (error) {
          console.error(`Error sending invitation to professional ${professionalId}:`, error);
        }
      }
      
      if (invitesSent === 0) {
        return res.status(400).json({ error: "No valid professionals found to invite" });
      }

      res.json({ 
        success: true, 
        invitesSent,
        message: `Sent ${invitesSent} invitation${invitesSent !== 1 ? "s" : ""}`
      });
    } catch (error) {
      console.error("Error sending shift invitations:", error);
      res.status(500).json({ error: "Failed to send shift invitations" });
    }
  });

  // ============================================================
  // Dentrix Ascend Integration API
  // ============================================================

  // Get Dentrix Ascend configuration (practice-level)
  app.get("/api/dentrix/config", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const practiceId = req.query.practiceId as string | undefined;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      const config = await service.loadConfig(practiceId);
      
      if (!config) {
        return res.json({ configured: false });
      }
      
      res.json({
        configured: true,
        isEnabled: config.isEnabled,
        autoSyncEnabled: config.autoSyncEnabled,
        syncIntervalMinutes: config.syncIntervalMinutes,
        lastSyncAt: config.lastSyncAt,
        lastSyncStatus: config.lastSyncStatus,
        lastSyncError: config.lastSyncError,
        hasCredentials: !!(config.clientId && config.clientSecret && config.apiKey),
        clientId: config.clientId ? config.clientId.slice(0, 4) + "****" : "",
        hasClientSecret: !!config.clientSecret,
        hasApiKey: !!config.apiKey,
      });
    } catch (error) {
      console.error("Error fetching Dentrix config:", error);
      res.status(500).json({ error: "Failed to fetch Dentrix configuration" });
    }
  });

  // Save Dentrix Ascend configuration (practice-level)
  app.post("/api/dentrix/config", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { clientId, clientSecret, apiKey, baseUrl, isEnabled, autoSyncEnabled, syncIntervalMinutes, practiceId } = req.body;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      const updateData: Record<string, any> = {
        isEnabled,
        autoSyncEnabled,
        syncIntervalMinutes,
      };
      
      if (clientId && clientId.trim()) updateData.clientId = clientId;
      if (clientSecret && clientSecret.trim()) updateData.clientSecret = clientSecret;
      if (apiKey && apiKey.trim()) updateData.apiKey = apiKey;
      if (baseUrl && baseUrl.trim()) updateData.baseUrl = baseUrl;
      
      const config = await service.saveConfig(updateData, practiceId);
      
      res.json({
        success: true,
        isEnabled: config.isEnabled,
        hasCredentials: !!(config.clientId && config.clientSecret && config.apiKey),
      });
    } catch (error) {
      console.error("Error saving Dentrix config:", error);
      res.status(500).json({ error: "Failed to save Dentrix configuration" });
    }
  });

  // Test Dentrix Ascend connection (practice-level)
  app.post("/api/dentrix/test-connection", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { practiceId } = req.body;
      
      if (!practiceId) {
        return res.status(400).json({ success: false, message: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      await service.loadConfig(practiceId);
      const result = await service.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Error testing Dentrix connection:", error);
      res.status(500).json({ success: false, message: "Connection test failed" });
    }
  });

  // Start bulk patient sync (practice-level)
  app.post("/api/dentrix/sync/patients", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { syncType = "full", practiceId } = req.body;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      await service.loadConfig(practiceId);
      const syncLogId = await service.syncAllPatients(syncType);
      
      res.json({
        success: true,
        syncLogId,
        message: "Sync started successfully",
      });
    } catch (error) {
      console.error("Error starting Dentrix sync:", error);
      const message = error instanceof Error ? error.message : "Failed to start sync";
      res.status(500).json({ error: message });
    }
  });

  // Sync single patient (practice-level)
  app.post("/api/dentrix/sync/patient/:dentrixPatientId", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { dentrixPatientId } = req.params;
      const { practiceId } = req.body;
      
      if (!practiceId) {
        return res.status(400).json({ success: false, message: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      await service.loadConfig(practiceId);
      const result = await service.syncSinglePatient(dentrixPatientId);
      res.json(result);
    } catch (error) {
      console.error("Error syncing single patient:", error);
      res.status(500).json({ success: false, message: "Failed to sync patient" });
    }
  });

  // Get sync status (practice-level)
  app.get("/api/dentrix/sync/:syncLogId", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { syncLogId } = req.params;
      const practiceId = req.query.practiceId as string | undefined;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      await service.loadConfig(practiceId);
      const status = await service.getSyncStatus(syncLogId);
      
      if (!status) {
        return res.status(404).json({ error: "Sync log not found" });
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ error: "Failed to fetch sync status" });
    }
  });

  // Get recent sync logs (practice-level)
  app.get("/api/dentrix/sync-history", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const practiceId = req.query.practiceId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      await service.loadConfig(practiceId);
      const logs = await service.getRecentSyncLogs(limit, practiceId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync history:", error);
      res.status(500).json({ error: "Failed to fetch sync history" });
    }
  });

  // Get patient mapping by Dentrix ID (practice-level)
  app.get("/api/dentrix/mapping/:dentrixPatientId", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { dentrixPatientId } = req.params;
      const practiceId = req.query.practiceId as string | undefined;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      await service.loadConfig(practiceId);
      const mapping = await service.getPatientMapping(dentrixPatientId);
      
      if (!mapping) {
        return res.status(404).json({ error: "Mapping not found" });
      }
      
      res.json(mapping);
    } catch (error) {
      console.error("Error fetching patient mapping:", error);
      res.status(500).json({ error: "Failed to fetch patient mapping" });
    }
  });

  // Generate simulated patients (for testing without live Dentrix connection)
  // Note: This just generates mock data, no practiceId needed - using static method
  app.get("/api/dentrix/simulated-patients", async (req, res) => {
    try {
      const { DentrixAscendService } = await import("./services/dentrix-ascend");
      const count = parseInt(req.query.count as string) || 10;
      
      const service = new DentrixAscendService();
      const patients = service.generateSimulatedPatients(count);
      res.json(patients);
    } catch (error) {
      console.error("Error generating simulated patients:", error);
      res.status(500).json({ error: "Failed to generate simulated patients" });
    }
  });

  // Import simulated patients (for testing) - practice-level
  app.post("/api/dentrix/import-simulated", async (req, res) => {
    try {
      const { createDentrixService } = await import("./services/dentrix-ascend");
      const { count = 5, practiceId } = req.body;
      
      if (!practiceId) {
        return res.status(400).json({ error: "practiceId is required for practice-level integration" });
      }
      
      const service = createDentrixService(practiceId);
      const simulatedPatients = service.generateSimulatedPatients(count);
      
      let created = 0;
      let updated = 0;
      
      // Use service's importSimulatedPatients method which handles DB operations
      for (const simPatient of simulatedPatients) {
        const result = await service.importSimulatedPatient(simPatient);
        if (result.action === "created") created++;
        if (result.action === "updated") updated++;
      }
      
      res.json({
        success: true,
        patientsCreated: created,
        patientsUpdated: updated,
        message: `Imported ${created} new patients, updated ${updated} existing patients from simulated Dentrix data`,
      });
    } catch (error) {
      console.error("Error importing simulated patients:", error);
      res.status(500).json({ error: "Failed to import simulated patients" });
    }
  });

  // ============================================================
  // Production Seed Endpoint (One-time setup)
  // ============================================================
  
  app.post("/api/seed/production", async (req, res) => {
    try {
      const { seedSecret } = req.body;
      const expectedSecret = process.env.SEED_SECRET;
      
      // Require a secret to prevent unauthorized seeding
      if (!expectedSecret) {
        return res.status(403).json({ 
          error: "SEED_SECRET environment variable not configured. Set it in your secrets to enable seeding." 
        });
      }
      
      if (seedSecret !== expectedSecret) {
        return res.status(401).json({ error: "Invalid seed secret" });
      }
      
      const results: string[] = [];
      const { hashPassword } = await import("./services/auth");
      
      // ============== SUPER ADMIN SEEDING ==============
      // Platform-level super admin with hardcoded credentials
      const superAdminEmail = "superadmin@etherai.com";
      const superAdminPassword = "EtherAI@2024!"; // Strong default password
      
      const existingSuperAdmin = await storage.getPracticeAdminByEmail(superAdminEmail);
      if (existingSuperAdmin) {
        // Update to ensure it's a super admin
        if (!existingSuperAdmin.isSuperAdmin) {
          await db.update(practiceAdmins)
            .set({ isSuperAdmin: true })
            .where(eq(practiceAdmins.id, existingSuperAdmin.id));
          results.push(`Updated super admin: ${superAdminEmail} (now has super admin privileges)`);
        } else {
          results.push(`Super admin already exists: ${superAdminEmail}`);
        }
      } else {
        // Need a practice for the super admin - create Platform practice if doesn't exist
        let platformPractice = await storage.getPracticeByName("EtherAI Platform");
        
        if (!platformPractice) {
          platformPractice = await storage.createPractice({
            name: "EtherAI Platform",
            email: "platform@etherai.com",
            phone: "(555) 000-0000",
            address: "Platform Administration",
            city: "San Francisco",
            stateCode: "CA",
            zipCode: "94102",
            registrationStatus: "approved",
          });
          results.push("Created EtherAI Platform practice for super admins");
        }
        
        const superAdminPasswordHash = await hashPassword(superAdminPassword);
        await storage.createPracticeAdmin({
          practiceId: platformPractice.id,
          firstName: "Super",
          lastName: "Admin",
          email: superAdminEmail,
          phone: null,
          role: "admin",
          passwordHash: superAdminPasswordHash,
          isSuperAdmin: true,
        });
        results.push(`Created super admin: ${superAdminEmail}`);
      }
      
      // ============== TEST ADMIN SEEDING ==============
      // Check if admin already exists
      const existingAdmin = await storage.getPracticeAdminByEmail("admin@test.com");
      if (existingAdmin) {
        results.push("Test admin already exists (admin@test.com)");
      } else {
        // Create a test practice
        const existingPractices = await storage.getPractices();
        // Filter out the platform practice
        const regularPractices = existingPractices.filter(p => p.name !== "EtherAI Platform");
        let practiceId: string;
        
        if (regularPractices.length > 0) {
          practiceId = regularPractices[0].id;
          results.push(`Using existing practice: ${regularPractices[0].name}`);
        } else {
          const newPractice = await storage.createPractice({
            name: "Demo Dental Practice",
            email: "demo@demopractice.com",
            phone: "(555) 123-4567",
            address: "123 Main Street",
            city: "San Francisco",
            stateCode: "CA",
            zipCode: "94102",
            registrationStatus: "approved",
          });
          practiceId = newPractice.id;
          results.push(`Created practice: Demo Dental Practice`);
        }
        
        // Create test admin with password
        const passwordHash = await hashPassword("admin123");
        
        await storage.createPracticeAdmin({
          practiceId,
          firstName: "Test",
          lastName: "Admin",
          email: "admin@test.com",
          phone: "(555) 987-6543",
          role: "admin",
          passwordHash,
        });
        results.push("Created test admin: admin@test.com / admin123");
      }
      
      // Create a sample patient if none exist
      const existingPatients = await storage.getPatients();
      if (existingPatients.length === 0) {
        await storage.createPatient({
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "(555) 111-2222",
          dateOfBirth: "1985-03-15",
          address: "456 Oak Avenue",
          city: "San Francisco",
          state: "CA",
          zipCode: "94103",
        });
        results.push("Created sample patient: John Doe");
      } else {
        results.push(`${existingPatients.length} patients already exist`);
      }
      
      res.json({
        success: true,
        message: "Production seed completed",
        results,
        credentials: {
          superAdmin: {
            email: superAdminEmail,
            password: superAdminPassword,
            note: "Platform-level super admin - has access to all practices"
          },
          testAdmin: {
            email: "admin@test.com",
            password: "admin123",
            note: "Test admin for demo practice"
          }
        }
      });
    } catch (error) {
      console.error("Error seeding production:", error);
      res.status(500).json({ error: "Failed to seed production data" });
    }
  });

  return httpServer;
}
