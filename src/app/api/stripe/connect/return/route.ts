/**
 * GET /api/stripe/connect/return
 *
 * Stripe uses this as the refresh_url when the onboarding link expires.
 * Generates a fresh Account Link and redirects the venue back to Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const isRefresh = req.nextUrl.searchParams.get("refresh") === "true";

  if (!isRefresh) {
    return NextResponse.redirect(
      new URL("/stripe/connect/return", req.nextUrl.origin)
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(
      new URL("/settings?stripe=unconfigured", req.nextUrl.origin)
    );
  }

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "venue") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.redirect(
      new URL("/settings?stripe=error", req.nextUrl.origin)
    );
  }

  const venueId = `${session.user.id}_venue`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const venue = await VenueProfileModel.findOne({ venueId }).lean() as {
      stripeConnectAccountId?: string | null;
    } | null;

    if (!venue?.stripeConnectAccountId) {
      return NextResponse.redirect(
        new URL("/settings?stripe=no-account", req.nextUrl.origin)
      );
    }

    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
      account: venue.stripeConnectAccountId,
      refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
      return_url: `${appUrl}/stripe/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error("GET /api/stripe/connect/return error:", err);
    return NextResponse.redirect(
      new URL("/settings?stripe=error", req.nextUrl.origin)
    );
  }
}
