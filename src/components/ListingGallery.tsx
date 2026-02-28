"use client";

import { useState, useEffect, useCallback } from "react";
import { ListingMediaItem } from "@/lib/types";

interface ListingGalleryProps {
  media: ListingMediaItem[];
  title?: string;
}

const PLACEHOLDER = (
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-accent/20">
    <svg className="h-16 w-16 text-primary/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
    </svg>
  </div>
);

function MediaItem({
  item,
  className = "",
  onClick,
  onError,
  failed,
}: {
  item: ListingMediaItem;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
  failed?: boolean;
}) {
  if (failed) {
    return <div className={`${className} bg-muted/20`}>{PLACEHOLDER}</div>;
  }
  if (item.type === "video") {
    return (
      <div className={`relative ${className} bg-black`} onClick={onClick}>
        <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" onError={onError} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
  return (
    <img
      src={item.url}
      alt=""
      className={`${className} object-cover`}
      onError={onError}
      onClick={onClick}
    />
  );
}

export default function ListingGallery({ media, title }: ListingGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);

  const items = media.length ? media : [];
  const count = items.length;

  const markFailed = (url: string) => setFailed((prev) => new Set(prev).add(url));

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);

  const lbPrev = useCallback(() => {
    setLightboxIndex((i) => (i == null ? null : i <= 0 ? count - 1 : i - 1));
  }, [count]);

  const lbNext = useCallback(() => {
    setLightboxIndex((i) => (i == null ? null : i >= count - 1 ? 0 : i + 1));
  }, [count]);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lbPrev();
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, lbPrev, lbNext]);

  // ── No media ───────────────────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div className="h-[380px] overflow-hidden rounded-2xl border border-border sm:h-[460px]">
        {PLACEHOLDER}
      </div>
    );
  }

  // ── Thumbnail strip for mobile ─────────────────────────────────────────────
  const MobileCarousel = (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black sm:hidden" style={{ height: 320 }}>
      <MediaItem
        item={items[carouselIndex]}
        className="h-full w-full"
        failed={failed.has(items[carouselIndex].url)}
        onError={() => markFailed(items[carouselIndex].url)}
        onClick={() => openLightbox(carouselIndex)}
      />
      {count > 1 && (
        <>
          <button type="button" onClick={() => setCarouselIndex((i) => (i <= 0 ? count - 1 : i - 1))}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm cursor-pointer">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <button type="button" onClick={() => setCarouselIndex((i) => (i >= count - 1 ? 0 : i + 1))}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm cursor-pointer">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
            {carouselIndex + 1} / {count}
          </span>
        </>
      )}
    </div>
  );

  // ── Desktop grid ───────────────────────────────────────────────────────────
  // Show up to 5 images in the grid (1 main + up to 4 thumbs)
  const GRID_HEIGHT = "h-[460px]";
  const THUMB_MAX = 4; // slots on the right

  const showRight = count >= 2;
  const thumbSlots = Math.min(THUMB_MAX, count - 1); // right side has 1–4 thumbs
  const overflow = count - 1 - THUMB_MAX; // photos that don't fit in the grid

  const DesktopGrid = (
    <div className={`hidden sm:flex overflow-hidden rounded-2xl ${GRID_HEIGHT} gap-1.5 border border-border bg-black`}>
      {/* Main image */}
      <div className={`relative cursor-pointer overflow-hidden ${showRight ? "w-[62%] shrink-0" : "flex-1"} transition-opacity hover:opacity-95`}
        onClick={() => openLightbox(0)}>
        <MediaItem item={items[0]} className="h-full w-full" failed={failed.has(items[0].url)} onError={() => markFailed(items[0].url)} />
      </div>

      {/* Right column — up to 4 thumbnails */}
      {showRight && (
        <div className={`flex flex-1 flex-col gap-1.5`}>
          {Array.from({ length: thumbSlots }, (_, i) => {
            const itemIndex = i + 1;
            const item = items[itemIndex];
            const isLast = i === thumbSlots - 1 && overflow > 0;
            return (
              <div key={item.url}
                className={`relative flex-1 cursor-pointer overflow-hidden transition-opacity hover:opacity-95 ${thumbSlots === 1 ? "h-full" : ""}`}
                onClick={() => openLightbox(isLast && overflow > 0 ? -1 : itemIndex)}>
                <MediaItem item={item} className="h-full w-full" failed={failed.has(item.url)} onError={() => markFailed(item.url)} />
                {isLast && overflow > 0 && (
                  <div
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/55 backdrop-blur-[1px]"
                    onClick={(e) => { e.stopPropagation(); openLightbox(itemIndex); }}
                  >
                    <span className="text-2xl font-bold text-white">+{overflow + 1}</span>
                    <span className="mt-1 text-xs text-white/80">more photos</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Lightbox ───────────────────────────────────────────────────────────────
  const Lightbox = lightboxIndex != null && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={closeLightbox}
    >
      {/* Close */}
      <button type="button" onClick={closeLightbox}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 cursor-pointer z-10">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
        {lightboxIndex + 1} / {count}
      </div>

      {/* Prev */}
      {count > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); lbPrev(); }}
          className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 cursor-pointer z-10">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="mx-16 flex max-h-[85vh] max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {(() => {
          const item = items[lightboxIndex];
          if (failed.has(item.url)) return PLACEHOLDER;
          if (item.type === "video") {
            return (
              <video src={item.url} className="max-h-[85vh] max-w-full rounded-lg" controls playsInline preload="metadata"
                onError={() => markFailed(item.url)} />
            );
          }
          return (
            <img src={item.url} alt={`${title ?? "Listing"} photo ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
              onError={() => markFailed(item.url)} />
          );
        })()}
      </div>

      {/* Next */}
      {count > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); lbNext(); }}
          className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 cursor-pointer z-10">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-2 pb-1 max-w-[90vw]">
          {items.map((item, i) => (
            <button key={item.url} type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition cursor-pointer ${
                i === lightboxIndex ? "border-white" : "border-white/20 hover:border-white/60"
              }`}>
              {item.type === "video"
                ? <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                : <img src={item.url} alt="" className="h-full w-full object-cover" onError={() => markFailed(item.url)} />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {MobileCarousel}
      {DesktopGrid}
      {Lightbox}
    </>
  );
}
