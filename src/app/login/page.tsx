"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const intent = searchParams.get("intent"); // "renter" or "venue"

  const handleRoleSelect = (role: UserRole) => {
    login(role);
    if (role === "renter") {
      router.push("/listings");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                SS
              </div>
              <h1 className="mt-4 text-2xl font-bold text-foreground">
                Log in or
              </h1>
              <p className="text-2xl font-bold text-primary">Sign up now!</p>
              <p className="mt-2 text-sm text-muted">
                Choose how you want to use Shared Salon
              </p>
            </div>

            {/* Role Buttons */}
            <div className="mt-8 space-y-3">
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
