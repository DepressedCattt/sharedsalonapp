import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ReviewModel } from "@/models/Review";
import { BookingRequestModel } from "@/models/BookingRequest";
import { ListingModel } from "@/models/Listing";
import type { Review } from "@/lib/types";

function toReview(doc: {
  _id: { toString(): string };
  toObject?(): Record<string, unknown>;
  [k: string]: unknown;
}): Review {
  const o = doc.toObject ? doc.toObject() : (doc as Record<string, unknown>);
  const raw = o.createdAt;
  let createdAt: string;
  if (typeof raw === "string") {
    createdAt = raw.split("T")[0];
  } else if (raw instanceof Date) {
    createdAt = raw.toISOString().split("T")[0];
  } else {
    createdAt = new Date().toISOString().split("T")[0];
  }
  const scores = o.scores as Record<string, number>;
  return {
    id: doc._id.toString(),
    bookingId: o.bookingId as string,
    listingId: o.listingId as string,
    venueId: o.venueId as string,
    renterId: o.renterId as string,
    renterName: o.renterName as string,
    renterAvatarUrl: o.renterAvatarUrl as string | undefined,
    scores: {
      cleanliness: scores.cleanliness,
      accuracy: scores.accuracy,
      communication: scores.communication,
    },
    comment: o.comment as string | undefined,
    createdAt,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");

  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured. Set MONGODB_URI in .env.local" },
      { status: 503 }
    );
  }

  const venueId = searchParams.get("venueId");

  // At least one filter is required
  if (!listingId && !venueId) {
    return NextResponse.json({ error: "listingId or venueId is required" }, { status: 400 });
  }

  // Non-ObjectId listingIds (localStorage fallback) will never have DB reviews
  if (listingId && !mongoose.Types.ObjectId.isValid(listingId)) {
    return NextResponse.json([]);
  }

  try {
    const query = listingId ? { listingId } : { venueId };
    const docs = await ReviewModel.find(query).sort({ createdAt: -1 }).lean();
    const reviews = docs.map((d) => toReview({ ...d, _id: d._id }));
    return NextResponse.json(reviews);
  } catch (e) {
    console.error("Reviews GET:", e);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "renter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured. Set MONGODB_URI in .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { bookingId, listingId, venueId, scores, comment } = body as {
      bookingId: string;
      listingId: string;
      venueId: string;
      scores: { cleanliness: number; accuracy: number; communication: number };
      comment?: string;
    };

    const accountId = `${session.user.id}_renter`;
    const renterName = (session.user as { name?: string }).name ?? "Renter";
    const renterAvatarUrl = (session.user as { image?: string }).image;

    // Validate required fields (venueId may be "" for old bookings — that's acceptable)
    if (!bookingId || !listingId || !scores) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate bookingId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Validate scores
    for (const [key, val] of Object.entries(scores)) {
      if (typeof val !== "number" || val < 1 || val > 10) {
        return NextResponse.json(
          { error: `Score for ${key} must be between 1 and 10` },
          { status: 400 }
        );
      }
    }

    // Validate booking: must be completed, belong to this renter, not yet reviewed
    const booking = await BookingRequestModel.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.renterId !== accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Can only review completed bookings" },
        { status: 400 }
      );
    }
    if (booking.reviewSubmitted) {
      return NextResponse.json(
        { error: "Review already submitted for this booking" },
        { status: 409 }
      );
    }

    // Create the review
    const doc = await ReviewModel.create({
      bookingId,
      listingId,
      venueId,
      renterId: accountId,
      renterName,
      renterAvatarUrl: renterAvatarUrl ?? undefined,
      scores,
      comment: comment?.trim() || undefined,
    });

    // Mark booking as reviewed
    await BookingRequestModel.findByIdAndUpdate(bookingId, { $set: { reviewSubmitted: true } });

    // Recompute and persist listing's ratingBreakdown + overall rating.
    // Wrapped in its own try-catch so a bad/missing listingId doesn't fail the review.
    if (mongoose.Types.ObjectId.isValid(listingId)) {
      try {
        const allReviews = await ReviewModel.find({ listingId }).lean();
        const count = allReviews.length;

        const avg = (field: keyof typeof scores) =>
          allReviews.reduce((sum, r) => {
            const s = r.scores as Record<string, number>;
            return sum + (s[field] ?? 0);
          }, 0) / count;

        const cleanliness = avg("cleanliness");
        const accuracy = avg("accuracy");
        const communication = avg("communication");
        const overallRating =
          Math.round(((cleanliness + accuracy + communication) / 3) * 10) / 10;

        await ListingModel.findByIdAndUpdate(listingId, {
          ratingBreakdown: { cleanliness, accuracy, communication, count },
          rating: overallRating,
        });
      } catch (listingErr) {
        console.error("Reviews POST — listing rating update failed:", listingErr);
      }
    }

    return NextResponse.json(toReview(doc), { status: 201 });
  } catch (e: unknown) {
    // Duplicate key = already reviewed
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Review already submitted for this booking" },
        { status: 409 }
      );
    }
    console.error("Reviews POST:", e);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
