"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Listing, TrustProfile } from "@/lib/types";
import { formatPriceUnit, DAY_NAMES } from "@/lib/listingFormat";
import MediaCarousel from "@/components/MediaCarousel";
import TrustBadge from "@/components/TrustBadge";

interface ListingCardProps {
  listing: Listing;
  /** When provided (e.g. on venue dashboard), shows a delete button that removes the listing. */
  onDelete?: (listingId: string) => void;
  /** When true, shows an edit button that navigates to the edit page. */
  showEdit?: boolean;
  /** Optional badge count for pending applications (venue dashboard use). */
  pendingCount?: number;
  /** Optional pre-loaded trust profile for the venue. When provided, shows a tier badge. */
  venueTrustProfile?: TrustProfile;
}

const SHORT_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ListingCard({ listing, onDelete, showEdit, pendingCount, venueTrustProfile }: ListingCardProps) {
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm("Remove this listing? This cannot be undone.")) {
      onDelete(listing.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/listings/${listing.id}/edit`);
  };

  const availableDays = (listing.availability ?? []).map((s) => s.day);
  const equipmentCount = (listing.equipmentIncluded ?? []).length;
  const hasRating = (listing.ratingBreakdown?.count ?? 0) > 0;
  const isRecurring = listing.listingMode === "recurring";

  const cardContent = (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-0.5">
      {/* Image area */}
      <div className="relative h-52 w-full overflow-hidden bg-muted/20">
        {/* Recurring badge */}
        {isRecurring && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Recurring
            </span>
          </div>
        )}

        {/* Pending applications badge */}
        {pendingCount != null && pendingCount > 0 && (
          <div className="absolute right-3 top-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
              {pendingCount} pending
            </span>
          </div>
        )}

        {/* Edit / Delete buttons */}
        {(showEdit || onDelete) && (
          <div className={`absolute z-10 flex gap-1.5 ${isRecurring ? "left-3 top-10" : "left-3 top-3"} ${pendingCount ? "right-auto" : ""}`}>
            {showEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white cursor-pointer backdrop-blur-sm"
                aria-label="Edit listing"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/90 text-white shadow hover:bg-danger cursor-pointer"
                aria-label="Delete listing"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        <MediaCarousel
          media={listing.media ?? []}
          variant="compact"
          thumbnailOnly
          className="h-full"
        />

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-bold text-foreground backdrop-blur-sm shadow-sm">
          ${listing.price}
          <span className="text-xs font-normal text-muted">{formatPriceUnit(listing.priceType)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title + location */}
        <h3 className="font-semibold text-foreground line-clamp-1 text-[15px] group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="line-clamp-1">{listing.location}</span>
        </div>

        {/* Availability day chips */}
        {availableDays.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {availableDays.map((day) => (
              <span
                key={day}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                {SHORT_DAY[day]}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mt-3 border-t border-border" />

        {/* Footer row — rating + equipment */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {hasRating ? (
            <div className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-foreground">{listing.rating}/10</span>
              <span className="text-xs text-muted">({listing.ratingBreakdown!.count})</span>
            </div>
          ) : (
            <span className="rounded-full bg-muted/15 px-2.5 py-0.5 text-[11px] font-medium text-muted">
              New
            </span>
          )}

          {equipmentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
              <span>{equipmentCount} item{equipmentCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Venue trust tier badge */}
        {venueTrustProfile && venueTrustProfile.tier !== "unranked" && (
          <div className="mt-2">
            <TrustBadge profile={venueTrustProfile} size="sm" />
          </div>
        )}
      </div>
    </div>
  );

  if (onDelete || showEdit) {
    return (
      <div className="block relative">
        <Link href={`/listings/${listing.id}`}>{cardContent}</Link>
      </div>
    );
  }

  return <Link href={`/listings/${listing.id}`} className="block">{cardContent}</Link>;
}
