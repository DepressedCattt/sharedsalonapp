"use client";

import { useEffect, useState } from "react";
import type { TrustProfile, TrustTier } from "@/lib/types";
import TrustBadge from "@/components/TrustBadge";

// ── Tier label / gradient mapping ─────────────────────────────────────────────

const TIER_GRADIENT: Record<TrustTier, string> = {
  unranked: "from-slate-50 to-slate-100/60",
  bronze: "from-amber-50 to-amber-100/60",
  silver: "from-slate-50 to-slate-100/60",
  gold: "from-yellow-50 to-yellow-100/60",
  platinum: "from-indigo-50 to-indigo-100/60",
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

// ── Main component ────────────────────────────────────────────────────────────

interface TrustProfileCardProps {
  accountId: string;
  role: "venue" | "renter";
  /** Pre-loaded profile — if omitted the component fetches it. */
  profile?: TrustProfile;
  className?: string;
}

export default function TrustProfileCard({
  accountId,
  role,
  profile: profileProp,
  className = "",
}: TrustProfileCardProps) {
  const [profile, setProfile] = useState<TrustProfile | null>(
    profileProp ?? null
  );
  const [loading, setLoading] = useState(!profileProp);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profileProp) {
      setProfile(profileProp);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/trust?accountId=${encodeURIComponent(accountId)}&role=${role}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setProfile(data as TrustProfile);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load trust profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, role, profileProp]);

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

  if (error || !profile) {
    return null;
  }

  const { tier, renterMetrics, venueMetrics } = profile;
  const gradient = TIER_GRADIENT[tier];

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
      </div>

      {/* Score breakdown */}
      <div className="px-5 py-4">
        {role === "renter" && renterMetrics ? (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Score Breakdown
            </p>
            <div className="space-y-3">
              <ScoreBar
                label="Reliability"
                score={renterMetrics.reliabilityScore}
                color="bg-primary"
              />
              <ScoreBar
                label="Professionalism"
                score={renterMetrics.professionalismScore}
                color="bg-accent"
              />
              <ScoreBar
                label="Cleanliness"
                score={renterMetrics.cleanlinessScore}
                color="bg-success"
              />
              <ScoreBar
                label="Responsiveness"
                score={renterMetrics.responsivenessScore}
                color="bg-info"
              />
              <ScoreBar
                label="Repeat Bookings"
                score={renterMetrics.repeatRate}
                color="bg-warning"
              />
            </div>

            {/* Key stats */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatChip
                label="Completed"
                value={renterMetrics.totalCompleted}
              />
              <StatChip
                label="Cancellations"
                value={renterMetrics.totalCancelled}
              />
              <StatChip
                label="Disputes"
                value={renterMetrics.disputeCount}
              />
            </div>
          </>
        ) : role === "venue" && venueMetrics ? (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Score Breakdown
            </p>
            <div className="space-y-3">
              <ScoreBar
                label="Fairness"
                score={venueMetrics.fairnessScore}
                color="bg-primary"
              />
              <ScoreBar
                label="Freelancer Satisfaction"
                score={venueMetrics.satisfactionScore}
                color="bg-accent"
              />
              <ScoreBar
                label="Retention Rate"
                score={venueMetrics.retentionRate}
                color="bg-success"
              />
              <ScoreBar
                label="Payment Reliability"
                score={venueMetrics.paymentScore}
                color="bg-info"
              />
            </div>

            {/* Key stats */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatChip
                label="Completed"
                value={venueMetrics.totalCompleted}
              />
              <StatChip
                label="Freelancers"
                value={venueMetrics.activeFreelancers}
              />
              <StatChip
                label="Disputes"
                value={venueMetrics.disputeCount}
              />
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted">
            No trust data yet. Complete a booking to build your profile.
          </p>
        )}
      </div>

      {/* Trust score footer */}
      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
        <span className="text-xs text-muted">Trust Index</span>
        <span className="text-sm font-bold text-foreground">
          {profile.trustScore}
          <span className="text-xs font-normal text-muted"> / 100</span>
        </span>
      </div>
    </div>
  );
}
