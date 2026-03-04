/**
 * GET /api/verify/identity/status
 *
 * Checks the Stripe Identity VerificationSession status directly and syncs
 * the result to the user's TrustProfile. This handles the case where the
 * webhook hasn't arrived yet (e.g. local dev without Stripe CLI forwarding)
 * or where there's a race condition between the Stripe redirect and the webhook.
 *
 * Returns:
 *   { idVerified: boolean; status: string }
 *     status: "verified" | "processing" | "requires_input" | "canceled" | "none"
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TrustProfileModel } from "@/models/TrustProfile";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const accountId = `${session.user.id}_${session.user.role}`;

    const trustProfile = await TrustProfileModel.findOne({ accountId }).lean() as {
      idVerified?: boolean;
      stripeVerificationSessionId?: string;
    } | null;

    // Already verified in DB — no need to call Stripe
    if (trustProfile?.idVerified) {
      return NextResponse.json({ idVerified: true, status: "verified" });
    }

    // No session ID saved — user hasn't started verification
    if (!trustProfile?.stripeVerificationSessionId) {
      return NextResponse.json({ idVerified: false, status: "none" });
    }

    // Stripe not configured — can't check
    if (!isStripeConfigured()) {
      return NextResponse.json({ idVerified: false, status: "none" });
    }

    const stripe = getStripe();
    const vs = await stripe.identity.verificationSessions.retrieve(
      trustProfile.stripeVerificationSessionId
    );

    if (vs.status === "verified") {
      // Sync to DB — mirrors what the webhook does
      await TrustProfileModel.findOneAndUpdate(
        { accountId },
        { $set: { idVerified: true, idVerifiedAt: new Date() } },
        { upsert: false }
      );
      return NextResponse.json({ idVerified: true, status: "verified" });
    }

    return NextResponse.json({ idVerified: false, status: vs.status ?? "processing" });
  } catch (err) {
    console.error("GET /api/verify/identity/status error:", err);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
