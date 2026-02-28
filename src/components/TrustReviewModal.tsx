"use client";

import { useState } from "react";
import type { TrustIssueFlag } from "@/lib/types";

interface TrustReviewModalProps {
  bookingId: string;
  /** The name of the party being reviewed (venue name or freelancer name). */
  revieweeName: string;
  /** Role of the current user submitting the review. */
  reviewerRole: "venue" | "renter";
  onClose: () => void;
  onSuccess: () => void;
}

const ISSUE_FLAGS: { id: TrustIssueFlag; label: string }[] = [
  { id: "reliability", label: "Reliability" },
  { id: "cleanliness", label: "Cleanliness" },
  { id: "professionalism", label: "Professionalism" },
  { id: "rules", label: "House Rules" },
  { id: "other", label: "Other" },
];

type Step = "rating" | "followup" | "done";

export default function TrustReviewModal({
  bookingId,
  revieweeName,
  reviewerRole,
  onClose,
  onSuccess,
}: TrustReviewModalProps) {
  const [step, setStep] = useState<Step>("rating");
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null);
  const [selectedFlags, setSelectedFlags] = useState<Set<TrustIssueFlag>>(
    new Set()
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const displayRating = hoverRating || selectedRating;

  const STAR_LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

  function toggleFlag(flag: TrustIssueFlag) {
    setSelectedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  }

  function handleRatingSelect(rating: number) {
    setSelectedRating(rating);
    setHoverRating(0);
    // Immediately advance to follow-up step
    setTimeout(() => setStep("followup"), 120);
  }

  async function handleSubmit() {
    if (!selectedRating) return;
    setSubmitting(true);
    setError("");

    try {
      const body: {
        bookingId: string;
        quickRating: number;
        wouldBookAgain?: boolean;
        issueFlags?: TrustIssueFlag[];
      } = {
        bookingId,
        quickRating: selectedRating,
      };

      if (selectedRating >= 4 && wouldBookAgain !== null) {
        body.wouldBookAgain = wouldBookAgain;
      }
      if (selectedRating < 4 && selectedFlags.size > 0) {
        body.issueFlags = Array.from(selectedFlags);
      }

      const res = await fetch("/api/trust/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit review");
      }

      setStep("done");
      setTimeout(() => {
        onSuccess();
      }, 2200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl overflow-hidden">

        {/* ── Done state ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground">Review saved</p>
            <p className="text-sm text-muted leading-relaxed">
              It&apos;ll be revealed once both sides submit, or in 7 days.
            </p>
          </div>
        )}

        {/* ── Step 1: Star rating ── */}
        {step === "rating" && (
          <div className="px-6 pt-6 pb-8">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">
                  {reviewerRole === "renter" ? "Rate your venue" : "Rate your freelancer"}
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-foreground">
                  How was {revieweeName}?
                </h2>
              </div>
              <button
                onClick={onClose}
                className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-muted/10 transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRatingSelect(star)}
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <svg
                    className={`h-10 w-10 transition-colors ${
                      star <= displayRating
                        ? "text-warning"
                        : "text-border"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>

            {displayRating > 0 && (
              <p className="mt-2 text-center text-sm font-medium text-muted animate-in fade-in duration-150">
                {STAR_LABELS[displayRating]}
              </p>
            )}
          </div>
        )}

        {/* ── Step 2: Follow-up ── */}
        {step === "followup" && (
          <div className="px-6 pt-6 pb-8">
            {/* Back + close row */}
            <div className="mb-5 flex items-center justify-between">
              <button
                onClick={() => setStep("rating")}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>

              {/* Star summary */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className={`h-4 w-4 ${s <= selectedRating ? "text-warning" : "text-border"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-muted/10 transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Low rating: issue flags */}
            {selectedRating < 4 ? (
              <>
                <p className="mb-4 text-sm font-medium text-foreground">
                  What went wrong? <span className="text-muted font-normal">(select all that apply)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {ISSUE_FLAGS.map(({ id, label }) => {
                    const active = selectedFlags.has(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleFlag(id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all cursor-pointer ${
                          active
                            ? "bg-danger/10 text-danger ring-danger/40"
                            : "bg-card text-muted ring-border hover:ring-muted/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* High rating: would book again */
              <>
                <p className="mb-4 text-sm font-medium text-foreground">
                  Would you{" "}
                  {reviewerRole === "renter" ? "rent here" : "host them"} again?
                </p>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((val) => {
                    const isYes = val === "yes";
                    const active =
                      wouldBookAgain === (isYes ? true : false) &&
                      wouldBookAgain !== null;
                    return (
                      <button
                        key={val}
                        onClick={() => setWouldBookAgain(isYes)}
                        className={`flex-1 rounded-xl py-3 text-sm font-semibold ring-1 transition-all cursor-pointer ${
                          active
                            ? isYes
                              ? "bg-success/10 text-success ring-success/40"
                              : "bg-danger/10 text-danger ring-danger/40"
                            : "bg-card text-muted ring-border hover:ring-muted/50"
                        }`}
                      >
                        {isYes ? "Yes" : "No"}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {error && (
              <p className="mt-3 text-xs text-danger">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Saving…" : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
