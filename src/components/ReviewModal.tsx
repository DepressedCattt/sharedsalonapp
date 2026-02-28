"use client";

import { useState } from "react";
import type { ReviewScores } from "@/lib/types";

interface ReviewModalProps {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  venueId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CRITERIA: { key: keyof ReviewScores; label: string; description: string }[] = [
  {
    key: "cleanliness",
    label: "Cleanliness",
    description: "How clean and ready was the space on arrival?",
  },
  {
    key: "accuracy",
    label: "Accuracy",
    description: "Did the space match the listing (photos, equipment, description)?",
  },
  {
    key: "communication",
    label: "Communication",
    description: "How responsive and helpful was the venue host?",
  },
];

function scoreColor(score: number): string {
  if (score <= 4) return "bg-red-500 text-white";
  if (score <= 7) return "bg-amber-400 text-white";
  return "bg-green-500 text-white";
}

function scoreRingColor(score: number): string {
  if (score <= 4) return "ring-red-400";
  if (score <= 7) return "ring-amber-400";
  return "ring-green-400";
}

function ScorePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all cursor-pointer
              ${selected
                ? `${scoreColor(n)} ring-2 ring-offset-1 ${scoreRingColor(n)} scale-110`
                : "bg-muted/15 text-foreground hover:bg-muted/30"
              }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function scoreLabel(score: number | null): string {
  if (score === null) return "";
  if (score <= 2) return "Poor";
  if (score <= 4) return "Below average";
  if (score === 5) return "Average";
  if (score <= 7) return "Good";
  if (score <= 9) return "Great";
  return "Perfect";
}

export default function ReviewModal({
  bookingId,
  listingId,
  listingTitle,
  venueId,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [scores, setScores] = useState<{ [K in keyof ReviewScores]: number | null }>({
    cleanliness: null,
    accuracy: null,
    communication: null,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allScored = Object.values(scores).every((v) => v !== null);

  const setScore = (key: keyof ReviewScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!allScored) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          listingId,
          venueId,
          scores: {
            cleanliness: scores.cleanliness!,
            accuracy: scores.accuracy!,
            communication: scores.communication!,
          },
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit review");
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Leave a Review</h2>
            <p className="mt-0.5 text-sm text-muted line-clamp-1">{listingTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-lg p-1.5 text-muted transition-colors hover:bg-muted/20 hover:text-foreground cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scale legend */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/5 px-6 py-3">
          <span className="text-xs text-muted">Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">1–4 Poor</span>
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">5–7 Average</span>
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">8–10 Great</span>
          </div>
        </div>

        {/* Criteria */}
        <div className="space-y-6 px-6 py-5">
          {CRITERIA.map(({ key, label, description }) => (
            <div key={key}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <div>
                  <span className="font-semibold text-foreground">{label}</span>
                  <p className="text-xs text-muted">{description}</p>
                </div>
                {scores[key] !== null && (
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {scores[key]}/10
                    <span className="ml-1 text-xs font-normal text-muted">
                      {scoreLabel(scores[key])}
                    </span>
                  </span>
                )}
              </div>
              <ScorePicker value={scores[key]} onChange={(v) => setScore(key, v)} />
            </div>
          ))}

          {/* Optional comment */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Comment <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Share anything else about your experience..."
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-right text-xs text-muted">{comment.length}/500</p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allScored || submitting}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
