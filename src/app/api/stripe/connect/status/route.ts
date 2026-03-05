/**
 * GET /api/stripe/connect/status
 *
 * Returns the Stripe Connect onboarding status for the authenticated venue.
 * Always queries Stripe directly — the DB flag is only a cache.
 *
 * For V2 accounts (stripeConnectIsV2 = true):
 *   - Retrieves the account using the V2 API
 *   - readyToReceivePayments = stripe_transfers capability is "active"
 *   - onboardingComplete = no currently_due or past_due requirements
 *
 * For legacy V1 Express accounts (stripeConnectIsV2 = false or absent):
 *   - Uses the V1 stripe.accounts.retrieve() path
 *   - onboarded = details_submitted && charges_enabled
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
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const venueId = `${session.user.id}_venue`;

  try {
    const venue = await VenueProfileModel.findOne({ venueId }).lean() as {
      stripeConnectAccountId?: string | null;
      stripeConnectOnboarded?: boolean;
      stripeConnectIsV2?: boolean;
    } | null;

    if (!venue?.stripeConnectAccountId) {
      return NextResponse.json({ onboarded: false, hasAccount: false });
    }

    if (!isStripeConfigured()) {
      // Stripe not configured locally — return cached DB value
      return NextResponse.json({
        onboarded: venue.stripeConnectOnboarded ?? false,
        hasAccount: true,
      });
    }

    const stripe = getStripe();

    if (venue.stripeConnectIsV2) {
      // ── V2 account status check ────────────────────────────────────────────
      //
      // Include 'configuration.recipient' to check capability status
      // and 'requirements' to check for any outstanding items.
      const account = await stripe.v2.core.accounts.retrieve(
        venue.stripeConnectAccountId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { include: ["configuration.recipient", "requirements"] } as never
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as unknown as {
        configuration?: {
          recipient?: {
            capabilities?: {
              stripe_balance?: {
                stripe_transfers?: {
                  status: string;
                };
              };
            };
          };
        };
        requirements?: {
          summary?: {
            minimum_deadline?: {
              status: string | null;
            };
          };
        };
      };

      // The account can receive transfers when this capability is "active"
      const readyToReceivePayments =
        account?.configuration?.recipient?.capabilities?.stripe_balance
          ?.stripe_transfers?.status === "active";

      // Onboarding is complete when there are no currently_due or past_due requirements
      const requirementsStatus =
        account?.requirements?.summary?.minimum_deadline?.status ?? null;
      const onboardingComplete =
        requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

      const onboarded = readyToReceivePayments && onboardingComplete;

      // Cache the result in the DB so checkout doesn't need to re-query Stripe every time
      if (onboarded && !venue.stripeConnectOnboarded) {
        await VenueProfileModel.findOneAndUpdate(
          { venueId },
          { $set: { stripeConnectOnboarded: true } }
        );
      }

      return NextResponse.json({
        onboarded,
        hasAccount: true,
        readyToReceivePayments,
        onboardingComplete,
        requirementsStatus,
        isV2: true,
      });
    } else {
      // ── V1 Express account status check (backward compat) ─────────────────
      const account = await stripe.accounts.retrieve(venue.stripeConnectAccountId);
      const onboarded =
        account.details_submitted && (account.charges_enabled || false);

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
        isV2: false,
      });
    }
  } catch (err) {
    console.error("GET /api/stripe/connect/status error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve Stripe account status." },
      { status: 500 }
    );
  }
}
