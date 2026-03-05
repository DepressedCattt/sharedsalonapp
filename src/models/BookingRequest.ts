import mongoose, { model, models, Schema } from "mongoose";

const bookingRequestSchema = new Schema(
  {
    listingId: { type: String, required: true },
    listingTitle: { type: String, required: true },
    venueId: { type: String, required: true },
    venueName: { type: String, default: "" },
    renterId: { type: String, required: true },
    renterName: { type: String, required: true },
    renterAvatarUrl: String,
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    price: { type: Number, default: 0 },
    priceType: { type: String, enum: ["daily", "weekly", "commission", "hybrid"], default: "daily" },
    houseRulesAccepted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "completed"],
      default: "pending",
    },
    reviewSubmitted: { type: Boolean, default: false },
    trustReviewSubmitted: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["venue", "renter", null], default: null },
    bookingType: { type: String, enum: ["date_range", "recurring_slot"], default: "date_range" },
    recurringSlot: {
      type: { day: Number, start: String, end: String },
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending_payment", "paid", "refunded"],
      default: "unpaid",
    },
    stripeCheckoutSessionId: { type: String, default: null },
    totalAmount: { type: Number, default: null },
  },
  { timestamps: true }
);

export const BookingRequestModel =
  models?.BookingRequest ?? model("BookingRequest", bookingRequestSchema);
