import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { BookingRequestModel } from "@/models/BookingRequest";
import mongoose from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }
  const body = await request.json();
  const status = body.status as "approved" | "declined" | "completed" | undefined;
  const role = session.user.role as "venue" | "renter";

  // Venues can approve, decline, or complete bookings.
  // Renters can only cancel (decline) their own pending/approved bookings.
  const venueStatuses = ["approved", "declined", "completed"] as const;
  const renterStatuses = ["declined"] as const;

  const allValidStatuses = ["approved", "declined", "completed"];
  if (!status || !allValidStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status for your role" }, { status: 400 });
  }
  if (role === "renter" && status !== "declined") {
    return NextResponse.json({ error: "Renters can only cancel bookings" }, { status: 403 });
  }

  try {
    const booking = await BookingRequestModel.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Enforce ownership
    const accountId = `${session.user.id}_${role}`;
    if (role === "venue" && booking.venueId !== accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "renter" && booking.renterId !== accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update — stamp cancellation metadata when a booking is declined
    const isCancellation = status === "declined";
    const updateFields: Record<string, unknown> = { status };
    if (isCancellation) {
      updateFields.cancelledAt = new Date();
      updateFields.cancelledBy = role;
    }

    await BookingRequestModel.findByIdAndUpdate(id, { $set: updateFields });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Booking PATCH:", e);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
