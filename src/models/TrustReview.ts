import { Schema, model, models } from "mongoose";

const trustReviewSchema = new Schema(
  {
    bookingId: { type: String, required: true },
    reviewerAccountId: { type: String, required: true },
    reviewerRole: { type: String, enum: ["venue", "renter"], required: true },
    revieweeAccountId: { type: String, required: true },
    quickRating: { type: Number, required: true, min: 1, max: 5 },
    // Mixed type avoids subdocument schema caching issues in Next.js dev HMR
    dimensionRatings: { type: Schema.Types.Mixed, default: {} },
    wouldBookAgain: { type: Boolean, default: null },
    issueFlags: {
      type: [String],
      enum: [
        "late_cancellation",
        "no_show",
        "damage",
        "unprofessional",
        "rules_violation",
        "listing_inaccurate",
        "rules_changed",
        "poor_communication",
        "venue_cleanliness",
        "payment_issue",
        "other",
      ],
      default: [],
    },
    isPublished: { type: Boolean, default: false },
    publishAfter: { type: Date, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One review per booking per reviewer
trustReviewSchema.index({ bookingId: 1, reviewerAccountId: 1 }, { unique: true });
trustReviewSchema.index({ revieweeAccountId: 1, isPublished: 1, createdAt: -1 });

// In development, bust the model cache on every HMR cycle so schema changes take effect immediately
if (process.env.NODE_ENV !== "production" && models?.TrustReview) {
  delete (models as Record<string, unknown>).TrustReview;
}

export const TrustReviewModel =
  models?.TrustReview ?? model("TrustReview", trustReviewSchema);
