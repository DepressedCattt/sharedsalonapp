/**
 * GET /api/stripe/connect/status
 *
 * Returns the Stripe Connect onboarding status for the authenticated venue.
 * Called after returning from Stripe's hosted onboarding to confirm completion.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "venue") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  const venueId = `${session.user.id}_venue`;

  try {
    const venue = await VenueProfileModel.findOne({ venueId }).lean() as {
      stripeConnectAccountId?: string | null;
      stripeConnectOnboarded?: boolean;
    } | null;

    if (!venue?.stripeConnectAccountId) {
      return NextResponse.json({ onboarded: false, hasAccount: false });
    }

    // If Stripe is configured, verify directly with the Stripe API
    if (isStripeConfigured()) {
      const stripe = getStripe();
      const account = await stripe.accounts.retrieve(venue.stripeConnectAccountId);
      const onboarded =
        account.details_submitted &&
        (account.charges_enabled || false);

      if (onboarded && !venue.stripeConnectOnboarded) {
        await VenueProfileModel.findOneAndUpdate(
          { venueId },
          { $set: { stripeConnectOnboarded: true } }
        );
      }

      return NextResponse.json({
        onboarded,
        hasAccount: true,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
      });
    }

    return NextResponse.json({
      onboarded: venue.stripeConnectOnboarded ?? false,
      hasAccount: true,
    });
  } catch (err) {
    console.error("GET /api/stripe/connect/status error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve Stripe account status." },
      { status: 500 }
    );
  }
}
