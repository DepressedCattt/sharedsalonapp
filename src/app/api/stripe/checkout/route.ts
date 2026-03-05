/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for an approved booking using a destination
 * charge. Money flows: customer → platform → venue's connected account.
 *
 * Body: { bookingId: string }
 * Returns: { url: string } — the Stripe-hosted Checkout URL.
 *
 * Destination charge model:
 *   - The platform processes the full charge from the customer
 *   - An application_fee_amount is withheld by the platform
 *   - The remainder is transferred to the venue via transfer_data.destination
 *
 * Platform fee rate:
 *   Set PLATFORM_FEE_PERCENT in .env.local (default: 5 = 5%)
 *   PLACEHOLDER: set PLATFORM_FEE_PERCENT=0 to collect no fee during testing
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import { VenueProfileModel } from "@/models/VenueProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import mongoose from "mongoose";

/** Calculate total booking amount in AUD cents. */
function calculateTotalCents(
  price: number,
  priceType: string,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);

  let total: number;
  if (priceType === "weekly") {
    const weeks = Math.max(1, Math.ceil(days / 7));
    total = price * weeks;
  } else {
    // daily, commission, hybrid — use days
    total = price * days;
  }

  // Convert AUD dollars to cents
  return Math.round(total * 100);
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "renter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  let body: { bookingId?: string };
  try {
    body = await req.json() as { bookingId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { bookingId } = body;
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId." }, { status: 400 });
  }

  try {
    const booking = await BookingRequestModel.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const renterId = `${session.user.id}_renter`;
    if (booking.renterId !== renterId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (booking.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved bookings can be paid." },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This booking has already been paid." },
        { status: 400 }
      );
    }

    // Get venue's Stripe Connect account
    const venue = await VenueProfileModel.findOne({
      venueId: booking.venueId,
    }).lean() as {
      stripeConnectAccountId?: string | null;
      stripeConnectOnboarded?: boolean;
    } | null;

    if (!venue?.stripeConnectAccountId || !venue.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "The venue has not completed Stripe payout setup. Please contact them." },
        { status: 422 }
      );
    }

    const totalCents = calculateTotalCents(
      booking.price,
      booking.priceType,
      booking.startDate,
      booking.endDate
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();

    // Platform fee: read from env or default to 5%.
    // PLACEHOLDER: set PLATFORM_FEE_PERCENT=0 in .env.local to collect no fee during testing.
    const feePct = Math.max(
      0,
      Math.min(100, Number(process.env.PLATFORM_FEE_PERCENT ?? 5))
    );
    // application_fee_amount is withheld from the destination transfer (in cents).
    // e.g. 5% of $100 = $5 kept by platform, $95 transferred to venue.
    const applicationFeeAmount = Math.round(totalCents * (feePct / 100));

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            // PLACEHOLDER: change currency to match your market (e.g. 'usd', 'gbp')
            currency: "aud",
            unit_amount: totalCents,
            product_data: {
              name: booking.listingTitle,
              description: `Chair rental: ${booking.startDate} – ${booking.endDate} at ${booking.venueName}`,
            },
          },
        },
      ],
      payment_intent_data: {
        // Destination charge: full amount captured by platform, remainder transferred to venue.
        transfer_data: {
          destination: venue.stripeConnectAccountId,
        },
        // Platform fee withheld before transfer. Set PLATFORM_FEE_PERCENT=0 to disable.
        ...(applicationFeeAmount > 0 && {
          application_fee_amount: applicationFeeAmount,
        }),
        metadata: {
          bookingId: bookingId,
          renterId,
          venueId: booking.venueId,
          // Store fee details in metadata for reconciliation
          feePct: feePct.toString(),
          feeAmountCents: applicationFeeAmount.toString(),
        },
      },
      success_url: `${appUrl}/bookings?payment=success&bookingId=${bookingId}`,
      cancel_url: `${appUrl}/bookings?payment=cancelled&bookingId=${bookingId}`,
      metadata: {
        bookingId: bookingId,
      },
    });

    // Mark booking as awaiting payment
    await BookingRequestModel.findByIdAndUpdate(bookingId, {
      $set: {
        paymentStatus: "pending_payment",
        stripeCheckoutSessionId: checkoutSession.id,
        totalAmount: totalCents / 100,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("POST /api/stripe/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
