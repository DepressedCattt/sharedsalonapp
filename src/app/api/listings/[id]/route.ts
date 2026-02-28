import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ListingModel } from "@/models/Listing";
import mongoose from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "venue") {
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
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }
  try {
    const listing = await ListingModel.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    const accountId = `${session.user.id}_venue`;
    if (listing.venueId !== accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
    if (typeof body.description === "string") update.description = body.description;
    if (typeof body.priceType === "string") update.priceType = body.priceType;
    if (typeof body.price === "number") update.price = body.price;
    if (typeof body.location === "string") update.location = body.location;
    if (typeof body.latitude === "number") update.latitude = body.latitude;
    if (typeof body.longitude === "number") update.longitude = body.longitude;
    if (Array.isArray(body.availability)) update.availability = body.availability;
    if (Array.isArray(body.equipmentIncluded)) update.equipmentIncluded = body.equipmentIncluded;
    if (Array.isArray(body.media)) update.media = body.media;
    if (Array.isArray(body.houseRules)) update.houseRules = body.houseRules;
    if (body.listingMode === "one_off" || body.listingMode === "recurring") update.listingMode = body.listingMode;
    if (typeof body.slotCapacity === "number" && body.slotCapacity >= 1) update.slotCapacity = body.slotCapacity;
    if (Object.keys(update).length === 0) {
      return NextResponse.json(listing);
    }
    const updated = await ListingModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Listing PATCH:", e);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "venue") {
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
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }
  try {
    const listing = await ListingModel.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    const accountId = `${session.user.id}_venue`;
    if (listing.venueId !== accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await ListingModel.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Listing DELETE:", e);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
