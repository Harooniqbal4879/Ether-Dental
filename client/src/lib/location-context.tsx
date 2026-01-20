import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PracticeLocation } from "@shared/schema";

interface LocationContextType {
  currentLocationId: string | null;
  currentPracticeId: string | null;
  setCurrentLocationId: (locationId: string | null) => void;
  currentLocation: PracticeLocation | null;
  locations: PracticeLocation[];
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = "etherAI_location";
const PRACTICE_ID = "practice-1";

function getStoredLocationId(): string | null {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocationId, setCurrentLocationIdState] = useState<string | null>(getStoredLocationId);

  const { data: locations = [], isLoading } = useQuery<PracticeLocation[]>({
    queryKey: ["/api/practices", PRACTICE_ID, "locations"],
    queryFn: async () => {
      const response = await fetch(`/api/practices/${PRACTICE_ID}/locations`);
      if (!response.ok) throw new Error("Failed to fetch locations");
      return response.json();
    },
  });

  useEffect(() => {
    if (!isLoading && locations.length > 0 && !currentLocationId) {
      const primaryLocation = locations.find(loc => loc.isPrimary && loc.isActive);
      const firstActiveLocation = locations.find(loc => loc.isActive);
      const defaultLocation = primaryLocation || firstActiveLocation;
      if (defaultLocation) {
        setCurrentLocationIdState(defaultLocation.id);
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, defaultLocation.id);
        } catch (e) {}
      }
    }
  }, [locations, isLoading, currentLocationId]);

  const setCurrentLocationId = (locationId: string | null) => {
    setCurrentLocationIdState(locationId);
    try {
      if (locationId) {
        localStorage.setItem(LOCATION_STORAGE_KEY, locationId);
      } else {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch (e) {}
  };

  const currentLocation = locations.find(loc => loc.id === currentLocationId) || null;
  const currentPracticeId = currentLocation?.practiceId || null;

  return (
    <LocationContext.Provider value={{ 
      currentLocationId,
      currentPracticeId,
      setCurrentLocationId, 
      currentLocation,
      locations: locations.filter(loc => loc.isActive),
      isLoading 
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
