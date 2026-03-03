"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import {
  User,
  UserRole,
  UserProfile,
  Listing,
  BookingRequest,
  Conversation,
  BookingType,
} from "@/lib/types";
import { fetchWithRetry } from "@/lib/fetchRetry";

const PROFILE_STORAGE_KEY = "sharedsalon_profile";
const LISTINGS_STORAGE_KEY = "sharedsalon_listings";
const BOOKING_REQUESTS_STORAGE_KEY = "sharedsalon_booking_requests";

function loadProfile(userId: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY}_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function saveProfile(userId: string, profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${PROFILE_STORAGE_KEY}_${userId}`,
      JSON.stringify(profile)
    );
  } catch {
    // ignore
  }
}

function loadListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Listing[];
  } catch {
    return [];
  }
}

function saveListings(listings: Listing[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings));
  } catch {
    // ignore
  }
}

function loadBookingRequests(): BookingRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKING_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BookingRequest[];
  } catch {
    return [];
  }
}

function saveBookingRequests(requests: BookingRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      BOOKING_REQUESTS_STORAGE_KEY,
      JSON.stringify(requests)
    );
  } catch {
    // ignore
  }
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setRole: (role: UserRole) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => void;
  listings: Listing[];
  bookingRequests: BookingRequest[];
  refreshBookings: () => Promise<void>;
  addListing: (
    listing: Omit<Listing, "id" | "venueId" | "venueName" | "createdAt" | "rating">
  ) => Promise<void>;
  updateListing: (listingId: string, data: Partial<Omit<Listing, "id" | "venueId" | "venueName" | "createdAt" | "rating">>) => Promise<void>;
  removeListing: (listingId: string) => void;
  addBookingRequest: (
    request: Omit<
      BookingRequest,
      "id" | "renterId" | "renterName" | "venueId" | "venueName" | "price" | "priceType" | "status" | "createdAt" | "houseRulesAccepted" | "bookingType"
    > & { houseRulesAccepted?: boolean; bookingType?: BookingRequest["bookingType"] }
  ) => void;
  updateBookingStatus: (
    bookingId: string,
    status: "approved" | "declined" | "completed"
  ) => void;
  conversations: Conversation[];
  unreadTotal: number;
  refreshConversations: () => Promise<void>;
  startConversation: (opts: {
    participantId: string;
    participantName: string;
    participantAvatarUrl?: string;
    listingId?: string;
    listingTitle?: string;
  }) => Promise<Conversation | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  // Always start with empty arrays so server and client first render match (avoids hydration error).
  // Rehydrate from localStorage in useEffect (client-only) after mount.
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Load listings and bookings: try API first (MongoDB), fall back to localStorage
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [listRes, bookRes] = await Promise.all([
          fetchWithRetry("/api/listings"),
          fetchWithRetry("/api/bookings"),
        ]);
        if (cancelled) return;
        if (listRes.ok && bookRes.ok) {
          const [listData, bookData] = await Promise.all([
            listRes.json(),
            bookRes.json(),
          ]);
          if (!cancelled) {
            setListings(Array.isArray(listData) ? listData : []);
            setBookingRequests(Array.isArray(bookData) ? bookData : []);
          }
          return;
        }
      } catch {
        // ignore
      }
      if (!cancelled) {
        setListings(loadListings());
        setBookingRequests(loadBookingRequests());
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const user = useMemo<User | null>(() => {
    if (status !== "authenticated" || !session?.user?.role) return null;
    const id = session.user.id;
    const role = session.user.role as UserRole;
    const accountId = `${id}_${role}`;
    return {
      id,
      role,
      accountId,
      name: session.user.name ?? "User",
      email: session.user.email ?? "",
      verified: true,
      avatarUrl: session.user.image ?? undefined,
    };
  }, [session, status]);

  // Load profile: try API (MongoDB) first so display name is always current,
  // fall back to localStorage if the DB isn't available.
  useEffect(() => {
    if (!user?.accountId) {
      setProfileState(null);
      return;
    }
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { displayName?: string; email?: string; phone?: string; location?: string } | null) => {
        if (cancelled) return;
        if (data) {
          const merged: UserProfile = {
            displayName: data.displayName || user.name,
            email: data.email || user.email,
            phone: data.phone ?? "",
            location: data.location ?? "",
            paymentAccount: loadProfile(user.accountId)?.paymentAccount ?? { connected: false },
          };
          setProfileState(merged);
          saveProfile(user.accountId, merged);
        } else {
          setProfileState(loadProfile(user.accountId) ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setProfileState(loadProfile(user.accountId) ?? null);
      });
    return () => { cancelled = true; };
  }, [user?.accountId, user?.name, user?.email]);

  const isLoading = status === "loading";

  const setRole = useCallback(
    async (role: UserRole) => {
      await update({ role });
    },
    [update]
  );

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      if (!user?.accountId) return;
      setProfileState((prev) => {
        const next: UserProfile = {
          displayName: partial.displayName ?? prev?.displayName ?? user.name,
          email: partial.email ?? prev?.email ?? user.email,
          phone: partial.phone ?? prev?.phone ?? "",
          location: partial.location ?? prev?.location ?? "",
          paymentAccount:
            partial.paymentAccount ?? prev?.paymentAccount ?? {
              connected: false,
            },
        };
        saveProfile(user.accountId, next);
        // Persist to DB so server-side code (e.g. ABN verification) sees
        // the latest display name rather than stale or empty data.
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: next.displayName,
            email: next.email,
            phone: next.phone,
            location: next.location,
          }),
        }).catch(() => { /* localStorage copy is the fallback */ });
        return next;
      });
    },
    [user]
  );

  const addListing = useCallback(
    async (
      listing: Omit<
        Listing,
        "id" | "venueId" | "venueName" | "createdAt" | "rating"
      >
    ) => {
      if (!user || user.role !== "venue") return;
      try {
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...listing,
            media: listing.media ?? [],
            availability: listing.availability ?? [],
            equipmentIncluded: listing.equipmentIncluded ?? [],
            houseRules: listing.houseRules ?? [],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setListings((prev) => [data, ...prev]);
          return;
        }
      } catch {
        // fall through to localStorage fallback
      }
      const displayName = profile?.displayName ?? user.name;
      const newListing: Listing = {
        ...listing,
        media: listing.media ?? [],
        id: `listing-${Date.now()}`,
        venueId: user.accountId,
        venueName: displayName,
        rating: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setListings((prev) => {
        const next = [newListing, ...prev];
        saveListings(next);
        return next;
      });
    },
    [user, profile?.displayName]
  );

  const updateListing = useCallback(
    async (
      listingId: string,
      data: Partial<Omit<Listing, "id" | "venueId" | "venueName" | "createdAt" | "rating">>
    ) => {
      if (!user || user.role !== "venue") return;
      try {
        const res = await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setListings((prev) =>
            prev.map((l) => {
              if (l.id !== listingId) return l;
              const raw = updated.createdAt;
              let createdAt: string;
              if (typeof raw === "string") {
                createdAt = raw.includes("T") ? raw.split("T")[0] : raw;
              } else {
                createdAt = l.createdAt;
              }
              return {
                ...l,
                ...data,
                id: listingId,
                createdAt,
              };
            })
          );
          return;
        }
      } catch {
        // fall through to localStorage fallback
      }
      setListings((prev) => {
        const next = prev.map((l) =>
          l.id === listingId ? { ...l, ...data } : l
        );
        saveListings(next);
        return next;
      });
    },
    [user]
  );

  const removeListing = useCallback(
    async (listingId: string) => {
      if (!user || user.role !== "venue") return;
      setListings((prev) => {
        const listing = prev.find((l) => l.id === listingId);
        if (!listing || listing.venueId !== user.accountId) return prev;
        const next = prev.filter((l) => l.id !== listingId);
        fetch(`/api/listings/${listingId}`, { method: "DELETE" }).then(
          (res) => {
            if (!res.ok) saveListings(next);
          }
        ).catch(() => saveListings(next));
        return next;
      });
    },
    [user]
  );

  const addBookingRequest = useCallback(
    async (
      request: Omit<
        BookingRequest,
        "id" | "renterId" | "renterName" | "venueId" | "venueName" | "price" | "priceType" | "status" | "createdAt" | "houseRulesAccepted" | "bookingType"
      > & { houseRulesAccepted?: boolean; bookingType?: BookingType }
    ) => {
      if (!user || user.role !== "renter") return;
      const listing = listings.find((l) => l.id === request.listingId);
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: request.listingId,
            listingTitle: request.listingTitle,
            startDate: request.startDate ?? "",
            endDate: request.endDate ?? "",
            houseRulesAccepted: request.houseRulesAccepted ?? false,
            bookingType: request.bookingType ?? "date_range",
            recurringSlot: request.recurringSlot ?? null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBookingRequests((prev) => [data, ...prev]);
          return;
        }
      } catch {
        // fall through to localStorage fallback
      }
      const displayName = profile?.displayName ?? user.name;
      const newRequest: BookingRequest = {
        ...request,
        id: `booking-${Date.now()}`,
        venueId: listing?.venueId ?? "",
        venueName: listing?.venueName ?? "",
        renterId: user.accountId,
        renterName: displayName,
        price: listing?.price ?? 0,
        priceType: listing?.priceType ?? "daily",
        houseRulesAccepted: request.houseRulesAccepted ?? false,
        bookingType: request.bookingType ?? "date_range",
        status: "pending",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setBookingRequests((prev) => {
        const next = [newRequest, ...prev];
        saveBookingRequests(next);
        return next;
      });
    },
    [user, profile?.displayName, listings]
  );

  const refreshBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBookingRequests(data);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const updateBookingStatus = useCallback(
    async (bookingId: string, status: "approved" | "declined" | "completed") => {
      setBookingRequests((prev) => {
        const next = prev.map((b) =>
          b.id === bookingId ? { ...b, status } : b
        );
        fetch(`/api/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }).then((res) => {
          if (!res.ok) saveBookingRequests(next);
        }).catch(() => saveBookingRequests(next));
        return next;
      });
    },
    []
  );

  // ── Conversations ────────────────────────────────────────

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetchWithRetry("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently ignore — conversations require DB
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      refreshConversations();
    }
  }, [status, refreshConversations]);

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  const startConversation = useCallback(
    async (opts: {
      participantId: string;
      participantName: string;
      participantAvatarUrl?: string;
      listingId?: string;
      listingTitle?: string;
    }): Promise<Conversation | null> => {
      if (!user) return null;
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts),
        });
        if (res.ok) {
          const conv: Conversation = await res.json();
          setConversations((prev) => {
            if (prev.some((c) => c.id === conv.id)) return prev;
            return [conv, ...prev];
          });
          return conv;
        }
      } catch {
        // ignore
      }
      return null;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        setRole,
        updateProfile,
        listings,
        bookingRequests,
        refreshBookings,
        addListing,
        updateListing,
        removeListing,
        addBookingRequest,
        updateBookingStatus,
        conversations,
        unreadTotal,
        refreshConversations,
        startConversation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
