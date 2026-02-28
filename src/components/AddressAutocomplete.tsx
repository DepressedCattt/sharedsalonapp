"use client";

import { useRef, useEffect } from "react";
import { useGoogleMaps } from "@/context/GoogleMapsContext";

export interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coords?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Shown when address was typed but not selected from suggestions (no coordinates). */
  hint?: string;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Start typing a full address...",
  required = false,
  disabled = false,
  id,
  className = "",
  hint,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, apiKey } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !apiKey || !inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["formatted_address", "geometry", "place_id"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const addr = place.formatted_address ?? "";
      const location = place.geometry?.location;
      if (addr) {
        const latitude = location?.lat?.() ?? 0;
        const longitude = location?.lng?.() ?? 0;
        onChange(addr, latitude && longitude ? { latitude, longitude } : undefined);
      }
    });

    autocompleteRef.current = autocomplete;
    return () => {
      if (listener) window.google?.maps?.event?.clearInstanceListeners?.(autocomplete);
      autocompleteRef.current = null;
    };
  }, [isLoaded, apiKey, onChange]);

  if (!apiKey) {
    return (
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter full address (e.g. 123 High St, London)"
          required={required}
          disabled={disabled}
          id={id}
          className={className}
        />
        <p className="text-xs text-muted">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and enable Places API to get address suggestions and map display.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        id={id}
        className={className}
        autoComplete="off"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
