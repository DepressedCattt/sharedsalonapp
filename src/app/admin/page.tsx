"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

// ─── What each persona tests ────────────────────────────────────────────────
// dev-venue  : role pre-set in JWT → bypasses signup entirely → good for
//              testing venue features (dashboard, listings, bookings)
// dev-renter : role pre-set in JWT → bypasses signup entirely → good for
//              testing renter features (browse, book, messages)
// dev-new    : no role → lands on /login → user selects role → triggers the
//              REAL new-user check → good for testing the full signup flow
// ────────────────────────────────────────────────────────────────────────────

const DEV_PERSONAS = [
  {
    id: "dev-venue",
    label: "Venue Owner",
    description: "Returning user — skips signup",
    role: "venue" as const,
    redirectTo: "/dashboard",
    roleColor: "bg-blue-500/10 text-blue-400",
    badge: "existing",
  },
  {
    id: "dev-renter",
    label: "Freelancer",
    description: "Returning user — skips signup",
    role: "renter" as const,
    redirectTo: "/listings",
    roleColor: "bg-green-500/10 text-green-400",
    badge: "existing",
  },
  {
    id: "dev-new",
    label: "New User",
    description: "No role set — goes through full signup",
    role: null,
    redirectTo: "/login",
    roleColor: "bg-amber-500/10 text-amber-400",
    badge: "signup",
  },
];

// localStorage key used by the venue profile onboarding animation
const ONBOARDING_LS_KEY = (id: string) =>
  `sharedsalon_venue_onboarding_seen_${id}_venue`;

const TEST_FLOWS = [
  {
    href: "/login",
    label: "Sign Up / Login",
    description: "Onboarding & role selection",
    icon: "→",
  },
  {
    href: "/listings",
    label: "Browse Listings",
    description: "Renter-side listing view",
    icon: "🗂",
  },
  {
    href: "/dashboard",
    label: "Venue Dashboard",
    description: "Listings & booking management",
    icon: "📊",
  },
  {
    href: "/create",
    label: "Create Listing",
    description: "New listing form",
    icon: "✚",
  },
  {
    href: "/bookings",
    label: "Bookings",
    description: "Booking requests & history",
    icon: "📅",
  },
  {
    href: "/messages",
    label: "Messages",
    description: "Conversation threads",
    icon: "💬",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Profile & preferences",
    icon: "⚙",
  },
  {
    href: "/venue-profile",
    label: "Venue Profile",
    description: "Public venue page editor",
    icon: "🏢",
  },
  {
    href: "/admin/seed",
    label: "Database Seeder",
    description: "Populate with mock data",
    icon: "🌱",
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [storageCleared, setStorageCleared] = useState(false);
  const [onboardingReset, setOnboardingReset] = useState(false);
  const [loadingSignupTest, setLoadingSignupTest] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Not available</p>
          <p className="text-sm text-muted mt-1">
            Admin tools are only available in development mode.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const handleDevLogin = async (persona: (typeof DEV_PERSONAS)[number]) => {
    setLoadingPersona(persona.id);
    await signIn("dev", {
      persona: persona.id,
      callbackUrl: persona.redirectTo,
    });
    setLoadingPersona(null);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin" });
  };

  const clearLocalStorage = () => {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("sharedsalon_")
    );
    keys.forEach((k) => localStorage.removeItem(k));
    setStorageCleared(true);
    setTimeout(() => setStorageCleared(false), 2500);
  };

  // Clears ONLY the onboarding animation flags (doesn't touch other data)
  const resetOnboardingFlags = () => {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage).filter((k) =>
      k.includes("_onboarding_seen_")
    );
    keys.forEach((k) => localStorage.removeItem(k));
    setOnboardingReset(true);
    setTimeout(() => setOnboardingReset(false), 2500);
  };

  // Clears the dev-new onboarding flag then signs in as dev-new for a clean
  // run through the full venue signup flow (role selection → new-user check → onboarding)
  const handleTestVenueSignup = async () => {
    setLoadingSignupTest(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_LS_KEY("dev-new-001"));
    }
    await signIn("dev", { persona: "dev-new", callbackUrl: "/login" });
    setLoadingSignupTest(false);
  };

  // Navigates to the venue profile onboarding preview (force mode — no localStorage flag needed)
  const handlePreviewOnboarding = () => {
    router.push("/venue-profile?onboarding=force");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                DEV MODE
              </span>
              <h1 className="text-2xl font-bold text-white">Admin Hub</h1>
            </div>
            <p className="text-sm text-slate-400">
              Developer tools and quick access to all features.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors rounded-lg border border-white/5 px-3 py-1.5"
          >
            ← Home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* Left column */}
          <div className="space-y-6">

            {/* ── Signup Testing ────────────────────────────────── */}
            <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Signup Testing
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                Two signals control first-time detection: the{" "}
                <span className="text-slate-400 font-mono">
                  GET /api/venue-profile
                </span>{" "}
                API (404 = new user) and a{" "}
                <span className="text-slate-400 font-mono">localStorage</span>{" "}
                flag that gates the onboarding animation.
              </p>

              {/* How each persona behaves */}
              <div className="mb-4 space-y-1.5">
                {[
                  {
                    persona: "dev-venue / dev-renter",
                    color: "text-slate-500",
                    dot: "bg-slate-600",
                    note: "Role pre-set in JWT → bypasses handleRoleSelect entirely → never hits the new-user check",
                  },
                  {
                    persona: "dev-new",
                    color: "text-amber-400",
                    dot: "bg-amber-500",
                    note: "No role → /login → user selects role → runs the real new-user API check → triggers onboarding on first run",
                  },
                ].map((row) => (
                  <div key={row.persona} className="flex gap-2.5">
                    <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${row.dot}`} />
                    <div>
                      <span className={`text-xs font-mono font-semibold ${row.color}`}>
                        {row.persona}
                      </span>
                      <span className="text-xs text-slate-600"> — {row.note}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleTestVenueSignup}
                  disabled={loadingSignupTest}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/[0.12] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loadingSignupTest ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  ) : (
                    "▶"
                  )}
                  Test Full Venue Signup
                </button>

                <button
                  onClick={handlePreviewOnboarding}
                  disabled={status !== "authenticated" || session?.user?.role !== "venue"}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={
                    session?.user?.role !== "venue"
                      ? "Sign in as Venue Owner first"
                      : undefined
                  }
                >
                  ◎ Preview Onboarding
                </button>

                <button
                  onClick={resetOnboardingFlags}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    onboardingReset
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {onboardingReset ? "✓ Flags cleared" : "↺ Reset Onboarding Flags"}
                </button>
              </div>

              <p className="mt-3 text-[11px] text-slate-700 leading-relaxed">
                <strong className="text-slate-500">Test Full Venue Signup</strong> — clears
                the onboarding localStorage flag for{" "}
                <span className="font-mono">dev-new</span> and signs in with no role so
                you run through the exact real-user path.{" "}
                <strong className="text-slate-500">Preview Onboarding</strong> — opens{" "}
                <span className="font-mono">?onboarding=force</span> which always replays
                the animation without touching any flags (requires venue role).{" "}
                <strong className="text-slate-500">Reset Flags</strong> — clears only the
                animation flags so the next normal visit re-triggers them.
              </p>
            </section>

            {/* Test flows */}
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Test Flows
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEST_FLOWS.map((flow) => (
                  <Link
                    key={flow.href}
                    href={flow.href}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.07] hover:border-white/10 transition-all"
                  >
                    <span className="text-lg w-6 text-center flex-shrink-0">
                      {flow.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {flow.label}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {flow.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick actions */}
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearLocalStorage}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    storageCleared
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  {storageCleared ? "✓ Cleared!" : "Clear LocalStorage"}
                </button>

                <Link
                  href="/admin/seed"
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
                >
                  Database Seeder →
                </Link>

                {status === "authenticated" && (
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Session info */}
            <section className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Current Session
              </h2>

              {status === "loading" && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                  <span className="text-xs text-slate-500">Loading…</span>
                </div>
              )}

              {status === "unauthenticated" && (
                <p className="text-xs text-slate-500 italic">Not signed in</p>
              )}

              {status === "authenticated" && session && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        className="h-9 w-9 rounded-full ring-1 ring-white/10"
                        alt=""
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {session.user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/[0.04] px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Role</span>
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          session.user.role === "venue"
                            ? "bg-blue-500/10 text-blue-400"
                            : session.user.role === "renter"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {session.user.role ?? "none"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-500 flex-shrink-0">ID</span>
                      <span className="text-xs font-mono text-slate-400 text-right break-all">
                        {session.user.id}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Dev persona switcher */}
            <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <h2 className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-1">
                Login As
              </h2>
              <p className="text-[11px] text-slate-600 mb-3">
                First two bypass signup. Use <span className="font-mono text-slate-500">dev-new</span> to test the full flow.
              </p>
              <div className="space-y-2">
                {DEV_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handleDevLogin(persona)}
                    disabled={loadingPersona !== null}
                    className="w-full text-left rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 hover:bg-white/[0.07] hover:border-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          {persona.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {persona.description}
                        </p>
                      </div>
                      {loadingPersona === persona.id ? (
                        <div className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      ) : (
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${persona.roleColor}`}>
                            {persona.role ?? "new"}
                          </span>
                          <span className={`text-[10px] font-medium ${
                            persona.badge === "signup"
                              ? "text-amber-600"
                              : "text-slate-600"
                          }`}>
                            {persona.badge === "signup" ? "▶ full signup" : "skips signup"}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-600 text-center">
                Switching will replace current session
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
