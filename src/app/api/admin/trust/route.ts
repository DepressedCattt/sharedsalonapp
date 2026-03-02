import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { TrustProfileModel } from "@/models/TrustProfile";
import { TrustReviewModel } from "@/models/TrustReview";
import { BookingRequestModel } from "@/models/BookingRequest";
import {
  upsertTrustProfile,
  checkAndPublishReviews,
} from "@/lib/trustEngine";
import type { TrustDimensionRatings, TrustIssueFlag, ArrivalStatus } from "@/lib/types";

// Only accessible in development
function guardDev() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  return null;
}

// ── GET — fetch trust profile for any accountId ───────────────────────────────

export async function GET(req: NextRequest) {
  const guard = guardDev();
  if (guard) return guard;

  const db = await connectDB();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const profile = await TrustProfileModel.findOne({ accountId }).lean();
  const reviews = await TrustReviewModel.find({ revieweeAccountId: accountId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ profile: profile ?? null, reviews });
}

// ── POST — inject a review or completed booking ───────────────────────────────

export async function POST(req: NextRequest) {
  const guard = guardDev();
  if (guard) return guard;

  const db = await connectDB();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const body = await req.json();
  const { type } = body as { type?: string };

  // ── Inject a completed booking ──────────────────────────────────────────────
  if (type === "booking") {
    const {
      venueId,
      renterId,
      venueName = "Simulated Venue",
      renterName = "Simulated Renter",
    } = body as {
      venueId: string;
      renterId: string;
      venueName?: string;
      renterName?: string;
    };

    if (!venueId || !renterId) {
      return NextResponse.json({ error: "venueId and renterId are required" }, { status: 400 });
    }

    const booking = await BookingRequestModel.create({
      listingId: "admin_sim",
      listingTitle: "Admin Simulated Booking",
      venueId,
      venueName,
      renterId,
      renterName,
      renterAvatarUrl: "",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      price: 100,
      priceType: "daily",
      houseRulesAccepted: true,
      status: "completed",
      reviewSubmitted: false,
      bookingType: "date_range",
    });

    // Trigger recompute for both sides
    await upsertTrustProfile(venueId, "venue");
    await upsertTrustProfile(renterId, "renter");

    return NextResponse.json({ ok: true, bookingId: booking._id.toString() }, { status: 201 });
  }

  // ── Inject a trust review (published immediately) ──────────────────────────
  const {
    reviewerAccountId,
    reviewerRole,
    revieweeAccountId,
    quickRating,
    dimensionRatings,
    wouldBookAgain,
    issueFlags,
    publishImmediately = true,
  } = body as {
    reviewerAccountId: string;
    reviewerRole: "venue" | "renter";
    revieweeAccountId: string;
    quickRating: number;
    dimensionRatings?: TrustDimensionRatings;
    wouldBookAgain?: boolean;
    issueFlags?: TrustIssueFlag[];
    publishImmediately?: boolean;
  };

  if (!reviewerAccountId || !reviewerRole || !revieweeAccountId || quickRating == null) {
    return NextResponse.json(
      { error: "reviewerAccountId, reviewerRole, revieweeAccountId, and quickRating are required" },
      { status: 400 }
    );
  }

  const bookingId = `admin_sim_${Date.now()}`;

  const review = await TrustReviewModel.create({
    bookingId,
    reviewerAccountId,
    reviewerRole,
    revieweeAccountId,
    quickRating,
    dimensionRatings: dimensionRatings ?? {},
    wouldBookAgain: wouldBookAgain ?? null,
    issueFlags: issueFlags ?? [],
    isPublished: publishImmediately,
    publishAfter: new Date(),
    submittedAt: new Date(),
  });

  if (publishImmediately) {
    // Directly recompute the reviewee's profile
    const revieweeRole = reviewerRole === "renter" ? "venue" : "renter";
    await upsertTrustProfile(revieweeAccountId, revieweeRole);
  } else {
    await checkAndPublishReviews(bookingId);
  }

  // Return updated profile
  const updatedProfile = await TrustProfileModel.findOne({
    accountId: revieweeAccountId,
  }).lean();

  return NextResponse.json({ ok: true, review, profile: updatedProfile }, { status: 201 });
}

// ── DELETE — clear trust data for an accountId ────────────────────────────────

export async function DELETE(req: NextRequest) {
  const guard = guardDev();
  if (guard) return guard;

  const db = await connectDB();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const [profileResult, reviewResult, bookingResult] = await Promise.all([
    TrustProfileModel.deleteMany({ accountId }),
    TrustReviewModel.deleteMany({
      $or: [{ reviewerAccountId: accountId }, { revieweeAccountId: accountId }],
    }),
    BookingRequestModel.deleteMany({
      $or: [{ venueId: accountId }, { renterId: accountId }],
      listingId: "admin_sim",
    }),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      profiles: profileResult.deletedCount,
      reviews: reviewResult.deletedCount,
      simulatedBookings: bookingResult.deletedCount,
    },
  });
}

// ── PATCH — grant or revoke trailblazer status ────────────────────────────────

export async function PATCH(req: NextRequest) {
  const guard = guardDev();
  if (guard) return guard;

  const db = await connectDB();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { accountId, foundingVerified, role } = await req.json() as {
    accountId: string;
    foundingVerified: boolean;
    role: "venue" | "renter";
  };

  if (!accountId || foundingVerified === undefined || !role) {
    return NextResponse.json(
      { error: "accountId, foundingVerified, and role are required" },
      { status: 400 }
    );
  }

  await TrustProfileModel.findOneAndUpdate(
    { accountId },
    {
      $set: {
        foundingVerified,
        tier: foundingVerified ? "trailblazer" : undefined,
        role,
      },
    },
    { upsert: true, new: true }
  );

  // Recompute to set correct tier
  const profile = await upsertTrustProfile(accountId, role);

  // If granting trailblazer, force it (upsert may have overwritten it)
  if (foundingVerified) {
    await TrustProfileModel.findOneAndUpdate(
      { accountId },
      { $set: { tier: "trailblazer", foundingVerified: true } }
    );
  }

  return NextResponse.json({ ok: true, profile });
}
