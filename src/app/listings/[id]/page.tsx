"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ListingGallery from "@/components/ListingGallery";
import RatingBreakdown from "@/components/RatingBreakdown";
import TrustBadge from "@/components/TrustBadge";

// ── Trust tier colours (used for the sidebar trust card) ──────────────────────
const TIER_COLORS: Record<string, { bg: string; badge: string; dot: string; bar: string }> = {
  unranked: { bg: "from-slate-50 to-slate-100/60 border-slate-200",   badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",   dot: "bg-slate-400",  bar: "bg-slate-400"  },
  bronze:   { bg: "from-amber-50 to-orange-50/40 border-amber-200/70", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   dot: "bg-amber-500",  bar: "bg-amber-500"  },
  silver:   { bg: "from-slate-50 to-slate-100/60 border-slate-200",   badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-300",   dot: "bg-slate-500",  bar: "bg-slate-500"  },
  gold:     { bg: "from-yellow-50 to-amber-50/40 border-yellow-200",  badge: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-300", dot: "bg-yellow-500", bar: "bg-yellow-500" },
  platinum: { bg: "from-indigo-50 to-blue-50/40 border-indigo-200/70", badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", dot: "bg-indigo-500", bar: "bg-indigo-500" },
};
import { formatPriceUnit, formatAvailability, DAY_NAMES } from "@/lib/listingFormat";
import { useAuth } from "@/context/AuthContext";
import type { Review, AvailabilitySlot, TrustProfile } from "@/lib/types";
import type { SlotAvailability } from "@/app/api/listings/[id]/slot-availability/route";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, listings, addBookingRequest, removeListing, startConversation } = useAuth();

  const listing = listings.find((l) => l.id === params.id);

  // One-off booking state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [houseRulesAccepted, setHouseRulesAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Recurring booking state
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [recurringBookingType, setRecurringBookingType] = useState<"recurring_slot" | "date_range">("recurring_slot");
  const [recurringStartDate, setRecurringStartDate] = useState("");
  const [recurringEndDate, setRecurringEndDate] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [venueTrustProfile, setVenueTrustProfile] = useState<TrustProfile | null>(null);
  const [showTrustBreakdown, setShowTrustBreakdown] = useState(false);

  useEffect(() => {
    if (!listing) return;
    fetch(`/api/reviews?listingId=${listing.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Review[]) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [listing?.id]);

  useEffect(() => {
    if (!listing?.venueId) return;
    fetch(`/api/trust?accountId=${encodeURIComponent(listing.venueId)}&role=venue`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: TrustProfile | null) => setVenueTrustProfile(data))
      .catch(() => {});
  }, [listing?.venueId]);

  useEffect(() => {
    if (!listing || listing.listingMode !== "recurring") return;
    fetch(`/api/listings/${listing.id}/slot-availability`)
      .then((r) => r.ok ? r.json() : { slots: [] })
      .then((data: { slots: SlotAvailability[] }) => setSlotAvailability(data.slots ?? []))
      .catch(() => {});
  }, [listing?.id, listing?.listingMode]);

  const computedBreakdown = useMemo(() => {
    if (reviews.length === 0) return null;
    const count = reviews.length;
    const avg = (key: keyof Review["scores"]) =>
      reviews.reduce((sum, r) => sum + r.scores[key], 0) / count;
    return {
      cleanliness: avg("cleanliness"),
      accuracy: avg("accuracy"),
      communication: avg("communication"),
      count,
    };
  }, [reviews]);

  const computedRating = computedBreakdown
    ? Math.round(((computedBreakdown.cleanliness + computedBreakdown.accuracy + computedBreakdown.communication) / 3) * 10) / 10
    : listing?.rating ?? 0;

  const hasHouseRules = !!(listing?.houseRules?.length);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Listing not found</p>
            <Link href="/listings" className="mt-2 inline-block text-sm text-primary hover:underline">
              Back to listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleRequestBooking = () => {
    if (hasHouseRules && !houseRulesAccepted) return;
    if (listing.listingMode === "recurring") {
      if (!selectedSlot) return;
      if (recurringBookingType === "date_range" && (!recurringStartDate || !recurringEndDate)) return;
      addBookingRequest({
        listingId: listing.id,
        listingTitle: listing.title,
        startDate: recurringBookingType === "date_range" ? recurringStartDate : "",
        endDate: recurringBookingType === "date_range" ? recurringEndDate : "",
        houseRulesAccepted,
        bookingType: recurringBookingType,
        recurringSlot: selectedSlot,
      });
    } else {
      if (!startDate || !endDate) return;
      addBookingRequest({
        listingId: listing.id,
        listingTitle: listing.title,
        startDate,
        endDate,
        houseRulesAccepted,
        bookingType: "date_range",
      });
    }
    setSubmitted(true);
  };

  const isVenueOwner = user?.role === "venue" && user?.accountId === listing.venueId;
  const isRecurring = listing.listingMode === "recurring";

  const handleDeleteListing = () => {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    removeListing(listing.id);
    router.push("/dashboard");
  };

  const staticMapUrl =
    listing.latitude != null && listing.longitude != null && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${listing.latitude},${listing.longitude}&zoom=15&size=800x300&scale=2&markers=color:red%7C${listing.latitude},${listing.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : null;

  const mapsLink =
    listing.latitude != null && listing.longitude != null
      ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* ── Top nav row ──────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/listings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Browse listings
          </Link>
          {isVenueOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/listings/${listing.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary-light px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125" />
                </svg>
                Edit
              </Link>
              <button type="button" onClick={handleDeleteListing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Title header — ABOVE the gallery ─────────────────────────────── */}
        <div className="mb-5">
          {/* Badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isRecurring && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Recurring · Always Open
              </span>
            )}
            {computedBreakdown ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {computedRating}/10
                <span className="font-normal text-amber-600">{computedBreakdown.count} review{computedBreakdown.count !== 1 ? "s" : ""}</span>
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted/10 border border-border px-3 py-1 text-xs font-medium text-muted">
                New listing
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{listing.title}</h1>

          {/* Venue link + trust badge */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link href={`/venues/${listing.venueId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary group">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              <span className="border-b border-transparent group-hover:border-primary/50">{listing.venueName}</span>
              <svg className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            {venueTrustProfile && venueTrustProfile.tier !== "fresh" && (
              <TrustBadge profile={venueTrustProfile} size="sm" />
            )}
          </div>
        </div>

        {/* ── Gallery ───────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <ListingGallery media={listing.media ?? []} title={listing.title} />
        </div>

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">

          {/* ── Main content column ──────────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Key highlights — feature list (Muse Avenue style) */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Prime location</p>
                  <p className="text-sm text-muted">{listing.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    ${listing.price}
                    <span className="ml-1 font-normal text-muted">{formatPriceUnit(listing.priceType)}</span>
                  </p>
                  <p className="text-sm text-muted">Transparent pricing, no hidden fees</p>
                </div>
              </div>

              {Array.isArray(listing.availability) && listing.availability.length > 0 && (
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{formatAvailability(listing.availability)}</p>
                    <p className="text-sm text-muted">Regular slots available to book</p>
                  </div>
                </div>
              )}

              {listing.equipmentIncluded?.length > 0 && (
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {listing.equipmentIncluded.length} item{listing.equipmentIncluded.length !== 1 ? "s" : ""} included
                    </p>
                    <p className="text-sm text-muted">Equipment and tools ready to use</p>
                  </div>
                </div>
              )}
            </div>

            <hr className="my-8 border-border" />

            {/* About */}
            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">About this space</h2>
              <p className="text-[15px] leading-7 text-muted">{listing.description}</p>
            </section>

            <hr className="my-8 border-border" />

            {/* Location */}
            <section>
              <h2 className="mb-1 text-xl font-semibold text-foreground">Location</h2>
              <p className="mb-4 flex items-center gap-2 text-sm text-muted">
                <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {listing.location}
              </p>
              {staticMapUrl && mapsLink ? (
                <a href={mapsLink} target="_blank" rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-2xl border border-border shadow-sm transition hover:shadow-md">
                  <img src={staticMapUrl} alt="Map" className="h-[220px] w-full object-cover" />
                  <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3 text-sm font-medium text-primary transition-colors group-hover:text-primary-dark">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Google Maps
                  </div>
                </a>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
                  No map available for this location
                </div>
              )}
            </section>

            {/* Equipment */}
            {listing.equipmentIncluded?.length > 0 && (
              <>
                <hr className="my-8 border-border" />
                <section>
                  <h2 className="mb-4 text-xl font-semibold text-foreground">What&rsquo;s included</h2>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {listing.equipmentIncluded.map((item) => (
                      <li key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="text-sm font-medium text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {/* House Rules */}
            {hasHouseRules && (
              <>
                <hr className="my-8 border-border" />
                <section>
                  <h2 className="mb-1 text-xl font-semibold text-foreground">House rules</h2>
                  <p className="mb-4 text-sm text-muted">
                    Freelancers must agree to the following before booking this space.
                  </p>
                  <div className="space-y-2">
                    {listing.houseRules.map((rule, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm text-foreground">{rule}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Reviews */}
            {computedBreakdown && (
              <>
                <hr className="my-8 border-border" />
                <RatingBreakdown
                  breakdown={computedBreakdown}
                  reviews={reviews}
                  overallRating={computedRating}
                />
              </>
            )}

          </div>

          {/* ── Sticky sidebar ───────────────────────────────────────────────── */}
          <div>
            <div className="sticky top-24">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">

                {/* Price */}
                <div className="px-6 pt-6 pb-5">
                  {isRecurring && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Recurring · Always Open
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-foreground">${listing.price}</span>
                    <span className="text-base text-muted">{formatPriceUnit(listing.priceType)}</span>
                  </div>
                  {computedBreakdown && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-foreground">{computedRating}/10</span>
                      <span className="text-sm text-muted">· {computedBreakdown.count} review{computedBreakdown.count !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>

                {/* Booking form */}
                <div className="border-t border-border px-6 py-5">
                  {submitted ? (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                      <svg className="mx-auto h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 font-semibold text-green-800">Application Sent!</p>
                      <p className="mt-1 text-sm text-green-700">The venue will review your application.</p>
                      <button onClick={() => router.push("/dashboard")}
                        className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark cursor-pointer">
                        View My Requests
                      </button>
                    </div>
                  ) : user?.role === "renter" ? (
                    listing.listingMode === "recurring" ? (
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">1. Choose a time slot</p>
                          {slotAvailability.length === 0 ? (
                            <p className="text-sm text-muted">No availability slots set for this listing.</p>
                          ) : (
                            <div className="space-y-2">
                              {slotAvailability.map((s) => {
                                const isFull = s.approved >= s.capacity;
                                const isSelected = selectedSlot?.day === s.day && selectedSlot?.start === s.start && selectedSlot?.end === s.end;
                                return (
                                  <button key={`${s.day}-${s.start}`} type="button" disabled={isFull}
                                    onClick={() => setSelectedSlot(isSelected ? null : { day: s.day, start: s.start, end: s.end })}
                                    className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                      isSelected ? "border-primary bg-primary-light" : isFull ? "border-border bg-muted/10" : "border-border bg-background hover:border-primary/50"
                                    }`}>
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-foreground">{DAY_NAMES[s.day]} · {s.start}–{s.end}</span>
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        isFull ? "bg-danger/10 text-danger" : s.approved === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                      }`}>
                                        {isFull ? "Full" : `${s.capacity - s.approved} spot${s.capacity - s.approved !== 1 ? "s" : ""} open`}
                                      </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                                      <div className={`h-full rounded-full transition-all ${isFull ? "bg-danger" : "bg-primary"}`}
                                        style={{ width: `${Math.min(100, (s.approved / s.capacity) * 100)}%` }} />
                                    </div>
                                    <p className="mt-1 text-[11px] text-muted">{s.approved}/{s.capacity} spots filled</p>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {selectedSlot && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">2. Commitment type</p>
                            <div className="flex gap-2">
                              {(["recurring_slot", "date_range"] as const).map((type) => (
                                <button key={type} type="button" onClick={() => setRecurringBookingType(type)}
                                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition cursor-pointer ${
                                    recurringBookingType === type ? "border-primary bg-primary-light text-primary" : "border-border bg-background text-muted hover:border-primary/40"
                                  }`}>
                                  {type === "recurring_slot" ? "Weekly (ongoing)" : "Fixed date range"}
                                </button>
                              ))}
                            </div>
                            {recurringBookingType === "date_range" && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted">Start</label>
                                  <input type="date" value={recurringStartDate} onChange={(e) => setRecurringStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted">End</label>
                                  <input type="date" value={recurringEndDate} onChange={(e) => setRecurringEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {hasHouseRules && selectedSlot && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="mb-2 text-sm font-semibold text-amber-900">Agreement Required</p>
                            <div className="mb-3 max-h-28 space-y-1.5 overflow-y-auto">
                              {listing.houseRules.map((rule, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs text-amber-900">
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">{index + 1}</span>
                                  <span>{rule}</span>
                                </div>
                              ))}
                            </div>
                            <label className="flex cursor-pointer items-start gap-2">
                              <input type="checkbox" checked={houseRulesAccepted} onChange={(e) => setHouseRulesAccepted(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-primary focus:ring-primary cursor-pointer" />
                              <span className="text-xs font-medium text-amber-900">I have read and agree to all house rules</span>
                            </label>
                          </div>
                        )}
                        <button onClick={handleRequestBooking}
                          disabled={!selectedSlot || (recurringBookingType === "date_range" && (!recurringStartDate || !recurringEndDate)) || (hasHouseRules && !houseRulesAccepted)}
                          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                          Apply for This Slot
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-foreground">Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-foreground">End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                        </div>
                        {hasHouseRules && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="mb-2 text-sm font-semibold text-amber-900">Agreement Required</p>
                            <p className="mb-3 text-xs text-amber-800">This venue has house rules you must accept before booking.</p>
                            <div className="mb-3 max-h-32 space-y-1.5 overflow-y-auto">
                              {listing.houseRules.map((rule, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs text-amber-900">
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">{index + 1}</span>
                                  <span>{rule}</span>
                                </div>
                              ))}
                            </div>
                            <label className="flex cursor-pointer items-start gap-2">
                              <input type="checkbox" checked={houseRulesAccepted} onChange={(e) => setHouseRulesAccepted(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-primary focus:ring-primary cursor-pointer" />
                              <span className="text-xs font-medium text-amber-900">I have read and agree to all house rules</span>
                            </label>
                          </div>
                        )}
                        <button onClick={handleRequestBooking} disabled={!startDate || !endDate || (hasHouseRules && !houseRulesAccepted)}
                          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                          Request Booking
                        </button>
                      </div>
                    )
                  ) : user?.role === "venue" ? (
                    <p className="text-center text-sm text-muted">Switch to a renter account to book this listing.</p>
                  ) : (
                    <Link href="/login?intent=renter"
                      className="block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl">
                      Log in to Request Booking
                    </Link>
                  )}
                </div>

                {/* Message venue */}
                {user && !isVenueOwner && (
                  <div className="border-t border-border px-6 pb-5 pt-4">
                    <button
                      onClick={async () => {
                        const conv = await startConversation({
                          participantId: listing.venueId,
                          participantName: listing.venueName,
                          listingId: listing.id,
                          listingTitle: listing.title,
                        });
                        if (conv) router.push(`/messages/${conv.id}`);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      Message {listing.venueName}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Venue Trust Card ─────────────────────────────── */}
              {venueTrustProfile && (() => {
                const tc = TIER_COLORS[venueTrustProfile.tier] ?? TIER_COLORS.unranked;
                const vm = venueTrustProfile.venueMetrics;
                const tierLabel = venueTrustProfile.tier.charAt(0).toUpperCase() + venueTrustProfile.tier.slice(1);
                const hasActivity = vm && (vm.activeFreelancers > 0 || vm.totalCompleted > 0);
                return (
                  <div className={`mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br ${tc.bg}`}>
                    <div className="px-5 pt-5 pb-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                        Venue Trust
                      </p>

                      {/* Tier badge + Trust Index */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${tc.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${tc.dot}`} />
                          {tierLabel}
                          {venueTrustProfile.foundingVerified && (
                            <span className="ml-1 text-amber-600">✦ Founding</span>
                          )}
                        </span>
                        <div className="text-right">
                          <p className="text-2xl font-bold leading-none text-foreground">
                            {venueTrustProfile.trustScore}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">/ 100 Trust Index</p>
                        </div>
                      </div>

                      {/* 3 key metrics */}
                      {hasActivity && vm && (
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl border border-white/70 bg-white/50 px-2 py-2.5">
                            <p className="text-base font-bold leading-none text-foreground">{vm.satisfactionScore}%</p>
                            <p className="mt-1 text-[10px] text-muted">Satisfaction</p>
                          </div>
                          <div className="rounded-xl border border-white/70 bg-white/50 px-2 py-2.5">
                            <p className="text-base font-bold leading-none text-foreground">{vm.activeFreelancers}</p>
                            <p className="mt-1 text-[10px] text-muted">Freelancers</p>
                          </div>
                          <div className="rounded-xl border border-white/70 bg-white/50 px-2 py-2.5">
                            <p className="text-base font-bold leading-none text-foreground">{vm.activeFreelancers}</p>
                            <p className="mt-1 text-[10px] text-muted">Freelancers</p>
                          </div>
                        </div>
                      )}

                      {/* Expand toggle */}
                      {vm && (
                        <button
                          type="button"
                          onClick={() => setShowTrustBreakdown((v) => !v)}
                          className="mt-4 flex w-full items-center justify-between text-xs font-medium text-primary transition-colors hover:text-primary-dark cursor-pointer"
                        >
                          <span>{showTrustBreakdown ? "Hide score breakdown" : "See full score breakdown"}</span>
                          <svg
                            className={`h-4 w-4 transition-transform duration-200 ${showTrustBreakdown ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      )}

                      {/* Expandable score breakdown */}
                      {showTrustBreakdown && vm && (
                        <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
                          {[
                            { label: "Fairness",               score: vm.fairnessScore,    color: "bg-primary"  },
                            { label: "Freelancer Satisfaction", score: vm.satisfactionScore, color: "bg-accent"   },
                            { label: "Payment Reliability",     score: vm.paymentScore,      color: "bg-success"  },
                          ].map(({ label, score, color }) => (
                            <div key={label}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs text-muted">{label}</span>
                                <span className="text-xs font-semibold text-foreground">{score}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                                <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center justify-between border-t border-black/10 pt-3 text-xs">
                            <span className="text-muted">{vm.totalCompleted} completed booking{vm.totalCompleted !== 1 ? "s" : ""}</span>
                            <span className={vm.disputeCount > 0 ? "text-danger" : "text-success"}>
                              {vm.disputeCount} dispute{vm.disputeCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer note */}
                    <div className="border-t border-black/10 bg-white/30 px-5 py-3">
                      <p className="text-[11px] text-muted leading-relaxed">
                        Trust scores are based on verified bookings and freelancer reviews.
                      </p>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
