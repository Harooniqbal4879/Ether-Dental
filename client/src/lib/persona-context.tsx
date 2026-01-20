import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const PERSONA_STORAGE_KEY = "etherAI_persona";

function getStoredPersona(): Persona {
  try {
    const stored = localStorage.getItem(PERSONA_STORAGE_KEY);
    if (stored && personas.some(p => p.id === stored)) {
      return stored as Persona;
    }
  } catch (e) {
    // localStorage not available
  }
  return "admin";
}

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [currentPersona, setCurrentPersonaState] = useState<Persona>(getStoredPersona);
  
  const setCurrentPersona = (persona: Persona) => {
    setCurrentPersonaState(persona);
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, persona);
    } catch (e) {
      // localStorage not available
    }
  };
  
  const personaInfo = personas.find((p) => p.id === currentPersona) || personas[0];

  return (
    <PersonaContext.Provider value={{ currentPersona, setCurrentPersona, personaInfo }}>
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
