"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import TrustProfileCard from "@/components/TrustProfileCard";
import type { FreelancerProfile } from "@/lib/types";
import { fetchWithRetry } from "@/lib/fetchRetry";
import { getCached, setCached } from "@/lib/apiCache";

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

export default function FreelancerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      }
    >
      <FreelancerProfilePageInner />
    </Suspense>
  );
}

function FreelancerProfilePageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "trust">("profile");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Please log in to manage your freelancer profile.
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

  if (user.role !== "renter") {
    router.replace("/settings");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-8 sm:px-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Your public page — what venues see when they review your booking requests.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trust")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "trust"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Trust Profile
          </button>
        </div>

        {/* Profile tab — keep mounted to preserve form state */}
        <div style={{ display: activeTab === "profile" ? "block" : "none" }}>
          <FreelancerProfileContent
            renterId={user.accountId}
            renterName={user.name}
          />
        </div>

        {/* Trust Profile tab */}
        {activeTab === "trust" && (
          <FreelancerTrustTab renterId={user.accountId} />
        )}
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
function FreelancerProfileContent({
  renterId,
  renterName,
}: {
  renterId: string;
  renterName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(renterName);
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bannerPhoto, setBannerPhoto] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
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
    const cacheKey = `freelancer_profile_${renterId}`;

    function applyData(data: FreelancerProfile) {
      setDisplayName(data.displayName || renterName);
      setBio(data.bio || "");
      const loadedPhotos = data.photos || [];
      setPhotos(loadedPhotos);
      setProfilePhoto(data.profilePhoto || null);
      setBannerPhoto(data.bannerPhoto || loadedPhotos[0] || null);
      setSpecialties(data.specialties || []);
      setShowReviews(data.showReviews ?? true);
      setWebsite(data.website || "");
      setInstagram(data.instagram || "");
    }

    // Show cached data immediately — skip the loading spinner on repeat visits
    const cached = getCached<FreelancerProfile>(cacheKey);
    if (cached) {
      applyData(cached);
      setLoading(false);
    }

    // Always fetch fresh data in the background
    fetchWithRetry(`/api/freelancer-profile?renterId=${renterId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FreelancerProfile | null) => {
        if (data) {
          applyData(data);
          setCached(cacheKey, data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [renterId, renterName]);

  // Completion tracker
  const completionItems = [
    { label: "Name", done: displayName.trim().length > 0 },
    { label: "Bio", done: bio.trim().length > 0 },
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
    if (profilePhoto === url) setProfilePhoto(null);
    if (bannerPhoto === url) setBannerPhoto(null);
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/freelancer-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          photos,
          profilePhoto: profilePhoto || photos[0] || null,
          bannerPhoto: bannerPhoto || null,
          specialties,
          showReviews,
          website,
          instagram,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save profile");
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
          title="About You"
          description="Name, bio, and social links visible on your public profile"
        />
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or business name"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Bio</label>
            <p className="mb-2 text-xs text-muted">
              Tell venues about your experience and style. Shown at the top of your profile.
            </p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Describe your skills, experience, and what makes you a great freelancer to work with..."
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
                placeholder="https://yoursite.com"
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
                  placeholder="yourhandle"
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
          title="Photos"
          description="Portfolio shots and a profile photo — help venues get to know you"
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
              Profile — your freelancer avatar
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
              </svg>
              Banner — full-width hero on your profile
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

          {/* Photo grid */}
          {photos.length > 0 && (
            <>
              <p className="mt-4 mb-2.5 text-xs text-muted">
                Hover a photo to set it as your <span className="font-semibold text-violet-600">Profile</span> or <span className="font-semibold text-primary">Banner</span> image.
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {photos.map((url) => {
                  const isProfile = profilePhoto === url;
                  const isBanner = bannerPhoto === url;
                  return (
                    <div
                      key={url}
                      className={`group relative aspect-square overflow-hidden rounded-xl transition-all ${
                        isProfile
                          ? "ring-2 ring-violet-500 ring-offset-2"
                          : isBanner
                          ? "ring-2 ring-primary ring-offset-2"
                          : "border border-border"
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/45 pointer-events-none" />

                      {/* Status badges */}
                      <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                        {isProfile && (
                          <span className="flex items-center gap-0.5 rounded bg-violet-600/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            Profile
                          </span>
                        )}
                        {isBanner && (
                          <span className="flex items-center gap-0.5 rounded bg-primary/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            Banner
                          </span>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer shadow-sm"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Bottom action strip */}
                      <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 p-1.5 transition-transform duration-200 group-hover:translate-y-0">
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
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected roles preview */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${profilePhoto ? "border-violet-300 bg-violet-50" : "border-border bg-muted/5"}`}>
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted/20">
                    {profilePhoto
                      ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><svg className="h-4 w-4 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg></div>
                    }
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${profilePhoto ? "text-violet-600" : "text-muted"}`}>Profile image</p>
                    <p className="text-[10px] text-muted">{profilePhoto ? "Your freelancer avatar" : "Not set — hover a photo"}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${bannerPhoto ? "border-primary/30 bg-primary/5" : "border-border bg-muted/5"}`}>
                  <div className="h-9 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20">
                    {bannerPhoto
                      ? <img src={bannerPhoto} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><svg className="h-4 w-4 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159M3.75 21h16.5" /></svg></div>
                    }
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${bannerPhoto ? "text-primary" : "text-muted"}`}>Banner image</p>
                    <p className="text-[10px] text-muted">{bannerPhoto ? "Hero on your profile page" : "Not set — hover a photo"}</p>
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

      {/* ── Section 3: Specialties ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
          title="Specialties"
          description="The types of beauty work you offer — helps venues understand your skills"
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

      {/* ── Section 4: Preferences ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Preferences"
          description="Control how your profile appears to venues"
        />
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Show reviews</p>
              <p className="mt-0.5 text-xs text-muted">
                Display venue reviews publicly on your profile page.
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
  );
}

// ────────────────────────────────────────────────────────────
// Trust Profile tab
// ────────────────────────────────────────────────────────────

const TIER_INFO = [
  {
    tier: "fresh",
    label: "Fresh",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    scoreReq: "—",
    bookingReq: "0–4 bookings",
    description:
      "Every new freelancer starts here. Reviews are collected during this period and used to set your first rank once you hit 5 completed bookings.",
  },
  {
    tier: "bronze",
    label: "Bronze",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    scoreReq: "0 – 59",
    bookingReq: "5+ bookings",
    description:
      "Your first ranked tier. Indicates an active freelancer still building their reputation. Focus on reliability, professionalism, and good communication to move up.",
  },
  {
    tier: "silver",
    label: "Silver",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-500",
    scoreReq: "60 – 74",
    bookingReq: "5+ bookings",
    description:
      "A solid, reliable freelancer. Venues can accept requests with confidence. Continued positive reviews push you toward Gold.",
  },
  {
    tier: "gold",
    label: "Gold",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
    scoreReq: "75 – 89",
    bookingReq: "5+ bookings",
    description:
      "A highly regarded freelancer. Venues actively seek out Gold freelancers for quality and professionalism. You're in the top tier of everyday rankings.",
  },
  {
    tier: "platinum",
    label: "Platinum",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    scoreReq: "90+",
    bookingReq: "20+ bookings",
    description:
      "Reserved for exceptional freelancers with a long track record of near-perfect reviews. Both thresholds must be met simultaneously — score and booking count.",
  },
  {
    tier: "trailblazer",
    label: "Trailblazer",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    scoreReq: "—",
    bookingReq: "Admin-granted",
    description:
      "A special badge for early adopters who helped shape SharedSalon. This tier sits outside the standard ranking system and is permanently granted.",
  },
];

const SCORE_DIMENSIONS = [
  {
    label: "Professionalism",
    weight: "40%",
    color: "bg-primary",
    description: "How professional and prepared you are on the day. Did you arrive on time, keep your station clean, and follow venue rules?",
  },
  {
    label: "Venue Satisfaction",
    weight: "40%",
    color: "bg-accent",
    description: "Whether the venue felt your conduct matched your profile and communication was clear throughout.",
  },
  {
    label: "Payment Reliability",
    weight: "10%",
    color: "bg-info",
    description: "Timely payment of booth rental fees and any agreed charges.",
  },
  {
    label: "No Disputes",
    weight: "10%",
    color: "bg-success",
    description: "Penalty reduction for any disputed or flagged bookings.",
  },
];

function FreelancerTrustTab({ renterId }: { renterId: string }) {
  return (
    <div className="space-y-5 pb-10">
      {/* Current trust profile */}
      <TrustProfileCard accountId={renterId} role="renter" />

      {/* How your score is calculated */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-5 py-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">How Your Score is Calculated</p>
            <p className="text-xs text-muted">A weighted average of four dimensions rated by venues after each booking</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {SCORE_DIMENSIONS.map((dim) => (
            <div key={dim.label} className="flex items-start gap-4 px-5 py-4">
              <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dim.color}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{dim.label}</p>
                  <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                    {dim.weight}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted leading-relaxed">{dim.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-muted/10 px-5 py-3">
          <p className="text-xs text-muted leading-relaxed">
            Ratings are collected on a 1–5 star scale and converted to a 0–100 score.
            Your public score and tier only update at every 5th completed booking to preserve
            reviewer anonymity — so individual ratings can&apos;t be traced back to a single venue.
          </p>
        </div>
      </div>

      {/* Tier guide */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-5 py-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Trust Tiers</p>
            <p className="text-xs text-muted">What each rank means and how to achieve it</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {TIER_INFO.map((t) => (
            <div key={t.tier} className="flex items-start gap-4 px-5 py-4">
              <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${t.color}`}>
                    {t.label}
                  </span>
                  <span className="text-xs text-muted">Score {t.scoreReq}</span>
                  <span className="text-muted/40 text-xs">·</span>
                  <span className="text-xs text-muted">{t.bookingReq}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips to improve */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-5 py-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tips to Improve Your Rank</p>
            <p className="text-xs text-muted">Small changes that have the biggest impact on your score</p>
          </div>
        </div>
        <div className="space-y-0 divide-y divide-border">
          {[
            {
              icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              title: "Arrive on time and prepared",
              body: "Professionalism is your biggest score driver at 40%. Venues rate whether you arrived punctually, kept your station clean, and followed their house rules. Consistency here makes the biggest difference.",
            },
            {
              icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
              title: "Communicate clearly and promptly",
              body: "Communication is part of the Satisfaction score. Respond to messages quickly, confirm booking details in advance, and flag any changes early — venues appreciate proactive freelancers.",
            },
            {
              icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
              title: "Keep your profile accurate",
              body: "If your skills and specialties match what you deliver on the day, satisfaction scores stay high. Update your bio and specialties whenever your services change.",
            },
            {
              icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              title: "Pay booth fees promptly",
              body: "Payment reliability counts for 10%. Paying on time, following the agreed payment method, and raising any billing questions before the booking keeps this dimension high.",
            },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-4 px-5 py-4">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tip.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="mt-0.5 text-xs text-muted leading-relaxed">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
