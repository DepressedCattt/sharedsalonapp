/**
 * GET /api/stripe/checkout/confirm?bookingId=xxx
 *
 * Verifies a booking's payment status directly via the Stripe API and syncs
 * the result to the database. This handles the race condition between:
 *   - Stripe redirecting the user back to the app (fast — happens immediately)
 *   - Stripe firing the checkout.session.completed webhook (slower — may lag seconds)
 *
 * In local development the webhook never arrives (Stripe can't reach localhost),
 * so without this endpoint the paymentStatus would stay "pending_payment" forever
 * even after a successful payment.
 *
 * Returns:
 *   { paymentStatus: "paid" | "pending_payment" | "unpaid" | "refunded" }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookingId = req.nextUrl.searchParams.get("bookingId");
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const booking = await BookingRequestModel.findById(bookingId).lean() as {
    renterId: string;
    paymentStatus?: string;
    stripeCheckoutSessionId?: string;
  } | null;

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only the renter who owns this booking can check its payment status
  const renterId = `${session.user.id}_renter`;
  if (booking.renterId !== renterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Already confirmed paid in DB — no need to call Stripe
  if (booking.paymentStatus === "paid") {
    return NextResponse.json({ paymentStatus: "paid" });
  }

  // No Stripe session attached yet — payment hasn't started
  if (!booking.stripeCheckoutSessionId) {
    return NextResponse.json({ paymentStatus: booking.paymentStatus ?? "unpaid" });
  }

  // If Stripe isn't configured (e.g. running without keys), return DB value
  if (!isStripeConfigured()) {
    return NextResponse.json({ paymentStatus: booking.paymentStatus ?? "unpaid" });
  }

  try {
    const stripe = getStripe();

    // Retrieve the Checkout Session directly from Stripe to get the real-time status.
    // payment_status values: "paid" | "unpaid" | "no_payment_required"
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      booking.stripeCheckoutSessionId
    );

    if (checkoutSession.payment_status === "paid") {
      // Sync to DB — mirrors what the checkout.session.completed webhook does
      await BookingRequestModel.findByIdAndUpdate(bookingId, {
        $set: { paymentStatus: "paid" },
      });
      return NextResponse.json({ paymentStatus: "paid" });
    }

    // Still processing or not paid yet
    return NextResponse.json({
      paymentStatus:
        checkoutSession.payment_status === "unpaid"
          ? (booking.paymentStatus ?? "pending_payment")
          : "pending_payment",
    });
  } catch (err) {
    console.error("GET /api/stripe/checkout/confirm error:", err);
    return NextResponse.json({ paymentStatus: booking.paymentStatus ?? "pending_payment" });
  }
}
