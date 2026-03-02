import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { FreelancerProfileModel } from "@/models/FreelancerProfile";
import type { FreelancerProfile } from "@/lib/types";

function toFreelancerProfile(doc: {
  _id: { toString(): string };
  toObject?(): Record<string, unknown>;
  [k: string]: unknown;
}): FreelancerProfile {
  const o = doc.toObject ? doc.toObject() : (doc as Record<string, unknown>);
  const toDateStr = (v: unknown) => {
    if (!v) return undefined;
    if (typeof v === "string") return v.split("T")[0];
    if (v instanceof Date) return v.toISOString().split("T")[0];
    return undefined;
  };
  return {
    id: doc._id.toString(),
    renterId: o.renterId as string,
    displayName: (o.displayName as string) ?? "",
    bio: (o.bio as string) ?? "",
    photos: (o.photos as string[]) ?? [],
    profilePhoto: (o.profilePhoto as string | null) ?? null,
    bannerPhoto: (o.bannerPhoto as string | null) ?? null,
    specialties: (o.specialties as string[]) ?? [],
    showReviews: (o.showReviews as boolean) ?? true,
    website: (o.website as string) ?? "",
    instagram: (o.instagram as string) ?? "",
    createdAt: toDateStr(o.createdAt),
    updatedAt: toDateStr(o.updatedAt),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const renterId = searchParams.get("renterId");
  if (!renterId) {
    return NextResponse.json({ error: "renterId is required" }, { status: 400 });
  }

  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const doc = await FreelancerProfileModel.findOne({ renterId });
    if (!doc) {
      return NextResponse.json({ error: "Freelancer profile not found" }, { status: 404 });
    }
    return NextResponse.json(toFreelancerProfile(doc));
  } catch (e) {
    console.error("FreelancerProfile GET:", e);
    return NextResponse.json({ error: "Failed to fetch freelancer profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "renter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const renterId = `${session.user.id}_renter`;
    const body = await request.json() as Partial<FreelancerProfile>;

    const update: Record<string, unknown> = {};
    if (typeof body.displayName === "string") update.displayName = body.displayName;
    if (typeof body.bio === "string") update.bio = body.bio;
    if (Array.isArray(body.photos)) update.photos = body.photos;
    if ("profilePhoto" in body) update.profilePhoto = body.profilePhoto ?? null;
    if ("bannerPhoto" in body) update.bannerPhoto = body.bannerPhoto ?? null;
    if (Array.isArray(body.specialties)) update.specialties = body.specialties;
    if (typeof body.showReviews === "boolean") update.showReviews = body.showReviews;
    if (typeof body.website === "string") update.website = body.website;
    if (typeof body.instagram === "string") update.instagram = body.instagram;

    const doc = await FreelancerProfileModel.findOneAndUpdate(
      { renterId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(toFreelancerProfile(doc));
  } catch (e) {
    console.error("FreelancerProfile PATCH:", e);
    return NextResponse.json({ error: "Failed to save freelancer profile" }, { status: 500 });
  }
}
