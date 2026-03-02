"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import Script from "next/script";

const GOOGLE_SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";

interface GoogleMapsContextType {
  /** True once the script has loaded. Use this before using window.google. */
  isLoaded: boolean;
  apiKey: string | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  apiKey: undefined,
});

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, apiKey }}>
      {apiKey && (
        <Script
          src={`${GOOGLE_SCRIPT_URL}?key=${apiKey}&libraries=places&region=au&language=en-AU&loading=async`}
          onLoad={handleLoad}
          strategy="lazyOnload"
        />
      )}
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
