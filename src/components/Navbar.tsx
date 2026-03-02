"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
  const { user, profile, setRole, unreadTotal } = useAuth();
  const displayName = profile?.displayName ?? user?.name ?? "User";
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSignOutConfirm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const otherRole: UserRole = user?.role === "venue" ? "renter" : "venue";

  const handleSwitchAccount = async () => {
    await setRole(otherRole);
    setMenuOpen(false);
    router.push(otherRole === "venue" ? "/dashboard" : "/listings");
  };

  const handleSignOut = () => {
    setSignOutConfirm(false);
    setMenuOpen(false);
    signOut({ callbackUrl: "/" });
  };

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
                    href="/venue-profile"
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    Venue Profile
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
                    My Requests
                  </Link>
                  <Link
                    href="/freelancer-profile"
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    Profile
                  </Link>
                </>
              )}

              <Link
                href="/messages"
                className="relative text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Messages
                {unreadTotal > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {unreadTotal}
                  </span>
                )}
              </Link>

              <Link
                href="/settings"
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Settings
              </Link>

              {/* User menu (avatar + dropdown) */}
              <div className="relative ml-2 pl-2 border-l border-border" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setSignOutConfirm(false);
                    setMenuOpen((o) => !o);
                  }}
                  className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {displayName.charAt(0)}
                    </div>
                  )}
                  <svg
                    className={`h-4 w-4 text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1 shadow-lg">
                    {signOutConfirm ? (
                      <>
                        <p className="px-4 py-2 text-sm text-muted">
                          Sign out of Shared Salon?
                        </p>
                        <div className="flex gap-2 px-4 py-2">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex-1 rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 cursor-pointer"
                          >
                            Sign out
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignOutConfirm(false)}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/30 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSwitchAccount}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted/30 cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </span>
                          Switch to {otherRole === "venue" ? "Venue" : "Freelancer"} account
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignOutConfirm(true)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/10 cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </span>
                          Sign out
                        </button>
                      </>
                    )}
                  </div>
                )}
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
