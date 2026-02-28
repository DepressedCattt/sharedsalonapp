"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import ListingsMap from "@/components/ListingsMap";
import { useAuth } from "@/context/AuthContext";

type ModeFilter = "all" | "one_off" | "recurring";
type SortBy = "newest" | "price_asc" | "price_desc" | "rating";

export default function ListingsPage() {
  const { listings } = useAuth();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  // Unique locations for dropdown
  const locations = useMemo(
    () => Array.from(new Set(listings.map((l) => l.location).filter(Boolean))),
    [listings]
  );

  // Filtered + sorted listings
  const filteredListings = useMemo(() => {
    let result = listings.filter((listing) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!listing.title.toLowerCase().includes(q) && !listing.location.toLowerCase().includes(q)) return false;
      }
      if (locationFilter && listing.location !== locationFilter) return false;
      if (minPrice && listing.price < Number(minPrice)) return false;
      if (maxPrice && listing.price > Number(maxPrice)) return false;
      if (minRating && listing.rating < Number(minRating)) return false;
      if (modeFilter === "recurring" && listing.listingMode !== "recurring") return false;
      if (modeFilter === "one_off" && listing.listingMode === "recurring") return false;
      return true;
    });

    switch (sortBy) {
      case "price_asc": result = [...result].sort((a, b) => a.price - b.price); break;
      case "price_desc": result = [...result].sort((a, b) => b.price - a.price); break;
      case "rating": result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case "newest": default: break;
    }

    return result;
  }, [listings, searchQuery, locationFilter, minPrice, maxPrice, minRating, modeFilter, sortBy]);

  const hasActiveFilters = searchQuery || locationFilter || minPrice || maxPrice || minRating || modeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setModeFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-bold text-foreground">Browse Listings</h1>
          <p className="mt-1 text-muted">
            Find the perfect chair or space for your next session
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* ── Horizontal filter strip ──────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-2 p-3 sm:flex-nowrap">

            {/* Text search */}
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search listings…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Location */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Price range — compact inline pair */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted">–</span>
              <input
                type="number"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Rating (1-10) */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Any rating</option>
              <option value="7">7+ / 10</option>
              <option value="8">8+ / 10</option>
              <option value="9">9+ / 10</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low–High</option>
              <option value="price_desc">Price: High–Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Second row: mode toggle + result count + clear */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5">
            {/* Listing mode toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/10 p-1">
              {(["all", "one_off", "recurring"] as ModeFilter[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModeFilter(mode)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    modeFilter === mode
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {mode === "all" ? "All" : mode === "one_off" ? "One-off" : "Recurring"}
                </button>
              ))}
            </div>

            {/* Count + Clear */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">
                <span className="font-semibold text-foreground">{filteredListings.length}</span>
                {" "}listing{filteredListings.length !== 1 ? "s" : ""} found
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-primary hover:text-primary-dark cursor-pointer transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Listings near you</h2>
            <span className="text-xs text-muted">{filteredListings.length} shown on map</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <ListingsMap listings={filteredListings} />
          </div>
        </div>

        {/* ── Listings Grid ────────────────────────────────────────────────── */}
        {filteredListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/10">
              <svg className="h-8 w-8 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">No listings found</p>
            <p className="mt-1 text-sm text-muted">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
