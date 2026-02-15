"use client";

import Link from "next/link";
import { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:border-primary/30">
        {/* Image placeholder */}
        <div className="relative h-48 w-full bg-gradient-to-br from-primary-light to-accent/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-12 w-12 text-primary/30"
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
          {/* Price badge */}
          <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1 text-sm font-semibold text-foreground backdrop-blur-sm">
            £{listing.price}
            <span className="text-xs font-normal text-muted">/week</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">
            {listing.description}
          </p>

          {/* Meta */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <svg className="h-4 w-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium text-foreground">{listing.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
