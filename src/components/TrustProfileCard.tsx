"use client";

import { useEffect, useRef, useState } from "react";
import type { TrustProfile, TrustTier } from "@/lib/types";
import TrustBadge from "@/components/TrustBadge";
import { fetchWithRetry } from "@/lib/fetchRetry";
import { getCached, setCached } from "@/lib/apiCache";

// ── Tier gradient mapping ──────────────────────────────────────────────────────

const TIER_GRADIENT: Record<TrustTier, string> = {
  fresh: "from-slate-50 to-slate-100/60",
  bronze: "from-amber-50 to-amber-100/60",
  silver: "from-slate-50 to-slate-100/60",
  gold: "from-yellow-50 to-yellow-100/60",
  platinum: "from-indigo-50 to-indigo-100/60",
  trailblazer: "from-amber-50 via-orange-50 to-amber-100/60",
};

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  max = 100,
  color,
}: {
  label: string;
  score: number;
  max?: number;
  color: string;
}) {
  const pct = Math.round((score / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-semibold text-foreground">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-4 py-3 text-center">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="mt-0.5 text-[11px] text-muted">{label}</span>
    </div>
  );
}

// ── Verification badge pill ────────────────────────────────────────────────────

type VerificationBadgeProps = {
  label: string;
  verified: boolean;
  icon: React.ReactNode;
  color: "green" | "blue" | "amber";
};

function VerificationBadge({ label, verified, icon, color }: VerificationBadgeProps) {
  const colors = {
    green: verified
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-muted/20 text-muted border-border",
    blue: verified
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-muted/20 text-muted border-border",
    amber: verified
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-muted/20 text-muted border-border",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${colors[color]}`}
    >
      <span className="h-3.5 w-3.5 shrink-0">{icon}</span>
      {label}
      {verified && (
        <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 shrink-0 opacity-80">
          <path d="M10.28 2.28a.75.75 0 0 0-1.06 0L4.5 7l-1.72-1.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l5.25-5.25a.75.75 0 0 0 0-1.06Z" />
        </svg>
      )}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TrustProfileCardProps {
  accountId: string;
  role: "venue" | "renter";
  /** Pre-loaded profile — if omitted the component fetches it. */
  profile?: TrustProfile;
  /** Show internal pending score (for admin/dev use). */
  showPendingScore?: boolean;
  /** Set true when the viewing user owns this profile — reveals verification actions. */
  isOwner?: boolean;
  className?: string;
}

export default function TrustProfileCard({
  accountId,
  role,
  profile: profileProp,
  showPendingScore = false,
  isOwner = false,
  className = "",
}: TrustProfileCardProps) {
  const [profile, setProfile] = useState<TrustProfile | null>(profileProp ?? null);
  const [loading, setLoading] = useState(!profileProp);
  const [error, setError] = useState("");

  // ABN verification state
  const [abnOpen, setAbnOpen] = useState(false);
  const [abnInput, setAbnInput] = useState("");
  const [abnLoading, setAbnLoading] = useState(false);
  const [abnResult, setAbnResult] = useState<{ ok: boolean; message: string } | null>(null);
  const abnInputRef = useRef<HTMLInputElement>(null);

  // ID verification state
  const [idLoading, setIdLoading] = useState(false);
  const [idMessage, setIdMessage] = useState("");

  useEffect(() => {
    if (profileProp) {
      setProfile(profileProp);
      return;
    }
    let cancelled = false;
    const cacheKey = `trust_${accountId}_${role}`;

    // Show cached data immediately — no spinner on repeat visits
    const cached = getCached<TrustProfile>(cacheKey);
    if (cached) {
      setProfile(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Always fetch fresh data in the background
    fetchWithRetry(`/api/trust?accountId=${encodeURIComponent(accountId)}&role=${role}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((data: TrustProfile) => {
        if (!cancelled) {
          setProfile(data);
          setCached(cacheKey, data);
        }
      })
      .catch(() => {
        if (!cancelled && !cached) setError("Could not load trust profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, role, profileProp]);

  // Focus ABN input when the form opens
  useEffect(() => {
    if (abnOpen) abnInputRef.current?.focus();
  }, [abnOpen]);

  async function handleAbnSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAbnLoading(true);
    setAbnResult(null);
    try {
      const res = await fetch("/api/verify/abn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abn: abnInput, accountId, role }),
      });
      const data = await res.json() as { verified?: boolean; message?: string };
      if (res.ok && data.verified) {
        setAbnResult({ ok: true, message: data.message ?? "ABN verified." });
        setProfile((p) => p ? { ...p, abnVerified: true, abnNumber: abnInput.replace(/[\s-]/g, "") } : p);
        setAbnOpen(false);
      } else {
        setAbnResult({ ok: false, message: data.message ?? "Verification failed." });
      }
    } catch {
      setAbnResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setAbnLoading(false);
    }
  }

  async function handleIdVerify() {
    setIdLoading(true);
    setIdMessage("");
    try {
      const res = await fetch("/api/verify/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, role }),
      });
      const data = await res.json() as { available?: boolean; url?: string; message?: string };
      if (res.ok && data.available && data.url) {
        window.location.href = data.url;
      } else {
        setIdMessage(data.message ?? "Identity verification is coming soon.");
      }
    } catch {
      setIdMessage("Network error. Please try again.");
    } finally {
      setIdLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse rounded-2xl border border-border bg-card p-6 ${className}`}>
        <div className="h-5 w-24 rounded bg-border mb-3" />
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-border" />
          <div className="h-2 w-3/4 rounded bg-border" />
          <div className="h-2 w-5/6 rounded bg-border" />
        </div>
      </div>
    );
  }

  if (error || !profile) return null;

  const { tier, renterMetrics, venueMetrics } = profile;
  const gradient = TIER_GRADIENT[tier] ?? TIER_GRADIENT.fresh;
  const isFresh = tier === "fresh";
  const isTrailblazer = tier === "trailblazer";

  const completedCount =
    role === "renter"
      ? renterMetrics?.totalCompleted ?? 0
      : venueMetrics?.totalCompleted ?? 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${gradient} ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
          Trust Profile
        </p>
        <TrustBadge profile={profile} size="lg" />

        {/* Trailblazer descriptor */}
        {isTrailblazer && (
          <p className="mt-3 text-xs text-orange-600/80 leading-relaxed">
            Recognised as an early adopter of SharedSalon. This badge is permanently granted and sits outside the standard ranking system.
          </p>
        )}
      </div>

      {/* Score breakdown or fresh state */}
      <div className="px-5 py-4">
        {isFresh ? (
          <div className="py-2 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    n <= completedCount ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">
              {completedCount} of 5 bookings completed
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Your first rank is assigned after 5 completed bookings. Reviews are being collected in the meantime.
            </p>
          </div>
        ) : role === "renter" && renterMetrics ? (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Score Breakdown
            </p>
            <div className="space-y-3">
              <ScoreBar label="Reliability" score={renterMetrics.reliabilityScore} color="bg-primary" />
              <ScoreBar label="Professionalism" score={renterMetrics.professionalismScore} color="bg-accent" />
              <ScoreBar label="Cleanliness" score={renterMetrics.cleanlinessScore} color="bg-success" />
              <ScoreBar label="Responsiveness" score={renterMetrics.responsivenessScore} color="bg-info" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatChip label="Completed" value={renterMetrics.totalCompleted} />
              <StatChip label="Cancellations" value={renterMetrics.totalCancelled} />
              <StatChip label="Disputes" value={renterMetrics.disputeCount} />
            </div>
          </>
        ) : role === "venue" && venueMetrics ? (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Score Breakdown
            </p>
            <div className="space-y-3">
              <ScoreBar label="Fairness" score={venueMetrics.fairnessScore} color="bg-primary" />
              <ScoreBar label="Freelancer Satisfaction" score={venueMetrics.satisfactionScore} color="bg-accent" />
              <ScoreBar label="Payment Reliability" score={venueMetrics.paymentScore} color="bg-info" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatChip label="Completed" value={venueMetrics.totalCompleted} />
              <StatChip label="Freelancers" value={venueMetrics.activeFreelancers} />
              <StatChip label="Disputes" value={venueMetrics.disputeCount} />
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted">
            No trust data yet. Complete a booking to build your profile.
          </p>
        )}
      </div>

      {/* ── Verification badges ──────────────────────────────────────────────── */}
      {(profile.abnVerified || profile.idVerified || profile.foundingVerified) && (
        <div className="border-t border-border/60 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Verifications
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.abnVerified && (
              <VerificationBadge
                label="ABN Verified"
                verified
                color="green"
                icon={
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-full w-full">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 1.5 10.5 3l2.5.5.5 2.5L15 8l-1.5 2-.5 2.5-2.5.5L8 14.5 6 13l-2.5-.5-.5-2.5L1.5 8l1-2L3 3.5 5.5 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5.5 8 1.75 1.75 3-3.5" />
                  </svg>
                }
              />
            )}
            {profile.idVerified && (
              <VerificationBadge
                label="ID Verified"
                verified
                color="blue"
                icon={
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-full w-full">
                    <rect x="1" y="3.5" width="14" height="9" rx="1.5" strokeLinecap="round" />
                    <circle cx="5.5" cy="8" r="1.5" />
                    <path strokeLinecap="round" d="M9 6.5h3.5M9 8h2.5M9 9.5h3" />
                  </svg>
                }
              />
            )}
            {profile.foundingVerified && (
              <VerificationBadge
                label="Founding Member"
                verified
                color="amber"
                icon={
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-full w-full">
                    <path d="M8 1.25a.75.75 0 0 1 .673.418l1.558 3.057 3.355.476a.75.75 0 0 1 .414 1.285l-2.43 2.308.575 3.263a.75.75 0 0 1-1.085.793L8 11.027l-3.06 1.823a.75.75 0 0 1-1.085-.793l.574-3.263L2 6.486a.75.75 0 0 1 .415-1.285l3.354-.476 1.558-3.057A.75.75 0 0 1 8 1.25Z" />
                  </svg>
                }
              />
            )}
          </div>
        </div>
      )}

      {/* ── Owner: add pending verifications ─────────────────────────────────── */}
      {isOwner && (!profile.abnVerified || !profile.idVerified) && (
        <div className={`px-5 py-4 ${(profile.abnVerified || profile.idVerified || profile.foundingVerified) ? "" : "border-t border-border/60"}`}>
          {!(profile.abnVerified || profile.idVerified || profile.foundingVerified) && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Verifications
            </p>
          )}
          <div className="space-y-3">

            {/* ABN row — owner only, unverified */}
            {!profile.abnVerified && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted leading-snug">
                    <span className="font-medium text-foreground">ABN</span> — verify your Australian Business Number to earn the ABN Verified badge.
                  </p>
                  <button
                    onClick={() => { setAbnOpen((v) => !v); setAbnResult(null); }}
                    className="shrink-0 rounded-lg border border-border bg-card px-3 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-border/40"
                  >
                    {abnOpen ? "Cancel" : "Add ABN"}
                  </button>
                </div>
                {abnOpen && (
                  <form onSubmit={handleAbnSubmit} className="mt-3">
                    <div className="flex gap-2">
                      <input
                        ref={abnInputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 51 824 753 556"
                        value={abnInput}
                        onChange={(e) => { setAbnInput(e.target.value); setAbnResult(null); }}
                        maxLength={14}
                        className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        disabled={abnLoading || abnInput.replace(/[\s-]/g, "").length < 11}
                        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                      >
                        {abnLoading ? "Checking…" : "Verify"}
                      </button>
                    </div>
                    {abnResult && (
                      <p className={`mt-2 text-[11px] leading-snug ${abnResult.ok ? "text-success" : "text-destructive"}`}>
                        {abnResult.message}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* ID row — owner only, unverified */}
            {!profile.idVerified && (
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted leading-snug">
                  <span className="font-medium text-foreground">ID</span> — verify a government-issued ID via Stripe to earn the ID Verified badge.
                </p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    onClick={handleIdVerify}
                    disabled={idLoading}
                    className="rounded-lg border border-border bg-card px-3 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-border/40 disabled:opacity-50"
                  >
                    {idLoading ? "Starting…" : "Verify ID"}
                  </button>
                  {idMessage && (
                    <p className="text-[10px] text-muted max-w-[180px] text-right leading-snug">
                      {idMessage}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Trust score footer */}
      {!isFresh && (
        <div className="border-t border-border/60 px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Trust Index</span>
            <span className="text-sm font-bold text-foreground">
              {profile.trustScore}
              <span className="text-xs font-normal text-muted"> / 100</span>
            </span>
          </div>

          {showPendingScore &&
            profile.pendingTrustScore !== undefined &&
            profile.pendingTrustScore !== profile.trustScore && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  Pending (next milestone)
                </span>
                <span className="text-[11px] font-semibold text-muted">
                  {profile.pendingTrustScore}
                  <span className="font-normal"> / 100</span>
                </span>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
