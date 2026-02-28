"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useGoogleMaps } from "@/context/GoogleMapsContext";
import type { Listing } from "@/lib/types";

/** Brisbane CBD — default center for the mockup map */
const BRISBANE_CENTER = { lat: -27.4698, lng: 153.0251 };
const DEFAULT_ZOOM = 12;

interface ListingsMapProps {
  listings: Listing[];
  className?: string;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

/** Listings that have coords either from DB or from geocoding. */
function getCoords(
  listing: Listing,
  geocoded: Record<string, { lat: number; lng: number }>
): { lat: number; lng: number } | null {
  if (listing.latitude != null && listing.longitude != null) {
    return { lat: listing.latitude, lng: listing.longitude };
  }
  const c = geocoded[listing.id];
  return c ?? null;
}

export default function ListingsMap({ listings, className = "" }: ListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const { isLoaded, apiKey } = useGoogleMaps();
  const [mapReady, setMapReady] = useState(false);
  /** Geocoded coords for listings that have address text but no saved lat/lng. */
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number; lng: number }>>({});

  const mappableListings = useMemo(() => {
    return listings.filter((l) => getCoords(l, geocodedCoords) !== null);
  }, [listings, geocodedCoords]);

  // Geocode listings that have location text but no coordinates (e.g. created before autocomplete)
  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.Geocoder) return;
    const geocoder = new window.google.maps.Geocoder();
    const toGeocode = listings.filter(
      (l) =>
        l.location?.trim() &&
        l.latitude == null &&
        l.longitude == null &&
        !geocodedCoords[l.id]
    );
    if (toGeocode.length === 0) return;
    let cancelled = false;
    toGeocode.forEach((listing) => {
      geocoder.geocode({ address: listing.location!.trim() }, (results, status) => {
        if (cancelled || status !== "OK" || !results?.[0]?.geometry?.location) return;
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        setGeocodedCoords((prev) => ({
          ...prev,
          [listing.id]: { lat, lng },
        }));
        // Persist coords to MongoDB so the listing shows on the map next time (venue can update)
        fetch(`/api/listings/${listing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        }).catch(() => {});
      });
    });
    return () => {
      cancelled = true;
    };
  }, [listings, isLoaded, geocodedCoords]);

  // Init map when script is loaded
  useEffect(() => {
    if (!isLoaded || !apiKey || !mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: BRISBANE_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
    setMapReady(true);

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
      infoWindowRef.current = null;
      setMapReady(false);
    };
  }, [isLoaded, apiKey]);

  // Update markers when listings change or map becomes ready
  useEffect(() => {
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    if (!mapReady || !map || !infoWindow || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    mappableListings.forEach((listing) => {
      const coords = getCoords(listing, geocodedCoords);
      if (!coords) return;
      const marker = new window.google!.maps.Marker({
        position: coords,
        map,
        title: listing.title,
      });

      marker.addListener("click", () => {
        const content = `
          <div style="min-width: 180px; padding: 4px 0;">
            <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(listing.title)}</div>
            <div style="font-size: 13px; color: #555;">${escapeHtml(listing.location)}</div>
            <div style="margin-top: 6px; font-size: 14px;">
              <strong>$${listing.price}</strong>
              <span style="color: #666;"> / ${listing.priceType === "daily" ? "day" : "week"}</span>
            </div>
            <a href="/listings/${listing.id}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 8px; font-size: 13px; color: #0d9488;">View listing →</a>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [mapReady, mappableListings, geocodedCoords]);

  if (!apiKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 ${className}`}
        style={{ minHeight: 320 }}
      >
        <p className="text-muted">
          Add <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to show the map.
        </p>
        <p className="mt-1 text-sm text-muted">
          {mappableListings.length} listing{mappableListings.length !== 1 ? "s" : ""} have locations.
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card ${className}`}>
        <div className="border-b border-border bg-muted/30 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">
            Listings on the map
          </h2>
          <p className="text-xs text-muted">
            {mappableListings.length} of {listings.length} listing{listings.length !== 1 ? "s" : ""} with an address (Brisbane area)
          </p>
        </div>
        <div
          ref={mapRef}
          className="h-[320px] w-full"
          aria-label="Map showing listing locations"
        />
      </div>
  );
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
