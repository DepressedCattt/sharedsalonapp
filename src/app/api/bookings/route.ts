import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import { ListingModel } from "@/models/Listing";
import type { BookingRequest, BookingType, AvailabilitySlot } from "@/lib/types";

function toBookingRequest(doc: {
  _id: { toString(): string };
  toObject?(): Record<string, unknown>;
  [k: string]: unknown;
}): BookingRequest {
  const o = doc.toObject ? doc.toObject() : (doc as Record<string, unknown>);
  const id = doc._id.toString();
  const raw = o.createdAt;
  let createdAt: string;
  if (typeof raw === "string") {
    createdAt = raw.split("T")[0];
  } else if (raw instanceof Date) {
    createdAt = raw.toISOString().split("T")[0];
  } else {
    createdAt = new Date().toISOString().split("T")[0];
  }
  return {
    id,
    listingId: o.listingId as string,
    listingTitle: o.listingTitle as string,
    venueId: (o.venueId as string) ?? "",
    venueName: (o.venueName as string) ?? "",
    renterId: o.renterId as string,
    renterName: o.renterName as string,
    renterAvatarUrl: o.renterAvatarUrl as string | undefined,
    startDate: o.startDate as string,
    endDate: o.endDate as string,
    price: (o.price as number) ?? 0,
    priceType: (o.priceType as BookingRequest["priceType"]) ?? "daily",
    houseRulesAccepted: (o.houseRulesAccepted as boolean) ?? false,
    status: o.status as BookingRequest["status"],
    reviewSubmitted: (o.reviewSubmitted as boolean) ?? false,
    bookingType: ((o.bookingType as BookingType) ?? "date_range"),
    recurringSlot: (o.recurringSlot as AvailabilitySlot | undefined) ?? undefined,
    createdAt,
  };
}

export async function GET() {
  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured. Set MONGODB_URI in .env.local" },
      { status: 503 }
    );
  }
  try {
    const docs = await BookingRequestModel.find().sort({ createdAt: -1 }).lean();
    const requests = docs.map((d) => toBookingRequest({ ...d, _id: d._id }));
    return NextResponse.json(requests);
  } catch (e) {
    console.error("Bookings GET:", e);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
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
    const accountId = `${session.user.id}_renter`;
    const renterName = (session.user as { name?: string }).name ?? "Renter";
    const renterAvatarUrl = (session.user as { image?: string }).image;

    const listing = await ListingModel.findById(body.listingId).lean();
    const listingDoc = listing as Record<string, unknown> | null;

    // For recurring_slot bookings, enforce slot capacity
    const bookingType: string = body.bookingType ?? "date_range";
    if (bookingType === "recurring_slot" && body.recurringSlot && listingDoc) {
      const slotCapacity = (listingDoc.slotCapacity as number) ?? 1;
      const slot = body.recurringSlot as { day: number; start: string; end: string };
      const approvedCount = await BookingRequestModel.countDocuments({
        listingId: body.listingId,
        status: "approved",
        bookingType: "recurring_slot",
        "recurringSlot.day": slot.day,
        "recurringSlot.start": slot.start,
        "recurringSlot.end": slot.end,
      });
      if (approvedCount >= slotCapacity) {
        return NextResponse.json(
          { error: "This slot is full. No more spots are available." },
          { status: 409 }
        );
      }
    }

    const doc = await BookingRequestModel.create({
      listingId: body.listingId,
      listingTitle: body.listingTitle,
      venueId: listingDoc ? listingDoc.venueId as string : (body.venueId ?? ""),
      venueName: listingDoc ? listingDoc.venueName as string : (body.venueName ?? ""),
      renterId: accountId,
      renterName,
      renterAvatarUrl: renterAvatarUrl ?? undefined,
      startDate: body.startDate ?? "",
      endDate: body.endDate ?? "",
      price: listingDoc ? listingDoc.price as number : (body.price ?? 0),
      priceType: listingDoc ? listingDoc.priceType as string : (body.priceType ?? "daily"),
      houseRulesAccepted: body.houseRulesAccepted ?? false,
      bookingType,
      recurringSlot: bookingType === "recurring_slot" ? (body.recurringSlot ?? null) : null,
      status: "pending",
    });
    const booking = toBookingRequest(doc);
    return NextResponse.json(booking);
  } catch (e) {
    console.error("Bookings POST:", e);
    return NextResponse.json({ error: "Failed to create booking request" }, { status: 500 });
  }
}
