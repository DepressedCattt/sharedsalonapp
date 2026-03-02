"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import BookingCard from "@/components/BookingCard";
import TrustProfileCard from "@/components/TrustProfileCard";
import { useAuth } from "@/context/AuthContext";
import type { VenueProfile, BookingRequest, BookingStatus } from "@/lib/types";

// ─── Bookings helpers ────────────────────────────────────────
type TimePeriod = "week" | "month" | "year" | "all";

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "year", label: "Past Year" },
  { value: "all", label: "All Time" },
];

const ALL_STATUSES: BookingStatus[] = ["pending", "approved", "completed", "declined"];

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  declined: "Declined",
};

function getStartDate(period: TimePeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "week") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

function filterByPeriod(bookings: BookingRequest[], period: TimePeriod): BookingRequest[] {
  const start = getStartDate(period);
  if (!start) return bookings;
  return bookings.filter((b) => new Date(b.createdAt) >= start);
}

interface ChartDataPoint {
  date: string;
  revenue: number;
}

function buildChartData(bookings: BookingRequest[], period: TimePeriod): ChartDataPoint[] {
  const revenueBookings = bookings.filter(
    (b) => b.status === "approved" || b.status === "completed"
  );
  const now = new Date();
  let start: Date;
  let formatDate: (d: Date) => string;

  if (period === "all" && revenueBookings.length > 0) {
    const dates = revenueBookings.map((b) => new Date(b.createdAt).getTime());
    start = new Date(Math.min(...dates));
    const range = now.getTime() - start.getTime();
    const days = range / (1000 * 60 * 60 * 24);
    formatDate =
      days > 365
        ? (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        : (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else if (period === "year") {
    start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    formatDate = (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    formatDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    formatDate = (d) =>
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  const revenueByDay = new Map<string, number>();
  for (const b of revenueBookings) {
    const d = new Date(b.createdAt);
    const isMonthly =
      period === "year" ||
      (period === "all" && now.getTime() - start.getTime() > 365 * 86400000);
    const key = isMonthly
      ? `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      : `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + (b.price ?? 0));
  }

  const points: ChartDataPoint[] = [];
  const cursor = new Date(start);
  const isMonthly =
    period === "year" || (period === "all" && now.getTime() - start.getTime() > 365 * 86400000);

  if (isMonthly) {
    cursor.setDate(1);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth()).padStart(2, "0")}`;
      points.push({ date: formatDate(new Date(cursor)), revenue: revenueByDay.get(key) ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth()).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      points.push({ date: formatDate(new Date(cursor)), revenue: revenueByDay.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return points;
}

function RevenueChart({ data, label, color = "#2563eb" }: { data: ChartDataPoint[]; label: string; color?: string }) {
  if (data.length === 0) return null;
  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{label}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradientDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted, #9ca3af)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-muted, #9ca3af)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} domain={[0, maxRevenue > 0 ? "auto" : 100]} width={48} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--color-card, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "0.75rem", fontSize: "0.8rem" }}
              formatter={(value: number | undefined) => [`$${value ?? 0}`, "Revenue"]}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Area type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} fill="url(#revenueGradientDash)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TimePeriodSelector({ value, onChange }: { value: TimePeriod; onChange: (v: TimePeriod) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/10 p-1">
      {TIME_PERIODS.map((p) => (
        <button key={p.value} onClick={() => onChange(p.value)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${value === p.value ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground hover:bg-muted/20"}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Page root ───────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

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
  const { user, listings, bookingRequests, updateBookingStatus, removeListing } = useAuth();

  // Sub-tab state
  const [dashTab, setDashTab] = useState<"listings" | "bookings">("listings");

  // Venue profile setup state
  const [venueProfile, setVenueProfile] = useState<VenueProfile | null | undefined>(undefined);
  const [setupDismissed, setSetupDismissed] = useState(false);

  // Bookings tab state
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  useEffect(() => {
    if (!user?.accountId) return;
    fetch(`/api/venue-profile?venueId=${user.accountId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setVenueProfile(data ?? null))
      .catch(() => setVenueProfile(null));
  }, [user?.accountId]);

  const myListings = useMemo(
    () => listings.filter((l) => l.venueId === user?.accountId),
    [listings, user]
  );

  const myListingIds = useMemo(
    () => new Set(myListings.map((l) => l.id)),
    [myListings]
  );

  const incomingRequests = useMemo(
    () => bookingRequests.filter((b) => myListingIds.has(b.listingId)),
    [bookingRequests, myListingIds]
  );

  const pendingRequests = useMemo(
    () => incomingRequests.filter((b) => b.status === "pending"),
    [incomingRequests]
  );

  const activeRecurringBookings = useMemo(
    () => incomingRequests.filter((b) => b.status === "approved" && b.bookingType === "recurring_slot"),
    [incomingRequests]
  );

  const pendingCount = pendingRequests.length;

  const totalRevenue = useMemo(
    () => incomingRequests.filter((b) => b.status === "approved" || b.status === "completed").reduce((sum, b) => sum + (b.price ?? 0), 0),
    [incomingRequests]
  );

  // Bookings tab computed values
  const periodBookings = useMemo(
    () => filterByPeriod(incomingRequests, timePeriod),
    [incomingRequests, timePeriod]
  );

  const filteredBookings = useMemo(
    () => statusFilter === "all" ? periodBookings : periodBookings.filter((b) => b.status === statusFilter),
    [periodBookings, statusFilter]
  );

  const bookingCounts = useMemo(() => {
    const c: Record<string, number> = { all: periodBookings.length };
    for (const s of ALL_STATUSES) c[s] = periodBookings.filter((b) => b.status === s).length;
    return c;
  }, [periodBookings]);

  const periodRevenue = useMemo(
    () => periodBookings.filter((b) => b.status === "approved" || b.status === "completed").reduce((sum, b) => sum + (b.price ?? 0), 0),
    [periodBookings]
  );

  const chartData = useMemo(
    () => buildChartData(incomingRequests, timePeriod),
    [incomingRequests, timePeriod]
  );

  const periodLabel = TIME_PERIODS.find((p) => p.value === timePeriod)?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
            <p className="mt-1 text-muted">Manage your chairs and booking requests</p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New Listing
          </Link>
        </div>

        {/* ── Sub-tab bar ─────────────────────────────────────── */}
        <div className="mb-8 flex gap-1 rounded-xl bg-muted/10 p-1">
          <button
            type="button"
            onClick={() => setDashTab("listings")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              dashTab === "listings"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            My Listings
            {myListings.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dashTab === "listings" ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted"}`}>
                {myListings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDashTab("bookings")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              dashTab === "bookings"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Bookings
            {pendingCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                {pendingCount} pending
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            MY LISTINGS TAB
        ══════════════════════════════════════════════════════ */}
        {dashTab === "listings" && (
          <>
            {/* Setup checklist */}
            {!setupDismissed && venueProfile !== undefined && (() => {
              const hasProfile = !!venueProfile?.displayName && !!venueProfile?.bio && !!venueProfile?.location;
              const hasPhotos = (venueProfile?.photos?.length ?? 0) > 0;
              const hasListing = myListings.length > 0;

              const steps = [
                {
                  id: "profile",
                  done: hasProfile,
                  label: "Complete your venue profile",
                  desc: "Add your bio, location, and specialties so freelancers know your space.",
                  href: "/venue-profile",
                  cta: "Set up profile",
                },
                {
                  id: "photos",
                  done: hasPhotos,
                  label: "Upload venue photos",
                  desc: "Photos added here are reused automatically when creating listings.",
                  href: "/venue-profile",
                  cta: "Add photos",
                },
                {
                  id: "listing",
                  done: hasListing,
                  label: "Create your first listing",
                  desc: "Post a chair or space for freelancers to discover and book.",
                  href: "/create",
                  cta: "Create listing",
                },
              ];

              const completedCount = steps.filter((s) => s.done).length;
              if (completedCount === steps.length) return null;

              return (
                <div className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                  <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Get started — {completedCount}/{steps.length} done</h2>
                      <p className="mt-0.5 text-xs text-muted">Complete these steps to start receiving bookings.</p>
                    </div>
                    <button type="button" onClick={() => setSetupDismissed(true)} className="shrink-0 text-muted hover:text-foreground transition-colors cursor-pointer mt-0.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mx-6 mb-4 h-1.5 overflow-hidden rounded-full bg-primary/15">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
                  </div>
                  <div className="divide-y divide-primary/10">
                    {steps.map((s) => (
                      <div key={s.id} className={`flex items-start gap-4 px-6 py-4 ${s.done ? "opacity-50" : ""}`}>
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-success/15" : "bg-primary/10"}`}>
                          {s.done ? (
                            <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${s.done ? "line-through text-muted" : "text-foreground"}`}>{s.label}</p>
                          {!s.done && <p className="mt-0.5 text-xs text-muted">{s.desc}</p>}
                        </div>
                        {!s.done && (
                          <Link href={s.href} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark">
                            {s.cta}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Two-column layout: main content + Trust Profile sidebar */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

              {/* LEFT: stats + listings + requests */}
              <div className="flex-1 min-w-0 space-y-8">

                {/* Stats row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm text-muted">Active Listings</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{myListings.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm text-muted">Pending Requests</p>
                    <p className="mt-1 text-2xl font-bold text-warning">{pendingCount}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted">Total Revenue</p>
                      <button
                        type="button"
                        onClick={() => setDashTab("bookings")}
                        className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                        Analytics &rarr;
                      </button>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-success">${totalRevenue}</p>
                  </div>
                </div>

                {/* Listings section */}
                <div>
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        My Listings
                        {myListings.length > 0 && (
                          <span className="ml-2 text-base font-normal text-muted">({myListings.length})</span>
                        )}
                      </h2>
                      {myListings.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted">
                          One-off: {myListings.filter((l) => l.listingMode !== "recurring").length}
                          {" · "}
                          Recurring: {myListings.filter((l) => l.listingMode === "recurring").length}
                        </p>
                      )}
                    </div>
                  </div>

                  {myListings.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {myListings.map((listing) => {
                        const listingPending = incomingRequests.filter(
                          (b) => b.listingId === listing.id && b.status === "pending"
                        ).length;
                        return (
                          <ListingCard
                            key={listing.id}
                            listing={listing}
                            onDelete={removeListing}
                            showEdit
                            pendingCount={listingPending}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-card">
                      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="relative mb-5">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                            <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                            </svg>
                          </div>
                          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No listings yet</h3>
                        <p className="mt-1.5 max-w-xs text-sm text-muted">
                          Create your first chair or space listing and start connecting with freelancers today.
                        </p>
                        <Link
                          href="/create"
                          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Create your first listing
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Recurring Bookings */}
                {activeRecurringBookings.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-xl font-bold text-foreground">Active Bookings</h2>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                        {activeRecurringBookings.length} ongoing
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeRecurringBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} perspective="venue" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Incoming Requests */}
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-foreground">Incoming Requests</h2>
                      {pendingCount > 0 && (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDashTab("bookings")}
                      className="text-sm font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
                    >
                      View full history &rarr;
                    </button>
                  </div>

                  {incomingRequests.filter((b) => !(b.status === "approved" && b.bookingType === "recurring_slot")).length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {incomingRequests
                        .filter((b) => !(b.status === "approved" && b.bookingType === "recurring_slot"))
                        .map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            perspective="venue"
                            showActions={booking.status === "pending"}
                            showComplete={booking.status === "approved" && booking.bookingType !== "recurring_slot"}
                            onAccept={(id) => updateBookingStatus(id, "approved")}
                            onDecline={(id) => updateBookingStatus(id, "declined")}
                            onComplete={(id) => updateBookingStatus(id, "completed")}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border py-8 text-center">
                      <p className="text-muted">No booking requests yet</p>
                    </div>
                  )}
                </div>

              </div>{/* /LEFT */}

              {/* RIGHT: Trust Profile sticky sidebar */}
              {user?.accountId && (
                <div className="lg:w-[300px] lg:shrink-0 lg:sticky lg:top-6">
                  <TrustProfileCard accountId={user.accountId} role="venue" />
                </div>
              )}

            </div>{/* /two-column */}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            BOOKINGS TAB
        ══════════════════════════════════════════════════════ */}
        {dashTab === "bookings" && (
          <>
            {/* Time period filter */}
            <div className="mb-6">
              <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Bookings</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{bookingCounts.all}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Completed</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{bookingCounts.completed ?? 0}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Approved</p>
                <p className="mt-1 text-2xl font-bold text-success">{bookingCounts.approved ?? 0}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Revenue</p>
                <p className="mt-1 text-2xl font-bold text-success">${periodRevenue}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
            </div>

            {/* Revenue chart */}
            <div className="mb-8">
              <RevenueChart data={chartData} label={`Revenue — ${periodLabel}`} color="#10b981" />
            </div>

            {/* Status filter pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(["all", ...ALL_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === s
                      ? "bg-primary text-white"
                      : "bg-muted/20 text-muted hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s]}
                  <span className="ml-1.5 text-xs opacity-75">({bookingCounts[s] ?? 0})</span>
                </button>
              ))}
            </div>

            {/* Booking list */}
            {filteredBookings.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    perspective="venue"
                    showActions={booking.status === "pending"}
                    showComplete={booking.status === "approved"}
                    onAccept={(id) => updateBookingStatus(id, "approved")}
                    onDecline={(id) => updateBookingStatus(id, "declined")}
                    onComplete={(id) => updateBookingStatus(id, "completed")}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
                <svg className="h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <p className="mt-3 font-medium text-foreground">
                  {statusFilter === "all" ? "No bookings in this period" : `No ${STATUS_LABEL[statusFilter as BookingStatus].toLowerCase()} bookings`}
                </p>
                <p className="mt-1 text-sm text-muted">Bookings from freelancers will appear here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RENTER DASHBOARD
// ────────────────────────────────────────────────────────────
function RenterDashboard() {
  const { user, bookingRequests } = useAuth();
  const [dashTab, setDashTab] = useState<"requests" | "history">("requests");

  // Booking History tab state
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

  const myRequests = useMemo(
    () => bookingRequests.filter((b) => b.renterId === user?.accountId),
    [bookingRequests, user]
  );

  const activeRecurring = useMemo(
    () => myRequests.filter((b) => b.status === "approved" && b.bookingType === "recurring_slot"),
    [myRequests]
  );

  const otherRequests = useMemo(
    () => myRequests.filter((b) => !(b.status === "approved" && b.bookingType === "recurring_slot")),
    [myRequests]
  );

  const approvedCount = myRequests.filter((b) => b.status === "approved").length;
  const pendingCount = myRequests.filter((b) => b.status === "pending").length;

  // Booking History tab data
  const periodBookings = useMemo(
    () => filterByPeriod(myRequests, timePeriod),
    [myRequests, timePeriod]
  );

  const filtered = useMemo(
    () => statusFilter === "all" ? periodBookings : periodBookings.filter((b) => b.status === statusFilter),
    [periodBookings, statusFilter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: periodBookings.length };
    for (const s of ALL_STATUSES) c[s] = periodBookings.filter((b) => b.status === s).length;
    return c;
  }, [periodBookings]);

  const totalSpent = useMemo(
    () => periodBookings
      .filter((b) => b.status === "approved" || b.status === "completed")
      .reduce((sum, b) => sum + (b.price ?? 0), 0),
    [periodBookings]
  );

  const chartData = useMemo(
    () => buildChartData(myRequests, timePeriod),
    [myRequests, timePeriod]
  );

  const periodLabel = TIME_PERIODS.find((p) => p.value === timePeriod)?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
            <p className="mt-1 text-muted">Track the status of your chair rental requests</p>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            Browse Listings
          </Link>
        </div>

        {/* Sub-tab bar */}
        <div className="mb-8 flex gap-1 rounded-xl bg-muted/10 p-1">
          <button
            type="button"
            onClick={() => setDashTab("requests")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              dashTab === "requests"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Requests
            {pendingCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dashTab === "requests" ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted"}`}>
                {pendingCount} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDashTab("history")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              dashTab === "history"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Booking History
          </button>
        </div>

        {/* ══ MY REQUESTS TAB ══════════════════════════════════ */}
        {dashTab === "requests" && (
          <>
            {/* Stats + Trust Profile */}
            <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="grid gap-4 sm:grid-cols-3 content-start">
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm text-muted">Total Requests</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{myRequests.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm text-muted">Approved</p>
                  <p className="mt-1 text-2xl font-bold text-success">{approvedCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm text-muted">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
              </div>

              {user?.accountId && (
                <TrustProfileCard accountId={user.accountId} role="renter" />
              )}
            </div>

            {/* Active Recurring Bookings */}
            {activeRecurring.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">Active Bookings</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                    {activeRecurring.length} active
                  </span>
                </div>
                <div className="space-y-3">
                  {activeRecurring.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} perspective="renter" />
                  ))}
                </div>
              </div>
            )}

            {/* Requests List */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recent Requests</h2>
              <button
                type="button"
                onClick={() => setDashTab("history")}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                View full history &rarr;
              </button>
            </div>
            {otherRequests.length > 0 ? (
              <div className="space-y-3">
                {otherRequests.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} perspective="renter" showComplete={booking.status === "approved"} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
                <svg className="h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <p className="mt-3 font-medium text-foreground">No requests yet</p>
                <p className="mt-1 text-sm text-muted">Browse listings and request a chair to get started</p>
                <Link
                  href="/listings"
                  className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Find a Chair
                </Link>
              </div>
            )}
          </>
        )}

        {/* ══ BOOKING HISTORY TAB ══════════════════════════════ */}
        {dashTab === "history" && (
          <>
            {/* Time Period Filter */}
            <div className="mb-6">
              <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Bookings</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{counts.all}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Completed</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{counts.completed ?? 0}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Approved</p>
                <p className="mt-1 text-2xl font-bold text-success">{counts.approved ?? 0}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Total Spent</p>
                <p className="mt-1 text-2xl font-bold text-foreground">${totalSpent}</p>
                <p className="mt-1 text-xs text-muted">{periodLabel}</p>
              </div>
            </div>

            {/* Spending Chart */}
            <div className="mb-8">
              <RevenueChart
                data={chartData}
                label={`Spending — ${periodLabel}`}
                color="#7c3aed"
              />
            </div>

            {/* Status Filter pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(["all", ...ALL_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === s
                      ? "bg-primary text-white"
                      : "bg-muted/20 text-muted hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s]}
                  <span className="ml-1.5 text-xs opacity-75">({counts[s] ?? 0})</span>
                </button>
              ))}
            </div>

            {/* Booking list */}
            {filtered.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} perspective="renter" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
                <svg className="h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <p className="mt-3 font-medium text-foreground">
                  {statusFilter === "all" ? "No bookings in this period" : `No ${STATUS_LABEL[statusFilter as BookingStatus].toLowerCase()} bookings`}
                </p>
                <p className="mt-1 text-sm text-muted">Browse listings and book a chair to get started.</p>
                <Link
                  href="/listings"
                  className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Find a Chair
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
