"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";

const DEV_PERSONAS = [
  {
    id: "dev-venue",
    label: "Venue Owner",
    description: "Manage listings & bookings",
    role: "venue" as const,
    redirectTo: "/dashboard",
  },
  {
    id: "dev-renter",
    label: "Freelancer",
    description: "Browse & rent chairs",
    role: "renter" as const,
    redirectTo: "/listings",
  },
  {
    id: "dev-new",
    label: "New User",
    description: "Test the sign-up flow",
    role: null,
    redirectTo: "/login",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { user, setRole } = useAuth();
  const [devLoading, setDevLoading] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  // Prevent the auto-redirect effect from firing while we're handling role selection
  const isSelectingRoleRef = useRef(false);

  const intent = searchParams.get("intent");
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (user && !isSelectingRoleRef.current) {
      router.push(user.role === "renter" ? "/listings" : "/dashboard");
    }
  }, [user, router]);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/login" });
  };

  const handleFacebookSignIn = () => {
    signIn("facebook", { callbackUrl: "/login" });
  };

  const handleRoleSelect = async (role: UserRole) => {
    isSelectingRoleRef.current = true;
    setRoleLoading(role);
    await setRole(role);

    if (role === "venue" && session?.user?.id) {
      // Check whether this venue already has a profile (returning user)
      try {
        const venueId = `${session.user.id}_venue`;
        const res = await fetch(`/api/venue-profile?venueId=${encodeURIComponent(venueId)}`);
        if (!res.ok) {
          // 404 = brand-new venue → send to profile setup with onboarding
          router.push("/venue-profile?onboarding=true");
          return;
        }
      } catch {
        // On network error default to onboarding
        router.push("/venue-profile?onboarding=true");
        return;
      }
      router.push("/dashboard");
    } else {
      router.push("/listings");
    }
  };

  const handleDevLogin = async (persona: (typeof DEV_PERSONAS)[number]) => {
    setDevLoading(persona.id);
    await signIn("dev", {
      persona: persona.id,
      callbackUrl: persona.redirectTo,
    });
    setDevLoading(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                SS
              </div>

              {isAuthenticated ? (
                <>
                  {session?.user?.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="mx-auto mt-4 h-16 w-16 rounded-full"
                    />
                  )}
                  <h1 className="mt-3 text-2xl font-bold text-foreground">
                    Welcome, {session?.user?.name?.split(" ")[0]}!
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    How do you want to use Shared Salon?
                  </p>
                </>
              ) : (
                <>
                  <h1 className="mt-4 text-2xl font-bold text-foreground">
                    Log in or
                  </h1>
                  <p className="text-2xl font-bold text-primary">
                    Sign up now!
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Get started with your Google account
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 space-y-3">
              {isAuthenticated ? (
                <>
                  {/* Role selection after sign-in */}
                  <button
                    onClick={() => handleRoleSelect("renter")}
                    disabled={roleLoading !== null}
                    className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      intent === "renter"
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary hover:bg-primary-light/50"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <svg
                        className="h-6 w-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        I&apos;m a Freelancer
                      </p>
                      <p className="text-sm text-muted">
                        Browse and rent chairs at salon venues
                      </p>
                    </div>
                    {roleLoading === "renter" ? (
                      <div className="ml-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <svg
                        className="ml-auto h-5 w-5 text-muted transition-colors group-hover:text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => handleRoleSelect("venue")}
                    disabled={roleLoading !== null}
                    className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      intent === "venue"
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-primary hover:bg-primary-light/50"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <svg
                        className="h-6 w-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        I&apos;m a Venue
                      </p>
                      <p className="text-sm text-muted">
                        List your chairs and manage bookings
                      </p>
                    </div>
                    {roleLoading === "venue" ? (
                      <div className="ml-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <svg
                        className="ml-auto h-5 w-5 text-muted transition-colors group-hover:text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Google sign-in button */}
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-white px-4 py-3.5 font-medium text-foreground transition-all hover:border-gray-400 hover:shadow-md cursor-pointer"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  {/* Facebook sign-in button */}
                  <button
                    onClick={handleFacebookSignIn}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-white px-4 py-3.5 font-medium text-foreground transition-all hover:border-[#1877F2]/40 hover:shadow-md cursor-pointer"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Continue with Facebook
                  </button>

                  <p className="pt-2 text-center text-xs text-muted">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Dev login panel — only visible in development */}
          {isDev && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/20">
                    DEV
                  </span>
                  <span className="text-sm font-semibold text-foreground">Quick Login</span>
                </div>
                <a
                  href="/admin"
                  className="text-xs text-amber-600 hover:text-amber-500 transition-colors"
                >
                  Admin Hub →
                </a>
              </div>

              <div className="space-y-2">
                {DEV_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handleDevLogin(persona)}
                    disabled={devLoading !== null}
                    className="group flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{persona.label}</p>
                      <p className="text-xs text-muted">{persona.description}</p>
                    </div>
                    {devLoading === persona.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    ) : (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                          persona.role === "venue"
                            ? "bg-blue-500/10 text-blue-600"
                            : persona.role === "renter"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {persona.role ?? "new user"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
