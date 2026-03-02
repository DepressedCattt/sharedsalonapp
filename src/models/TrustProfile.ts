import { Schema, model, models } from "mongoose";

const renterMetricsSchema = new Schema(
  {
    reliabilityScore: { type: Number, default: 0 },
    professionalismScore: { type: Number, default: 0 },
    cleanlinessScore: { type: Number, default: 0 },
    responsivenessScore: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    totalCancelled: { type: Number, default: 0 },
    disputeCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const venueMetricsSchema = new Schema(
  {
    fairnessScore: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 0 },
    paymentScore: { type: Number, default: 0 },
    activeFreelancers: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    disputeCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const trustProfileSchema = new Schema(
  {
    accountId: { type: String, required: true, unique: true },
    role: { type: String, enum: ["venue", "renter"], required: true },
    tier: {
      type: String,
      enum: ["fresh", "bronze", "silver", "gold", "platinum", "trailblazer"],
      default: "fresh",
    },
    foundingVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 0 },
    pendingTrustScore: { type: Number, default: 0 },
    renterMetrics: { type: renterMetricsSchema, default: null },
    venueMetrics: { type: venueMetricsSchema, default: null },
    lastCalculatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

trustProfileSchema.index({ accountId: 1 });

export const TrustProfileModel =
  models?.TrustProfile ?? model("TrustProfile", trustProfileSchema);
