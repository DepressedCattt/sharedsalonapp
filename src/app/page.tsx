"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-white to-accent/10" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Rent a Chair
              <span className="block text-primary">Without a Care</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
              The simplest way to connect freelance stylists with salon venues.
              Find a chair to rent or list your space — all in one place.
            </p>

            {/* Dual CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/login?intent=renter"
                className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
              >
                Find a Chair
              </Link>
              <Link
                href="/login?intent=venue"
                className="inline-flex h-14 w-full items-center justify-center rounded-xl border-2 border-primary bg-white px-8 text-base font-semibold text-primary transition-all hover:bg-primary-light sm:w-auto"
              >
                List Your Chair
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {/* For Renters */}
          <div className="rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">
              Find Your Perfect Chair
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 text-muted">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong className="text-foreground">Trusted venues</strong> — every salon is verified so you can book with confidence</span>
              </li>
              <li className="flex items-start gap-3 text-muted">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong className="text-foreground">Simple booking</strong> — browse, request, and get approved in minutes</span>
              </li>
              <li className="flex items-start gap-3 text-muted">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong className="text-foreground">Flexible terms</strong> — rent by the day, week, or month on your schedule</span>
              </li>
            </ul>
            <Link
              href="/login?intent=renter"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              Start browsing
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* For Venues */}
          <div className="rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
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
                  d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">
              List Your Chair
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 text-muted">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong className="text-foreground">Increase revenue</strong> — fill empty chairs and earn from unused space</span>
              </li>
              <li className="flex items-start gap-3 text-muted">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong className="text-foreground">Simple listing</strong> — create a listing in under 2 minutes</span>
              </li>
              <li className="flex items-start gap-3 text-muted">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong className="text-foreground">Trust & safety</strong> — insurance policies and verified renters</span>
              </li>
            </ul>
            <Link
              href="/login?intent=venue"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              List your space
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                SS
              </div>
              <span className="text-sm font-semibold text-foreground">
                Shared Salon
              </span>
            </div>
            <p className="text-sm text-muted">
              &copy; 2026 Shared Salon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
