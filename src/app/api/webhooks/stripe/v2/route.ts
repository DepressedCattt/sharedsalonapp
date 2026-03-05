/**
 * POST /api/webhooks/stripe/v2
 *
 * Handles Stripe V2 thin events for connected account requirement changes.
 * V2 events use a "thin" payload — only the event ID and type are sent by Stripe.
 * The full event data is fetched separately via stripe.v2.core.events.retrieve().
 *
 * Events handled:
 *   - v2.core.account[requirements].updated
 *       → An account's requirements changed (new docs needed, items resolved, etc.)
 *       → Re-check the account's onboarding status and update the DB cache
 *
 *   - v2.core.account[.recipient].capability_status_updated
 *       → The stripe_transfers capability status changed (e.g. became "active")
 *       → Mark venue as onboarded when transfers become active
 *
 * Setup:
 *   1. Stripe Dashboard → Developers → Webhooks → + Add destination
 *   2. Events from: "Connected accounts"
 *   3. Advanced options → Payload style: "Thin"
 *   4. Search for "v2" and select:
 *        - v2.core.account[requirements].updated
 *        - v2.core.account[.recipient].capability_status_updated
 *   5. Copy the signing secret and set STRIPE_WEBHOOK_SECRET_V2 in .env.local
 *
 * Local development (Stripe CLI):
 *   stripe listen \
 *     --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' \
 *     --forward-thin-to localhost:3000/api/webhooks/stripe/v2
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // PLACEHOLDER: Add STRIPE_WEBHOOK_SECRET_V2 to .env.local
  // Get this from Stripe Dashboard → Webhooks → (your V2 endpoint) → Signing secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_V2;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (
    !webhookSecret ||
    webhookSecret === "whsec_..." ||
    !stripeKey ||
    stripeKey === "sk_test_..."
  ) {
    console.warn(
      "[stripe v2 webhook] Keys not configured — skipping event processing."
    );
    return NextResponse.json({ received: true });
  }

  const { default: StripeLib } = await import("stripe");
  // Use the same Stripe client for all requests including V2 API calls
  const stripe = new StripeLib(stripeKey);

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  // parseThinEvent verifies the webhook signature and returns the thin event object.
  // Thin events only contain: id, type, created, and related_object — NOT the full payload.
  let thinEvent: { id: string; type: string };
  try {
    thinEvent = stripe.parseThinEvent(rawBody, sig, webhookSecret) as {
      id: string;
      type: string;
    };
  } catch (err) {
    console.error("[stripe v2 webhook] Thin event signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Fetch the full event data from Stripe.
  // This is required for thin events — the payload from Stripe is intentionally minimal.
  let event: {
    id: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    related_object?: any;
  };
  try {
    event = await stripe.v2.core.events.retrieve(thinEvent.id) as typeof event;
  } catch (err) {
    console.error("[stripe v2 webhook] Failed to retrieve full event:", err);
    return NextResponse.json({ error: "Failed to retrieve event" }, { status: 500 });
  }

  await connectDB();

  switch (event.type) {
    // ── Account requirements changed ──────────────────────────────────────────
    // Triggered when Stripe requests new information from a connected account
    // (e.g. due to regulatory changes, insufficient verification, or a passed deadline).
    case "v2.core.account[requirements].updated": {
      const connectedAccountId: string | undefined =
        event.related_object?.id ?? event.data?.account?.id;

      if (!connectedAccountId) {
        console.warn("[stripe v2 webhook] requirements.updated: no account ID in event");
        break;
      }

      console.log(
        `[stripe v2 webhook] Requirements updated for account ${connectedAccountId}`
      );

      // Re-fetch the account to get current requirements and capability status.
      // This ensures the DB stays in sync regardless of what changed.
      try {
        const account = await stripe.v2.core.accounts.retrieve(
          connectedAccountId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { include: ["configuration.recipient", "requirements"] } as never
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;

        const requirementsStatus =
          account?.requirements?.summary?.minimum_deadline?.status ?? null;
        const hasOutstandingRequirements =
          requirementsStatus === "currently_due" || requirementsStatus === "past_due";

        if (hasOutstandingRequirements) {
          // Mark venue as not fully onboarded — they need to complete requirements
          await VenueProfileModel.findOneAndUpdate(
            { stripeConnectAccountId: connectedAccountId },
            { $set: { stripeConnectOnboarded: false } }
          );
          console.log(
            `[stripe v2 webhook] Account ${connectedAccountId} has outstanding requirements (${requirementsStatus}) — marked not onboarded`
          );
        }
      } catch (err) {
        console.error(
          `[stripe v2 webhook] Failed to re-fetch account ${connectedAccountId}:`,
          err
        );
      }
      break;
    }

    // ── Capability status changed for the recipient configuration ─────────────
    // Triggered when the stripe_transfers capability becomes active, pending, or restricted.
    // This is the primary signal that a venue is ready to receive payments.
    case "v2.core.account[.recipient].capability_status_updated": {
      const connectedAccountId: string | undefined =
        event.related_object?.id ?? event.data?.account?.id;

      if (!connectedAccountId) {
        console.warn(
          "[stripe v2 webhook] capability_status_updated: no account ID in event"
        );
        break;
      }

      console.log(
        `[stripe v2 webhook] Recipient capability status updated for account ${connectedAccountId}`
      );

      try {
        // Fetch the full account to check the current capability status
        const account = await stripe.v2.core.accounts.retrieve(
          connectedAccountId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { include: ["configuration.recipient", "requirements"] } as never
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;

        const transfersStatus =
          account?.configuration?.recipient?.capabilities?.stripe_balance
            ?.stripe_transfers?.status;

        const requirementsStatus =
          account?.requirements?.summary?.minimum_deadline?.status ?? null;
        const onboardingComplete =
          requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

        const readyToReceivePayments =
          transfersStatus === "active" && onboardingComplete;

        // Update the venue's cached onboarding status
        await VenueProfileModel.findOneAndUpdate(
          { stripeConnectAccountId: connectedAccountId },
          { $set: { stripeConnectOnboarded: readyToReceivePayments } }
        );

        console.log(
          `[stripe v2 webhook] Account ${connectedAccountId} transfers_status=${transfersStatus}, onboarded=${readyToReceivePayments}`
        );
      } catch (err) {
        console.error(
          `[stripe v2 webhook] Failed to re-fetch account ${connectedAccountId}:`,
          err
        );
      }
      break;
    }

    default:
      console.log(`[stripe v2 webhook] Unhandled V2 event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
