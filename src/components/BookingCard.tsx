"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingRequest } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { DAY_NAMES } from "@/lib/listingFormat";
import ReviewModal from "@/components/ReviewModal";
import TrustReviewModal from "@/components/TrustReviewModal";

interface BookingCardProps {
  booking: BookingRequest;
  /** If true, shows accept/decline buttons (venue view) */
  showActions?: boolean;
  /** If true, shows "Mark Complete" button for approved bookings */
  showComplete?: boolean;
  /** "venue" renders renter info; "renter" renders venue info */
  perspective?: "venue" | "renter";
  onAccept?: (bookingId: string) => void;
  onDecline?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  completed: "Completed",
};

function formatPriceLabel(price: number, priceType: string): string {
  if (!price) return "";
  const unit =
    priceType === "daily" ? "/day" : priceType === "weekly" ? "/week" : "";
  return `$${price}${unit}`;
}

export default function BookingCard({
  booking,
  showActions = false,
  showComplete = false,
  perspective,
  onAccept,
  onDecline,
  onComplete,
}: BookingCardProps) {
  const router = useRouter();
  const { user, startConversation, refreshBookings, updateBookingStatus } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDone, setReviewDone] = useState(booking.reviewSubmitted ?? false);
  const [showTrustReviewModal, setShowTrustReviewModal] = useState(false);
  const [trustReviewDone, setTrustReviewDone] = useState(booking.trustReviewSubmitted ?? false);

  const isRecurring = booking.bookingType === "recurring_slot";

  const canReview =
    perspective === "renter" &&
    booking.status === "completed" &&
    !reviewDone;

  // Both venue and renter can submit a trust review for completed bookings
  const canTrustReview =
    booking.status === "completed" &&
    !trustReviewDone;

  const trustRevieweeName =
    perspective === "venue" ? booking.renterName : booking.venueName;

  const handleMessage = async () => {
    if (!user) return;

    const isVenue = perspective === "venue";
    const participantId = isVenue ? booking.renterId : booking.venueId;
    const participantName = isVenue ? booking.renterName : booking.venueName;
    const participantAvatarUrl = isVenue ? booking.renterAvatarUrl : undefined;

    const conv = await startConversation({
      participantId,
      participantName,
      participantAvatarUrl,
      listingId: booking.listingId,
      listingTitle: booking.listingTitle,
    });
    if (conv) router.push(`/messages/${conv.id}`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/listings/${booking.listingId}`}
              className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors"
            >
              {booking.listingTitle}
            </Link>
            {isRecurring && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Recurring
              </span>
            )}
          </div>
          {isRecurring && booking.recurringSlot ? (
            <p className="mt-0.5 text-sm text-muted">
              {DAY_NAMES[booking.recurringSlot.day]}s · {booking.recurringSlot.start}–{booking.recurringSlot.end}
              {booking.startDate && booking.endDate && ` · ${booking.startDate} – ${booking.endDate}`}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted">
              {booking.startDate} &mdash; {booking.endDate}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${
            isRecurring && booking.status === "approved" ? "bg-primary/10 text-primary border-primary/30" : statusStyles[booking.status]
          }`}
        >
          {isRecurring && booking.status === "approved" ? "Active" : statusLabels[booking.status]}
        </span>
      </div>

      {/* Price */}
      {booking.price > 0 && (
        <p className="mt-2 text-sm font-semibold text-foreground">
          {formatPriceLabel(booking.price, booking.priceType)}
        </p>
      )}

      {/* Renter info (shown to venue owners) */}
      {(showActions || perspective === "venue") && (
        <div className="mt-3 flex items-center gap-2">
          {booking.renterAvatarUrl ? (
            <img
              src={booking.renterAvatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              {booking.renterName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            {booking.renterName}
          </span>
          {booking.houseRulesAccepted && (
            <span className="ml-auto rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Rules accepted
            </span>
          )}
        </div>
      )}

      {/* Venue info (shown to freelancers) */}
      {perspective === "renter" && booking.venueName && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
            {booking.venueName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground">
            {booking.venueName}
          </span>
        </div>
      )}

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
        <span>Booked {booking.createdAt}</span>
      </div>

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

      {/* Mark Complete (one-off only) */}
      {showComplete && booking.status === "approved" && !isRecurring && (
        <div className="mt-3">
          <button
            onClick={() => onComplete?.(booking.id)}
            className="w-full rounded-lg border border-primary/50 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {/* End Booking — venue view, active recurring booking */}
      {perspective === "venue" && isRecurring && booking.status === "approved" && (
        <div className="mt-3">
          <button
            onClick={() => {
              if (!confirm(`End the recurring booking for ${booking.renterName}? They will be notified and can no longer use this slot.`)) return;
              updateBookingStatus(booking.id, "completed");
            }}
            className="w-full rounded-lg border border-danger/40 px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10 cursor-pointer"
          >
            End Booking
          </button>
        </div>
      )}

      {/* Active recurring badge — renter view */}
      {perspective === "renter" && isRecurring && booking.status === "approved" && (
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-medium text-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Booking active — see you on {booking.recurringSlot ? DAY_NAMES[booking.recurringSlot.day] + "s" : "schedule"}
        </div>
      )}

      {/* Message button */}
      {user && booking.status !== "declined" && (
        <div className={`${showActions && booking.status === "pending" ? "" : "mt-3"}`}>
          <button
            onClick={handleMessage}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground cursor-pointer mt-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            Message {perspective === "venue" ? booking.renterName.split(" ")[0] : booking.venueName.split(" ")[0]}
          </button>
        </div>
      )}

      {/* Leave a Review — renter only, completed, not yet reviewed */}
      {canReview && (
        <div className="mt-2">
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Leave a Review
          </button>
        </div>
      )}

      {/* Already reviewed badge */}
      {perspective === "renter" && booking.status === "completed" && reviewDone && (
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-medium text-green-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Review submitted
        </div>
      )}

      {/* Trust Review — both parties, completed bookings */}
      {canTrustReview && (
        <div className="mt-2">
          <button
            onClick={() => setShowTrustReviewModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent-light px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/20 cursor-pointer"
          >
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Rate {trustRevieweeName.split(" ")[0]}
          </button>
        </div>
      )}

      {/* Trust Review submitted badge */}
      {booking.status === "completed" && trustReviewDone && (
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-accent-light border border-accent/30 px-3 py-2 text-xs font-medium text-foreground">
          <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Trust review pending reveal
        </div>
      )}

      {showTrustReviewModal && (
        <TrustReviewModal
          bookingId={booking.id}
          revieweeName={trustRevieweeName}
          reviewerRole={perspective === "venue" ? "venue" : "renter"}
          onClose={() => setShowTrustReviewModal(false)}
          onSuccess={() => {
            setShowTrustReviewModal(false);
            setTrustReviewDone(true);
          }}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          bookingId={booking.id}
          listingId={booking.listingId}
          listingTitle={booking.listingTitle}
          venueId={booking.venueId}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            setReviewDone(true);
            refreshBookings();
          }}
        />
      )}
    </div>
  );
}
