import { Schema, model, models } from "mongoose";

const reviewScoresSchema = new Schema(
  {
    cleanliness: { type: Number, required: true, min: 1, max: 10 },
    accuracy: { type: Number, required: true, min: 1, max: 10 },
    communication: { type: Number, required: true, min: 1, max: 10 },
  },
  { _id: false }
);

const reviewSchema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    listingId: { type: String, required: true },
    venueId: { type: String, default: "" },
    renterId: { type: String, required: true },
    renterName: { type: String, required: true },
    renterAvatarUrl: String,
    scores: { type: reviewScoresSchema, required: true },
    comment: String,
  },
  { timestamps: true }
);

reviewSchema.index({ listingId: 1, createdAt: -1 });

export const ReviewModel = models?.Review ?? model("Review", reviewSchema);
