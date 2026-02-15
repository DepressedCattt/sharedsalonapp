// Core entity types for Shared Salon MVP

export type UserRole = "venue" | "renter";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  verified: boolean;
  avatarUrl?: string;
}

export type PriceType = "flat" | "commission" | "hybrid";

export interface Listing {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  description: string;
  priceType: PriceType;
  price: number;
  location: string;
  availability: string;
  equipmentIncluded: string[];
  imageUrl: string;
  rating: number;
  createdAt: string;
}

export type BookingStatus = "pending" | "approved" | "declined";

export interface BookingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  renterId: string;
  renterName: string;
  renterAvatarUrl?: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  createdAt: string;
}
