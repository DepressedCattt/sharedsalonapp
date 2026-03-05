/**
 * POST /api/verify/abn
 *
 * How name ownership is established:
 *
 *  1. PRIMARY — Auth identity match (strong):
 *     The ABR entity name is compared against session.user.name — the legal name
 *     the user registered with Google or Facebook. This name is NOT editable inside
 *     the app, so it links the ABN to an externally-verified identity.
 *     Typically covers sole traders whose ABN is registered in their own name.
 *
 *  2. SECONDARY — Business display name match (weaker, for companies/Pty Ltd):
 *     If the auth name doesn't match, we check the profile's displayName.
 *     This covers business entities (e.g. "City Cuts Pty Ltd") where the ABN is
 *     registered under a company name rather than the owner's personal name.
 *     The user must have set their display name to the exact registered entity name
 *     — it cannot be a casual nickname. Combined with Stripe ID verification, this
 *     still provides a strong trust signal: the verified person owns the business.
 *
 *  In both cases:
 *   - The ABN must be real, valid (checksum), and Active in the ABR.
 *   - The session user can only verify their own accountId (server-enforced).
 *   - The matchType is stored so it can be weighted differently in trust scoring.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TrustProfileModel } from "@/models/TrustProfile";
import { VenueProfileModel } from "@/models/VenueProfile";
import { FreelancerProfileModel } from "@/models/FreelancerProfile";
import { validateAbnFormat, lookupAbn, namesMatch } from "@/lib/abnLookup";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Set MONGODB_URI in .env.local" },
        { status: 503 }
      );
    }

    const body = await req.json() as { abn?: string; accountId?: string; role?: string };
    const { abn, accountId, role } = body;

    if (!abn || !accountId || !role) {
      return NextResponse.json(
        { error: "abn, accountId, and role are required" },
        { status: 400 }
      );
    }

    if (role !== "venue" && role !== "renter") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Server-enforced: a user can only verify their own accountId.
    // This prevents one user from claiming another's ABN.
    const sessionAccountId = `${session.user.id}_${session.user.role}`;
    if (accountId !== sessionAccountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cleanAbn = abn.replace(/[\s\-]/g, "");

    if (!validateAbnFormat(cleanAbn)) {
      return NextResponse.json(
        { verified: false, message: "Invalid ABN. Please check the number and try again." },
        { status: 422 }
      );
    }

    // Fetch the entity name from ABR (stubbed until ABR_GUID is configured)
    let lookupResult;
    try {
      lookupResult = await lookupAbn(cleanAbn);
    } catch {
      return NextResponse.json(
        { verified: false, message: "ABN lookup failed. Please try again later." },
        { status: 502 }
      );
    }

    if (lookupResult.status !== "Active") {
      return NextResponse.json(
        {
          verified: false,
          entityName: lookupResult.entityName,
          message: `This ABN is not active (status: ${lookupResult.status}).`,
        },
        { status: 422 }
      );
    }

    // ── Name ownership check ──────────────────────────────────────────────────

    // The OAuth name (from Google/Facebook) — NOT user-editable in this app.
    const authName = session.user.name ?? "";

    // The profile display name — user-editable, but must equal the registered
    // entity name to pass (partial matches only allowed in one direction).
    let displayName = "";
    if (role === "venue") {
      const venueProfile = await VenueProfileModel.findOne({ venueId: accountId }).lean() as
        | { displayName?: string }
        | null;
      displayName = venueProfile?.displayName ?? "";
    } else {
      const freelancerProfile = await FreelancerProfileModel.findOne({ renterId: accountId }).lean() as
        | { displayName?: string }
        | null;
      displayName = freelancerProfile?.displayName ?? "";
    }

    // 1. Primary: match against the OAuth-verified name (strongest signal)
    let matchType: "auth_name" | "display_name" | null = null;
    if (authName && namesMatch(lookupResult.entityName, authName)) {
      matchType = "auth_name";
    }
    // 2. Secondary: match against the profile display name (covers business entities)
    else if (displayName && namesMatch(lookupResult.entityName, displayName)) {
      matchType = "display_name";
    }

    if (!matchType) {
      const authHint = authName ? ` your account name ("${authName}") or` : "";
      const displayHint = displayName ? ` your display name ("${displayName}")` : " your profile display name";
      return NextResponse.json(
        {
          verified: false,
          entityName: lookupResult.entityName,
          message:
            `The business name on this ABN ("${lookupResult.entityName}") does not match${authHint}${displayHint}. ` +
            `If this is your ABN, make sure your profile display name exactly matches the name registered with the ABR.`,
        },
        { status: 422 }
      );
    }

    // ── Save verification ─────────────────────────────────────────────────────
    await TrustProfileModel.findOneAndUpdate(
      { accountId },
      {
        $set: {
          abnVerified: true,
          abnNumber: cleanAbn,
          abnVerifiedAt: new Date(),
          abnMatchType: matchType,
        },
      },
      { upsert: false }
    );

    const strengthNote =
      matchType === "auth_name"
        ? "Matched against your verified account name."
        : "Matched against your business display name.";

    return NextResponse.json({
      verified: true,
      entityName: lookupResult.entityName,
      matchType,
      message: `ABN verified successfully. ${strengthNote}`,
    });
  } catch (err) {
    console.error("POST /api/verify/abn error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
