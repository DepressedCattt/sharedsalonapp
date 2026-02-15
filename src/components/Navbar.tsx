"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            SS
          </div>
          <span className="text-lg font-semibold text-foreground">
            Shared Salon
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role badge */}
              <span className="hidden rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark capitalize sm:inline-block">
                {user.role}
              </span>

              {/* Nav links based on role */}
              {user.role === "venue" ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    My Listings
                  </Link>
                  <Link
                    href="/create"
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    New Listing
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/listings"
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    Listings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    My Booking Requests
                  </Link>
                </>
              )}

              {/* User avatar / logout */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-muted transition-colors hover:text-danger cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
