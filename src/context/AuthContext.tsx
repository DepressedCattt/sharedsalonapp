"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { User, UserRole, Listing, BookingRequest } from "@/lib/types";
import {
  mockUsers,
  mockListings as initialListings,
  mockBookingRequests as initialBookings,
} from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  listings: Listing[];
  bookingRequests: BookingRequest[];
  login: (role: UserRole) => void;
  logout: () => void;
  addListing: (listing: Omit<Listing, "id" | "venueId" | "venueName" | "createdAt" | "rating">) => void;
  addBookingRequest: (
    request: Omit<BookingRequest, "id" | "renterId" | "renterName" | "status" | "createdAt">
  ) => void;
  updateBookingStatus: (bookingId: string, status: "approved" | "declined") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(initialBookings);

  const login = useCallback((role: UserRole) => {
    // Fake auth: pick the first user that matches the role
    const matchedUser = mockUsers.find((u) => u.role === role);
    if (matchedUser) {
      setUser(matchedUser);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const addListing = useCallback(
    (listing: Omit<Listing, "id" | "venueId" | "venueName" | "createdAt" | "rating">) => {
      if (!user || user.role !== "venue") return;
      const newListing: Listing = {
        ...listing,
        id: `listing-${Date.now()}`,
        venueId: user.id,
        venueName: user.name,
        rating: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setListings((prev) => [newListing, ...prev]);
    },
    [user]
  );

  const addBookingRequest = useCallback(
    (
      request: Omit<BookingRequest, "id" | "renterId" | "renterName" | "status" | "createdAt">
    ) => {
      if (!user || user.role !== "renter") return;
      const newRequest: BookingRequest = {
        ...request,
        id: `booking-${Date.now()}`,
        renterId: user.id,
        renterName: user.name,
        status: "pending",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setBookingRequests((prev) => [newRequest, ...prev]);
    },
    [user]
  );

  const updateBookingStatus = useCallback(
    (bookingId: string, status: "approved" | "declined") => {
      setBookingRequests((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        listings,
        bookingRequests,
        login,
        logout,
        addListing,
        addBookingRequest,
        updateBookingStatus,
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
