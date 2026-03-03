"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import BookingCard from "@/components/BookingCard";
import { useAuth } from "@/context/AuthContext";
import type { BookingRequest, BookingStatus, PaymentStatus } from "@/lib/types";

const ALL_STATUSES: BookingStatus[] = ["pending", "approved", "completed", "declined"];

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  declined: "Declined",
};

type TimePeriod = "week" | "month" | "year" | "all";

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "year", label: "Past Year" },
  { value: "all", label: "All Time" },
];

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

function buildChartData(
  bookings: BookingRequest[],
  period: TimePeriod
): ChartDataPoint[] {
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

    if (days > 365) {
      formatDate = (d) =>
        d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    } else {
      formatDate = (d) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } else if (period === "year") {
    start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    formatDate = (d) =>
      d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    formatDate = (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    formatDate = (d) =>
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  const revenueByDay = new Map<string, number>();
  for (const b of revenueBookings) {
    const d = new Date(b.createdAt);
    let key: string;
    if (period === "year" || (period === "all" && (now.getTime() - start.getTime()) > 365 * 86400000)) {
      key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + (b.price ?? 0));
  }

  const points: ChartDataPoint[] = [];
  const cursor = new Date(start);

  if (period === "year" || (period === "all" && (now.getTime() - start.getTime()) > 365 * 86400000)) {
    cursor.setDate(1);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth()).padStart(2, "0")}`;
      points.push({
        date: formatDate(new Date(cursor)),
        revenue: revenueByDay.get(key) ?? 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth()).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      points.push({
        date: formatDate(new Date(cursor)),
        revenue: revenueByDay.get(key) ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return points;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Please log in to view your booking history.
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

  if (user.role === "venue") return <VenueBookings />;
  return <RenterBookings />;
}

// ────────────────────────────────────────────────────────────
// Revenue Chart Component
// ────────────────────────────────────────────────────────────
function RevenueChart({
  data,
  label,
  color = "#7c3aed",
}: {
  data: ChartDataPoint[];
  label: string;
  color?: string;
}) {
  if (data.length === 0) return null;

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{label}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-muted, #9ca3af)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted, #9ca3af)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v}`}
              domain={[0, maxRevenue > 0 ? "auto" : 100]}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "0.75rem",
                fontSize: "0.8rem",
              }}
              formatter={(value: number | undefined) => [`$${value ?? 0}`, "Revenue"]}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={color}
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Time Period Selector
// ────────────────────────────────────────────────────────────
function TimePeriodSelector({
  value,
  onChange,
}: {
  value: TimePeriod;
  onChange: (v: TimePeriod) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/10 p-1">
      {TIME_PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
            value === p.value
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:text-foreground hover:bg-muted/20"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// VENUE — Booking History
// ────────────────────────────────────────────────────────────
function VenueBookings() {
  const { user, listings, bookingRequests, updateBookingStatus } = useAuth();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

  const myListingIds = useMemo(
    () => new Set(listings.filter((l) => l.venueId === user?.accountId).map((l) => l.id)),
    [listings, user]
  );

  const allBookings = useMemo(
    () => bookingRequests.filter((b) => myListingIds.has(b.listingId)),
    [bookingRequests, myListingIds]
  );

  const periodBookings = useMemo(
    () => filterByPeriod(allBookings, timePeriod),
    [allBookings, timePeriod]
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? periodBookings
        : periodBookings.filter((b) => b.status === statusFilter),
    [periodBookings, statusFilter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: periodBookings.length };
    for (const s of ALL_STATUSES) c[s] = periodBookings.filter((b) => b.status === s).length;
    return c;
  }, [periodBookings]);

  const totalRevenue = useMemo(
    () =>
      periodBookings
        .filter((b) => b.status === "approved" || b.status === "completed")
        .reduce((sum, b) => sum + (b.price ?? 0), 0),
    [periodBookings]
  );

  const chartData = useMemo(
    () => buildChartData(allBookings, timePeriod),
    [allBookings, timePeriod]
  );

  const periodLabel = TIME_PERIODS.find((p) => p.value === timePeriod)?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Booking History</h1>
            <p className="mt-1 text-muted">
              Revenue analytics and booking records across your listings
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

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
            <p className="text-sm text-muted">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-success">${totalRevenue}</p>
            <p className="mt-1 text-xs text-muted">{periodLabel}</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <RevenueChart
            data={chartData}
            label={`Revenue — ${periodLabel}`}
            color="#10b981"
          />
        </div>

        {/* Status Filter tabs */}
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
              <span className="ml-1.5 text-xs opacity-75">
                ({counts[s] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* Booking list */}
        {filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((booking) => (
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
              {statusFilter === "all"
                ? "No bookings in this period"
                : `No ${STATUS_LABEL[statusFilter as BookingStatus].toLowerCase()} bookings`}
            </p>
            <p className="mt-1 text-sm text-muted">
              Bookings from freelancers will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RENTER (Freelancer) — Booking History
// ────────────────────────────────────────────────────────────
function RenterBookings() {
  const { user, bookingRequests } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

  // Pay Now state
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string>("");
  const [paymentBanner, setPaymentBanner] = useState<"success" | "cancelled" | null>(null);

  // Read payment result from query string after Stripe redirect
  useEffect(() => {
    const result = searchParams.get("payment");
    if (result === "success" || result === "cancelled") {
      setPaymentBanner(result);
      // Strip query params from URL without a full navigation
      router.replace("/bookings");
    }
  }, [searchParams, router]);

  const handlePayNow = useCallback(async (bookingId: string) => {
    setPayingBookingId(bookingId);
    setPayError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setPayError(data.error ?? "Failed to start payment. Please try again.");
        setPayingBookingId(null);
      }
    } catch {
      setPayError("Network error. Please try again.");
      setPayingBookingId(null);
    }
  }, []);

  const myBookings = useMemo(
    () => bookingRequests.filter((b) => b.renterId === user?.accountId),
    [bookingRequests, user]
  );

  const periodBookings = useMemo(
    () => filterByPeriod(myBookings, timePeriod),
    [myBookings, timePeriod]
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? periodBookings
        : periodBookings.filter((b) => b.status === statusFilter),
    [periodBookings, statusFilter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: periodBookings.length };
    for (const s of ALL_STATUSES) c[s] = periodBookings.filter((b) => b.status === s).length;
    return c;
  }, [periodBookings]);

  const totalSpent = useMemo(
    () =>
      periodBookings
        .filter((b) => b.status === "approved" || b.status === "completed")
        .reduce((sum, b) => sum + (b.price ?? 0), 0),
    [periodBookings]
  );

  const chartData = useMemo(
    () => buildChartData(myBookings, timePeriod),
    [myBookings, timePeriod]
  );

  const periodLabel = TIME_PERIODS.find((p) => p.value === timePeriod)?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Booking History</h1>
            <p className="mt-1 text-muted">
              Spending analytics and booking records
            </p>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            Browse Listings
          </Link>
        </div>

        {/* Payment result banners */}
        {paymentBanner === "success" && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-4">
            <svg className="h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-success">Payment successful! Your booking is confirmed.</p>
          </div>
        )}
        {paymentBanner === "cancelled" && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-muted/10 px-5 py-4">
            <svg className="h-5 w-5 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-muted">Payment was cancelled. You can try again from your booking.</p>
          </div>
        )}
        {payError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4">
            <p className="text-sm text-destructive">{payError}</p>
          </div>
        )}

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

        {/* Status Filter tabs */}
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
              <span className="ml-1.5 text-xs opacity-75">
                ({counts[s] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* Booking list */}
        {filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((booking) => (
              <div key={booking.id} className="flex flex-col gap-2">
                <BookingCard
                  booking={booking}
                  perspective="renter"
                />
                <PayNowButton
                  booking={booking}
                  onPay={handlePayNow}
                  loading={payingBookingId === booking.id}
                />
              </div>
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
              {statusFilter === "all"
                ? "No bookings in this period"
                : `No ${STATUS_LABEL[statusFilter as BookingStatus].toLowerCase()} bookings`}
            </p>
            <p className="mt-1 text-sm text-muted">
              Browse listings and book a chair to get started.
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

// ────────────────────────────────────────────────────────────
// Pay Now Button — shown for approved, unpaid renter bookings
// ────────────────────────────────────────────────────────────
function PayNowButton({
  booking,
  onPay,
  loading,
}: {
  booking: BookingRequest;
  onPay: (id: string) => void;
  loading: boolean;
}) {
  const paymentStatus = (booking.paymentStatus ?? "unpaid") as PaymentStatus;

  if (booking.status !== "approved") return null;
  if (paymentStatus === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Payment confirmed
      </div>
    );
  }

  const isPending = paymentStatus === "pending_payment";

  return (
    <button
      onClick={() => onPay(booking.id)}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60 cursor-pointer transition-colors"
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Redirecting to payment…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {isPending ? "Complete payment" : "Pay now"}
          {booking.totalAmount ? ` — $${booking.totalAmount.toFixed(2)} AUD` : ""}
        </>
      )}
    </button>
  );
}
