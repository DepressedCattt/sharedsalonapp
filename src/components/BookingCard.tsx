"use client";

import { BookingRequest } from "@/lib/types";

interface BookingCardProps {
  booking: BookingRequest;
  /** If true, shows accept/decline buttons (venue view) */
  showActions?: boolean;
  onAccept?: (bookingId: string) => void;
  onDecline?: (bookingId: string) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Accepted!",
  declined: "Declined",
};

export default function BookingCard({
  booking,
  showActions = false,
  onAccept,
  onDecline,
}: BookingCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground line-clamp-1">
            {booking.listingTitle}
          </h4>
          <p className="mt-0.5 text-sm text-muted">
            {booking.startDate} — {booking.endDate}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${
            statusStyles[booking.status]
          }`}
        >
          {statusLabels[booking.status]}
        </span>
      </div>

      {/* Renter info (shown to venue owners) */}
      {showActions && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
            {booking.renterName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground">
            {booking.renterName}
          </span>
        </div>
      )}

      {/* Actions */}
      {showActions && booking.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onAccept?.(booking.id)}
            className="flex-1 rounded-lg bg-success px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 cursor-pointer"
          >
            Accept
          </button>
          <button
            onClick={() => onDecline?.(booking.id)}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-danger hover:border-danger cursor-pointer"
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
