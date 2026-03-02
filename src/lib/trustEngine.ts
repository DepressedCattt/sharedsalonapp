import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import { TrustProfileModel } from "@/models/TrustProfile";
import { TrustReviewModel } from "@/models/TrustReview";
import type {
  TrustTier,
  RenterTrustMetrics,
  VenueTrustMetrics,
  TrustDimensionRatings,
} from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map a 1–5 star rating to a 0–100 score. */
function starsTo100(stars: number): number {
  return Math.round(((stars - 1) / 4) * 100);
}

/** Map arrival status string to a reliability score 0–100. */
function arrivalToScore(status: string | null | undefined): number {
  if (status === "on_time") return 100;
  if (status === "late") return 50;
  if (status === "no_show") return 0;
  return 70; // neutral fallback when no data
}

/**
 * Safely cast the Mixed dimensionRatings field from a lean Mongoose document.
 * Stored as Schema.Types.Mixed to avoid subdocument schema caching issues.
 */
function getDimRatings(review: { dimensionRatings?: unknown }): TrustDimensionRatings {
  if (!review.dimensionRatings || typeof review.dimensionRatings !== "object") return {};
  return review.dimensionRatings as TrustDimensionRatings;
}

// ── Tier Assignment ──────────────────────────────────────────────────────────

/**
 * Tiers:
 *   Fresh       — < 5 completed bookings (calibration period, no rank)
 *   Bronze      — score 0–59, 5+ bookings
 *   Silver      — score 60–74, 5+ bookings
 *   Gold        — score 75–94, 5+ bookings
 *   Platinum    — score ≥ 90 AND 20+ bookings (both gates required)
 *   Trailblazer — foundingVerified = true (separate track, admin-granted only)
 *
 * The score is the raw weighted composite — no confidence weighting applied.
 * Booking count only gates Fresh→ranked and the Platinum threshold.
 *
 * Public tier/score only updates at every 5th completed booking (milestone)
 * to prevent reviewers from being identified by immediate rank shifts.
 */
export function assignTier(
  score: number,
  completedCount: number,
  foundingVerified: boolean
): TrustTier {
  if (foundingVerified) return "trailblazer";
  if (completedCount < 5) return "fresh";
  if (completedCount >= 20 && score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  return "bronze";
}

// ── Renter Score Computation ─────────────────────────────────────────────────

/**
 * Weights: Reliability 40% · Professionalism 30% · Cleanliness 20% · Responsiveness 10%
 * Repeat rate is intentionally excluded — it reflects habit, not quality.
 */
export async function computeRenterTrustScore(accountId: string): Promise<{
  score: number;
  metrics: RenterTrustMetrics;
}> {
  const bookings = await BookingRequestModel.find({ renterId: accountId }).lean();

  const completed = bookings.filter((b) => b.status === "completed").length;
  const renterCancelled = bookings.filter(
    (b) => b.cancelledBy === "renter"
  ).length;

  // Published reviews about this renter (written by venues)
  const publishedReviews = await TrustReviewModel.find({
    revieweeAccountId: accountId,
    reviewerRole: "venue",
    isPublished: true,
  }).lean();

  let reliabilityScore = 70;
  let professionalismScore = 70;
  let cleanlinessScore = 70;
  let responsivenessScore = 70;

  if (publishedReviews.length > 0) {
    // Reliability from arrivalStatus answers
    const arrivalScores = publishedReviews
      .map((r) => getDimRatings(r).arrivalStatus)
      .filter((s) => s != null)
      .map((s) => arrivalToScore(s));

    if (arrivalScores.length > 0) {
      reliabilityScore = Math.round(
        arrivalScores.reduce((s, v) => s + v, 0) / arrivalScores.length
      );
    }

    // Professionalism from 1–5 rating
    const profScores = publishedReviews
      .map((r) => getDimRatings(r).professionalism)
      .filter((v): v is number => v != null)
      .map(starsTo100);

    if (profScores.length > 0) {
      professionalismScore = Math.round(
        profScores.reduce((s, v) => s + v, 0) / profScores.length
      );
    }

    // Cleanliness from 1–5 rating
    const cleanScores = publishedReviews
      .map((r) => getDimRatings(r).cleanliness)
      .filter((v): v is number => v != null)
      .map(starsTo100);

    if (cleanScores.length > 0) {
      cleanlinessScore = Math.round(
        cleanScores.reduce((s, v) => s + v, 0) / cleanScores.length
      );
    }

    // Responsiveness from communication 1–5 rating
    const commScores = publishedReviews
      .map((r) => getDimRatings(r).communication)
      .filter((v): v is number => v != null)
      .map(starsTo100);

    if (commScores.length > 0) {
      responsivenessScore = Math.round(
        commScores.reduce((s, v) => s + v, 0) / commScores.length
      );
    }
  }

  const disputeCount = publishedReviews.filter((r) =>
    r.issueFlags.some((f: string) =>
      ["damage", "no_show", "rules_violation"].includes(f)
    )
  ).length;

  const rawScore = Math.round(
    reliabilityScore * 0.4 +
      professionalismScore * 0.3 +
      cleanlinessScore * 0.2 +
      responsivenessScore * 0.1
  );

  const metrics: RenterTrustMetrics = {
    reliabilityScore,
    professionalismScore,
    cleanlinessScore,
    responsivenessScore,
    totalCompleted: completed,
    totalCancelled: renterCancelled,
    disputeCount,
  };

  return { score: Math.min(100, Math.max(0, rawScore)), metrics };
}

// ── Venue Score Computation ──────────────────────────────────────────────────

/**
 * Weights: Fairness 40% · Satisfaction 40% · Dispute penalty 10% · Payment 10%
 * Retention rate is intentionally excluded — it reflects habit, not quality.
 */
export async function computeVenueTrustScore(accountId: string): Promise<{
  score: number;
  metrics: VenueTrustMetrics;
}> {
  const bookings = await BookingRequestModel.find({ venueId: accountId }).lean();

  const totalCompleted = bookings.filter((b) => b.status === "completed").length;

  // Active freelancers (informational only — not used in scoring)
  const renterIds = new Set(
    bookings
      .filter((b) => b.status === "completed" || b.status === "approved")
      .map((b) => b.renterId)
  );
  const activeFreelancers = renterIds.size;

  // Published trust reviews about this venue (written by renters)
  const publishedTrustReviews = await TrustReviewModel.find({
    revieweeAccountId: accountId,
    reviewerRole: "renter",
    isPublished: true,
  }).lean();

  let fairnessScore = 70;
  let satisfactionScore = 70;
  const paymentScore = 70; // v1 default — bumped to 95 with verified payment in v2

  if (publishedTrustReviews.length > 0) {
    // Fairness from 1–5 rating
    const fairScores = publishedTrustReviews
      .map((r) => getDimRatings(r).fairness)
      .filter((v): v is number => v != null)
      .map(starsTo100);

    if (fairScores.length > 0) {
      fairnessScore = Math.round(
        fairScores.reduce((s, v) => s + v, 0) / fairScores.length
      );
    }

    // Satisfaction: blend accuracy + communication ratings
    const satInputs: number[] = [];
    publishedTrustReviews.forEach((r) => {
      const dr = getDimRatings(r);
      if (dr.accuracy != null) satInputs.push(starsTo100(dr.accuracy));
      if (dr.communication != null) satInputs.push(starsTo100(dr.communication));
    });

    if (satInputs.length > 0) {
      satisfactionScore = Math.round(
        satInputs.reduce((s, v) => s + v, 0) / satInputs.length
      );
    }
  }

  const disputeCount = publishedTrustReviews.filter((r) =>
    r.issueFlags.some((f: string) =>
      ["rules_changed", "payment_issue", "listing_inaccurate"].includes(f)
    )
  ).length;

  const disputeScore = Math.max(0, 100 - disputeCount * 20);

  const rawScore = Math.round(
    fairnessScore * 0.4 +
      satisfactionScore * 0.4 +
      disputeScore * 0.1 +
      paymentScore * 0.1
  );

  const metrics: VenueTrustMetrics = {
    fairnessScore,
    satisfactionScore,
    paymentScore,
    activeFreelancers,
    totalCompleted,
    disputeCount,
  };

  return { score: Math.min(100, Math.max(0, rawScore)), metrics };
}

// ── Upsert TrustProfile ──────────────────────────────────────────────────────

/**
 * Recomputes the trust profile for a given account.
 *
 * - pendingTrustScore is always updated (internal, admin-visible).
 * - trustScore and tier only update at every 5th completed booking (milestone)
 *   to prevent reviewers from being identified by immediate rank shifts.
 * - The first milestone is at 5 bookings, which is also when the account
 *   graduates from the "Fresh" calibration tier.
 */
export async function upsertTrustProfile(
  accountId: string,
  role: "venue" | "renter"
) {
  await connectDB();

  let rawScore: number;
  let renterMetrics: RenterTrustMetrics | undefined;
  let venueMetrics: VenueTrustMetrics | undefined;
  let completedCount = 0;

  if (role === "renter") {
    const result = await computeRenterTrustScore(accountId);
    rawScore = result.score;
    renterMetrics = result.metrics;
    completedCount = result.metrics.totalCompleted;
  } else {
    const result = await computeVenueTrustScore(accountId);
    rawScore = result.score;
    venueMetrics = result.metrics;
    completedCount = result.metrics.totalCompleted;
  }

  const existing = await TrustProfileModel.findOne({ accountId }).lean() as {
    foundingVerified?: boolean;
    tier?: string;
    trustScore?: number;
  } | null;

  const foundingVerified = existing?.foundingVerified ?? false;
  const newTier = assignTier(rawScore, completedCount, foundingVerified);

  // Milestone check: only publish tier/score at every 5th booking
  const isMilestone = completedCount > 0 && completedCount % 5 === 0;

  const updatePayload: Record<string, unknown> = {
    role,
    pendingTrustScore: rawScore,
    lastCalculatedAt: new Date(),
    ...(role === "renter" ? { renterMetrics } : { venueMetrics }),
  };

  // On milestone (or first time with no existing profile): update public fields
  if (isMilestone || !existing) {
    updatePayload.tier = newTier;
    updatePayload.trustScore = rawScore;
  }

  const profile = await TrustProfileModel.findOneAndUpdate(
    { accountId },
    { $set: updatePayload },
    { upsert: true, new: true }
  ).lean();

  return profile;
}

// ── Publish Check ────────────────────────────────────────────────────────────

/**
 * After a TrustReview is submitted, check whether both sides have now
 * submitted reviews for the same booking. If so, publish both and trigger
 * a recompute of the reviewee's TrustProfile.
 */
export async function checkAndPublishReviews(bookingId: string) {
  await connectDB();

  const reviews = await TrustReviewModel.find({ bookingId }).lean();
  if (reviews.length < 2) return; // still waiting on the other side

  const unpublished = reviews.filter((r) => !r.isPublished);
  if (unpublished.length === 0) return; // already published

  await TrustReviewModel.updateMany(
    { bookingId },
    { $set: { isPublished: true } }
  );

  // Recompute TrustProfile for both reviewees
  for (const review of reviews) {
    const revieweeRole = review.reviewerRole === "renter" ? "venue" : "renter";
    await upsertTrustProfile(review.revieweeAccountId, revieweeRole);
  }
}

/**
 * Publish reviews where the 7-day window has expired (called on GET requests
 * as a lightweight sweep — no background job needed for MVP).
 */
export async function publishExpiredReviews() {
  await connectDB();

  const expiredReviews = await TrustReviewModel.find({
    isPublished: false,
    publishAfter: { $lte: new Date() },
  }).lean();

  const bookingIds = [...new Set(expiredReviews.map((r) => r.bookingId))];

  for (const bookingId of bookingIds) {
    await TrustReviewModel.updateMany(
      { bookingId, isPublished: false, publishAfter: { $lte: new Date() } },
      { $set: { isPublished: true } }
    );

    const reviews = await TrustReviewModel.find({ bookingId }).lean();
    for (const review of reviews) {
      const revieweeRole = review.reviewerRole === "renter" ? "venue" : "renter";
      await upsertTrustProfile(review.revieweeAccountId, revieweeRole);
    }
  }
}
