"use client";

import type { TrustProfile, TrustTier } from "@/lib/types";

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  TrustTier,
  { label: string; subtitle?: string; bg: string; text: string; ring: string; dot: string }
> = {
  fresh: {
    label: "Fresh",
    bg: "bg-slate-100",
    text: "text-slate-500",
    ring: "ring-slate-200",
    dot: "bg-slate-400",
  },
  bronze: {
    label: "Bronze",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
  },
  silver: {
    label: "Silver",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-300",
    dot: "bg-slate-400",
  },
  gold: {
    label: "Gold",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    ring: "ring-yellow-300",
    dot: "bg-yellow-500",
  },
  platinum: {
    label: "Platinum",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    dot: "bg-indigo-500",
  },
  trailblazer: {
    label: "Trailblazer",
    subtitle: "Early Adopter",
    bg: "bg-gradient-to-r from-amber-50 to-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-300",
    dot: "bg-orange-500",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TierPill({
  tier,
  completedCount,
  size,
}: {
  tier: TrustTier;
  completedCount?: number;
  size: "sm" | "md" | "lg";
}) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.fresh;
  const pillSize =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : size === "md"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-3 py-1.5 text-sm gap-2";

  const isFresh = tier === "fresh";
  const isTrailblazer = tier === "trailblazer";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center font-semibold rounded-full ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring} ${pillSize}`}
        >
          {isTrailblazer ? (
            <svg
              className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          ) : (
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          )}
          {cfg.label}
        </span>

        {isTrailblazer && cfg.subtitle && size !== "sm" && (
          <span className="text-[10px] font-medium text-orange-500/80">
            {cfg.subtitle}
          </span>
        )}
      </div>

      {/* Fresh progress indicator */}
      {isFresh && completedCount !== undefined && (
        <p className={`text-muted ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
          {completedCount} of 5 bookings to first rank
        </p>
      )}
    </div>
  );
}

function MetricItem({
  label,
  value,
  size,
}: {
  label: string;
  value: string;
  size: "sm" | "md" | "lg";
}) {
  if (size === "sm") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted">{label}:</span>
        <span className="text-[10px] font-semibold text-foreground">{value}</span>
      </div>
    );
  }
  if (size === "lg") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted">{label}:</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface TrustBadgeProps {
  profile: TrustProfile;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function TrustBadge({
  profile,
  size = "md",
  className = "",
}: TrustBadgeProps) {
  const { tier, role, renterMetrics, venueMetrics } = profile;

  const completedCount =
    role === "renter"
      ? renterMetrics?.totalCompleted ?? 0
      : venueMetrics?.totalCompleted ?? 0;

  // Build up to 3 key display metrics based on role and available data
  const metrics: { label: string; value: string }[] = [];

  if (tier === "fresh") {
    // No metrics shown for fresh — just the progress indicator in TierPill
  } else if (role === "renter" && renterMetrics) {
    const { reliabilityScore, cleanlinessScore, totalCompleted, disputeCount } = renterMetrics;
    if (totalCompleted > 0) {
      metrics.push({ label: "Reliability", value: `${reliabilityScore}%` });
      metrics.push({ label: "Cleanliness", value: `${cleanlinessScore}%` });
      metrics.push({
        label: "Completed",
        value: `${totalCompleted} rental${totalCompleted !== 1 ? "s" : ""}`,
      });
      if (disputeCount > 0 && size === "lg") {
        metrics.push({ label: "Disputes", value: String(disputeCount) });
      }
    }
  } else if (role === "venue" && venueMetrics) {
    const { satisfactionScore, activeFreelancers, disputeCount } = venueMetrics;
    if (activeFreelancers > 0 || venueMetrics.totalCompleted > 0) {
      metrics.push({ label: "Satisfaction", value: `${satisfactionScore}%` });
      metrics.push({ label: "Freelancers", value: String(activeFreelancers) });
      metrics.push({
        label: "Completed",
        value: String(venueMetrics.totalCompleted),
      });
      if (disputeCount > 0 && size === "lg") {
        metrics.push({ label: "Disputes", value: String(disputeCount) });
      }
    }
  }

  const hasMetrics = metrics.length > 0;
  const displayMetrics = size === "sm" ? metrics.slice(0, 2) : metrics.slice(0, 3);

  if (size === "sm") {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <TierPill tier={tier} completedCount={completedCount} size="sm" />
        {hasMetrics && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {displayMetrics.map((m) => (
              <MetricItem key={m.label} label={m.label} value={m.value} size="sm" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <TierPill tier={tier} completedCount={completedCount} size="lg" />
        {hasMetrics && (
          <div className="grid grid-cols-3 gap-3">
            {displayMetrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <div className="text-base font-bold text-foreground">{m.value}</div>
                <div className="mt-0.5 text-xs text-muted">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // md (default)
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <TierPill tier={tier} completedCount={completedCount} size="md" />
      {hasMetrics && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {displayMetrics.map((m) => (
            <MetricItem key={m.label} label={m.label} value={m.value} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
