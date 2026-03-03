// Core entity types for Shared Salon MVP

export type UserRole = "venue" | "renter";

export interface User {
  /** Auth identity (e.g. Google sub) — same for both venue and freelancer. */
  id: string;
  /** Current account role; one email can have both venue and freelancer. */
  role: UserRole;
  /** Unique ID for this account type (id_role). Use for DB/listings/bookings. */
  accountId: string;
  name: string;
  email: string;
  verified: boolean;
  avatarUrl?: string;
}

/** Editable profile/settings for both venue and renter (stored per account). */
export interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  /** Address or location text (e.g. "Sydney, NSW" or full address). */
  location: string;
  /** Venue: payout account; Renter: payment method. */
  paymentAccount: {
    connected: boolean;
    /** Optional label, e.g. "•••• 4242" or "Stripe Connected". */
    label?: string;
  };
}

/** How the listing is priced; renters choose number of days (or weeks) when booking. */
export type PriceType = "daily" | "weekly" | "commission" | "hybrid";

/** Whether the listing is a one-time post or a permanent always-on recurring rental. */
export type ListingMode = "one_off" | "recurring";

/** One recurring slot: available on this day of week (0=Mon … 6=Sun) from start to end (HH:mm). */
export interface AvailabilitySlot {
  day: number;
  start: string;
  end: string;
}

export type ListingMediaType = "image" | "video";

export interface ListingMediaItem {
  url: string;
  type: ListingMediaType;
}

export interface Listing {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  description: string;
  priceType: PriceType;
  price: number;
  /** Display address (e.g. from Google Places). Must be a real address for map display. */
  location: string;
  /** Latitude from Places/Geocoding — used to show the listing on a map. */
  latitude?: number;
  /** Longitude from Places/Geocoding — used to show the listing on a map. */
  longitude?: number;
  /** Recurring weekly slots (e.g. Mon 9am–5pm). */
  availability: AvailabilitySlot[];
  equipmentIncluded: string[];
  /** Photos and videos; shown in a carousel. */
  media: ListingMediaItem[];
  /** Venue-defined house rules and instructions freelancers must accept before booking. */
  houseRules: string[];
  rating: number;
  /** Per-criterion averages computed from all submitted reviews. */
  ratingBreakdown?: {
    cleanliness: number;
    accuracy: number;
    communication: number;
    count: number;
  };
  /** Whether this listing is one-off or always-on recurring. Defaults to "one_off". */
  listingMode: ListingMode;
  /** For recurring listings: max simultaneous freelancers accepted per slot. */
  slotCapacity: number;
  createdAt: string;
}

export type BookingStatus = "pending" | "approved" | "declined" | "completed";

export type PaymentStatus = "unpaid" | "pending_payment" | "paid" | "refunded";

/** Whether the freelancer applied for a specific date range or a recurring weekly slot. */
export type BookingType = "date_range" | "recurring_slot";

export interface BookingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  /** Venue account ID that owns the listing. */
  venueId: string;
  venueName: string;
  renterId: string;
  renterName: string;
  renterAvatarUrl?: string;
  startDate: string;
  endDate: string;
  /** Price at time of booking (snapshot from listing). */
  price: number;
  priceType: PriceType;
  /** Whether the renter accepted the venue's house rules before booking. */
  houseRulesAccepted: boolean;
  status: BookingStatus;
  /** True once the renter has submitted a review for this booking. */
  reviewSubmitted?: boolean;
  /** True once the current user has submitted a TrustReview for this booking. */
  trustReviewSubmitted?: boolean;
  /** Timestamp of cancellation, if applicable. */
  cancelledAt?: string;
  /** Which party cancelled the booking. */
  cancelledBy?: "venue" | "renter";
  /** Whether this is a one-time date-range booking or a recurring weekly slot. */
  bookingType: BookingType;
  /** For recurring_slot bookings: the specific weekly slot the freelancer applied for. */
  recurringSlot?: AvailabilitySlot;
  /** Stripe payment lifecycle status. */
  paymentStatus?: PaymentStatus;
  /** Stripe Checkout Session ID associated with this booking. */
  stripeCheckoutSessionId?: string;
  /** Total charged amount in AUD cents (price × duration). */
  totalAmount?: number;
  createdAt: string;
}

// ── Messaging ──────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface ConversationParticipant {
  accountId: string;
  name: string;
  avatarUrl?: string;
  lastReadAt: string;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  listingId?: string;
  listingTitle?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ── Venue Profile ──────────────────────────────────────────

export interface VenueProfile {
  id?: string;
  /** Matches User.accountId for venue accounts (e.g. "userId_venue"). */
  venueId: string;
  displayName: string;
  bio: string;
  location: string;
  latitude?: number;
  longitude?: number;
  /** Shared photo library — /uploads/... URLs reusable across listings. */
  photos: string[];
  /** URL of the photo used as the hero banner on the public profile. */
  bannerPhoto?: string | null;
  /** URL of the photo used as the venue avatar. */
  profilePhoto?: string | null;
  /** Types of work the venue accommodates (e.g. "Hair", "Nails"). */
  specialties: string[];
  /** House rules / booth policies shown on the public profile. */
  boothPolicies: string[];
  /** Whether to surface booking reviews on the public profile. */
  showReviews: boolean;
  website?: string;
  instagram?: string;
  /** Stripe Express connected account ID (acct_...). Set after onboarding initiated. */
  stripeConnectAccountId?: string | null;
  /** True once the venue has completed Stripe Express onboarding. */
  stripeConnectOnboarded?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FreelancerProfile {
  id?: string;
  /** Matches User.accountId for renter accounts (e.g. "userId_renter"). */
  renterId: string;
  displayName: string;
  bio: string;
  /** Portfolio / headshot photos. */
  photos: string[];
  /** URL of the photo used as the freelancer's avatar. */
  profilePhoto?: string | null;
  /** URL of the photo used as the hero banner. */
  bannerPhoto?: string | null;
  /** Types of work the freelancer specialises in (e.g. "Hair", "Nails"). */
  specialties: string[];
  /** Whether to surface booking reviews on the public profile. */
  showReviews: boolean;
  website?: string;
  instagram?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Reviews ────────────────────────────────────────────────

/** Individual criterion scores, each on a 1–10 scale. */
export interface ReviewScores {
  /** Cleanliness of the space on arrival. */
  cleanliness: number;
  /** How well the space matched the listing (photos, equipment, description). */
  accuracy: number;
  /** Responsiveness and helpfulness of the venue host. */
  communication: number;
}

export interface Review {
  id: string;
  /** One review per booking — enforced at the DB level. */
  bookingId: string;
  listingId: string;
  venueId: string;
  renterId: string;
  renterName: string;
  renterAvatarUrl?: string;
  scores: ReviewScores;
  /** Optional written comment from the freelancer. */
  comment?: string;
  createdAt: string;
}

// ── Trust System ────────────────────────────────────────────

export type TrustTier =
  | "fresh"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "trailblazer";

export interface RenterTrustMetrics {
  reliabilityScore: number;
  professionalismScore: number;
  cleanlinessScore: number;
  responsivenessScore: number;
  totalCompleted: number;
  totalCancelled: number;
  disputeCount: number;
}

export interface VenueTrustMetrics {
  fairnessScore: number;
  satisfactionScore: number;
  paymentScore: number;
  activeFreelancers: number;
  totalCompleted: number;
  disputeCount: number;
}

export interface TrustProfile {
  id?: string;
  accountId: string;
  role: UserRole;
  tier: TrustTier;
  foundingVerified: boolean;
  trustScore: number;
  pendingTrustScore?: number;
  renterMetrics?: RenterTrustMetrics;
  venueMetrics?: VenueTrustMetrics;
  lastCalculatedAt?: string;
  /** ABN (Australian Business Number) verification */
  abnVerified?: boolean;
  abnNumber?: string;
  abnVerifiedAt?: string;
  /** "auth_name" = matched against OAuth identity (stronger); "display_name" = matched against business display name */
  abnMatchType?: "auth_name" | "display_name";
  /** Government ID verification via Stripe Identity */
  idVerified?: boolean;
  idVerifiedAt?: string;
  stripeVerificationSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ArrivalStatus = "on_time" | "late" | "no_show";

export type TrustIssueFlag =
  | "late_cancellation"
  | "no_show"
  | "damage"
  | "unprofessional"
  | "rules_violation"
  | "listing_inaccurate"
  | "rules_changed"
  | "poor_communication"
  | "venue_cleanliness"
  | "payment_issue"
  | "other";

export interface TrustDimensionRatings {
  arrivalStatus?: ArrivalStatus;
  professionalism?: number;
  cleanliness?: number;
  communication?: number;
  accuracy?: number;
  fairness?: number;
}

export interface TrustReview {
  id: string;
  bookingId: string;
  reviewerAccountId: string;
  reviewerRole: UserRole;
  revieweeAccountId: string;
  quickRating: number;
  dimensionRatings?: TrustDimensionRatings;
  wouldBookAgain?: boolean;
  issueFlags: TrustIssueFlag[];
  isPublished: boolean;
  publishAfter: string;
  submittedAt: string;
  createdAt: string;
}
