import { Schema, model, models } from "mongoose";

const trustReviewSchema = new Schema(
  {
    bookingId: { type: String, required: true },
    reviewerAccountId: { type: String, required: true },
    reviewerRole: { type: String, enum: ["venue", "renter"], required: true },
    revieweeAccountId: { type: String, required: true },
    quickRating: { type: Number, required: true, min: 1, max: 5 },
    wouldBookAgain: { type: Boolean, default: null },
    issueFlags: {
      type: [String],
      enum: ["reliability", "cleanliness", "professionalism", "rules", "other"],
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

export const TrustReviewModel =
  models?.TrustReview ?? model("TrustReview", trustReviewSchema);
