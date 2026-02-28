import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TrustProfileModel } from "@/models/TrustProfile";
import {
  upsertTrustProfile,
  publishExpiredReviews,
} from "@/lib/trustEngine";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured. Set MONGODB_URI in .env.local" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const role = searchParams.get("role") as "venue" | "renter" | null;

    if (!accountId || !role) {
      return NextResponse.json(
        { error: "accountId and role are required" },
        { status: 400 }
      );
    }

    if (role !== "venue" && role !== "renter") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Run a lightweight sweep to publish expired reviews
    await publishExpiredReviews();

    const existing = await TrustProfileModel.findOne({ accountId }).lean() as {
      lastCalculatedAt?: Date;
      [key: string]: unknown;
    } | null;

    const isStale =
      !existing?.lastCalculatedAt ||
      Date.now() - new Date(existing.lastCalculatedAt).getTime() >
        STALE_THRESHOLD_MS;

    if (isStale) {
      const updated = await upsertTrustProfile(accountId, role);
      return NextResponse.json(updated);
    }

    return NextResponse.json(existing);
  } catch (err) {
    console.error("GET /api/trust error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trust profile" },
      { status: 500 }
    );
  }
}

// Force recompute — useful after admin operations (founding verified flag, etc.)
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

    const body = await req.json();
    const { accountId, role } = body as { accountId?: string; role?: string };

    if (!accountId || !role) {
      return NextResponse.json(
        { error: "accountId and role are required" },
        { status: 400 }
      );
    }

    if (role !== "venue" && role !== "renter") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Users can only recompute their own profile
    const sessionAccountId = `${session.user.id}_${session.user.role}`;
    if (accountId !== sessionAccountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await upsertTrustProfile(accountId, role as "venue" | "renter");
    return NextResponse.json(profile);
  } catch (err) {
    console.error("POST /api/trust error:", err);
    return NextResponse.json(
      { error: "Failed to recompute trust profile" },
      { status: 500 }
    );
  }
}
