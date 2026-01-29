import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth-context";

export type Persona = 
  | "system_admin"
  | "admin"
  | "front_desk"
  | "treatment_coordinator"
  | "billing_manager"
  | "patient"
  | "professional";

export interface PersonaInfo {
  id: Persona;
  title: string;
  description: string;
  initials: string;
}

export const personas: PersonaInfo[] = [
  {
    id: "system_admin",
    title: "System Administrator",
    description: "System-wide access & AI config",
    initials: "SA",
  },
  {
    id: "admin",
    title: "Practice Administrator",
    description: "Full practice access",
    initials: "PA",
  },
  {
    id: "front_desk",
    title: "Front Desk Staff",
    description: "Patient management & verifications",
    initials: "FD",
  },
  {
    id: "treatment_coordinator",
    title: "Treatment Coordinator",
    description: "Benefits & treatment planning",
    initials: "TC",
  },
  {
    id: "billing_manager",
    title: "Billing Manager",
    description: "Verification data & reports",
    initials: "BM",
  },
  {
    id: "patient",
    title: "Patient",
    description: "View bills & make payments",
    initials: "PT",
  },
  {
    id: "professional",
    title: "Professional",
    description: "Manage profile & view shifts",
    initials: "PR",
  },
];

interface PersonaContextType {
  currentPersona: Persona;
  setCurrentPersona: (persona: Persona) => void;
  personaInfo: PersonaInfo;
  allowedPersonas: PersonaInfo[];
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const PERSONA_STORAGE_KEY = "etherAI_persona";

function getDefaultPersonaForRole(role?: string, isSuperAdmin?: boolean): Persona {
  if (isSuperAdmin) return "system_admin";
  
  switch (role) {
    case "admin":
      return "admin";
    case "staff":
      return "front_desk";
    case "billing":
      return "billing_manager";
    default:
      return "front_desk";
  }
}

function getAllowedPersonasForRole(role?: string, isSuperAdmin?: boolean): Persona[] {
  if (isSuperAdmin) {
    return ["system_admin", "admin", "front_desk", "treatment_coordinator", "billing_manager"];
  }
  
  switch (role) {
    case "admin":
      return ["admin", "front_desk", "treatment_coordinator", "billing_manager"];
    case "staff":
      return ["front_desk", "treatment_coordinator"];
    case "billing":
      return ["billing_manager"];
    default:
      return ["front_desk"];
  }
}

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { admin, isProfessionalAuthenticated, professional } = useAuth();
  const [currentPersona, setCurrentPersonaState] = useState<Persona>("front_desk");
  const [lastAdminId, setLastAdminId] = useState<string | null>(null);
  const [lastProfessionalId, setLastProfessionalId] = useState<string | null>(null);
  
  // Determine allowed personas based on user type
  const allowedPersonaIds = isProfessionalAuthenticated 
    ? ["professional" as Persona]
    : getAllowedPersonasForRole(admin?.role, admin?.isSuperAdmin);
  const allowedPersonas = personas.filter(p => allowedPersonaIds.includes(p.id));
  
  // Handle professional login
  useEffect(() => {
    if (isProfessionalAuthenticated && professional && professional.id !== lastProfessionalId) {
      setCurrentPersonaState("professional");
      setLastProfessionalId(professional.id);
      setLastAdminId(null);
      try {
        localStorage.setItem(PERSONA_STORAGE_KEY, "professional");
      } catch (e) {
        // localStorage not available
      }
    } else if (!isProfessionalAuthenticated && lastProfessionalId) {
      // Professional logged out
      setLastProfessionalId(null);
    }
  }, [isProfessionalAuthenticated, professional, lastProfessionalId]);
  
  // Reset persona when admin user changes (different admin ID or logout/login)
  useEffect(() => {
    if (!isProfessionalAuthenticated && admin && admin.id !== lastAdminId) {
      const defaultPersona = getDefaultPersonaForRole(admin.role, admin.isSuperAdmin);
      setCurrentPersonaState(defaultPersona);
      setLastAdminId(admin.id);
      try {
        localStorage.setItem(PERSONA_STORAGE_KEY, defaultPersona);
      } catch (e) {
        // localStorage not available
      }
    } else if (!admin && !isProfessionalAuthenticated && lastAdminId) {
      // User logged out
      setLastAdminId(null);
      setCurrentPersonaState("front_desk");
    }
  }, [admin, lastAdminId, isProfessionalAuthenticated]);

  // Ensure current persona is always allowed for the current user
  useEffect(() => {
    if ((admin || isProfessionalAuthenticated) && !allowedPersonaIds.includes(currentPersona)) {
      if (isProfessionalAuthenticated) {
        setCurrentPersonaState("professional");
      } else if (admin) {
        const defaultPersona = getDefaultPersonaForRole(admin.role, admin.isSuperAdmin);
        setCurrentPersonaState(defaultPersona);
      }
      try {
        localStorage.setItem(PERSONA_STORAGE_KEY, currentPersona);
      } catch (e) {
        // localStorage not available
      }
    }
  }, [admin, isProfessionalAuthenticated, currentPersona, allowedPersonaIds]);
  
  const setCurrentPersona = (persona: Persona) => {
    if (allowedPersonaIds.includes(persona)) {
      setCurrentPersonaState(persona);
      try {
        localStorage.setItem(PERSONA_STORAGE_KEY, persona);
      } catch (e) {
        // localStorage not available
      }
    }
  };
  
  const personaInfo = personas.find((p) => p.id === currentPersona) || personas[2];

  return (
    <PersonaContext.Provider value={{ currentPersona, setCurrentPersona, personaInfo, allowedPersonas }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}
