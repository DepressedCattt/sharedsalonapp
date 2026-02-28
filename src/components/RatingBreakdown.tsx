"use client";

import type { Review } from "@/lib/types";

interface RatingBreakdownData {
  cleanliness: number;
  accuracy: number;
  communication: number;
  count: number;
}

interface RatingBreakdownProps {
  breakdown: RatingBreakdownData;
  reviews: Review[];
  overallRating: number;
}

const CRITERIA_LABELS: { key: keyof Omit<RatingBreakdownData, "count">; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
];

function scoreBarColor(score: number): string {
  if (score <= 4) return "bg-red-400";
  if (score <= 7) return "bg-amber-400";
  return "bg-green-500";
}

function scoreTextColor(score: number): string {
  if (score <= 4) return "text-red-600";
  if (score <= 7) return "text-amber-600";
  return "text-green-600";
}

function scoreLabel(score: number): string {
  if (score <= 2) return "Poor";
  if (score <= 4) return "Below average";
  if (score < 5.5) return "Average";
  if (score <= 7) return "Good";
  if (score <= 9) return "Great";
  return "Perfect";
}

function CriterionBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const pct = (score / 10) * 100;
  const rounded = Math.round(score * 10) / 10;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-bold ${scoreTextColor(score)}`}>{rounded}</span>
          <span className="text-xs text-muted">/10</span>
          <span className={`text-xs font-medium ${scoreTextColor(score)}`}>
            · {scoreLabel(score)}
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/20">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const avgScore =
    (review.scores.cleanliness + review.scores.accuracy + review.scores.communication) / 3;
  const rounded = Math.round(avgScore * 10) / 10;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {review.renterAvatarUrl ? (
            <img
              src={review.renterAvatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              {review.renterName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{review.renterName}</p>
            <p className="text-xs text-muted">{review.createdAt}</p>
          </div>
        </div>
        <div className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold ${scoreTextColor(avgScore)} bg-muted/10`}>
          {rounded}/10
        </div>
      </div>

      {/* Per-criterion mini scores */}
      <div className="mt-3 flex flex-wrap gap-2">
        {CRITERIA_LABELS.map(({ key, label }) => (
          <span
            key={key}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted"
          >
            {label}: <span className={`font-semibold ${scoreTextColor(review.scores[key])}`}>{review.scores[key]}</span>
          </span>
        ))}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{review.comment}</p>
      )}
    </div>
  );
}

export default function RatingBreakdown({
  breakdown,
  reviews,
  overallRating,
}: RatingBreakdownProps) {
  if (breakdown.count === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">Reviews</h2>

      {/* Summary card */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        {/* Overall score header */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex flex-col items-center justify-center rounded-xl bg-primary-light px-5 py-3">
            <span className={`text-3xl font-extrabold ${scoreTextColor(overallRating)}`}>
              {Math.round(overallRating * 10) / 10}
            </span>
            <span className="text-xs text-muted">out of 10</span>
          </div>
          <div>
            <p className={`text-base font-bold ${scoreTextColor(overallRating)}`}>
              {scoreLabel(overallRating)}
            </p>
            <p className="text-sm text-muted">
              Based on {breakdown.count} {breakdown.count === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        {/* Per-criterion bars */}
        <div className="space-y-3.5">
          {CRITERIA_LABELS.map(({ key, label }) => (
            <CriterionBar key={key} label={label} score={breakdown[key]} />
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.length > 0 && (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
