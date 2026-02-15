"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { useAuth } from "@/context/AuthContext";

export default function ListingsPage() {
  const { listings } = useAuth();

  // Filter state
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");

  // Get unique locations for dropdown
  const locations = useMemo(
    () => Array.from(new Set(listings.map((l) => l.location))),
    [listings]
  );

  // Filtered listings
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (locationFilter && listing.location !== locationFilter) return false;
      if (minPrice && listing.price < Number(minPrice)) return false;
      if (maxPrice && listing.price > Number(maxPrice)) return false;
      if (minRating && listing.rating < Number(minRating)) return false;
      return true;
    });
  }, [listings, locationFilter, minPrice, maxPrice, minRating]);

  const clearFilters = () => {
    setLocationFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
  };

  const hasActiveFilters = locationFilter || minPrice || maxPrice || minRating;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Browse Listings</h1>
          <p className="mt-2 text-muted">
            Find the perfect chair or space for your business
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Listing Filters
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Location */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Min Price (£/week)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Max Price (£/week)
              </label>
              <input
                type="number"
                placeholder="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Min Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any rating</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
                <option value="4.8">4.8+ stars</option>
              </select>
            </div>
          </div>

          {/* Filter actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Clear Filters
            </button>
            <span className="text-sm text-muted">
              {filteredListings.length} listing{filteredListings.length !== 1 && "s"} found
            </span>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <svg
              className="h-12 w-12 text-muted/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <p className="mt-4 text-lg font-medium text-foreground">
              No listings found
            </p>
            <p className="mt-1 text-sm text-muted">
              Try adjusting your filters to see more results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
