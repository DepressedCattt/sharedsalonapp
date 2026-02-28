import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ListingModel } from "@/models/Listing";
import { BookingRequestModel } from "@/models/BookingRequest";
import mongoose from "mongoose";

export interface SlotAvailability {
  day: number;
  start: string;
  end: string;
  capacity: number;
  approved: number;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured. Set MONGODB_URI in .env.local" },
      { status: 503 }
    );
  }
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }
  try {
    const listing = await ListingModel.findById(id).lean();
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const l = listing as Record<string, unknown>;
    const availability = (l.availability as { day: number; start: string; end: string }[]) ?? [];
    const slotCapacity = (l.slotCapacity as number) ?? 1;

    // Fetch all approved recurring_slot bookings for this listing
    const approvedBookings = await BookingRequestModel.find({
      listingId: id,
      status: "approved",
      bookingType: "recurring_slot",
    })
      .select("recurringSlot")
      .lean();

    // Count approvals per slot key (day-start-end)
    const slotKey = (day: number, start: string, end: string) => `${day}|${start}|${end}`;
    const counts: Record<string, number> = {};
    for (const b of approvedBookings) {
      const bDoc = b as Record<string, unknown>;
      const slot = bDoc.recurringSlot as { day: number; start: string; end: string } | null;
      if (slot) {
        const key = slotKey(slot.day, slot.start, slot.end);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }

    const slots: SlotAvailability[] = availability.map((s) => ({
      day: s.day,
      start: s.start,
      end: s.end,
      capacity: slotCapacity,
      approved: counts[slotKey(s.day, s.start, s.end)] ?? 0,
    }));

    return NextResponse.json({ slots });
  } catch (e) {
    console.error("Slot availability GET:", e);
    return NextResponse.json({ error: "Failed to fetch slot availability" }, { status: 500 });
  }
}
