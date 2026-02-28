import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { VenueProfileModel } from "@/models/VenueProfile";
import type { VenueProfile } from "@/lib/types";

function toVenueProfile(doc: {
  _id: { toString(): string };
  toObject?(): Record<string, unknown>;
  [k: string]: unknown;
}): VenueProfile {
  const o = doc.toObject ? doc.toObject() : (doc as Record<string, unknown>);
  const toDateStr = (v: unknown) => {
    if (!v) return undefined;
    if (typeof v === "string") return v.split("T")[0];
    if (v instanceof Date) return v.toISOString().split("T")[0];
    return undefined;
  };
  return {
    id: doc._id.toString(),
    venueId: o.venueId as string,
    displayName: (o.displayName as string) ?? "",
    bio: (o.bio as string) ?? "",
    location: (o.location as string) ?? "",
    latitude: o.latitude as number | undefined,
    longitude: o.longitude as number | undefined,
    photos: (o.photos as string[]) ?? [],
    bannerPhoto: (o.bannerPhoto as string | null) ?? null,
    profilePhoto: (o.profilePhoto as string | null) ?? null,
    specialties: (o.specialties as string[]) ?? [],
    boothPolicies: (o.boothPolicies as string[]) ?? [],
    showReviews: (o.showReviews as boolean) ?? true,
    website: (o.website as string) ?? "",
    instagram: (o.instagram as string) ?? "",
    createdAt: toDateStr(o.createdAt),
    updatedAt: toDateStr(o.updatedAt),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "venueId is required" }, { status: 400 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const doc = await VenueProfileModel.findOne({ venueId });
    if (!doc) {
      return NextResponse.json({ error: "Venue profile not found" }, { status: 404 });
    }
    return NextResponse.json(toVenueProfile(doc));
  } catch (e) {
    console.error("VenueProfile GET:", e);
    return NextResponse.json({ error: "Failed to fetch venue profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "venue") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const venueId = `${session.user.id}_venue`;
    const body = await request.json() as Partial<VenueProfile>;

    const update: Record<string, unknown> = {};
    if (typeof body.displayName === "string") update.displayName = body.displayName;
    if (typeof body.bio === "string") update.bio = body.bio;
    if (typeof body.location === "string") update.location = body.location;
    if (typeof body.latitude === "number") update.latitude = body.latitude;
    if (typeof body.longitude === "number") update.longitude = body.longitude;
    if (typeof body.latitude === "undefined" && "latitude" in body) update.latitude = undefined;
    if (typeof body.longitude === "undefined" && "longitude" in body) update.longitude = undefined;
    if (Array.isArray(body.photos)) update.photos = body.photos;
    if ("bannerPhoto" in body) update.bannerPhoto = body.bannerPhoto ?? null;
    if ("profilePhoto" in body) update.profilePhoto = body.profilePhoto ?? null;
    if (Array.isArray(body.specialties)) update.specialties = body.specialties;
    if (Array.isArray(body.boothPolicies)) update.boothPolicies = body.boothPolicies;
    if (typeof body.showReviews === "boolean") update.showReviews = body.showReviews;
    if (typeof body.website === "string") update.website = body.website;
    if (typeof body.instagram === "string") update.instagram = body.instagram;

    const doc = await VenueProfileModel.findOneAndUpdate(
      { venueId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(toVenueProfile(doc));
  } catch (e) {
    console.error("VenueProfile PATCH:", e);
    return NextResponse.json({ error: "Failed to save venue profile" }, { status: 500 });
  }
}
