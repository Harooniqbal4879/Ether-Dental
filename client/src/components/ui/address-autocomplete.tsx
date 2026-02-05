import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

let googleMapsLoading = false;
let googleMapsLoaded = false;

async function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded || window.google?.maps?.places) {
    googleMapsLoaded = true;
    return;
  }

  if (googleMapsLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  googleMapsLoading = true;

  try {
    const response = await fetch("/api/config/google-maps-key");
    if (!response.ok) throw new Error("Failed to get API key");
    const { apiKey } = await response.json();
    
    if (!apiKey) throw new Error("No API key available");

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleMapsLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  } catch (error) {
    googleMapsLoading = false;
    throw error;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  "data-testid": testId,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setIsLoaded(true))
      .catch((error) => console.error("Google Maps loading error:", error));
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: ["us", "ca", "mx", "gb", "au"] },
        fields: ["address_components", "formatted_address"],
        types: ["address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        const components: AddressComponents = {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "US",
        };

        let streetNumber = "";
        let route = "";

        for (const component of place.address_components) {
          const type = component.types[0];
          switch (type) {
            case "street_number":
              streetNumber = component.long_name;
              break;
            case "route":
              route = component.long_name;
              break;
            case "locality":
            case "sublocality_level_1":
              components.city = component.long_name;
              break;
            case "administrative_area_level_1":
              components.state = component.short_name;
              break;
            case "postal_code":
              components.zip = component.long_name;
              break;
            case "country":
              const countryCode = component.short_name;
              components.country = ["US", "CA", "MX", "GB", "AU"].includes(countryCode) ? countryCode : "OTHER";
              break;
          }
        }

        components.street = streetNumber ? `${streetNumber} ${route}` : route;
        
        onChange(components.street);
        onAddressSelect?.(components);
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error("Failed to initialize Google Places Autocomplete:", error);
    }
  }, [isLoaded, onChange, onAddressSelect]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      data-testid={testId}
      autoComplete="off"
    />
  );
}
