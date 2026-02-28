"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import RatingBreakdown from "@/components/RatingBreakdown";
import { useAuth } from "@/context/AuthContext";
import type { VenueProfile, Review } from "@/lib/types";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function VenueProfilePage() {
  const params = useParams();
  const venueId = params.venueId as string;
  const { listings } = useAuth();

  const [profile, setProfile] = useState<VenueProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    Promise.all([
      fetch(`/api/venue-profile?venueId=${venueId}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/reviews?venueId=${venueId}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([profileData, reviewData]) => {
        setProfile(profileData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [venueId]);

  const venueListings = useMemo(
    () => listings.filter((l) => l.venueId === venueId),
    [listings, venueId]
  );

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
    ? Math.round(
        ((computedBreakdown.cleanliness +
          computedBreakdown.accuracy +
          computedBreakdown.communication) /
          3) *
          10
      ) / 10
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-center px-4">
          <div>
            <p className="text-lg font-semibold text-foreground">Venue not found</p>
            <p className="mt-1 text-sm text-muted">
              This venue hasn&apos;t set up their public profile yet.
            </p>
            <Link
              href="/listings"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Browse listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverPhoto = profile.bannerPhoto ?? profile.photos[0] ?? null;
  const hasMorePhotos = profile.photos.length > 5;
  const remainingPhotoCount = profile.photos.length - 5;

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const staticMapUrl =
    mapsKey && profile.latitude != null && profile.longitude != null
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${profile.latitude},${profile.longitude}&zoom=15&size=1200x400&scale=2&markers=color:0x2563eb%7C${profile.latitude},${profile.longitude}&key=${mapsKey}`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Lightbox ───────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 cursor-pointer transition"
            onClick={() => setLightboxUrl(null)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── All Photos Modal ───────────────────────────────── */}
      {showAllPhotos && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-6 backdrop-blur-sm"
          onClick={() => setShowAllPhotos(false)}
        >
          <button
            className="fixed right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 cursor-pointer transition"
            onClick={() => setShowAllPhotos(false)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="mx-auto max-w-5xl pt-14" onClick={(e) => e.stopPropagation()}>
            <h2
              className="mb-6 text-2xl font-normal text-white"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              All Photos &middot; {profile.photos.length}
            </h2>
            <div className="columns-2 gap-3 sm:columns-3">
              {profile.photos.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setShowAllPhotos(false);
                    setLightboxUrl(url);
                  }}
                  className="mb-3 block w-full overflow-hidden rounded-xl cursor-pointer transition hover:opacity-90"
                >
                  <img src={url} alt="" className="w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PHOTO HERO
      ══════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden" style={{ height: "540px" }}>
        {/* Background image or gradient fallback */}
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={profile.displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #dbeafe 0%, #1d4ed8 60%, #0f172a 100%)",
            }}
          />
        )}

        {/* Gradient overlay — subtle top, heavy bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.72) 85%, rgba(0,0,0,0.82) 100%)",
          }}
        />

        {/* Decorative blur accent */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-primary/30 blur-3xl opacity-40" />

        {/* Back link — top left */}
        <div className="absolute left-0 right-0 top-0 mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to listings
          </Link>
        </div>

        {/* Hero content — bottom */}
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Left: avatar + name + location + socials */}
            <div className="flex items-end gap-5">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-[3px] border-white bg-primary text-3xl font-extrabold text-white shadow-xl">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1
                  className="text-3xl font-normal leading-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  {profile.displayName}
                </h1>

                {profile.location && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <svg className="h-4 w-4 shrink-0 text-white/75" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-sm font-medium text-white/75">{profile.location}</span>
                  </div>
                )}

                {/* Social links as frosted glass pills */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {profile.website && (
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/35"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                      </svg>
                      Website
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/35"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      @{profile.instagram}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: rating badge */}
            {computedBreakdown && (
              <div className="shrink-0 rounded-2xl border border-white/20 bg-white/15 px-5 py-3.5 text-center backdrop-blur-md">
                <p className="text-3xl font-extrabold text-white">{computedRating}</p>
                <p className="text-xs text-white/65">out of 10</p>
                <p className="mt-0.5 text-xs text-white/65">
                  {computedBreakdown.count}{" "}
                  {computedBreakdown.count === 1 ? "review" : "reviews"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PAGE BODY
      ══════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">

        {/* ── About ──────────────────────────────────────────── */}
        {(profile.bio ||
          venueListings.length > 0 ||
          profile.specialties.length > 0) && (
          <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-14"
          >
            {profile.bio && (
              <motion.div variants={fadeUp}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  About
                </span>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/75 sm:text-lg">
                  {profile.bio}
                </p>
              </motion.div>
            )}

            {/* Quick stats row */}
            {(venueListings.length > 0 ||
              profile.specialties.length > 0 ||
              computedBreakdown) && (
              <motion.div
                variants={fadeUp}
                className="mt-6 flex flex-wrap gap-3"
              >
                {venueListings.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">
                      {venueListings.length}
                    </span>
                    <span className="text-sm text-muted">
                      {venueListings.length === 1 ? "space" : "spaces"}
                    </span>
                  </div>
                )}
                {profile.specialties.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">
                      {profile.specialties.length}
                    </span>
                    <span className="text-sm text-muted">
                      {profile.specialties.length === 1 ? "specialty" : "specialties"}
                    </span>
                  </div>
                )}
                {computedBreakdown && (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">
                      {computedRating}
                    </span>
                    <span className="text-sm text-muted">
                      rating ({computedBreakdown.count} reviews)
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </motion.section>
        )}

        {/* ── Photo Mosaic ───────────────────────────────────── */}
        {profile.photos.length > 0 && (
          <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-14"
          >
            <motion.div
              variants={fadeUp}
              className="mb-5 flex items-end justify-between"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Gallery
                </span>
                <h2
                  className="mt-1 text-2xl font-normal text-foreground"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  Inside the Venue
                </h2>
              </div>
              {profile.photos.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllPhotos(true)}
                  className="text-sm font-medium text-primary transition hover:underline cursor-pointer"
                >
                  View all {profile.photos.length} photos
                </button>
              )}
            </motion.div>

            <motion.div variants={fadeUp}>
              {/* Desktop: Airbnb-style mosaic */}
              {profile.photos.length === 1 ? (
                <button
                  type="button"
                  onClick={() => setLightboxUrl(profile.photos[0])}
                  className="hidden w-full overflow-hidden rounded-2xl border border-border cursor-pointer transition hover:opacity-95 sm:block"
                  style={{ height: "500px" }}
                >
                  <img
                    src={profile.photos[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div
                  className="hidden overflow-hidden rounded-2xl border border-border sm:grid"
                  style={{
                    gridTemplateColumns: "2fr 1fr",
                    gap: "3px",
                    height: "500px",
                    background: "#e2e8f0",
                  }}
                >
                  {/* Main large photo */}
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(profile.photos[0])}
                    className="relative h-full w-full overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={profile.photos[0]}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  </button>

                  {/* Right 2×2 grid */}
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr",
                      gridTemplateRows: "1fr 1fr",
                      gap: "3px",
                    }}
                  >
                    {[1, 2, 3, 4].map((idx) => {
                      const url = profile.photos[idx];
                      const isOverlay = idx === 4 && hasMorePhotos;
                      if (!url)
                        return (
                          <div
                            key={idx}
                            className="bg-muted/10"
                          />
                        );
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            isOverlay
                              ? setShowAllPhotos(true)
                              : setLightboxUrl(url)
                          }
                          className="relative h-full w-full overflow-hidden cursor-pointer group"
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          />
                          {isOverlay && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                              <span className="text-lg font-bold text-white">
                                +{remainingPhotoCount} more
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile: horizontal scroll strip */}
              <div
                className="flex gap-3 overflow-x-auto pb-2 sm:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {profile.photos.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="h-56 w-48 shrink-0 overflow-hidden rounded-xl border border-border cursor-pointer transition hover:opacity-90"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* ── Available Spaces ───────────────────────────────── */}
        {venueListings.length > 0 && (
          <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-14"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Spaces
              </span>
              <h2
                className="mt-1 text-2xl font-normal text-foreground"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Available to Book ({venueListings.length})
              </h2>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {venueListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Specialties + Booth Policies (two-column) ─────── */}
        {(profile.specialties.length > 0 || profile.boothPolicies.length > 0) && (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-14 grid gap-10 lg:grid-cols-2"
          >
            {profile.specialties.length > 0 && (
              <motion.section variants={fadeUp}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Focus
                </span>
                <h2
                  className="mt-1 mb-5 text-2xl font-normal text-foreground"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  Specialties
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-primary/30 bg-primary-light px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white cursor-default"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {profile.boothPolicies.length > 0 && (
              <motion.section variants={fadeUp}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Rules
                </span>
                <h2
                  className="mt-1 mb-5 text-2xl font-normal text-foreground"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  Booth Policies
                </h2>
                <div className="space-y-2.5">
                  {profile.boothPolicies.map((policy, i) => (
                    <div
                      key={policy}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition hover:border-primary/30 hover:shadow-sm"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">
                        {policy}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </motion.div>
        )}

        {/* ── Location Map ───────────────────────────────────── */}
        {staticMapUrl && (
          <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-14"
          >
            <motion.div variants={fadeUp} className="mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Location
              </span>
              <h2
                className="mt-1 text-2xl font-normal text-foreground"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Find Us
              </h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <a
                href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-2xl border border-border transition hover:opacity-95 hover:shadow-lg"
              >
                <img
                  src={staticMapUrl}
                  alt="Venue location"
                  className="h-[280px] w-full object-cover"
                />
              </a>
              {profile.location && (
                <div className="mt-3 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-sm text-muted">{profile.location}</span>
                  <span className="ml-1 text-xs font-medium text-primary">
                    Open in Maps ↗
                  </span>
                </div>
              )}
            </motion.div>
          </motion.section>
        )}

        {/* ── Reviews ────────────────────────────────────────── */}
        {profile.showReviews && computedBreakdown && (
          <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mb-14"
          >
            <motion.div variants={fadeUp} className="mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Reputation
              </span>
              <h2
                className="mt-1 text-2xl font-normal text-foreground"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Guest Reviews
              </h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <RatingBreakdown
                breakdown={computedBreakdown}
                reviews={reviews}
                overallRating={computedRating}
              />
            </motion.div>
          </motion.section>
        )}

        {/* Empty state */}
        {!profile.bio &&
          profile.photos.length === 0 &&
          profile.specialties.length === 0 &&
          venueListings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-muted">
                This venue is still setting up their profile.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
