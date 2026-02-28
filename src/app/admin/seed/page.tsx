"use client";

import { useState } from "react";

interface SeedResult {
  ok: boolean;
  message: string;
  created?: {
    venueProfiles: number;
    listings: number;
    trustProfiles: number;
    bookings: number;
    reviews: number;
    conversations: number;
    userSpecific: string[];
  };
}

const STAT_ICONS: Record<string, string> = {
  venueProfiles: "🏢",
  listings: "📋",
  trustProfiles: "⭐",
  bookings: "📅",
  reviews: "💬",
  conversations: "✉️",
};

const STAT_LABELS: Record<string, string> = {
  venueProfiles: "Venue Profiles",
  listings: "Listings",
  trustProfiles: "Trust Profiles",
  bookings: "Bookings",
  reviews: "Reviews",
  conversations: "Conversations",
};

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed(reset = false) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/seed${reset ? "?reset=true" : ""}`, { method: "POST" });
      const data: SeedResult = await res.json();
      setResult(data);
    } catch {
      setError("Failed to connect to the seed API. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setClearing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/seed", { method: "DELETE" });
      const data: SeedResult = await res.json();
      setResult(data);
    } catch {
      setError("Failed to connect to the seed API.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl mb-4">
            🌱
          </div>
          <h1 className="text-2xl font-bold text-white">Database Seeder</h1>
          <p className="mt-2 text-sm text-slate-400">
            Populate the database with realistic mock venues, listings, bookings, and
            conversations so you can fully test the app.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3 mb-6">
          {[
            { icon: "🏢", label: "5 Venue Profiles", sub: "Mayfair · Bondi · Shoreditch · Surry Hills · Melbourne CBD" },
            { icon: "📋", label: "5 Listings", sub: "Styling chairs, bridal suites, barber stations & private suites" },
            { icon: "⭐", label: "5 Trust Profiles", sub: "Bronze → Platinum tiers with realistic metrics" },
            { icon: "📅", label: "7 Booking Requests", sub: "Mix of pending, approved, completed & declined" },
            { icon: "💬", label: "3–5 Conversations", sub: "Mock-to-mock + user-linked if logged in" },
            { icon: "✍️", label: "2 Reviews", sub: "Detailed freelancer reviews with scores" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
            >
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleSeed(false)}
            disabled={loading || clearing}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Seeding…
              </>
            ) : (
              "🌱 Seed Database"
            )}
          </button>

          <button
            onClick={() => handleSeed(true)}
            disabled={loading || clearing}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear existing seed data and re-insert"
          >
            {loading ? "…" : "↺ Re-seed"}
          </button>

          <button
            onClick={handleClear}
            disabled={loading || clearing}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove all seed data"
          >
            {clearing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            ) : (
              "🗑 Clear"
            )}
          </button>
        </div>

        {/* Result panel */}
        {result && (
          <div
            className={`mt-5 rounded-xl border p-4 ${
              result.ok
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <p
              className={`text-sm font-semibold mb-3 ${
                result.ok ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {result.ok ? "✓" : "✗"} {result.message}
            </p>

            {result.created && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => {
                    const val = result.created![key as keyof typeof result.created];
                    if (typeof val !== "number") return null;
                    return (
                      <div
                        key={key}
                        className="rounded-lg bg-white/[0.04] px-3 py-2 text-center"
                      >
                        <div className="text-lg">{STAT_ICONS[key]}</div>
                        <div className="text-lg font-bold text-white">{val}</div>
                        <div className="text-xs text-slate-500">{STAT_LABELS[key]}</div>
                      </div>
                    );
                  })}
                </div>
                {result.created.userSpecific?.length > 0 && (
                  <div className="mt-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                    <p className="text-xs text-primary font-medium">Linked to your account:</p>
                    {result.created.userSpecific.map((s, i) => (
                      <p key={i} className="text-xs text-slate-400 mt-0.5">• {s}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400">✗ {error}</p>
          </div>
        )}

        {/* Nav links */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
          {[
            { href: "/listings", label: "Browse Listings" },
            { href: "/dashboard", label: "Dashboard" },
            { href: "/messages", label: "Messages" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-slate-400 transition-colors hover:text-white hover:border-white/10"
            >
              {l.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
