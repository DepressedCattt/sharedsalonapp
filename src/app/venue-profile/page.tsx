"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useAuth } from "@/context/AuthContext";

const SPECIALTY_OPTIONS = [
  { label: "Hair", icon: "M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.82 3.889 6.21L6 21l4.353-1.813A10.065 10.065 0 0012 19.23c4.97 0 9-3.186 9-7.115C21 8.185 16.97 5 12 5V3z" },
  { label: "Nails", icon: "M7 20.25l5.5-16.5 5.5 16.5M8.625 15.75h9.75" },
  { label: "Lashes", icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Waxing", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  { label: "Aesthetics", icon: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
  { label: "Barbering", icon: "M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.645-.604l-7.938 11.758H19.5m-9.883-1.613l1.943.029" },
  { label: "Makeup", icon: "M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" },
  { label: "Massage", icon: "M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" },
  { label: "Brows", icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Other", icon: "M12 4.5v15m7.5-7.5h-15" },
];

export default function VenueProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Please log in to manage your venue profile.
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

  if (user.role !== "venue") {
    router.replace("/settings");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-8 sm:px-6">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Venue Profile</h1>
            <p className="mt-1 text-sm text-muted">
              Your public page — what freelancers see when they discover your venue.
            </p>
          </div>
          <Link
            href={`/venues/${user.accountId}`}
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview
          </Link>
        </div>

        <VenueProfileContent venueId={user.accountId} venueName={user.name} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Section header component
// ────────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-5 py-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Profile editing content
// ────────────────────────────────────────────────────────────
function VenueProfileContent({
  venueId,
  venueName,
}: {
  venueId: string;
  venueName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(venueName);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [bannerPhoto, setBannerPhoto] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [boothPolicies, setBoothPolicies] = useState<string[]>([]);
  const [policyInput, setPolicyInput] = useState("");
  const [showReviews, setShowReviews] = useState(true);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/venue-profile?venueId=${venueId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDisplayName(data.displayName || venueName);
          setBio(data.bio || "");
          setLocation(data.location || "");
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          const loadedPhotos = data.photos || [];
          setPhotos(loadedPhotos);
          setBannerPhoto(data.bannerPhoto || loadedPhotos[0] || null);
          setProfilePhoto(data.profilePhoto || null);
          setSpecialties(data.specialties || []);
          setBoothPolicies(data.boothPolicies || []);
          setShowReviews(data.showReviews ?? true);
          setWebsite(data.website || "");
          setInstagram(data.instagram || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [venueId, venueName]);

  // Completion tracker
  const completionItems = [
    { label: "Name", done: displayName.trim().length > 0 },
    { label: "Bio", done: bio.trim().length > 0 },
    { label: "Location", done: location.trim().length > 0 },
    { label: "Photos", done: photos.length > 0 },
    { label: "Specialties", done: specialties.length > 0 },
    { label: "Social", done: !!(website.trim() || instagram.trim()) },
  ];
  const completionCount = completionItems.filter((i) => i.done).length;
  const completionPercent = Math.round((completionCount / completionItems.length) * 100);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingPhoto(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json() as { url: string };
        uploaded.push(data.url);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch {
      setError("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
    if (bannerPhoto === url) setBannerPhoto(null);
    if (profilePhoto === url) setProfilePhoto(null);
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addPolicy = () => {
    const trimmed = policyInput.trim();
    if (trimmed && !boothPolicies.includes(trimmed)) {
      setBoothPolicies((prev) => [...prev, trimmed]);
      setPolicyInput("");
    }
  };

  const removePolicy = (p: string) =>
    setBoothPolicies((prev) => prev.filter((x) => x !== p));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/venue-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          latitude,
          longitude,
          photos,
          bannerPhoto: bannerPhoto || photos[0] || null,
          profilePhoto,
          specialties,
          boothPolicies,
          showReviews,
          website,
          instagram,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save venue profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Profile completion ──────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-5 pt-4 pb-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Profile completion</p>
            <span className={`text-sm font-bold ${completionPercent === 100 ? "text-success" : "text-primary"}`}>
              {completionPercent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/20">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completionPercent === 100 ? "bg-success" : "bg-primary"}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border bg-muted/10 px-5 py-3">
          {completionItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  item.done ? "bg-success/15 text-success" : "bg-muted/30 text-muted"
                }`}
              >
                {item.done ? (
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>
              <span className={`text-xs ${item.done ? "font-medium text-foreground" : "text-muted"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 1: About ────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
          title="About Your Venue"
          description="Name, bio, and social links visible on your public profile"
        />
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Venue name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Salon or studio name"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Bio</label>
            <p className="mb-2 text-xs text-muted">
              Tell freelancers what makes your space special. Shown at the top of your profile.
            </p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Describe your space, vibe, and what makes it a great place to work..."
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-right text-xs text-muted">{bio.length}/600</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yoursalon.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">Instagram</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-muted text-sm">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                  placeholder="yoursalon"
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Photo Library ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          }
          title="Photo Library"
          description="Upload photos once — reuse them across all listings. Set a banner and profile image."
        />
        <div className="p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handlePhotoUpload(e.target.files)}
          />

          {/* Role legend */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              Banner — full-width hero on your venue profile
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Profile — your venue avatar / logo
            </span>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const imageFiles = Array.from(e.dataTransfer.files).filter((f) =>
                f.type.startsWith("image/")
              );
              const dt = new DataTransfer();
              imageFiles.forEach((f) => dt.items.add(f));
              handlePhotoUpload(dt.files);
            }}
            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
            className={`flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
              dragOver
                ? "border-primary bg-primary-light/20 scale-[1.01]"
                : "border-border bg-background hover:border-primary/50 hover:bg-muted/10"
            }`}
          >
            {uploadingPhoto ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted">Uploading…</p>
              </div>
            ) : (
              <>
                <svg className="h-7 w-7 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted">Click or drag photos here</p>
                  <p className="mt-0.5 text-xs text-muted/60">PNG, JPG, WEBP — multiple files supported</p>
                </div>
              </>
            )}
          </div>

          {/* Photo grid with banner/profile selection */}
          {photos.length > 0 && (
            <>
              <p className="mt-4 mb-2.5 text-xs text-muted">
                Hover a photo to set it as your <span className="font-semibold text-primary">Banner</span> or <span className="font-semibold text-violet-600">Profile</span> image.
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {photos.map((url) => {
                  const isBanner = bannerPhoto === url;
                  const isProfile = profilePhoto === url;
                  return (
                    <div
                      key={url}
                      className={`group relative aspect-square overflow-hidden rounded-xl transition-all ${
                        isBanner
                          ? "ring-2 ring-primary ring-offset-2"
                          : isProfile
                          ? "ring-2 ring-violet-500 ring-offset-2"
                          : "border border-border"
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />

                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/45 pointer-events-none" />

                      {/* Status badges (always visible when set) */}
                      <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                        {isBanner && (
                          <span className="flex items-center gap-0.5 rounded bg-primary/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                            </svg>
                            Banner
                          </span>
                        )}
                        {isProfile && (
                          <span className="flex items-center gap-0.5 rounded bg-violet-600/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                            </svg>
                            Profile
                          </span>
                        )}
                      </div>

                      {/* Remove button (top-right, hover) */}
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer shadow-sm"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Bottom action strip (slides up on hover) */}
                      <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 p-1.5 transition-transform duration-200 group-hover:translate-y-0">
                        <button
                          type="button"
                          onClick={() => setBannerPhoto(isBanner ? null : url)}
                          className={`flex-1 rounded py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                            isBanner
                              ? "bg-primary text-white"
                              : "bg-white/20 text-white backdrop-blur-sm hover:bg-primary"
                          }`}
                        >
                          {isBanner ? "✓ Banner" : "Banner"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfilePhoto(isProfile ? null : url)}
                          className={`flex-1 rounded py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                            isProfile
                              ? "bg-violet-600 text-white"
                              : "bg-white/20 text-white backdrop-blur-sm hover:bg-violet-600"
                          }`}
                        >
                          {isProfile ? "✓ Profile" : "Profile"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected roles preview */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${bannerPhoto ? "border-primary/30 bg-primary/5" : "border-border bg-muted/5"}`}>
                  <div className="h-9 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20">
                    {bannerPhoto
                      ? <img src={bannerPhoto} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><svg className="h-4 w-4 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159M3.75 21h16.5M20.25 3H3.75" /></svg></div>
                    }
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${bannerPhoto ? "text-primary" : "text-muted"}`}>Banner image</p>
                    <p className="text-[10px] text-muted">{bannerPhoto ? "Hero on your profile page" : "Not set — hover a photo"}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${profilePhoto ? "border-violet-300 bg-violet-50" : "border-border bg-muted/5"}`}>
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted/20">
                    {profilePhoto
                      ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><svg className="h-4 w-4 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg></div>
                    }
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${profilePhoto ? "text-violet-600" : "text-muted"}`}>Profile image</p>
                    <p className="text-[10px] text-muted">{profilePhoto ? "Your venue avatar" : "Not set — hover a photo"}</p>
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-muted">
                {photos.length} photo{photos.length !== 1 ? "s" : ""} in your library
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Section 3: Location ─────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
          title="Location"
          description="Used to pin your venue on the map and show in searches"
        />
        <div className="p-5">
          <label className="mb-1 block text-sm font-semibold text-foreground">Venue address</label>
          <AddressAutocomplete
            value={location}
            onChange={(address, coords) => {
              setLocation(address);
              if (coords) {
                setLatitude(coords.latitude);
                setLongitude(coords.longitude);
              } else {
                setLatitude(undefined);
                setLongitude(undefined);
              }
            }}
            placeholder="Start typing your venue address..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            hint="Select a suggestion to pin your venue precisely on the map."
          />
          {latitude != null && longitude != null && (() => {
            const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!key) return null;
            const url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=800x220&scale=2&markers=color:0x2563eb%7C${latitude},${longitude}&key=${key}`;
            return (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <img src={url} alt="Map preview" className="h-[200px] w-full object-cover" />
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Section 4: Specialties ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
          title="Specialties"
          description="Types of beauty work your venue accommodates — helps freelancers find you"
        />
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {SPECIALTY_OPTIONS.map((opt) => {
              const selected = specialties.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => toggleSpecialty(opt.label)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer text-left ${
                    selected
                      ? "border-primary bg-primary-light text-primary shadow-sm shadow-primary/10"
                      : "border-border bg-background text-muted hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      selected ? "bg-primary text-white" : "bg-muted/20 text-muted"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                    </svg>
                  </div>
                  {opt.label}
                </button>
              );
            })}
          </div>
          {specialties.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              {specialties.length} selected: {specialties.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* ── Section 5: Booth Policies ───────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          }
          title="Booth Policies"
          description="Rules that freelancers agree to before booking — shown on your public profile"
        />
        <div className="p-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={policyInput}
              onChange={(e) => setPolicyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addPolicy(); }
              }}
              placeholder="e.g. Clean station after each client, No walk-ins..."
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={addPolicy}
              className="shrink-0 rounded-lg bg-primary-light px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
            >
              Add
            </button>
          </div>

          {boothPolicies.length > 0 && (
            <div className="mt-3 space-y-2">
              {boothPolicies.map((policy, i) => (
                <div
                  key={policy}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-primary/30"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{policy}</span>
                  <button
                    type="button"
                    onClick={() => removePolicy(policy)}
                    className="shrink-0 text-muted hover:text-danger cursor-pointer transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 6: Preferences ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Preferences"
          description="Control how your profile appears to freelancers"
        />
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Show reviews</p>
              <p className="mt-0.5 text-xs text-muted">
                Display freelancer reviews publicly on your profile page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReviews((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                showReviews ? "bg-primary" : "bg-muted/40"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  showReviews ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Sticky save footer ──────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted/20 sm:block">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completionPercent === 100 ? "bg-success" : "bg-primary"}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted">
              {completionCount}/{completionItems.length} sections complete
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/venues/${venueId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              See Profile
            </Link>

            <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              saved
                ? "bg-success shadow-success/20"
                : "bg-primary shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : saved ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              <>
                Save Profile
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
