import { Schema, model, models } from "mongoose";

const freelancerProfileSchema = new Schema(
  {
    renterId: { type: String, required: true, unique: true },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    photos: { type: [String], default: [] },
    profilePhoto: { type: String, default: null },
    bannerPhoto: { type: String, default: null },
    specialties: { type: [String], default: [] },
    showReviews: { type: Boolean, default: true },
    website: { type: String, default: "" },
    instagram: { type: String, default: "" },
  },
  { timestamps: true }
);

export const FreelancerProfileModel =
  models?.FreelancerProfile ?? model("FreelancerProfile", freelancerProfileSchema);
