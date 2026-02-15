"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import BookingCard from "@/components/BookingCard";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, listings, bookingRequests, updateBookingStatus } = useAuth();

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Please log in to view your dashboard.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "venue") {
    return <VenueDashboard />;
  }

  return <RenterDashboard />;
}

// ────────────────────────────────────────────────────────────
// VENUE DASHBOARD
// ────────────────────────────────────────────────────────────
function VenueDashboard() {
  const { user, listings, bookingRequests, updateBookingStatus } = useAuth();

  const myListings = useMemo(
    () => listings.filter((l) => l.venueId === user?.id),
    [listings, user]
  );

  // Get all booking requests for this venue's listings
  const myListingIds = useMemo(
    () => new Set(myListings.map((l) => l.id)),
    [myListings]
  );

  const incomingRequests = useMemo(
    () => bookingRequests.filter((b) => myListingIds.has(b.listingId)),
    [bookingRequests, myListingIds]
  );

  const pendingCount = incomingRequests.filter(
    (b) => b.status === "pending"
  ).length;

  // Simple revenue calc (approved bookings x listing price)
  const weeklyRevenue = useMemo(() => {
    return incomingRequests
      .filter((b) => b.status === "approved")
      .reduce((sum, b) => {
        const listing = listings.find((l) => l.id === b.listingId);
        return sum + (listing?.price ?? 0);
      }, 0);
  }, [incomingRequests, listings]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
            <p className="mt-1 text-muted">
              Manage your chairs and booking requests
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create New Listing
          </Link>
        </div>

        {/* Revenue Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Active Listings</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {myListings.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Weekly Earned Revenue</p>
            <p className="mt-1 text-2xl font-bold text-success">
              £{weeklyRevenue}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Yearly Earned Revenue</p>
            <p className="mt-1 text-2xl font-bold text-success">
              £{weeklyRevenue * 52}
            </p>
          </div>
        </div>

        {/* Listings Grid */}
        {myListings.length > 0 ? (
          <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mb-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12">
            <svg
              className="h-10 w-10 text-muted/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <p className="mt-3 font-medium text-foreground">No listings yet</p>
            <p className="text-sm text-muted">
              Create your first listing to start earning
            </p>
          </div>
        )}

        {/* Incoming Requests */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Incoming Requests
            </h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                {pendingCount} pending
              </span>
            )}
          </div>

          {incomingRequests.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {incomingRequests.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showActions
                  onAccept={(id) => updateBookingStatus(id, "approved")}
                  onDecline={(id) => updateBookingStatus(id, "declined")}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-8 text-center">
              <p className="text-muted">No booking requests yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RENTER DASHBOARD
// ────────────────────────────────────────────────────────────
function RenterDashboard() {
  const { user, bookingRequests } = useAuth();

  const myRequests = useMemo(
    () => bookingRequests.filter((b) => b.renterId === user?.id),
    [bookingRequests, user]
  );

  const approvedCount = myRequests.filter(
    (b) => b.status === "approved"
  ).length;
  const pendingCount = myRequests.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              My Booking Requests
            </h1>
            <p className="mt-1 text-muted">
              Track the status of your chair rental requests
            </p>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            Browse Listings
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Total Requests</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {myRequests.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Approved</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {approvedCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Pending</p>
            <p className="mt-1 text-2xl font-bold text-warning">
              {pendingCount}
            </p>
          </div>
        </div>

        {/* Requests List */}
        {myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <svg
              className="h-10 w-10 text-muted/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <p className="mt-3 font-medium text-foreground">
              No requests yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Browse listings and request a chair to get started
            </p>
            <Link
              href="/listings"
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Find a Chair
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
