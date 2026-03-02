import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TrustReviewModel } from "@/models/TrustReview";
import { BookingRequestModel } from "@/models/BookingRequest";
import { checkAndPublishReviews } from "@/lib/trustEngine";
import type { TrustIssueFlag, TrustDimensionRatings } from "@/lib/types";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    const accountId = `${session.user.id}_${session.user.role}`;
    const reviews = await TrustReviewModel.find({ bookingId }).lean();

    const myReview = reviews.find((r) => r.reviewerAccountId === accountId);
    const otherReview = reviews.find((r) => r.reviewerAccountId !== accountId);

    return NextResponse.json({
      submitted: !!myReview,
      otherSideSubmitted: !!otherReview,
      isPublished: reviews.some((r) => r.isPublished),
      myReview: myReview ?? null,
      // Only return the other side's review once published
      otherReview: otherReview?.isPublished ? otherReview : null,
    });
  } catch (err) {
    console.error("GET /api/trust/reviews error:", err);
    return NextResponse.json(
      { error: "Failed to fetch review status" },
      { status: 500 }
    );
  }
}

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
    const {
      bookingId,
      quickRating,
      dimensionRatings,
      wouldBookAgain,
      issueFlags,
    } = body as {
      bookingId: string;
      quickRating: number;
      dimensionRatings?: TrustDimensionRatings;
      wouldBookAgain?: boolean;
      issueFlags?: TrustIssueFlag[];
    };

    if (!bookingId || quickRating == null) {
      return NextResponse.json(
        { error: "bookingId and quickRating are required" },
        { status: 400 }
      );
    }

    if (quickRating < 1 || quickRating > 5) {
      return NextResponse.json(
        { error: "quickRating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const role = session.user.role as "venue" | "renter";
    const accountId = `${session.user.id}_${role}`;

    // Validate the booking exists and the user is a participant
    const booking = await BookingRequestModel.findById(bookingId).lean() as {
      status: string;
      venueId: string;
      renterId: string;
      endDate?: string;
      [key: string]: unknown;
    } | null;

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Trust reviews can only be submitted for completed bookings" },
        { status: 400 }
      );
    }

    const isVenueParticipant = booking.venueId === accountId;
    const isRenterParticipant = booking.renterId === accountId;

    if (!isVenueParticipant && !isRenterParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine reviewee
    const revieweeAccountId = isVenueParticipant
      ? booking.renterId
      : booking.venueId;

    // Publish window: 7 days from booking end date (or now if no endDate)
    const publishAfter = new Date(
      booking.endDate
        ? new Date(booking.endDate as string).getTime() + 7 * 24 * 60 * 60 * 1000
        : Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const review = await TrustReviewModel.create({
      bookingId,
      reviewerAccountId: accountId,
      reviewerRole: role,
      revieweeAccountId,
      quickRating,
      dimensionRatings: dimensionRatings ?? {},
      wouldBookAgain: wouldBookAgain ?? null,
      issueFlags: issueFlags ?? [],
      isPublished: false,
      publishAfter,
      submittedAt: new Date(),
    });

    // Mark trustReviewSubmitted on the booking
    await BookingRequestModel.findByIdAndUpdate(bookingId, {
      $set: { trustReviewSubmitted: true },
    });

    // Check if both sides have now submitted — publish if so
    await checkAndPublishReviews(bookingId);

    return NextResponse.json(review, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "You have already submitted a trust review for this booking" },
        { status: 409 }
      );
    }
    console.error("POST /api/trust/reviews error:", err);
    return NextResponse.json(
      { error: "Failed to submit trust review" },
      { status: 500 }
    );
  }
}
