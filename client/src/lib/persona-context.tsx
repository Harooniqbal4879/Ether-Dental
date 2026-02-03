import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
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
  
  // Compute default persona based on current user
  const defaultPersona = useMemo(() => {
    if (isProfessionalAuthenticated) {
      return "professional" as Persona;
    }
    if (admin) {
      return getDefaultPersonaForRole(admin.role, admin.isSuperAdmin);
    }
    return "front_desk" as Persona;
  }, [admin, isProfessionalAuthenticated]);
  
  // Determine allowed personas based on user type
  const allowedPersonaIds = useMemo(() => {
    if (isProfessionalAuthenticated) {
      return ["professional" as Persona];
    }
    return getAllowedPersonasForRole(admin?.role, admin?.isSuperAdmin);
  }, [admin, isProfessionalAuthenticated]);
  
  const allowedPersonas = personas.filter(p => allowedPersonaIds.includes(p.id));
  
  // Track manually selected persona (only used when user switches personas)
  const [manualPersona, setManualPersona] = useState<Persona | null>(null);
  
  // The actual current persona: use manual selection if valid, otherwise use default
  const currentPersona = useMemo(() => {
    if (manualPersona && allowedPersonaIds.includes(manualPersona)) {
      return manualPersona;
    }
    return defaultPersona;
  }, [manualPersona, allowedPersonaIds, defaultPersona]);
  
  // Reset manual persona when user changes
  useEffect(() => {
    setManualPersona(null);
  }, [admin?.id, professional?.id]);

  const personaInfo = personas.find(p => p.id === currentPersona) || personas[2];
  
  const setCurrentPersona = (persona: Persona) => {
    if (allowedPersonaIds.includes(persona)) {
      setManualPersona(persona);
    }
  };
  
  return (
    <PersonaContext.Provider 
      value={{ 
        currentPersona, 
        setCurrentPersona, 
        personaInfo,
        allowedPersonas
      }}
    >
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
