"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { PriceType, ListingMode, ListingMediaItem, ListingMediaType, AvailabilitySlot } from "@/lib/types";
import { DAY_NAMES } from "@/lib/listingFormat";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const MAX_MEDIA = 10;
const ACCEPT = "image/*,video/*";

type MediaEntry = { file: File; url: string; type: ListingMediaType };

function fileToType(file: File): ListingMediaType {
  return file.type.startsWith("video/") ? "video" : "image";
}

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Basics", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Location", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
  { label: "Media & Details", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" },
  { label: "Review & Publish", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

function StepBar({ step }: { step: number }) {
  return (
    <div className="mb-8 px-4 sm:px-0">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const num = i + 1;
          const isDone = num < step;
          const isActive = num === step;
          return (
            <div key={num} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? "border-primary bg-primary text-white"
                      : isActive
                        ? "border-primary bg-white text-primary shadow-md shadow-primary/20"
                        : "border-border bg-background text-muted"
                  }`}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{num}</span>
                  )}
                </div>
                <span className={`hidden text-[11px] font-medium sm:block ${isActive ? "text-primary" : isDone ? "text-primary/70" : "text-muted"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 rounded-full transition-all duration-300 ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreateListingPage() {
  const router = useRouter();
  const { user, addListing } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard step
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 state
  const [listingMode, setListingMode] = useState<ListingMode>("one_off");
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("daily");

  // Step 2 state
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [availability, setAvailability] = useState<{ day: number; enabled: boolean; start: string; end: string }[]>(
    () => DAY_NAMES.map((_, day) => ({ day, enabled: false, start: "09:00", end: "17:00" }))
  );

  // Step 3 state
  const [venuePhotos, setVenuePhotos] = useState<string[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [houseRuleInput, setHouseRuleInput] = useState("");
  const [houseRules, setHouseRules] = useState<string[]>([]);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Profile pre-fill tracking
  const [profilePrefilled, setProfilePrefilled] = useState<string[]>([]);
  const [hasVenueProfile, setHasVenueProfile] = useState<boolean | null>(null);

  // Load venue profile — prefill location, description, house rules, and photos
  useEffect(() => {
    if (!user?.accountId) return;
    fetch(`/api/venue-profile?venueId=${user.accountId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setHasVenueProfile(false); return; }
        setHasVenueProfile(true);
        const filled: string[] = [];

        if (data.photos?.length) setVenuePhotos(data.photos);

        if (data.location) {
          setLocation(data.location);
          filled.push("location");
        }
        if (data.latitude != null) setLatitude(data.latitude);
        if (data.longitude != null) setLongitude(data.longitude);

        if (data.bio) {
          setDescription(data.bio);
          filled.push("description");
        }
        if (data.boothPolicies?.length) {
          setHouseRules(data.boothPolicies);
          filled.push("house rules");
        }
        if (filled.length) setProfilePrefilled(filled);
      })
      .catch(() => { setHasVenueProfile(false); });
  }, [user?.accountId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setAvailabilitySlot = (day: number, patch: Partial<{ enabled: boolean; start: string; end: string }>) => {
    setAvailability((prev) => prev.map((s) => (s.day === day ? { ...s, ...patch } : s)));
  };

  const toggleLibraryPhoto = (url: string) => {
    setMediaFiles((prev) => {
      const exists = prev.some((e) => e.url === url);
      if (exists) return prev.filter((e) => e.url !== url);
      if (prev.length >= MAX_MEDIA) return prev;
      return [...prev, { file: new File([], ""), url, type: "image" as ListingMediaType }];
    });
  };

  const addMediaFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const toAdd: MediaEntry[] = [];
    for (let i = 0; i < files.length && mediaFiles.length + toAdd.length < MAX_MEDIA; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
      toAdd.push({ file, url: URL.createObjectURL(file), type: fileToType(file) });
    }
    if (toAdd.length) setMediaFiles((prev) => [...prev, ...toAdd]);
  };

  const removeMedia = (url: string) => {
    setMediaFiles((prev) => {
      const entry = prev.find((e) => e.url === url);
      if (entry && entry.file.size) URL.revokeObjectURL(entry.url);
      return prev.filter((e) => e.url !== url);
    });
  };

  const addEquipment = () => {
    const trimmed = equipmentInput.trim();
    if (trimmed && !equipment.includes(trimmed)) { setEquipment([...equipment, trimmed]); setEquipmentInput(""); }
  };

  const addHouseRule = () => {
    const trimmed = houseRuleInput.trim();
    if (trimmed && !houseRules.includes(trimmed)) { setHouseRules([...houseRules, trimmed]); setHouseRuleInput(""); }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const canAdvanceStep1 = title.trim() && description.trim() && price && Number(price) > 0;
  const canAdvanceStep2 = location.trim();

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) setStep(2);
    else if (step === 2 && canAdvanceStep2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  // ── Publish ────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!title || !description || !price || !location) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const availabilitySlots: AvailabilitySlot[] = availability
      .filter((s) => s.enabled)
      .map(({ day, start, end }) => ({ day, start, end }));

    let media: ListingMediaItem[] = [];
    try {
      const uploaded: ListingMediaItem[] = [];
      for (const entry of mediaFiles) {
        if (!entry.file.size && entry.url.startsWith("/uploads/")) {
          uploaded.push({ url: entry.url, type: entry.type });
          continue;
        }
        const formData = new FormData();
        formData.append("file", entry.file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
        const data = (await res.json()) as { url: string };
        uploaded.push({ url: data.url, type: entry.type });
      }
      media = uploaded;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to upload images");
      setIsSubmitting(false);
      return;
    }

    try {
      await addListing({
        title,
        description,
        priceType,
        price: Number(price),
        location,
        ...(latitude != null && longitude != null && { latitude, longitude }),
        availability: availabilitySlots,
        equipmentIncluded: equipment,
        houseRules,
        media,
        listingMode,
        slotCapacity: listingMode === "recurring" ? slotCapacity : 1,
      });
      router.push("/dashboard");
    } catch {
      setSubmitError("Failed to create listing");
      setIsSubmitting(false);
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!user || user.role !== "venue") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Only venue accounts can create listings.</p>
            <button onClick={() => router.push("/login?intent=venue")}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">
              Sign in as Venue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values for review step ────────────────────────────────────────
  const isRecurring = listingMode === "recurring";
  const enabledDays = availability.filter((s) => s.enabled);
  const staticMapUrl = latitude != null && longitude != null && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x200&scale=2&markers=color:red%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">New Listing</h1>
          <p className="mt-1 text-sm text-muted">Create a new chair or space listing for freelancers</p>
        </div>

        {/* No venue profile nudge */}
        {hasVenueProfile === false && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">Set up your venue profile first</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Your venue profile provides default location, description, and house rules that auto-fill new listings — saving you time.
              </p>
              <a href="/settings" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700">
                Go to Venue Profile
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Pre-filled from profile notice */}
        {profilePrefilled.length > 0 && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-primary">
              <span className="font-semibold">Pre-filled from your venue profile:</span>{" "}
              {profilePrefilled.join(", ")}. You can change any of these below.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <StepBar step={step} />

        {/* ── Step 1 — Basics ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Listing type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Listing type</label>
              <p className="mb-3 text-xs text-muted">
                One-off listings are removed once a booking is completed. Recurring listings stay online permanently and accept multiple freelancers.
              </p>
              <div className="flex gap-3">
                {(["one_off", "recurring"] as ListingMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => setListingMode(mode)}
                    className={`flex-1 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all cursor-pointer ${
                      listingMode === mode ? "border-primary bg-primary-light text-primary" : "border-border bg-background text-muted hover:border-primary/40"
                    }`}>
                    {mode === "one_off" ? (
                      <span className="flex flex-col items-center gap-1.5">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.75m15-2.872A2.25 2.25 0 0119.5 9v.75M4.5 9.75v8.25A2.25 2.25 0 006.75 20.25h10.5A2.25 2.25 0 0019.5 18V9.75M4.5 9.75h15" />
                        </svg>
                        One-off
                        <span className="text-xs font-normal opacity-70">Single booking</span>
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-1.5">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Recurring
                        <span className="text-xs font-normal opacity-70">Always online</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {listingMode === "recurring" && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <label className="mb-1 block text-sm font-medium text-foreground">Capacity per slot</label>
                  <p className="mb-2 text-xs text-muted">How many freelancers can be approved for the same time slot simultaneously.</p>
                  <input type="number" min={1} max={20} value={slotCapacity}
                    onChange={(e) => setSlotCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Title <span className="text-danger">*</span>
              </label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Styling Chair — Sydney CBD" required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Description <span className="text-danger">*</span>
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the space, amenities, and what makes it special..." rows={4} required
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            {/* Price + Price Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">
                  Price (AUD{priceType === "daily" ? "/day" : priceType === "weekly" ? "/week" : ""}) <span className="text-danger">*</span>
                </label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder={priceType === "daily" ? "150" : priceType === "weekly" ? "800" : "—"} required min="1"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Price type</label>
                <select value={priceType} onChange={(e) => setPriceType(e.target.value as PriceType)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="daily">Per day</option>
                  <option value="weekly">Per week</option>
                  <option value="commission">Commission</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <StepFooter step={step} onBack={goBack} onNext={goNext} canNext={!!canAdvanceStep1} nextLabel="Next: Location" />
          </div>
        )}

        {/* ── Step 2 — Location & Availability ────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">
                Address <span className="text-danger">*</span>
              </label>
              <AddressAutocomplete value={location}
                onChange={(address, coords) => {
                  setLocation(address);
                  if (coords) { setLatitude(coords.latitude); setLongitude(coords.longitude); }
                  else { setLatitude(undefined); setLongitude(undefined); }
                }}
                placeholder="Start typing a full address (e.g. 123 High St, Sydney NSW)" required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                hint="Select an address from the suggestions so we can show this listing on the map." />
              {staticMapUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border">
                  <img src={staticMapUrl} alt="Location preview" className="h-[160px] w-full object-cover" />
                </div>
              )}
            </div>

            {/* Availability */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">When is this space available?</label>
              <p className="mb-3 text-xs text-muted">Tick the days and set the hours for each day.</p>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="py-3 pl-4 text-left font-medium text-foreground">Day</th>
                      <th className="py-3 pr-2 text-left font-medium text-foreground w-24">Open</th>
                      <th className="py-3 px-2 text-left font-medium text-foreground">From</th>
                      <th className="py-3 pl-2 pr-4 text-left font-medium text-foreground">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availability.map((slot) => (
                      <tr key={slot.day} className="border-b border-border last:border-0 transition-colors">
                        <td className="py-2.5 pl-4 font-medium text-foreground">{DAY_NAMES[slot.day]}</td>
                        <td className="py-2.5 pr-2">
                          <input type="checkbox" checked={slot.enabled}
                            onChange={(e) => setAvailabilitySlot(slot.day, { enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer" />
                        </td>
                        <td className="py-2.5 px-2">
                          <input type="time" value={slot.start}
                            onChange={(e) => setAvailabilitySlot(slot.day, { start: e.target.value })}
                            disabled={!slot.enabled}
                            className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed focus:border-primary focus:outline-none" />
                        </td>
                        <td className="py-2.5 pl-2 pr-4">
                          <input type="time" value={slot.end}
                            onChange={(e) => setAvailabilitySlot(slot.day, { end: e.target.value })}
                            disabled={!slot.enabled}
                            className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed focus:border-primary focus:outline-none" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <StepFooter step={step} onBack={goBack} onNext={goNext} canNext={!!canAdvanceStep2} nextLabel="Next: Media & Details" />
          </div>
        )}

        {/* ── Step 3 — Media & Details ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Media upload */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">Photos &amp; Videos</label>
              <p className="mb-3 text-xs text-muted">Add up to {MAX_MEDIA} images or videos. First image is the cover.</p>

              {/* Venue photo library */}
              {venuePhotos.length > 0 && (
                <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <button type="button" onClick={() => setShowLibrary((v) => !v)}
                    className="flex w-full items-center justify-between text-sm font-medium text-primary cursor-pointer">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      Venue photo library ({venuePhotos.length} photos)
                    </span>
                    <svg className={`h-4 w-4 transition-transform ${showLibrary ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {showLibrary && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {venuePhotos.map((url) => {
                        const selected = mediaFiles.some((e) => e.url === url);
                        return (
                          <button key={url} type="button" onClick={() => toggleLibraryPhoto(url)}
                            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition cursor-pointer ${selected ? "border-primary" : "border-transparent hover:border-primary/50"}`}>
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            {selected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                <svg className="h-6 w-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="sr-only"
                onChange={(e) => addMediaFiles(e.target.files)} />
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addMediaFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-background transition-colors ${dragOver ? "border-primary bg-primary-light/20" : "border-border hover:border-primary/50"}`}>
                <svg className="h-9 w-9 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="mt-2 text-sm text-muted">Click or drag to add photos and videos</p>
              </div>
              {mediaFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {mediaFiles.map((entry) => (
                    <div key={entry.url} className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/30">
                      {entry.type === "video"
                        ? <video src={entry.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                        : <img src={entry.url} alt="" className="h-full w-full object-cover" />
                      }
                      <button type="button" onClick={() => removeMedia(entry.url)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 transition group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">Equipment Included</label>
              <div className="flex gap-2">
                <input type="text" value={equipmentInput} onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEquipment(); } }}
                  placeholder="e.g. Mirror, Styling chair, Wash basin..."
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="button" onClick={addEquipment}
                  className="shrink-0 rounded-lg bg-primary-light px-4 py-3 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer">
                  Add
                </button>
              </div>
              {equipment.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                      {item}
                      <button type="button" onClick={() => setEquipment(equipment.filter((e) => e !== item))}
                        className="ml-1 text-muted hover:text-danger cursor-pointer">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* House Rules */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">House Rules &amp; Instructions</label>
              <p className="mb-3 text-xs text-muted">Add rules that freelancers must agree to before booking.</p>
              <div className="flex gap-2">
                <input type="text" value={houseRuleInput} onChange={(e) => setHouseRuleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHouseRule(); } }}
                  placeholder="e.g. Clean station after each client, No walk-ins..."
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="button" onClick={addHouseRule}
                  className="shrink-0 rounded-lg bg-primary-light px-4 py-3 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer">
                  Add
                </button>
              </div>
              {houseRules.length > 0 && (
                <div className="mt-3 space-y-2">
                  {houseRules.map((rule, index) => (
                    <div key={rule} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">{index + 1}</span>
                      <span className="flex-1 text-sm text-foreground">{rule}</span>
                      <button type="button" onClick={() => setHouseRules(houseRules.filter((r) => r !== rule))}
                        className="shrink-0 text-muted hover:text-danger cursor-pointer">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <StepFooter step={step} onBack={goBack} onNext={goNext} canNext nextLabel="Review &amp; Publish" />
          </div>
        )}

        {/* ── Step 4 — Review & Publish ─────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-muted">Review your listing details before publishing.</p>

            {/* Summary card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* Cover image preview */}
              {mediaFiles.length > 0 ? (
                <div className="relative h-52 w-full overflow-hidden bg-muted/20">
                  {mediaFiles[0].type === "video"
                    ? <video src={mediaFiles[0].url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                    : <img src={mediaFiles[0].url} alt="" className="h-full w-full object-cover" />
                  }
                  {mediaFiles.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                      +{mediaFiles.length - 1} more
                    </div>
                  )}
                  {isRecurring && (
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Recurring
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-bold text-foreground backdrop-blur-sm shadow-sm">
                    ${price}<span className="text-xs font-normal text-muted">{priceType === "daily" ? "/day" : priceType === "weekly" ? "/week" : ""}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-muted/10 text-muted text-sm">No photos added</div>
              )}

              {/* Details */}
              <div className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {location || "No location set"}
                  </p>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{description}</p>
                </div>

                {enabledDays.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {enabledDays.map((s) => (
                      <span key={s.day} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {DAY_NAMES[s.day]}
                      </span>
                    ))}
                  </div>
                )}

                {staticMapUrl && (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <img src={staticMapUrl} alt="Map" className="h-[140px] w-full object-cover" />
                  </div>
                )}

                {/* Checklist */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z", label: `${mediaFiles.length} photo${mediaFiles.length !== 1 ? "s" : ""}` },
                    { icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5", label: `${enabledDays.length} day${enabledDays.length !== 1 ? "s" : ""} available` },
                    { icon: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z", label: `${equipment.length} equipment item${equipment.length !== 1 ? "s" : ""}` },
                    { icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z", label: `${houseRules.length} house rule${houseRules.length !== 1 ? "s" : ""}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg bg-muted/10 px-3 py-2">
                      <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="text-xs text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {submitError && <p className="text-sm text-danger">{submitError}</p>}

            <StepFooter step={step} onBack={goBack} onNext={handlePublish} canNext={!isSubmitting}
              nextLabel={isSubmitting ? "Publishing…" : "Publish Listing"} isPublish />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable step footer ──────────────────────────────────────────────────────

function StepFooter({
  step,
  onBack,
  onNext,
  canNext,
  nextLabel,
  isPublish = false,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel: string;
  isPublish?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-6">
      {step > 1 ? (
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/10 cursor-pointer">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
      ) : (
        <div />
      )}
      <button type="button" onClick={onNext} disabled={!canNext}
        className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isPublish
            ? "bg-success shadow-success/25 hover:bg-green-700"
            : "bg-primary shadow-primary/25 hover:bg-primary-dark"
        }`}>
        <span dangerouslySetInnerHTML={{ __html: nextLabel }} />
        {!isPublish && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
        {isPublish && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
