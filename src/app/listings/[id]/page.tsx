"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, listings, addBookingRequest } = useAuth();

  const listing = listings.find((l) => l.id === params.id);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Listing not found
            </p>
            <Link
              href="/listings"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Back to listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleRequestBooking = () => {
    if (!startDate || !endDate) return;
    addBookingRequest({
      listingId: listing.id,
      listingTitle: listing.title,
      startDate,
      endDate,
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to listings
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary-light to-accent/20 sm:h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-16 w-16 text-primary/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
            </div>

            {/* Details */}
            <div className="mt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {listing.title}
                  </h1>
                  <p className="mt-1 text-muted">{listing.venueName}</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-primary-light px-3 py-1.5">
                  <svg
                    className="h-4 w-4 text-warning"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-primary-dark">
                    {listing.rating}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted">Location</p>
                  <p className="mt-1 font-medium text-foreground">
                    {listing.location}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted">Price</p>
                  <p className="mt-1 font-medium text-foreground">
                    £{listing.price}
                    <span className="text-sm font-normal text-muted">
                      /week
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted">Availability</p>
                  <p className="mt-1 font-medium text-foreground">
                    {listing.availability}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted">Price Type</p>
                  <p className="mt-1 font-medium text-foreground capitalize">
                    {listing.priceType}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Description
                </h2>
                <p className="mt-2 leading-relaxed text-muted">
                  {listing.description}
                </p>
              </div>

              {/* Equipment */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Equipment Included
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.equipmentIncluded.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 text-center">
                <p className="text-3xl font-bold text-foreground">
                  £{listing.price}
                </p>
                <p className="text-sm text-muted">per week</p>
              </div>

              {submitted ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-2 font-semibold text-green-800">
                    Request Sent!
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    The venue will review your booking request.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark cursor-pointer"
                  >
                    View My Requests
                  </button>
                </div>
              ) : user?.role === "renter" ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRequestBooking}
                    disabled={!startDate || !endDate}
                    className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Request Booking
                  </button>
                </>
              ) : user?.role === "venue" ? (
                <p className="text-center text-sm text-muted">
                  Switch to a renter account to book this listing.
                </p>
              ) : (
                <Link
                  href="/login?intent=renter"
                  className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
                >
                  Log in to Request Booking
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
