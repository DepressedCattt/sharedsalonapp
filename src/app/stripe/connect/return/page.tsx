"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type OnboardingStatus = "loading" | "complete" | "incomplete" | "error";

export default function StripeConnectReturnPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  useEffect(() => {
    fetch("/api/stripe/connect/status")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { onboarded?: boolean; hasAccount?: boolean }) => {
        setStatus(data.onboarded ? "complete" : "incomplete");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted">Checking your Stripe account status…</p>
          </div>
        )}

        {status === "complete" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <svg
                className="h-8 w-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Payouts connected!</h1>
              <p className="mt-2 text-muted">
                Your Stripe account is set up. Freelancers can now pay for approved bookings and
                payouts will be sent automatically to your bank account.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "incomplete" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/15">
              <svg
                className="h-8 w-8 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Setup incomplete</h1>
              <p className="mt-2 text-muted">
                Your Stripe account setup is not yet complete. Please finish the onboarding
                process to start receiving payments.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/settings")}
                className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Continue setup
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-muted/20 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="mt-2 text-muted">
                We could not verify your Stripe account status. Please go to Settings and try
                again.
              </p>
            </div>
            <Link
              href="/settings"
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Back to Settings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
