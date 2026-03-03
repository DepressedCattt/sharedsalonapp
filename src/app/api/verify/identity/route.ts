/**
 * POST /api/verify/identity
 *
 * Creates a Stripe Identity VerificationSession for the authenticated user.
 * Redirects the user to Stripe's hosted verification flow.
 *
 * Requires:
 *  - STRIPE_SECRET_KEY set in .env.local
 *  - Stripe Identity enabled in the Stripe Dashboard
 *    (Dashboard → More → Identity → Get started)
 *
 * On completion, the webhook (identity.verification_session.verified) sets
 * idVerified = true on the user's TrustProfile.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TrustProfileModel } from "@/models/TrustProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json({
        available: false,
        message: "Identity verification is coming soon.",
      });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Set MONGODB_URI in .env.local" },
        { status: 503 }
      );
    }

    const body = await req.json() as { accountId?: string; role?: string };
    const { accountId, role } = body;

    if (!accountId || !role) {
      return NextResponse.json(
        { error: "accountId and role are required" },
        { status: 400 }
      );
    }

    const sessionAccountId = `${session.user.id}_${session.user.role}`;
    if (accountId !== sessionAccountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { accountId, role },
      options: {
        document: {
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: `${appUrl}/settings?identity=complete`,
    });

    await TrustProfileModel.findOneAndUpdate(
      { accountId },
      { $set: { stripeVerificationSessionId: verificationSession.id } },
      { upsert: false }
    );

    return NextResponse.json({
      available: true,
      url: verificationSession.url,
    });
  } catch (err) {
    console.error("POST /api/verify/identity error:", err);
    return NextResponse.json(
      { error: "Failed to initiate identity verification." },
      { status: 500 }
    );
  }
}
