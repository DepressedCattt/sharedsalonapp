"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const { user, profile, updateProfile } = useAuth();
  const [form, setForm] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm(getDefaultProfile({ name: user.name, email: user.email }, profile));
  }, [user, profile]);

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
                  placeholder="+44 7XXX XXXXXX"
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
                placeholder={isVenue ? "123 High Street, London" : "London, UK"}
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
                ? "Connect an account to receive payments from freelancers."
                : "Add a payment method for chair rentals."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    form.paymentAccount.connected
                      ? "bg-success/15 text-success"
                      : "bg-muted/30 text-muted"
                  }`}
                >
                  {form.paymentAccount.connected ? (
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
                    {form.paymentAccount.connected
                      ? (form.paymentAccount.label ?? "Connected")
                      : "Not connected"}
                  </p>
                  <p className="text-sm text-muted">
                    {form.paymentAccount.connected
                      ? "You can change this in a future update."
                      : "Connect to enable payments."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleChange("paymentAccount", {
                    connected: !form.paymentAccount.connected,
                    label: form.paymentAccount.connected ? undefined : "•••• 4242",
                  })
                }
                className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {form.paymentAccount.connected ? "Disconnect" : "Connect (demo)"}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Full payment integration (e.g. Stripe) can be added later.
            </p>
          </section>

          <div className="flex items-center justify-between gap-4 pb-8">
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
      </div>
    </div>
  );
}
