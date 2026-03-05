import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ListingModel } from "@/models/Listing";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
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

    // Create a Stripe Product at the platform level for this listing.
    // Products are created on the platform account (not the connected venue account).
    // The connected account mapping is stored in the product's metadata.
    // Failure to create the product does NOT block listing creation.
    if (isStripeConfigured()) {
      try {
        const stripe = getStripe();
        const listingId = doc._id.toString();

        // The price_data in checkout uses unit_amount in cents, but the Stripe Product
        // default_price_data is for catalog display — the actual booking total is
        // calculated dynamically (days × price) at checkout time.
        const priceInCents = Math.round(body.price * 100);

        const product = await stripe.products.create({
          name: body.title,
          description: `${body.description} — ${body.priceType} rate at ${body.location}`,
          // PLACEHOLDER: add images here if the listing has media URLs
          default_price_data: {
            // PLACEHOLDER: change currency to match your market (e.g. 'usd', 'gbp')
            currency: "aud",
            // Base rate per billing period (displayed in Stripe dashboard)
            unit_amount: priceInCents,
          },
          metadata: {
            // Maps the platform product back to the listing and venue
            listingId,
            venueId: accountId,
            priceType: body.priceType ?? "daily",
          },
          // Do NOT pass stripeAccount here — products are created at the platform level
          // (not on the connected account), which is required for destination charges.
        });

        // Store the Stripe Product ID on the listing for future reference
        await ListingModel.findByIdAndUpdate(listingId, {
          $set: { stripeProductId: product.id },
        });
      } catch (stripeErr) {
        // Log but don't fail listing creation if Stripe product sync fails
        console.warn("Listings POST: Stripe product creation failed:", stripeErr);
      }
    }

    const listing = toListing(doc);
    return NextResponse.json(listing);
  } catch (e) {
    console.error("Listings POST:", e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
