import { Schema, model, models } from "mongoose";

const venueProfileSchema = new Schema(
  {
    venueId: { type: String, required: true, unique: true },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    latitude: Number,
    longitude: Number,
    photos: { type: [String], default: [] },
    bannerPhoto: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    specialties: { type: [String], default: [] },
    boothPolicies: { type: [String], default: [] },
    showReviews: { type: Boolean, default: true },
    website: { type: String, default: "" },
    instagram: { type: String, default: "" },
  },
  { timestamps: true }
);

export const VenueProfileModel =
  models?.VenueProfile ?? model("VenueProfile", venueProfileSchema);
