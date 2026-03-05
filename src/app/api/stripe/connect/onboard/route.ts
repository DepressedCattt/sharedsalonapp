/**
 * POST /api/stripe/connect/onboard
 *
 * Creates (or retrieves) a Stripe V2 connected account for the authenticated venue
 * and returns a V2 Account Link URL to redirect the user to Stripe's hosted onboarding.
 *
 * Uses the Stripe V2 API:
 *   - stripeClient.v2.core.accounts.create()  — for creating the account
 *   - stripeClient.v2.core.accountLinks.create() — for generating the onboarding link
 *
 * Account model:
 *   - Platform is responsible for fees AND losses (fees_collector / losses_collector = 'application')
 *   - 'recipient' configuration with stripe_transfers capability requested
 *   - This enables destination charges: platform processes payment, then transfers to the venue
 *
 * If the venue already has a V2 stripeConnectAccountId, a fresh Account Link is generated
 * so they can complete or re-visit onboarding.
 *
 * If the venue had an older V1 Express account, a new V2 account is created and replaces it.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // PLACEHOLDER: STRIPE_SECRET_KEY must be set in .env.local (sk_test_... or sk_live_...)
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
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const venueId = `${session.user.id}_venue`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    // getStripe() returns a singleton Stripe client — used for all requests including V2
    const stripe = getStripe();

    // Fetch the existing venue profile to get display name and existing account ID
    const venue = await VenueProfileModel.findOne({ venueId }).lean() as {
      stripeConnectAccountId?: string | null;
      stripeConnectIsV2?: boolean;
      displayName?: string;
    } | null;

    const existingAccountId = venue?.stripeConnectAccountId ?? null;
    const existingIsV2 = venue?.stripeConnectIsV2 ?? false;

    let accountId: string;

    if (existingAccountId && existingIsV2) {
      // Venue already has a V2 account — reuse it and just generate a fresh link
      accountId = existingAccountId;
    } else {
      // Either no account exists, or the existing one is a V1 Express account.
      // Create a new V2 account. The platform is responsible for fees and losses,
      // and the venue's account is configured as a "recipient" for receiving transfers.
      //
      // NOTE: If migrating from V1, the old V1 account will be orphaned in Stripe;
      // only the new V2 account ID is stored and used going forward.
      const account = await stripe.v2.core.accounts.create({
        // Display name shown to the venue in their Stripe Express dashboard
        display_name: venue?.displayName || session.user.name || venueId,
        // The venue owner's email address — used for Stripe to contact them
        contact_email: session.user.email!,
        identity: {
          // PLACEHOLDER: Set to the appropriate country for your market (e.g. 'AU', 'US', 'GB')
          country: "AU",
        },
        // 'express' gives the connected account a Stripe-hosted Express dashboard
        dashboard: "express",
        defaults: {
          responsibilities: {
            // Platform (application) collects and retains all fees
            fees_collector: "application",
            // Platform bears liability for any losses (e.g. chargebacks)
            losses_collector: "application",
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: {
                  // Request the stripe_transfers capability so this account can
                  // receive transfers from the platform (used in destination charges)
                  requested: true,
                },
              },
            },
          },
        },
        metadata: {
          // Store venueId in metadata so we can look up the venue from webhook events
          venueId,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as never);

      accountId = account.id;

      // Persist the new V2 account ID to the venue's profile
      await VenueProfileModel.findOneAndUpdate(
        { venueId },
        {
          $set: {
            stripeConnectAccountId: accountId,
            stripeConnectOnboarded: false,
            stripeConnectIsV2: true, // mark as V2 so status checks use the right API
          },
        },
        { upsert: true }
      );
    }

    // Generate a V2 Account Link for the hosted onboarding flow.
    // Stripe hosts the KYC/requirements form and redirects back when done.
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          // Only onboard the 'recipient' configuration (not 'controller' etc.)
          configurations: ["recipient"],
          // refresh_url: called when the link expires; regenerates a fresh link
          refresh_url: `${appUrl}/api/stripe/connect/return?refresh=true`,
          // return_url: called after the venue finishes (or skips) onboarding
          return_url: `${appUrl}/stripe/connect/return`,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ url: (accountLink as any).url });
  } catch (err) {
    console.error("POST /api/stripe/connect/onboard error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe onboarding link." },
      { status: 500 }
    );
  }
}
