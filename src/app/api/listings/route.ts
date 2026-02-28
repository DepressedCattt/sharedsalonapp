import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ListingModel } from "@/models/Listing";
import type { Listing, ListingMode } from "@/lib/types";

function toListing(doc: {
  _id: { toString(): string };
  toObject?(): Record<string, unknown>;
  [k: string]: unknown;
}): Listing {
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
    venueId: o.venueId as string,
    venueName: o.venueName as string,
    title: o.title as string,
    description: o.description as string,
    priceType: o.priceType as Listing["priceType"],
    price: o.price as number,
    location: o.location as string,
    latitude: o.latitude as number | undefined,
    longitude: o.longitude as number | undefined,
    availability: (o.availability as Listing["availability"]) ?? [],
    equipmentIncluded: (o.equipmentIncluded as string[]) ?? [],
    media: (o.media as Listing["media"]) ?? [],
    houseRules: (o.houseRules as string[]) ?? [],
    rating: (o.rating as number) ?? 0,
    ratingBreakdown: (o.ratingBreakdown as Listing["ratingBreakdown"]) ?? undefined,
    listingMode: ((o.listingMode as ListingMode) ?? "one_off"),
    slotCapacity: (o.slotCapacity as number) ?? 1,
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
    const docs = await ListingModel.find().sort({ createdAt: -1 }).lean();
    const listings = docs.map((d) => toListing({ ...d, _id: d._id }));
    return NextResponse.json(listings);
  } catch (e) {
    console.error("Listings GET:", e);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
  try {
    const body = await request.json();
    const accountId = `${session.user.id}_venue`;
    const venueName = (session.user as { name?: string }).name ?? "Venue";
    const doc = await ListingModel.create({
      venueId: accountId,
      venueName,
      title: body.title,
      description: body.description,
      priceType: body.priceType ?? "daily",
      price: body.price,
      location: body.location,
      latitude: body.latitude,
      longitude: body.longitude,
      availability: body.availability ?? [],
      equipmentIncluded: body.equipmentIncluded ?? [],
      media: body.media ?? [],
      houseRules: body.houseRules ?? [],
      listingMode: body.listingMode ?? "one_off",
      slotCapacity: body.slotCapacity ?? 1,
      rating: 0,
    });
    const listing = toListing(doc);
    return NextResponse.json(listing);
  } catch (e) {
    console.error("Listings POST:", e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
