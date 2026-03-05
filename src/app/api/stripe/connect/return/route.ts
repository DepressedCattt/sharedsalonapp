/**
 * GET /api/stripe/connect/return
 *
 * Stripe calls this as the refresh_url when an Account Link expires mid-flow.
 * We generate a fresh V2 Account Link and redirect the venue back to Stripe.
 *
 * When ?refresh=true is absent (Stripe returning the user after completion),
 * we redirect to the frontend return page for status display.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const isRefresh = req.nextUrl.searchParams.get("refresh") === "true";

  if (!isRefresh) {
    // Normal return from Stripe onboarding — show the frontend status page
    return NextResponse.redirect(
      new URL("/stripe/connect/return", req.nextUrl.origin)
    );
  }

  // PLACEHOLDER: STRIPE_SECRET_KEY must be configured to regenerate a link
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
      stripeConnectIsV2?: boolean;
    } | null;

    if (!venue?.stripeConnectAccountId) {
      return NextResponse.redirect(
        new URL("/settings?stripe=no-account", req.nextUrl.origin)
      );
    }

    const stripe = getStripe();

    if (venue.stripeConnectIsV2) {
      // Regenerate a V2 Account Link for the expired session
      const accountLink = await stripe.v2.core.accountLinks.create({
        account: venue.stripeConnectAccountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["recipient"],
            refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
            return_url: `${appUrl}/stripe/connect/return`,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as never);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.redirect((accountLink as any).url);
    } else {
      // Backward compatibility: V1 Express account — use V1 account links
      const accountLink = await stripe.accountLinks.create({
        account: venue.stripeConnectAccountId,
        refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
        return_url: `${appUrl}/stripe/connect/return`,
        type: "account_onboarding",
      });
      return NextResponse.redirect(accountLink.url);
    }
  } catch (err) {
    console.error("GET /api/stripe/connect/return error:", err);
    return NextResponse.redirect(
      new URL("/settings?stripe=error", req.nextUrl.origin)
    );
  }
}
