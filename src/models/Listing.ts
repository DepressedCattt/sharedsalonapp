import mongoose, { Schema, model, models } from "mongoose";

const availabilitySlotSchema = new Schema(
  { day: Number, start: String, end: String },
  { _id: false }
);

const mediaItemSchema = new Schema(
  { url: String, type: { type: String, enum: ["image", "video"] } },
  { _id: false }
);

const listingSchema = new Schema(
  {
    venueId: { type: String, required: true },
    venueName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priceType: {
      type: String,
      enum: ["daily", "weekly", "commission", "hybrid"],
      required: true,
    },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    availability: [availabilitySlotSchema],
    equipmentIncluded: [String],
    media: [mediaItemSchema],
    houseRules: [String],
    listingMode: { type: String, enum: ["one_off", "recurring"], default: "one_off" },
    slotCapacity: { type: Number, default: 1 },
    rating: { type: Number, default: 0 },
    ratingBreakdown: {
      type: {
        cleanliness: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
      default: () => ({ cleanliness: 0, accuracy: 0, communication: 0, count: 0 }),
    },
  },
  { timestamps: true }
);

export const ListingModel =
  models?.Listing ?? model("Listing", listingSchema);
