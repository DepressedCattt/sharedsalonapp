"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type {
  TrustProfile,
  TrustDimensionRatings,
  TrustIssueFlag,
  ArrivalStatus,
} from "@/lib/types";

// ── Seeded account options ────────────────────────────────────────────────────

const SEEDED_VENUES = [
  { id: "seed_v1_venue", label: "The Style Collective" },
  { id: "seed_v2_venue", label: "Luxe Beauty Studio" },
  { id: "seed_v3_venue", label: "The Barber Quarter" },
  { id: "seed_v4_venue", label: "Glow Nail Lounge" },
  { id: "seed_v5_venue", label: "Prestige Salon Suites" },
  { id: "dev-venue-001_venue", label: "Dev Venue (logged-in)" },
];

const SEEDED_RENTERS = [
  { id: "seed_r1_renter", label: "Jessica Taylor" },
  { id: "seed_r2_renter", label: "Marcus Williams" },
  { id: "seed_r3_renter", label: "Emma Chen" },
  { id: "seed_r4_renter", label: "Sophia Park" },
  { id: "seed_r5_renter", label: "Ryan Mitchell" },
  { id: "dev-renter-001_renter", label: "Dev Renter (logged-in)" },
];

const VENUE_ISSUE_FLAGS: { id: TrustIssueFlag; label: string }[] = [
  { id: "late_cancellation", label: "Late cancellation" },
  { id: "no_show", label: "No-show" },
  { id: "damage", label: "Damage" },
  { id: "unprofessional", label: "Unprofessional" },
  { id: "rules_violation", label: "Rules violation" },
  { id: "other", label: "Other" },
];

const RENTER_ISSUE_FLAGS: { id: TrustIssueFlag; label: string }[] = [
  { id: "listing_inaccurate", label: "Listing inaccurate" },
  { id: "rules_changed", label: "Rules changed on arrival" },
  { id: "poor_communication", label: "Poor communication" },
  { id: "venue_cleanliness", label: "Venue cleanliness" },
  { id: "payment_issue", label: "Payment issue" },
  { id: "other", label: "Other" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="cursor-pointer"
        >
          <svg
            className={`h-6 w-6 transition-colors ${s <= display ? "text-yellow-400" : "text-slate-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-xs text-slate-400 self-center">{value}/5</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    fresh: "bg-slate-700 text-slate-300",
    bronze: "bg-amber-900/50 text-amber-400",
    silver: "bg-slate-700 text-slate-200",
    gold: "bg-yellow-900/50 text-yellow-400",
    platinum: "bg-indigo-900/50 text-indigo-300",
    trailblazer: "bg-orange-900/50 text-orange-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colors[tier] ?? "bg-slate-700 text-slate-300"}`}>
      {tier}
    </span>
  );
}

// ── Profile viewer ────────────────────────────────────────────────────────────

function ProfileViewer({ profile }: { profile: TrustProfile }) {
  const m = profile.role === "renter" ? profile.renterMetrics : profile.venueMetrics;
  const completed = m?.totalCompleted ?? 0;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono">{profile.accountId}</span>
        <TierBadge tier={profile.tier} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
          <p className="text-slate-500">Public Score</p>
          <p className="text-lg font-bold text-white">{profile.trustScore}<span className="text-xs font-normal text-slate-500"> /100</span></p>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
          <p className="text-slate-500">Pending Score</p>
          <p className="text-lg font-bold text-amber-400">{profile.pendingTrustScore ?? profile.trustScore}<span className="text-xs font-normal text-slate-500"> /100</span></p>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
          <p className="text-slate-500">Completed</p>
          <p className="text-lg font-bold text-white">{completed}</p>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
          <p className="text-slate-500">Next milestone</p>
          <p className="text-lg font-bold text-white">
            {completed < 5 ? 5 : Math.ceil(completed / 5) * 5}
          </p>
        </div>
      </div>

      {m && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Dimension scores</p>
          {profile.role === "renter" && profile.renterMetrics && (
            <>
              {([
                ["Reliability", profile.renterMetrics.reliabilityScore],
                ["Professionalism", profile.renterMetrics.professionalismScore],
                ["Cleanliness", profile.renterMetrics.cleanlinessScore],
                ["Responsiveness", profile.renterMetrics.responsivenessScore],
              ] as [string, number][]).map(([label, score]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-slate-500 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${score}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{score}%</span>
                </div>
              ))}
            </>
          )}
          {profile.role === "venue" && profile.venueMetrics && (
            <>
              {([
                ["Fairness", profile.venueMetrics.fairnessScore],
                ["Satisfaction", profile.venueMetrics.satisfactionScore],
                ["Payment", profile.venueMetrics.paymentScore],
              ] as [string, number][]).map(([label, score]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-slate-500 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${score}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{score}%</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <details className="text-[10px]">
        <summary className="text-slate-600 cursor-pointer hover:text-slate-400">Raw JSON</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-black/30 p-2 text-slate-500">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminTrustPage() {
  const isDev = process.env.NODE_ENV === "development";

  // Lookup state
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<TrustProfile | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Review injection state
  const [revieweeId, setRevieweeId] = useState("");
  const [reviewerRole, setReviewerRole] = useState<"venue" | "renter">("venue");
  const [reviewerId, setReviewerId] = useState("");
  const [quickRating, setQuickRating] = useState(0);
  const [arrivalStatus, setArrivalStatus] = useState<ArrivalStatus | "">("");
  const [professionalism, setProfessionalism] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [fairness, setFairness] = useState(0);
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null);
  const [selectedFlags, setSelectedFlags] = useState<Set<TrustIssueFlag>>(new Set());
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<TrustProfile | null>(null);
  const [reviewError, setReviewError] = useState("");

  // Booking injection state
  const [bookingVenueId, setBookingVenueId] = useState("");
  const [bookingRenterId, setBookingRenterId] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Clear trust state
  const [clearId, setClearId] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [clearResult, setClearResult] = useState("");

  // Trailblazer state
  const [trailblazerId, setTrailblazerId] = useState("");
  const [trailblazerRole, setTrailblazerRole] = useState<"venue" | "renter">("venue");
  const [trailblazerLoading, setTrailblazerLoading] = useState(false);
  const [trailblazerResult, setTrailblazerResult] = useState("");

  const toggleFlag = (flag: TrustIssueFlag) => {
    setSelectedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  };

  const lookupProfile = useCallback(async () => {
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const res = await fetch(`/api/admin/trust?accountId=${encodeURIComponent(lookupId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLookupResult(data.profile);
    } catch (e: unknown) {
      setLookupError(e instanceof Error ? e.message : "Error");
    } finally {
      setLookupLoading(false);
    }
  }, [lookupId]);

  const injectReview = async () => {
    if (!revieweeId || quickRating === 0) return;
    setReviewLoading(true);
    setReviewError("");
    setReviewResult(null);

    const dimensionRatings: TrustDimensionRatings = {};
    if (reviewerRole === "venue") {
      if (arrivalStatus) dimensionRatings.arrivalStatus = arrivalStatus as ArrivalStatus;
      if (professionalism) dimensionRatings.professionalism = professionalism;
      if (cleanliness) dimensionRatings.cleanliness = cleanliness;
      if (communication) dimensionRatings.communication = communication;
    } else {
      if (accuracy) dimensionRatings.accuracy = accuracy;
      if (fairness) dimensionRatings.fairness = fairness;
      if (communication) dimensionRatings.communication = communication;
    }

    try {
      const res = await fetch("/api/admin/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerAccountId: reviewerId || `admin_sim_reviewer`,
          reviewerRole,
          revieweeAccountId: revieweeId,
          quickRating,
          dimensionRatings,
          wouldBookAgain,
          issueFlags: Array.from(selectedFlags),
          publishImmediately: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewResult(data.profile);
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : "Error");
    } finally {
      setReviewLoading(false);
    }
  };

  const injectBooking = async () => {
    if (!bookingVenueId || !bookingRenterId) return;
    setBookingLoading(true);
    setBookingError("");
    setBookingResult("");
    try {
      const res = await fetch("/api/admin/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "booking", venueId: bookingVenueId, renterId: bookingRenterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookingResult(`Booking created (ID: ${data.bookingId}). Both profiles recomputed.`);
    } catch (e: unknown) {
      setBookingError(e instanceof Error ? e.message : "Error");
    } finally {
      setBookingLoading(false);
    }
  };

  const clearTrustData = async () => {
    if (!clearId.trim()) return;
    setClearLoading(true);
    setClearResult("");
    try {
      const res = await fetch(`/api/admin/trust?accountId=${encodeURIComponent(clearId.trim())}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClearResult(
        `Cleared — ${data.deleted.profiles} profile(s), ${data.deleted.reviews} review(s), ${data.deleted.simulatedBookings} sim booking(s)`
      );
    } catch (e: unknown) {
      setClearResult(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setClearLoading(false);
    }
  };

  const grantTrailblazer = async (grant: boolean) => {
    if (!trailblazerId.trim()) return;
    setTrailblazerLoading(true);
    setTrailblazerResult("");
    try {
      const res = await fetch("/api/admin/trust", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: trailblazerId.trim(),
          foundingVerified: grant,
          role: trailblazerRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrailblazerResult(
        grant
          ? `Trailblazer granted to ${trailblazerId}`
          : `Trailblazer revoked from ${trailblazerId}`
      );
    } catch (e: unknown) {
      setTrailblazerResult(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setTrailblazerLoading(false);
    }
  };

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted">Admin tools are only available in development mode.</p>
      </div>
    );
  }

  const issueOptions = reviewerRole === "venue" ? VENUE_ISSUE_FLAGS : RENTER_ISSUE_FLAGS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                DEV MODE
              </span>
              <h1 className="text-2xl font-bold text-white">Trust Simulator</h1>
            </div>
            <p className="text-sm text-slate-400">
              Inject reviews and bookings to test the trust scoring engine.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors rounded-lg border border-white/5 px-3 py-1.5"
          >
            ← Admin Hub
          </Link>
        </div>

        {/* Tier reference */}
        <section className="mb-6 rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <SectionLabel>Tier Reference</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {[
              { tier: "fresh", rule: "< 5 bookings" },
              { tier: "bronze", rule: "score 0–59, 5+ bookings" },
              { tier: "silver", rule: "score 60–74, 5+ bookings" },
              { tier: "gold", rule: "score 75–94, 5+ bookings" },
              { tier: "platinum", rule: "score ≥ 90 AND 20+ bookings" },
              { tier: "trailblazer", rule: "foundingVerified = true" },
            ].map(({ tier, rule }) => (
              <div key={tier} className="rounded-lg bg-white/[0.04] px-3 py-2">
                <TierBadge tier={tier} />
                <p className="mt-1 text-slate-600">{rule}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-600">
          Score = raw weighted average of review dimensions (no formula adjustment). Booking count only gates Fresh→ranked and the Platinum threshold.{" "}
          Public tier/score updates only at every 5th booking (5, 10, 15…) for reviewer anonymity.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Left column ── */}
          <div className="space-y-6">

            {/* Profile lookup */}
            <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <SectionLabel>Look Up Profile</SectionLabel>
              <div className="flex gap-2">
                <Input value={lookupId} onChange={setLookupId} placeholder="accountId e.g. seed_v1_venue" />
                <button
                  onClick={lookupProfile}
                  disabled={lookupLoading || !lookupId.trim()}
                  className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.1] transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  {lookupLoading ? "…" : "Fetch"}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-600">Quick options: {SEEDED_VENUES.slice(0,3).map(v => v.id).join(" · ")}</p>
              {lookupError && <p className="mt-2 text-xs text-red-400">{lookupError}</p>}
              {lookupResult && <div className="mt-3"><ProfileViewer profile={lookupResult} /></div>}
              {lookupResult === null && !lookupError && !lookupLoading && lookupId && (
                <p className="mt-2 text-xs text-slate-500">No profile found for this accountId.</p>
              )}
            </section>

            {/* Inject booking */}
            <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <SectionLabel>Inject Completed Booking</SectionLabel>
              <p className="text-xs text-slate-600 mb-3">
                Creates a completed booking between a venue and renter, then recomputes both profiles. This increments the booking count toward tier milestones.
              </p>
              <div className="space-y-3">
                <Field label="Venue accountId">
                  <Select
                    value={bookingVenueId}
                    onChange={setBookingVenueId}
                    placeholder="Select venue…"
                    options={SEEDED_VENUES.map((v) => ({ value: v.id, label: `${v.label} (${v.id})` }))}
                  />
                </Field>
                <Field label="Custom venue ID (overrides dropdown)">
                  <Input value={bookingVenueId} onChange={setBookingVenueId} placeholder="e.g. dev-venue-001_venue" />
                </Field>
                <Field label="Renter accountId">
                  <Select
                    value={bookingRenterId}
                    onChange={setBookingRenterId}
                    placeholder="Select renter…"
                    options={SEEDED_RENTERS.map((r) => ({ value: r.id, label: `${r.label} (${r.id})` }))}
                  />
                </Field>
                <Field label="Custom renter ID (overrides dropdown)">
                  <Input value={bookingRenterId} onChange={setBookingRenterId} placeholder="e.g. dev-renter-001_renter" />
                </Field>
              </div>
              <button
                onClick={injectBooking}
                disabled={bookingLoading || !bookingVenueId || !bookingRenterId}
                className="mt-4 w-full rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/[0.12] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {bookingLoading ? "Creating…" : "Inject Completed Booking"}
              </button>
              {bookingResult && <p className="mt-2 text-xs text-emerald-400">{bookingResult}</p>}
              {bookingError && <p className="mt-2 text-xs text-red-400">{bookingError}</p>}
            </section>

            {/* Trailblazer */}
            <section className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4">
              <SectionLabel>Trailblazer Status</SectionLabel>
              <p className="text-xs text-slate-600 mb-3">
                Grant or revoke the Trailblazer tier. This sets <span className="font-mono text-slate-400">foundingVerified = true</span> and immediately applies the tier regardless of score.
              </p>
              <div className="space-y-2">
                <Field label="accountId">
                  <Input value={trailblazerId} onChange={setTrailblazerId} placeholder="e.g. dev-venue-001_venue" />
                </Field>
                <Field label="Role">
                  <Select
                    value={trailblazerRole}
                    onChange={(v) => setTrailblazerRole(v as "venue" | "renter")}
                    options={[{ value: "venue", label: "Venue" }, { value: "renter", label: "Renter" }]}
                  />
                </Field>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => grantTrailblazer(true)}
                  disabled={trailblazerLoading || !trailblazerId.trim()}
                  className="flex-1 rounded-lg border border-orange-500/25 bg-orange-500/[0.07] px-4 py-2.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/[0.12] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {trailblazerLoading ? "…" : "Grant Trailblazer"}
                </button>
                <button
                  onClick={() => grantTrailblazer(false)}
                  disabled={trailblazerLoading || !trailblazerId.trim()}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/[0.08] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Revoke
                </button>
              </div>
              {trailblazerResult && (
                <p className="mt-2 text-xs text-orange-400">{trailblazerResult}</p>
              )}
            </section>

            {/* Clear data */}
            <section className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-4">
              <SectionLabel>Clear Trust Data</SectionLabel>
              <p className="text-xs text-slate-600 mb-3">
                Deletes TrustProfile, TrustReviews, and admin-simulated bookings for this accountId.
              </p>
              <div className="flex gap-2">
                <Input value={clearId} onChange={setClearId} placeholder="accountId" />
                <button
                  onClick={clearTrustData}
                  disabled={clearLoading || !clearId.trim()}
                  className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/[0.1] transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  {clearLoading ? "…" : "Clear"}
                </button>
              </div>
              {clearResult && <p className="mt-2 text-xs text-slate-400">{clearResult}</p>}
            </section>
          </div>

          {/* ── Right column: Inject review ── */}
          <div>
            <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <SectionLabel>Inject Trust Review</SectionLabel>
              <p className="text-xs text-slate-600 mb-4">
                Injects a fully structured review and immediately recomputes the reviewee&apos;s trust profile. Use this to simulate the post-booking review flow.
              </p>

              <div className="space-y-4">
                <Field label="Reviewer role (who is writing the review)">
                  <Select
                    value={reviewerRole}
                    onChange={(v) => {
                      setReviewerRole(v as "venue" | "renter");
                      setSelectedFlags(new Set());
                    }}
                    options={[
                      { value: "venue", label: "Venue reviewing a Renter" },
                      { value: "renter", label: "Renter reviewing a Venue" },
                    ]}
                  />
                </Field>

                <Field label="Reviewee accountId (who is being reviewed)">
                  <Select
                    value={revieweeId}
                    onChange={setRevieweeId}
                    placeholder="Select from seeded accounts…"
                    options={
                      reviewerRole === "venue"
                        ? SEEDED_RENTERS.map((r) => ({ value: r.id, label: `${r.label} (${r.id})` }))
                        : SEEDED_VENUES.map((v) => ({ value: v.id, label: `${v.label} (${v.id})` }))
                    }
                  />
                  <Input value={revieweeId} onChange={setRevieweeId} placeholder="Or enter custom accountId…" />
                </Field>

                <Field label="Reviewer accountId (optional — defaults to admin_sim_reviewer)">
                  <Input value={reviewerId} onChange={setReviewerId} placeholder="Optional" />
                </Field>

                <Field label="Overall rating (1–5)">
                  <StarPicker value={quickRating} onChange={setQuickRating} />
                </Field>

                <div className="border-t border-white/5 pt-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">
                    {reviewerRole === "venue" ? "Venue → Renter dimensions" : "Renter → Venue dimensions"}
                  </p>

                  {reviewerRole === "venue" ? (
                    <div className="space-y-3">
                      <Field label="Arrival">
                        <div className="flex gap-2">
                          {(["on_time", "late", "no_show"] as ArrivalStatus[]).map((v) => {
                            const labels = { on_time: "On time", late: "Late", no_show: "No-show" };
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setArrivalStatus(v)}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-medium ring-1 transition-all cursor-pointer ${
                                  arrivalStatus === v
                                    ? "bg-amber-500/20 text-amber-400 ring-amber-500/40"
                                    : "bg-white/[0.04] text-slate-400 ring-white/10 hover:ring-white/20"
                                }`}
                              >
                                {labels[v]}
                              </button>
                            );
                          })}
                        </div>
                      </Field>
                      <Field label="Professionalism">
                        <StarPicker value={professionalism} onChange={setProfessionalism} />
                      </Field>
                      <Field label="Cleanliness">
                        <StarPicker value={cleanliness} onChange={setCleanliness} />
                      </Field>
                      <Field label="Communication">
                        <StarPicker value={communication} onChange={setCommunication} />
                      </Field>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Field label="Listing accuracy">
                        <StarPicker value={accuracy} onChange={setAccuracy} />
                      </Field>
                      <Field label="Fairness of house rules">
                        <StarPicker value={fairness} onChange={setFairness} />
                      </Field>
                      <Field label="Communication">
                        <StarPicker value={communication} onChange={setCommunication} />
                      </Field>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3 space-y-3">
                  <Field label="Would book again?">
                    <div className="flex gap-2">
                      {(["yes", "no", "skip"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setWouldBookAgain(v === "skip" ? null : v === "yes")}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-medium ring-1 transition-all cursor-pointer ${
                            (v === "yes" && wouldBookAgain === true) ||
                            (v === "no" && wouldBookAgain === false) ||
                            (v === "skip" && wouldBookAgain === null)
                              ? "bg-amber-500/20 text-amber-400 ring-amber-500/40"
                              : "bg-white/[0.04] text-slate-400 ring-white/10 hover:ring-white/20"
                          }`}
                        >
                          {v === "skip" ? "Skip" : v === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Issue flags (optional)">
                    <div className="flex flex-wrap gap-1.5">
                      {issueOptions.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleFlag(id)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-all cursor-pointer ${
                            selectedFlags.has(id)
                              ? "bg-red-500/20 text-red-400 ring-red-500/40"
                              : "bg-white/[0.04] text-slate-500 ring-white/10 hover:ring-white/20"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>

              <button
                onClick={injectReview}
                disabled={reviewLoading || !revieweeId || quickRating === 0}
                className="mt-5 w-full rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/[0.12] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {reviewLoading ? "Injecting…" : "Inject Review & Recompute"}
              </button>

              {reviewError && <p className="mt-2 text-xs text-red-400">{reviewError}</p>}

              {reviewResult && (
                <div className="mt-4">
                  <p className="text-xs text-emerald-400 mb-2">Profile updated:</p>
                  <ProfileViewer profile={reviewResult} />
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
