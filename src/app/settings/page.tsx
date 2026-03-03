"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/types";

function getDefaultProfile(
  user: { name: string; email: string },
  existing: UserProfile | null
): UserProfile {
  return {
    displayName: existing?.displayName ?? user.name,
    email: existing?.email ?? user.email,
    phone: existing?.phone ?? "",
    location: existing?.location ?? "",
    paymentAccount: existing?.paymentAccount ?? { connected: false },
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, updateProfile } = useAuth();
  const [form, setForm] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);

  // Stripe Connect state (venues only)
  const [stripeOnboarded, setStripeOnboarded] = useState(false);
  const [stripeHasAccount, setStripeHasAccount] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(true);
  const [stripeError, setStripeError] = useState("");

  // Verification state
  const [abnVerified, setAbnVerified] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(true);
  const [abnOpen, setAbnOpen] = useState(false);
  const [abnInput, setAbnInput] = useState("");
  const [abnSubmitting, setAbnSubmitting] = useState(false);
  const [abnResult, setAbnResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [idMessage, setIdMessage] = useState("");
  const abnInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setForm(getDefaultProfile({ name: user.name, email: user.email }, profile));
  }, [user, profile]);

  // Fetch current verification status from TrustProfile
  useEffect(() => {
    if (!user?.accountId || !user?.role) return;
    setVerifyLoading(true);
    fetch(`/api/trust?accountId=${encodeURIComponent(user.accountId)}&role=${user.role}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAbnVerified(!!data.abnVerified);
          setIdVerified(!!data.idVerified);
        }
      })
      .catch(() => {})
      .finally(() => setVerifyLoading(false));
  }, [user?.accountId, user?.role]);

  // Fetch Stripe Connect status for venues
  useEffect(() => {
    if (!user || user.role !== "venue") {
      setStripeStatusLoading(false);
      return;
    }
    setStripeStatusLoading(true);
    fetch("/api/stripe/connect/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { onboarded?: boolean; hasAccount?: boolean } | null) => {
        if (data) {
          setStripeOnboarded(!!data.onboarded);
          setStripeHasAccount(!!data.hasAccount);
        }
      })
      .catch(() => {})
      .finally(() => setStripeStatusLoading(false));
  }, [user]);

  // Show Stripe Connect return message from query param
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "error") {
      setStripeError("Something went wrong with Stripe. Please try again.");
    } else if (stripeParam === "unconfigured") {
      setStripeError("Stripe is not yet configured on this server.");
    }
  }, [searchParams]);

  // Refresh ID verification status after returning from Stripe Identity
  useEffect(() => {
    const identityParam = searchParams.get("identity");
    if (identityParam === "complete" && user?.accountId && user?.role) {
      setVerifyLoading(true);
      fetch(`/api/trust?accountId=${encodeURIComponent(user.accountId)}&role=${user.role}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setIdVerified(!!data.idVerified);
          }
        })
        .catch(() => {})
        .finally(() => setVerifyLoading(false));
    }
  }, [searchParams, user?.accountId, user?.role]);

  useEffect(() => {
    if (abnOpen) abnInputRef.current?.focus();
  }, [abnOpen]);

  async function handleStripeConnect() {
    setStripeLoading(true);
    setStripeError("");
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.error ?? "Failed to start Stripe onboarding.");
      }
    } catch {
      setStripeError("Network error. Please try again.");
    } finally {
      setStripeLoading(false);
    }
  }

  async function handleAbnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.accountId || !user?.role) return;
    setAbnSubmitting(true);
    setAbnResult(null);
    try {
      const res = await fetch("/api/verify/abn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abn: abnInput, accountId: user.accountId, role: user.role }),
      });
      const data = await res.json() as { verified?: boolean; message?: string };
      if (res.ok && data.verified) {
        setAbnVerified(true);
        setAbnOpen(false);
        setAbnResult({ ok: true, message: data.message ?? "ABN verified." });
      } else {
        setAbnResult({ ok: false, message: data.message ?? "Verification failed." });
      }
    } catch {
      setAbnResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setAbnSubmitting(false);
    }
  }

  async function handleIdVerify() {
    if (!user?.accountId || !user?.role) return;
    setIdSubmitting(true);
    setIdMessage("");
    try {
      const res = await fetch("/api/verify/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: user.accountId, role: user.role }),
      });
      const data = await res.json() as { available?: boolean; url?: string; message?: string };
      if (res.ok && data.available && data.url) {
        window.location.href = data.url;
      } else {
        setIdMessage(data.message ?? "Identity verification is coming soon.");
      }
    } catch {
      setIdMessage("Network error. Please try again.");
    } finally {
      setIdSubmitting(false);
    }
  }

  const handleChange = (
    field: keyof UserProfile,
    value: string | UserProfile["paymentAccount"]
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Please log in to manage your settings.
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

  if (form === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const isVenue = user.role === "venue";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted">
            {isVenue
              ? "Update your account details and payment info."
              : "Update your contact details and payment method."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">General</h2>
            <p className="mt-1 text-sm text-muted">
              Display name and contact info shown to{" "}
              {isVenue ? "freelancers" : "venues"}.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={isVenue ? "Salon or business name" : "Your name"}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Associated email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="+61 4XX XXX XXX"
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Location</h2>
            <p className="mt-1 text-sm text-muted">
              {isVenue
                ? "Address or area where your venue is located."
                : "Your preferred location (e.g. city or region)."}
            </p>
            <div className="mt-4">
              <label htmlFor="location" className="block text-sm font-medium text-foreground">
                {isVenue ? "Venue address" : "Location"}
              </label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={isVenue ? "123 High Street, Sydney NSW" : "Sydney, NSW"}
              />
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {isVenue ? "Payout account" : "Payment method"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isVenue
                ? "Connect a Stripe account to receive payments from freelancers."
                : "Payment is handled securely via Stripe when you confirm a booking."}
            </p>

            {isVenue ? (
              <div className="mt-4">
                {stripeStatusLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Checking Stripe status…
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          stripeOnboarded
                            ? "bg-success/15 text-success"
                            : stripeHasAccount
                            ? "bg-warning/15 text-warning"
                            : "bg-muted/30 text-muted"
                        }`}
                      >
                        {stripeOnboarded ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {stripeOnboarded
                            ? "Stripe payouts connected"
                            : stripeHasAccount
                            ? "Onboarding incomplete"
                            : "Not connected"}
                        </p>
                        <p className="text-sm text-muted">
                          {stripeOnboarded
                            ? "You will receive payouts automatically after bookings are paid."
                            : stripeHasAccount
                            ? "Complete your Stripe setup to receive payments."
                            : "Connect Stripe to receive payments from freelancers."}
                        </p>
                      </div>
                    </div>
                    {!stripeOnboarded && (
                      <button
                        type="button"
                        onClick={handleStripeConnect}
                        disabled={stripeLoading}
                        className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        {stripeLoading
                          ? "Redirecting…"
                          : stripeHasAccount
                          ? "Continue setup"
                          : "Connect with Stripe"}
                      </button>
                    )}
                  </div>
                )}
                {stripeError && (
                  <p className="mt-3 text-sm text-destructive">{stripeError}</p>
                )}
                <p className="mt-3 text-xs text-muted">
                  Powered by Stripe Connect. Your payout details are managed securely by Stripe.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/30 text-muted">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-sm text-muted">
                  You will be prompted to pay via Stripe Checkout when a venue approves your booking.
                  No card details are stored on our servers.
                </p>
              </div>
            )}
          </section>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            >
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </form>

        {/* ── Verifications ─────────────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Verifications</h2>
              <p className="mt-1 text-sm text-muted">
                Verified accounts appear more trustworthy to{" "}
                {isVenue ? "freelancers" : "venues"} and unlock higher trust tiers.
              </p>
            </div>
            {verifyLoading && (
              <div className="mt-1 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
            )}
          </div>

          <div className="mt-6 space-y-6">

            {/* ── ABN verification ──────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    abnVerified ? "bg-success/15 text-success" : "bg-muted/30 text-muted"
                  }`}>
                    {abnVerified ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">ABN Verification</p>
                    <p className="text-sm text-muted">
                      {abnVerified
                        ? "Your Australian Business Number has been verified."
                        : "Verify your ABN to confirm your business identity."}
                    </p>
                  </div>
                </div>
                {!abnVerified && !verifyLoading && (
                  <button
                    type="button"
                    onClick={() => { setAbnOpen((v) => !v); setAbnResult(null); }}
                    className="shrink-0 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    {abnOpen ? "Cancel" : "Add ABN"}
                  </button>
                )}
              </div>

              {/* ABN input form */}
              {!abnVerified && abnOpen && (
                <div className="mt-5 border-t border-border pt-5">
                  {/* Context callout */}
                  <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted leading-relaxed">
                    <p>
                      <span className="font-medium text-foreground">How name matching works: </span>
                      We look up your ABN on the Australian Business Register and check that the
                      registered entity name matches either:
                    </p>
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      <li>
                        Your <span className="font-medium text-foreground">account name</span>{" "}
                        from Google or Facebook{user?.name ? ` ("${user.name}")` : ""} — for sole traders.
                      </li>
                      <li>
                        Your <span className="font-medium text-foreground">display name</span>{" "}
                        set above{form?.displayName ? ` ("${form.displayName}")` : ""} — for registered businesses.
                      </li>
                    </ul>
                    <p className="mt-2">
                      If your ABN is registered under a business name, make sure your display name
                      above exactly matches the name on your ABR registration before submitting.
                    </p>
                  </div>

                  <form onSubmit={handleAbnSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="abnInput" className="block text-sm font-medium text-foreground">
                        Australian Business Number (ABN)
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          ref={abnInputRef}
                          id="abnInput"
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 51 824 753 556"
                          value={abnInput}
                          onChange={(e) => { setAbnInput(e.target.value); setAbnResult(null); }}
                          maxLength={14}
                          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="submit"
                          disabled={abnSubmitting || abnInput.replace(/[\s-]/g, "").length < 11}
                          className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
                        >
                          {abnSubmitting ? "Checking…" : "Verify"}
                        </button>
                      </div>
                    </div>
                    {abnResult && (
                      <p className={`text-sm leading-snug ${abnResult.ok ? "text-success" : "text-destructive"}`}>
                        {abnResult.message}
                      </p>
                    )}
                  </form>
                </div>
              )}

              {/* Success confirmation after verify */}
              {abnResult?.ok && abnVerified && (
                <p className="mt-3 text-sm text-success">{abnResult.message}</p>
              )}
            </div>

            {/* ── ID verification ───────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    idVerified ? "bg-success/15 text-success" : "bg-muted/30 text-muted"
                  }`}>
                    {idVerified ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Identity (ID) Verification</p>
                    <p className="text-sm text-muted">
                      {idVerified
                        ? "Your government-issued ID has been verified."
                        : "Confirm your identity with a government-issued ID via Stripe."}
                    </p>
                  </div>
                </div>
                {!idVerified && !verifyLoading && (
                  <button
                    type="button"
                    onClick={handleIdVerify}
                    disabled={idSubmitting}
                    className="shrink-0 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {idSubmitting ? "Starting…" : "Verify ID"}
                  </button>
                )}
              </div>
              {idMessage && (
                <p className="mt-3 text-sm text-muted leading-relaxed">{idMessage}</p>
              )}
            </div>

          </div>
        </section>

        <div className="pb-8" />
      </div>
    </div>
  );
}
