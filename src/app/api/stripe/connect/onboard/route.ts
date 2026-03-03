/**
 * POST /api/stripe/connect/onboard
 *
 * Creates (or retrieves) a Stripe Express connected account for the authenticated
 * venue and returns a hosted Account Link URL to redirect the user to.
 *
 * If the venue already has a stripeConnectAccountId, a fresh Account Link is
 * generated so they can complete or re-visit onboarding.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 }
    );
  }

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();

    // Fetch or create the VenueProfile to get/set stripeConnectAccountId
    let venue = await VenueProfileModel.findOne({ venueId }).lean() as {
      stripeConnectAccountId?: string | null;
    } | null;

    let accountId = venue?.stripeConnectAccountId ?? null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "AU",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { venueId },
      });
      accountId = account.id;

      await VenueProfileModel.findOneAndUpdate(
        { venueId },
        { $set: { stripeConnectAccountId: accountId, stripeConnectOnboarded: false } },
        { upsert: true }
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
      return_url: `${appUrl}/stripe/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("POST /api/stripe/connect/onboard error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe onboarding link." },
      { status: 500 }
    );
  }
}
