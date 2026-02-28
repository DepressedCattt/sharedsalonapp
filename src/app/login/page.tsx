"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { user, setRole } = useAuth();

  const intent = searchParams.get("intent");

  useEffect(() => {
    if (user) {
      router.push(user.role === "renter" ? "/listings" : "/dashboard");
    }
  }, [user, router]);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/login" });
  };

  const handleRoleSelect = async (role: UserRole) => {
    await setRole(role);
    router.push(role === "renter" ? "/listings" : "/dashboard");
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
        <div className="w-full max-w-md">
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
                  {/* Role selection after Google sign-in */}
                  <button
                    onClick={() => handleRoleSelect("renter")}
                    className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer ${
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
                  </button>

                  <button
                    onClick={() => handleRoleSelect("venue")}
                    className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer ${
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

                  <p className="pt-2 text-center text-xs text-muted">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                </>
              )}
            </div>
          </div>
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
