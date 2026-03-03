/**
 * GET  /api/profile  — return the current user's displayName, email, phone, location
 * PATCH /api/profile — update those same fields in the appropriate Mongo model
 *
 * Persisting to the database is required so that server-side code (e.g. ABN
 * verification) can read the latest displayName rather than the localStorage copy.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import { FreelancerProfileModel } from "@/models/FreelancerProfile";

interface ProfileFields {
  displayName?: string;
  email?: string;
  phone?: string;
  location?: string;
}

async function getModel(role: string) {
  return role === "venue" ? VenueProfileModel : FreelancerProfileModel;
}

function idField(role: string) {
  return role === "venue" ? "venueId" : "renterId";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const role = session.user.role as string;
    const accountId = `${session.user.id}_${role}`;
    const Model = await getModel(role);
    const doc = await Model.findOne({ [idField(role)]: accountId }).lean() as ProfileFields | null;

    return NextResponse.json({
      displayName: doc?.displayName ?? "",
      email: session.user.email ?? "",
      phone: (doc as { phone?: string } | null)?.phone ?? "",
      location: doc?.location ?? "",
    });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await req.json() as ProfileFields;
    const allowed: ProfileFields = {};
    if (typeof body.displayName === "string") allowed.displayName = body.displayName.trim();
    if (typeof body.email === "string") allowed.email = body.email.trim();
    if (typeof body.phone === "string") allowed.phone = body.phone.trim();
    if (typeof body.location === "string") allowed.location = body.location.trim();

    const role = session.user.role as string;
    const accountId = `${session.user.id}_${role}`;
    const Model = await getModel(role);

    const updated = await Model.findOneAndUpdate(
      { [idField(role)]: accountId },
      { $set: allowed },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as ProfileFields | null;

    return NextResponse.json({
      displayName: updated?.displayName ?? "",
      email: session.user.email ?? "",
      phone: (updated as { phone?: string } | null)?.phone ?? "",
      location: updated?.location ?? "",
    });
  } catch (err) {
    console.error("PATCH /api/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
