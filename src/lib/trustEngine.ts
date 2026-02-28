import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import { ReviewModel } from "@/models/Review";
import { TrustProfileModel } from "@/models/TrustProfile";
import { TrustReviewModel } from "@/models/TrustReview";
import type {
  TrustTier,
  RenterTrustMetrics,
  VenueTrustMetrics,
} from "@/lib/types";

// ── Tier Assignment ──────────────────────────────────────────────────────────

export function assignTier(
  score: number,
  completedCount: number,
  foundingVerified: boolean
): TrustTier {
  if (foundingVerified) return "platinum"; // founding verified always display at platinum minimum
  if (completedCount < 1) return "unranked";
  if (completedCount >= 25 && score >= 85) return "platinum";
  if (completedCount >= 12 && score >= 72) return "gold";
  if (completedCount >= 5 && score >= 60) return "silver";
  return "bronze";
}

// ── Renter Score Computation ─────────────────────────────────────────────────

export async function computeRenterTrustScore(accountId: string): Promise<{
  score: number;
  metrics: RenterTrustMetrics;
}> {
  const bookings = await BookingRequestModel.find({ renterId: accountId }).lean();

  const completed = bookings.filter((b) => b.status === "completed").length;
  const renterCancelled = bookings.filter(
    (b) => b.cancelledBy === "renter"
  ).length;
  const declined = bookings.filter(
    (b) => b.status === "declined" && b.cancelledBy === "renter"
  ).length;

  const reliabilityDenominator = completed + renterCancelled + declined;
  const reliabilityScore =
    reliabilityDenominator > 0
      ? Math.round((completed / reliabilityDenominator) * 100)
      : completed > 0
      ? 100
      : 70; // neutral default for new accounts

  // Passive: repeat venue rate
  const approvedBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "approved"
  );
  const venueIds = approvedBookings.map((b) => b.venueId);
  const uniqueVenues = new Set(venueIds).size;
  const repeatRate =
    venueIds.length > 0 && uniqueVenues > 0
      ? Math.round(
          ((venueIds.length - uniqueVenues) / venueIds.length) * 100
        )
      : 0;

  // Trust reviews (venue → renter): professionalism + cleanliness
  const publishedReviews = await TrustReviewModel.find({
    revieweeAccountId: accountId,
    reviewerRole: "venue",
    isPublished: true,
  }).lean();

  let professionalismScore = 70; // neutral default
  let cleanlinessScore = 70;

  if (publishedReviews.length > 0) {
    const avgRating =
      publishedReviews.reduce((s, r) => s + r.quickRating, 0) /
      publishedReviews.length;
    // Map 1-5 star to 0-100
    professionalismScore = Math.round(((avgRating - 1) / 4) * 100);

    // Cleanliness: penalise for cleanliness issue flags
    const cleanlinessFlags = publishedReviews.filter((r) =>
      r.issueFlags.includes("cleanliness")
    ).length;
    const cleanlinessHitRate = cleanlinessFlags / publishedReviews.length;
    cleanlinessScore = Math.round(Math.max(0, (1 - cleanlinessHitRate) * 100));
  }

  const responsivenessScore = 70; // v1 default — computed from message timestamps in v2

  const disputeCount = publishedReviews.filter((r) =>
    r.issueFlags.includes("other")
  ).length;

  // Weighted composite score
  const score = Math.round(
    reliabilityScore * 0.3 +
      professionalismScore * 0.25 +
      cleanlinessScore * 0.15 +
      responsivenessScore * 0.1 +
      repeatRate * 0.2
  );

  const metrics: RenterTrustMetrics = {
    reliabilityScore,
    professionalismScore,
    cleanlinessScore,
    responsivenessScore,
    repeatRate,
    totalCompleted: completed,
    totalCancelled: renterCancelled,
    disputeCount,
  };

  return { score: Math.min(100, Math.max(0, score)), metrics };
}

// ── Venue Score Computation ──────────────────────────────────────────────────

export async function computeVenueTrustScore(accountId: string): Promise<{
  score: number;
  metrics: VenueTrustMetrics;
}> {
  const bookings = await BookingRequestModel.find({ venueId: accountId }).lean();

  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalCompleted = completedBookings.length;

  // Retention: % of distinct renters who booked more than once
  const renterBookingCounts: Record<string, number> = {};
  bookings
    .filter((b) => b.status === "completed" || b.status === "approved")
    .forEach((b) => {
      renterBookingCounts[b.renterId] =
        (renterBookingCounts[b.renterId] ?? 0) + 1;
    });
  const distinctRenters = Object.keys(renterBookingCounts).length;
  const repeatRenters = Object.values(renterBookingCounts).filter(
    (c) => c > 1
  ).length;
  const retentionRate =
    distinctRenters > 0
      ? Math.round((repeatRenters / distinctRenters) * 100)
      : 0;
  const activeFreelancers = distinctRenters;

  // Satisfaction from existing detailed reviews (renter → listing)
  const detailedReviews = await ReviewModel.find({ venueId: accountId }).lean();
  let satisfactionScore = 70;
  if (detailedReviews.length > 0) {
    const avgOverall =
      detailedReviews.reduce((s, r) => {
        const avg =
          (r.scores.cleanliness + r.scores.accuracy + r.scores.communication) /
          3;
        return s + avg;
      }, 0) / detailedReviews.length;
    // Convert 1-10 scale to 0-100
    satisfactionScore = Math.round(((avgOverall - 1) / 9) * 100);
  }

  // Trust reviews (renter → venue): fairness
  const publishedTrustReviews = await TrustReviewModel.find({
    revieweeAccountId: accountId,
    reviewerRole: "renter",
    isPublished: true,
  }).lean();

  let fairnessScore = 70;
  if (publishedTrustReviews.length > 0) {
    const avgRating =
      publishedTrustReviews.reduce((s, r) => s + r.quickRating, 0) /
      publishedTrustReviews.length;
    fairnessScore = Math.round(((avgRating - 1) / 4) * 100);

    // Incorporate trust reviews into satisfaction as well
    if (detailedReviews.length > 0) {
      satisfactionScore = Math.round((satisfactionScore + fairnessScore) / 2);
    } else {
      satisfactionScore = fairnessScore;
    }
  }

  const disputeCount = publishedTrustReviews.filter((r) =>
    r.issueFlags.some((f: string) => ["rules", "other"].includes(f))
  ).length;
  const disputeScore = Math.max(0, 100 - disputeCount * 20);

  const paymentScore = 70; // v1 default — bumped to 95 with verified payment

  const score = Math.round(
    fairnessScore * 0.3 +
      satisfactionScore * 0.3 +
      retentionRate * 0.2 +
      disputeScore * 0.1 +
      paymentScore * 0.1
  );

  const metrics: VenueTrustMetrics = {
    fairnessScore,
    satisfactionScore,
    retentionRate,
    paymentScore,
    activeFreelancers,
    totalCompleted,
    disputeCount,
  };

  return { score: Math.min(100, Math.max(0, score)), metrics };
}

// ── Upsert TrustProfile ──────────────────────────────────────────────────────

export async function upsertTrustProfile(
  accountId: string,
  role: "venue" | "renter"
) {
  await connectDB();

  let score: number;
  let renterMetrics: RenterTrustMetrics | undefined;
  let venueMetrics: VenueTrustMetrics | undefined;
  let completedCount = 0;

  if (role === "renter") {
    const result = await computeRenterTrustScore(accountId);
    score = result.score;
    renterMetrics = result.metrics;
    completedCount = result.metrics.totalCompleted;
  } else {
    const result = await computeVenueTrustScore(accountId);
    score = result.score;
    venueMetrics = result.metrics;
    completedCount = result.metrics.totalCompleted;
  }

  const existing = await TrustProfileModel.findOne({ accountId }).lean();
  const foundingVerified = (existing as { foundingVerified?: boolean })?.foundingVerified ?? false;
  const tier = assignTier(score, completedCount, foundingVerified);

  const updatePayload = {
    role,
    tier,
    trustScore: score,
    lastCalculatedAt: new Date(),
    ...(role === "renter" ? { renterMetrics } : { venueMetrics }),
  };

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
