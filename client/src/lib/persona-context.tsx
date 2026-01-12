import { createContext, useContext, useState, ReactNode } from "react";

export type Persona = 
  | "system_admin"
  | "admin"
  | "front_desk"
  | "treatment_coordinator"
  | "billing_manager";

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
];

interface PersonaContextType {
  currentPersona: Persona;
  setCurrentPersona: (persona: Persona) => void;
  personaInfo: PersonaInfo;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [currentPersona, setCurrentPersona] = useState<Persona>("admin");
  
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
