"use client";

import { useState, useCallback, useEffect } from "react";
import { ListingMediaItem } from "@/lib/types";

interface MediaCarouselProps {
  media: ListingMediaItem[];
  /** Compact = single visible slide, no aspect constraint. Full = larger with aspect ratio. */
  variant?: "compact" | "full";
  className?: string;
  /** Optional: show only first frame (for card thumbnail). */
  thumbnailOnly?: boolean;
}

const PLACEHOLDER = (
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-accent/20">
    <svg
      className="h-12 w-12 text-primary/30 sm:h-16 sm:w-16"
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
);

export default function MediaCarousel({
  media,
  variant = "full",
  className = "",
  thumbnailOnly = false,
}: MediaCarouselProps) {
  const [index, setIndex] = useState(0);
  /** URLs that failed to load (e.g. expired blob URLs after refresh) — show placeholder instead. */
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());

  const items = media.length ? media : [];
  const current = items[index];
  const hasMultiple = items.length > 1;

  const markFailed = useCallback((url: string) => {
    setFailedUrls((prev) => new Set(prev).add(url));
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (thumbnailOnly || !hasMultiple) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [thumbnailOnly, hasMultiple, goPrev, goNext]);

  if (thumbnailOnly && items.length > 0) {
    const first = items[0];
    const firstImage = items.find((m) => m.type === "image") ?? first;
    const thumbFailed = failedUrls.has(firstImage.url);
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        {thumbFailed ? (
          PLACEHOLDER
        ) : firstImage.type === "video" ? (
          <div className="relative h-full w-full bg-black">
            <video
              src={firstImage.url}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              onError={() => markFailed(firstImage.url)}
            />
            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              Video
            </div>
          </div>
        ) : (
          <img
            src={firstImage.url}
            alt=""
            className="h-full w-full object-cover"
            onError={() => markFailed(firstImage.url)}
          />
        )}
        {items.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            {items.length} photos
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        {PLACEHOLDER}
      </div>
    );
  }

  const isCompact = variant === "compact";
  const aspectClass = isCompact
    ? "aspect-video"
    : "aspect-[4/3] sm:aspect-[16/10]";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-card ${className}`}
    >
      <div className={`relative w-full ${aspectClass} bg-black`}>
        {failedUrls.has(current.url) ? (
          PLACEHOLDER
        ) : current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
            onError={() => markFailed(current.url)}
          />
        ) : (
          <img
            key={current.url}
            src={current.url}
            alt=""
            className="h-full w-full object-cover"
            onError={() => markFailed(current.url)}
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
              aria-label="Previous"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
              aria-label="Next"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === index
                      ? "w-6 bg-white"
                      : "w-2 bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <span className="absolute right-3 top-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
              {index + 1} / {items.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
