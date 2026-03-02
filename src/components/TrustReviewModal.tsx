"use client";

import { useState } from "react";
import type {
  TrustIssueFlag,
  TrustDimensionRatings,
  ArrivalStatus,
} from "@/lib/types";

interface TrustReviewModalProps {
  bookingId: string;
  revieweeName: string;
  reviewerRole: "venue" | "renter";
  onClose: () => void;
  onSuccess: () => void;
}

// ── Issue flags per reviewer role ─────────────────────────────────────────────

const VENUE_ISSUE_FLAGS: { id: TrustIssueFlag; label: string }[] = [
  { id: "late_cancellation", label: "Late cancellation" },
  { id: "no_show", label: "No-show" },
  { id: "damage", label: "Damage to station" },
  { id: "unprofessional", label: "Unprofessional conduct" },
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

// ── Mini star picker ──────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  const starSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            className={`${starSize} transition-colors ${
              s <= display ? "text-warning" : "text-border"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Step summary stars (small, read-only) ────────────────────────────────────

function StarSummary({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "text-warning" : "text-border"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

type Step = "rating" | "dimensions" | "followup" | "done";

export default function TrustReviewModal({
  bookingId,
  revieweeName,
  reviewerRole,
  onClose,
  onSuccess,
}: TrustReviewModalProps) {
  const [step, setStep] = useState<Step>("rating");
  const [hoverRating, setHoverRating] = useState(0);
  const [quickRating, setQuickRating] = useState(0);

  // Venue → Renter dimensions
  const [arrivalStatus, setArrivalStatus] = useState<ArrivalStatus | null>(null);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [commRating, setCommRating] = useState(0);

  // Renter → Venue dimensions
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [fairnessRating, setFairnessRating] = useState(0);

  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null);
  const [selectedFlags, setSelectedFlags] = useState<Set<TrustIssueFlag>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const displayRating = hoverRating || quickRating;
  const STAR_LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];
  const issueFlags = reviewerRole === "venue" ? VENUE_ISSUE_FLAGS : RENTER_ISSUE_FLAGS;

  function toggleFlag(flag: TrustIssueFlag) {
    setSelectedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  }

  function handleRatingSelect(rating: number) {
    setQuickRating(rating);
    setHoverRating(0);
    setTimeout(() => setStep("dimensions"), 120);
  }

  // Check whether dimension step is complete enough to proceed
  function dimensionsComplete(): boolean {
    if (reviewerRole === "venue") {
      return arrivalStatus !== null && professionalismRating > 0 && cleanlinessRating > 0 && commRating > 0;
    }
    return accuracyRating > 0 && fairnessRating > 0 && commRating > 0;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const dimensionRatings: TrustDimensionRatings = {};
      if (reviewerRole === "venue") {
        if (arrivalStatus) dimensionRatings.arrivalStatus = arrivalStatus;
        if (professionalismRating) dimensionRatings.professionalism = professionalismRating;
        if (cleanlinessRating) dimensionRatings.cleanliness = cleanlinessRating;
        if (commRating) dimensionRatings.communication = commRating;
      } else {
        if (accuracyRating) dimensionRatings.accuracy = accuracyRating;
        if (fairnessRating) dimensionRatings.fairness = fairnessRating;
        if (commRating) dimensionRatings.communication = commRating;
      }

      const body: Record<string, unknown> = {
        bookingId,
        quickRating,
        dimensionRatings,
      };
      if (wouldBookAgain !== null) body.wouldBookAgain = wouldBookAgain;
      if (selectedFlags.size > 0) body.issueFlags = Array.from(selectedFlags);

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
      setTimeout(() => onSuccess(), 2200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-muted/10 transition-colors"
      aria-label="Close"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  const BackButton = ({ to }: { to: Step }) => (
    <button
      onClick={() => setStep(to)}
      className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      Back
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl overflow-hidden">

        {/* ── Done ── */}
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

        {/* ── Step 1: Overall rating ── */}
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
              <CloseButton />
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRatingSelect(star)}
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <svg
                    className={`h-10 w-10 transition-colors ${star <= displayRating ? "text-warning" : "text-border"}`}
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

        {/* ── Step 2: Dimension questions ── */}
        {step === "dimensions" && (
          <div className="px-6 pt-5 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <BackButton to="rating" />
              <StarSummary rating={quickRating} />
              <CloseButton />
            </div>

            <p className="mb-4 text-sm font-semibold text-foreground">
              A little more detail
            </p>

            <div className="space-y-4">
              {reviewerRole === "venue" ? (
                <>
                  {/* Arrival */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground">
                      Did {revieweeName} arrive on time?
                    </p>
                    <div className="flex gap-2">
                      {(["on_time", "late", "no_show"] as ArrivalStatus[]).map((v) => {
                        const labels = { on_time: "On time", late: "Late", no_show: "No-show" };
                        const active = arrivalStatus === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setArrivalStatus(v)}
                            className={`flex-1 rounded-lg py-2 text-xs font-semibold ring-1 transition-all cursor-pointer ${
                              active
                                ? v === "on_time"
                                  ? "bg-success/10 text-success ring-success/40"
                                  : "bg-danger/10 text-danger ring-danger/40"
                                : "bg-card text-muted ring-border hover:ring-muted/50"
                            }`}
                          >
                            {labels[v]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Professionalism */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Professionalism in the space
                    </p>
                    <StarPicker value={professionalismRating} onChange={setProfessionalismRating} />
                  </div>

                  {/* Cleanliness */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Left the station clean
                    </p>
                    <StarPicker value={cleanlinessRating} onChange={setCleanlinessRating} />
                  </div>

                  {/* Communication */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Communication
                    </p>
                    <StarPicker value={commRating} onChange={setCommRating} />
                  </div>
                </>
              ) : (
                <>
                  {/* Listing accuracy */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Was the listing accurate to what you found?
                    </p>
                    <StarPicker value={accuracyRating} onChange={setAccuracyRating} />
                  </div>

                  {/* Fairness */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Were the house rules fair and clearly communicated?
                    </p>
                    <StarPicker value={fairnessRating} onChange={setFairnessRating} />
                  </div>

                  {/* Communication */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">
                      Communication with the venue
                    </p>
                    <StarPicker value={commRating} onChange={setCommRating} />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setStep("followup")}
              disabled={!dimensionsComplete()}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 3: Would book again + optional issue flags ── */}
        {step === "followup" && (
          <div className="px-6 pt-5 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <BackButton to="dimensions" />
              <StarSummary rating={quickRating} />
              <CloseButton />
            </div>

            {/* Would book again */}
            <p className="mb-3 text-sm font-medium text-foreground">
              Would you{" "}
              {reviewerRole === "renter" ? "return to this venue" : "host them again"}?
            </p>
            <div className="flex gap-3 mb-5">
              {(["yes", "no"] as const).map((val) => {
                const isYes = val === "yes";
                const active = wouldBookAgain === (isYes ? true : false) && wouldBookAgain !== null;
                return (
                  <button
                    key={val}
                    type="button"
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

            {/* Issue flags — only shown for low ratings */}
            {quickRating <= 3 && (
              <>
                <p className="mb-2 text-xs font-medium text-foreground">
                  What went wrong?{" "}
                  <span className="text-muted font-normal">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {issueFlags.map(({ id, label }) => {
                    const active = selectedFlags.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleFlag(id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-all cursor-pointer ${
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
            )}

            {error && <p className="mb-3 text-xs text-danger">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || wouldBookAgain === null}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Saving…" : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
