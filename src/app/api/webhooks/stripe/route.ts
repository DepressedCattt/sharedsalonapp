/**
 * POST /api/webhooks/stripe
 *
 * Handles incoming Stripe webhook events. Registered events:
 *   - checkout.session.completed        → mark booking as paid
 *   - account.updated                   → sync venue Stripe Connect onboarding status
 *   - identity.verification_session.verified       → mark user ID as verified
 *   - identity.verification_session.requires_input → log failed ID verification
 *
 * Setup:
 *  1. In Stripe Dashboard → Developers → Webhooks, add an endpoint:
 *       https://yourdomain.com/api/webhooks/stripe
 *     Subscribe to all four events above.
 *  2. Copy the signing secret and add it to .env.local:
 *       STRIPE_WEBHOOK_SECRET=whsec_...
 *       STRIPE_SECRET_KEY=sk_...
 *
 * During local development use the Stripe CLI:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import { VenueProfileModel } from "@/models/VenueProfile";
import { TrustProfileModel } from "@/models/TrustProfile";
import type Stripe from "stripe";

// Next.js App Router requires raw body for Stripe signature verification.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (
    !webhookSecret ||
    webhookSecret === "whsec_..." ||
    !stripeKey ||
    stripeKey === "sk_test_..."
  ) {
    console.warn(
      "[stripe webhook] Keys not configured — skipping signature verification."
    );
    return NextResponse.json({ received: true });
  }

  const { default: StripeLib } = await import("stripe");
  const stripe = new StripeLib(stripeKey);

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    // ── Payment completed ──────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await BookingRequestModel.findByIdAndUpdate(bookingId, {
          $set: { paymentStatus: "paid" },
        });
        console.log(`[stripe webhook] Booking ${bookingId} marked as paid.`);
      }
      break;
    }

    // ── Venue Connect account updated ──────────────────────────────────────
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const venueId = account.metadata?.venueId;
      if (venueId && account.details_submitted) {
        await VenueProfileModel.findOneAndUpdate(
          { venueId },
          { $set: { stripeConnectOnboarded: true } }
        );
        console.log(
          `[stripe webhook] Venue ${venueId} Stripe Connect onboarding complete.`
        );
      }
      break;
    }

    // ── Identity verification ──────────────────────────────────────────────
    case "identity.verification_session.verified": {
      const vs = event.data.object as Stripe.Identity.VerificationSession;
      const accountId = vs.metadata?.accountId;
      if (accountId) {
        await TrustProfileModel.findOneAndUpdate(
          { accountId },
          { $set: { idVerified: true, idVerifiedAt: new Date() } },
          { upsert: false }
        );
        console.log(
          `[stripe webhook] Identity verified for account ${accountId}.`
        );
      }
      break;
    }

    case "identity.verification_session.requires_input": {
      const vs = event.data.object as Stripe.Identity.VerificationSession;
      console.warn(
        "[stripe webhook] Identity verification requires input:",
        vs.last_error
      );
      break;
    }

    default:
      console.log(`[stripe webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
