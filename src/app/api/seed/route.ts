import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ListingModel } from "@/models/Listing";
import { VenueProfileModel } from "@/models/VenueProfile";
import { BookingRequestModel } from "@/models/BookingRequest";
import { ConversationModel } from "@/models/Conversation";
import { TrustProfileModel } from "@/models/TrustProfile";
import { ReviewModel } from "@/models/Review";

/* ─── Constants ─────────────────────────────────────────── */
const SEED_PREFIX = "seed_";

/* ─── Unsplash photo helpers ─────────────────────────────── */
function img(id: string, w = 1200, h = 800) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

/* ─── Venue fixture data ─────────────────────────────────── */
const VENUES = [
  {
    id: "seed_v1_venue",
    name: "The Style Collective",
    bio: "An award-winning creative space in the heart of Paddington, Sydney. The Style Collective brings together the city's most talented independent stylists under one beautifully designed roof. With 8 premium styling stations, a dedicated colour bar, and on-site laundry, everything you need to deliver a world-class client experience is waiting for you.",
    location: "Oxford St, Paddington NSW 2021, Australia",
    lat: -33.8843, lng: 151.2263,
    specialties: ["Hair Colouring", "Balayage", "Wedding Styling", "Keratin Treatments", "Cuts & Blowdries"],
    boothPolicies: [
      "Maintain a clean, product-free workstation at the close of every day",
      "No strong fragrances in shared colour areas",
      "Advance booking only — no walk-ins accepted during peak season (Nov–Jan)",
    ],
    photos: [
      img("1560066984-138daefb34b"),
      img("1522337360826-f44e3ee4b1b2"),
      img("1570172619644-dfd03ed5d881"),
      img("1516975080664-ed2fc6a32937"),
    ],
    instagram: "@thestylecollective",
    website: "https://thestylecollective.com.au",
  },
  {
    id: "seed_v2_venue",
    name: "Luxe Beauty Studio",
    bio: "A sun-drenched beauty haven perched above Bondi Beach. Luxe Beauty Studio is a boutique multi-discipline space known for its relaxed yet professional atmosphere. Lash artists, brow specialists, and hair stylists thrive here in our naturally lit, Scandi-inspired studio.",
    location: "Curlewis St, Bondi Beach NSW 2026, Australia",
    lat: -33.8909, lng: 151.2744,
    specialties: ["Lash Extensions", "Brow Lamination", "HD Brows", "Hair Styling", "Skin Treatments"],
    boothPolicies: [
      "Gloves and eye protection required for all lash and brow procedures",
      "Written client consultations are mandatory for first-time visits",
      "All tools must be sterilised between clients — audit checks weekly",
    ],
    photos: [
      img("1522337360826-f44e3ee4b1b2"),
      img("1521590832167-7bcbfaa6381f"),
      img("1560066984-138daefb34b"),
      img("1570172619644-dfd03ed5d881"),
    ],
    instagram: "@luxebeautystudio",
    website: "https://luxebeauty.com.au",
  },
  {
    id: "seed_v3_venue",
    name: "The Barber Quarter",
    bio: "Fitzroy's most sought-after barbershop collective on iconic Smith Street. Heritage mirrors, vintage barber chairs, and a craft beer fridge — The Barber Quarter is where old-school craft meets modern business. We have 6 stations available for freelance barbers who want the space, the vibe, and the walk-in traffic.",
    location: "Smith St, Fitzroy VIC 3065, Australia",
    lat: -37.7985, lng: 144.9778,
    specialties: ["Classic Cuts", "Fades & Tapers", "Beard Grooming", "Hot Towel Shaves", "Men's Colouring"],
    boothPolicies: [
      "Maintain the classic barber aesthetic — no neon signs or digital displays",
      "Tips remain with the individual barber",
      "Smart-casual dress code — house barbering aprons provided",
    ],
    photos: [
      img("1562322140-8bef6a1218dc"),
      img("1503951914875-452162b0f3f1"),
      img("1599351431202-1e0f0137899a"),
      img("1560066984-138daefb34b"),
    ],
    instagram: "@thebarberquarter",
    website: "https://thebarberquarter.com.au",
  },
  {
    id: "seed_v4_venue",
    name: "Glow Nail Lounge",
    bio: "Surry Hills' most Instagrammable nail destination. Glow Nail Lounge is a vibrant, plant-filled studio where nail artists and lash techs create serious art. Our open-plan layout fosters collaboration and our regular clientele includes influencers, creatives, and professionals who expect the best.",
    location: "Crown St, Surry Hills NSW 2010, Australia",
    lat: -33.8881, lng: 151.2075,
    specialties: ["Gel Nails", "Nail Art", "Lash Extensions", "Threading & Tinting", "Waxing"],
    boothPolicies: [
      "All gel and acrylic products must be pre-approved by management",
      "Approved ventilation mask required for all acrylic applications",
      "Minimum client booking duration of 45 minutes per station",
    ],
    photos: [
      img("1604654894610-df63bc536371"),
      img("1605497788044-5a32c7078486"),
      img("1519014816548-bf5fe059798b"),
      img("1522337360826-f44e3ee4b1b2"),
    ],
    instagram: "@glownaillounge",
    website: "https://glownaillounge.com.au",
  },
  {
    id: "seed_v5_venue",
    name: "Prestige Salon Suites",
    bio: "Melbourne CBD's premier private salon suite destination, located in a heritage Collins Street building. Each lockable, fully-equipped suite gives you the freedom to run your business exactly how you want — with the prestige of a city-centre address and shared reception, front-of-house staff, and premium waiting lounge.",
    location: "Collins St, Melbourne VIC 3000, Australia",
    lat: -37.8136, lng: 144.9631,
    specialties: ["Balayage & Highlights", "Brazilian Blowout", "Makeup Artistry", "Skin Consultations", "Extensions"],
    boothPolicies: [
      "Each suite is your own business — maintain your space accordingly",
      "Building security requires photo ID for all after-hours visitors (after 8 pm)",
      "Shared reception area must be kept clear and professional at all times",
    ],
    photos: [
      img("1470259078422-826894b933aa"),
      img("1560066984-138daefb34b"),
      img("1570172619644-dfd03ed5d881"),
      img("1521590832167-7bcbfaa6381f"),
    ],
    instagram: "@prestigesalonsuites",
    website: "https://prestigesalonsuites.com.au",
  },
];

/* ─── Listing fixture data ────────────────────────────────── */
function weekdaySlots(startH = 9, endH = 18) {
  // Mon–Fri (1–5)
  return [1, 2, 3, 4, 5].map((day) => ({
    day,
    start: `${String(startH).padStart(2, "0")}:00`,
    end: `${String(endH).padStart(2, "0")}:00`,
  }));
}

function fullWeekSlots(startH = 9, endH = 18) {
  return [1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    start: `${String(startH).padStart(2, "0")}:00`,
    end: `${String(endH).padStart(2, "0")}:00`,
  }));
}

function weekendSlots(startH = 10, endH = 17) {
  return [0, 6].map((day) => ({
    day,
    start: `${String(startH).padStart(2, "0")}:00`,
    end: `${String(endH).padStart(2, "0")}:00`,
  }));
}

const LISTINGS_DATA = [
  // ── Venue 1 ──────────────────────────────────────────────
  {
    venueId: "seed_v1_venue",
    venueName: "The Style Collective",
    title: "Premium Styling Chair — Paddington",
    description:
      "Take your craft to a new suburb. This fully-equipped premium styling station is nestled inside one of Sydney's most acclaimed shared salon spaces. You'll benefit from a constant stream of walk-in clients, high-speed Wi-Fi, complimentary product samples from our brand partners, and a professional backwash bay. The chair is available Monday–Saturday; ideal for freelance stylists looking for a flagship Sydney base without the overheads.",
    priceType: "daily",
    price: 95,
    location: "Oxford St, Paddington NSW 2021, Australia",
    latitude: -33.8843,
    longitude: 151.2263,
    listingMode: "one_off",
    slotCapacity: 1,
    availability: fullWeekSlots(9, 18),
    equipmentIncluded: [
      "Styling chair & hydraulic base",
      "Large backlit mirror",
      "Backwash basin",
      "Professional hairdryer",
      "Tong & straightener set",
      "Colour mixing station",
    ],
    houseRules: [
      "Leave your station exactly as you found it",
      "All client consultations must be documented",
      "No subletting — only the named renter may use the chair",
    ],
    media: [
      { url: img("1560066984-138daefb34b"), type: "image" },
      { url: img("1522337360826-f44e3ee4b1b2"), type: "image" },
      { url: img("1570172619644-dfd03ed5d881"), type: "image" },
    ],
    rating: 4.8,
    ratingBreakdown: { cleanliness: 9.4, accuracy: 9.6, communication: 9.7, count: 23 },
  },
  // ── Venue 2 ──────────────────────────────────────────────
  {
    venueId: "seed_v2_venue",
    venueName: "Luxe Beauty Studio",
    title: "Bridal & Occasion Suite — Bondi",
    description:
      "A dedicated, naturally lit suite perfect for wedding-day prep and special occasion styling. The room features floor-to-ceiling windows with ocean glimpses, a comfortable bridal-prep chair, full vanity setup, and dedicated parking for equipment-heavy bookings. Available from Tuesday to Sunday, this is a favourite for makeup artists and hair stylists servicing high-end weddings across the Eastern Suburbs.",
    priceType: "daily",
    price: 120,
    location: "Curlewis St, Bondi Beach NSW 2026, Australia",
    latitude: -33.8909,
    longitude: 151.2744,
    listingMode: "one_off",
    slotCapacity: 1,
    availability: [
      { day: 2, start: "10:00", end: "19:00" },
      { day: 3, start: "10:00", end: "19:00" },
      { day: 4, start: "10:00", end: "19:00" },
      { day: 5, start: "10:00", end: "19:00" },
      { day: 6, start: "09:00", end: "18:00" },
      { day: 0, start: "09:00", end: "16:00" },
    ],
    equipmentIncluded: [
      "Bridal styling chair",
      "Full vanity with Hollywood lighting",
      "Garment rail & steamer",
      "Bluetooth speaker",
      "Mini-fridge (refreshments for clients)",
      "Dedicated parking bay",
    ],
    houseRules: [
      "Any damage to the Hollywood mirror must be reported immediately",
      "No red wine or coloured beverages near the vanity",
      "Leave the mini-fridge stocked to the level you found it",
    ],
    media: [
      { url: img("1522337360826-f44e3ee4b1b2"), type: "image" },
      { url: img("1521590832167-7bcbfaa6381f"), type: "image" },
      { url: img("1516975080664-ed2fc6a32937"), type: "image" },
    ],
    rating: 4.9,
    ratingBreakdown: { cleanliness: 9.8, accuracy: 9.7, communication: 9.9, count: 17 },
  },
  // ── Venue 3 ──────────────────────────────────────────────
  {
    venueId: "seed_v3_venue",
    venueName: "The Barber Quarter",
    title: "Classic Barber Station — Fitzroy (Recurring)",
    description:
      "Secure your very own recurring slot in one of Fitzroy's busiest barbershops. The Barber Quarter sees over 400 walk-ins every week, and our recurring station deal puts you front-of-house for your chosen day and time every single week. You'll have your own lockable drawer, access to our sterilisation cabinet, hot towel station, and a loyal audience of Melbourne's creative class.",
    priceType: "daily",
    price: 80,
    location: "Smith St, Fitzroy VIC 3065, Australia",
    latitude: -37.7985,
    longitude: 144.9778,
    listingMode: "recurring",
    slotCapacity: 2,
    availability: weekdaySlots(8, 18),
    equipmentIncluded: [
      "Vintage barber chair (Koken, restored)",
      "Large barbershop mirror with shelf",
      "Hot towel cabinet",
      "Lockable personal drawer",
      "Sterilisation cabinet (shared)",
      "Barber apron (house issue)",
    ],
    houseRules: [
      "House barbering apron must be worn on the floor",
      "Clients booked from social media must still sign the in-house waiver",
      "No loud music — shared background playlist managed by house",
    ],
    media: [
      { url: img("1562322140-8bef6a1218dc"), type: "image" },
      { url: img("1503951914875-452162b0f3f1"), type: "image" },
      { url: img("1599351431202-1e0f0137899a"), type: "image" },
    ],
    rating: 4.7,
    ratingBreakdown: { cleanliness: 9.2, accuracy: 9.4, communication: 9.5, count: 31 },
  },
  // ── Venue 4 ──────────────────────────────────────────────
  {
    venueId: "seed_v4_venue",
    venueName: "Glow Nail Lounge",
    title: "Nail & Lash Station — Surry Hills",
    description:
      "A bright and vibrant nail station inside the most Instagrammable salon in Surry Hills. This station is perfect for gel nail technicians and lash artists. Our clientele is social-media savvy and regularly features the salon on their feeds — great organic exposure. Includes a dedicated UV lamp station, ergonomic client chair, and access to our shared photography lightbox for portfolio shots.",
    priceType: "daily",
    price: 75,
    location: "Crown St, Surry Hills NSW 2010, Australia",
    latitude: -33.8881,
    longitude: 151.2075,
    listingMode: "one_off",
    slotCapacity: 1,
    availability: [
      { day: 5, start: "10:00", end: "18:00" },
      { day: 6, start: "09:00", end: "18:00" },
      { day: 0, start: "10:00", end: "17:00" },
    ],
    equipmentIncluded: [
      "Manicure table with gel UV lamp",
      "Ergonomic client chair",
      "Lash bed (convertible)",
      "Shared LED lightbox for photography",
      "Magnifying lamp",
      "Product display shelf",
    ],
    houseRules: [
      "No acrylic liquid without management-approved ventilation setup",
      "Photograph your station at start and end of each booking",
      "Social media tags to @glownaillounge are appreciated but not required",
    ],
    media: [
      { url: img("1604654894610-df63bc536371"), type: "image" },
      { url: img("1605497788044-5a32c7078486"), type: "image" },
      { url: img("1519014816548-bf5fe059798b"), type: "image" },
    ],
    rating: 4.6,
    ratingBreakdown: { cleanliness: 9.0, accuracy: 9.2, communication: 9.3, count: 19 },
  },
  // ── Venue 5 ──────────────────────────────────────────────
  {
    venueId: "seed_v5_venue",
    venueName: "Prestige Salon Suites",
    title: "Private Stylist Suite — Melbourne CBD",
    description:
      "Run your business entirely on your own terms inside a fully private, lockable suite in the heart of Melbourne CBD. This is not a chair rental — it's your own space, complete with reception coverage, a dedicated waiting area for your clients, and the prestige of a Collins Street address. Ideal for established stylists and beauty professionals who want full independence without a full commercial lease.",
    priceType: "daily",
    price: 145,
    location: "Collins St, Melbourne VIC 3000, Australia",
    latitude: -37.8136,
    longitude: 144.9631,
    listingMode: "one_off",
    slotCapacity: 1,
    availability: fullWeekSlots(9, 18),
    equipmentIncluded: [
      "Fully lockable private suite (22 sqm)",
      "Adjustable hydraulic styling chair",
      "Large backlit mirror wall",
      "Shampoo bowl with plumbing",
      "Reception coverage (Mon–Fri 9am–5pm)",
      "High-speed Wi-Fi & Bluetooth speaker",
    ],
    houseRules: [
      "Suite must be locked when unoccupied — keys returned to reception on departure",
      "No subletting or sharing of the suite with another professional",
      "Music must not be audible from the corridor",
    ],
    media: [
      { url: img("1470259078422-826894b933aa"), type: "image" },
      { url: img("1560066984-138daefb34b"), type: "image" },
      { url: img("1570172619644-dfd03ed5d881"), type: "image" },
    ],
    rating: 4.9,
    ratingBreakdown: { cleanliness: 9.7, accuracy: 9.8, communication: 9.9, count: 12 },
  },
];

/* ─── Mock renter freelancers ────────────────────────────── */
const RENTERS = [
  { id: "seed_r1_renter", name: "Jessica Taylor", avatar: "https://i.pravatar.cc/150?img=47" },
  { id: "seed_r2_renter", name: "Marcus Williams", avatar: "https://i.pravatar.cc/150?img=59" },
  { id: "seed_r3_renter", name: "Emma Chen", avatar: "https://i.pravatar.cc/150?img=45" },
  { id: "seed_r4_renter", name: "Sophia Park", avatar: "https://i.pravatar.cc/150?img=44" },
  { id: "seed_r5_renter", name: "Ryan Mitchell", avatar: "https://i.pravatar.cc/150?img=56" },
];

// Trust profiles are no longer seeded with mock data.
// They are computed exclusively by the trust engine from real bookings and reviews.
// Use /admin/trust to inject test reviews and trigger profile computation.

/* ─── Helpers ─────────────────────────────────────────────── */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/* ─── DELETE  — clear seed data ───────────────────────────── */
export async function DELETE() {
  const db = await connectDB();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const venueIds = VENUES.map((v) => v.id);
  const renterIds = RENTERS.map((r) => r.id);

  await Promise.all([
    ListingModel.deleteMany({ venueId: { $in: venueIds } }),
    VenueProfileModel.deleteMany({ venueId: { $in: venueIds } }),
    TrustProfileModel.deleteMany({ accountId: { $in: [...venueIds, ...renterIds] } }),
    BookingRequestModel.deleteMany({
      $or: [{ venueId: { $in: venueIds } }, { renterId: { $in: renterIds } }],
    }),
    ReviewModel.deleteMany({ venueId: { $in: venueIds } }),
    ConversationModel.deleteMany({
      "participants.accountId": { $in: [...venueIds, ...renterIds] },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Seed data cleared." });
}

/* ─── POST  — insert seed data ───────────────────────────── */
export async function POST(request: Request) {
  const db = await connectDB();
  if (!db)
    return NextResponse.json(
      { error: "Database not configured. Set MONGODB_URI in .env.local." },
      { status: 503 }
    );

  const session = await auth();
  const currentUser = session?.user
    ? {
        id: session.user.id,
        role: session.user.role as string,
        accountId: `${session.user.id}_${session.user.role}`,
        name: (session.user as { name?: string }).name ?? "You",
        avatarUrl: (session.user as { image?: string }).image ?? undefined,
      }
    : null;

  const url = new URL(request.url);
  const reset = url.searchParams.get("reset") === "true";

  // --- Guard against double-seeding (unless reset=true) ---
  const existing = await ListingModel.findOne({ venueId: "seed_v1_venue" });
  if (existing && !reset) {
    return NextResponse.json(
      { ok: true, message: "Seed data already present. Use ?reset=true to re-seed." },
      { status: 200 }
    );
  }

  // --- Clear old seed data if resetting ---
  if (reset) {
    const venueIds = VENUES.map((v) => v.id);
    const renterIds = RENTERS.map((r) => r.id);
    await Promise.all([
      ListingModel.deleteMany({ venueId: { $in: venueIds } }),
      VenueProfileModel.deleteMany({ venueId: { $in: venueIds } }),
      TrustProfileModel.deleteMany({ accountId: { $in: [...venueIds, ...renterIds] } }),
      BookingRequestModel.deleteMany({
        $or: [{ venueId: { $in: venueIds } }, { renterId: { $in: renterIds } }],
      }),
      ReviewModel.deleteMany({ venueId: { $in: venueIds } }),
      ConversationModel.deleteMany({
        "participants.accountId": { $in: [...venueIds, ...renterIds] },
      }),
    ]);
    // Also clear user-linked seed conversations
    if (currentUser) {
      await ConversationModel.deleteMany({
        "participants.accountId": currentUser.accountId,
        listingTitle: { $regex: /^SEED:/ },
      });
    }
  }

  /* ── 1. Venue profiles ─────────────────────────────────── */
  const venueProfileDocs = await Promise.all(
    VENUES.map((v) =>
      VenueProfileModel.findOneAndUpdate(
        { venueId: v.id },
        {
          venueId: v.id,
          displayName: v.name,
          bio: v.bio,
          location: v.location,
          latitude: v.lat,
          longitude: v.lng,
          photos: v.photos,
          specialties: v.specialties,
          boothPolicies: v.boothPolicies,
          showReviews: true,
          website: v.website,
          instagram: v.instagram,
          bannerPhoto: v.photos[0],
          profilePhoto: v.photos[1] ?? v.photos[0],
        },
        { upsert: true, new: true }
      )
    )
  );

  /* ── 2. Listings ───────────────────────────────────────── */
  const listingDocs = await Promise.all(
    LISTINGS_DATA.map((l) =>
      ListingModel.findOneAndUpdate(
        { venueId: l.venueId, title: l.title },
        { ...l },
        { upsert: true, new: true }
      )
    )
  );

  /* ── 3. Booking requests ───────────────────────────────── */
  const listing1Id = listingDocs[0]._id.toString();
  const listing2Id = listingDocs[1]._id.toString();
  const listing3Id = listingDocs[2]._id.toString();
  const listing4Id = listingDocs[3]._id.toString();
  const listing5Id = listingDocs[4]._id.toString();

  const BOOKINGS = [
    // completed – v1
    {
      listingId: listing1Id, listingTitle: LISTINGS_DATA[0].title,
      venueId: "seed_v1_venue", venueName: "The Style Collective",
      renterId: RENTERS[0].id, renterName: RENTERS[0].name, renterAvatarUrl: RENTERS[0].avatar,
      startDate: daysFromNow(-55), endDate: daysFromNow(-51),
      price: 95, priceType: "daily", houseRulesAccepted: true, status: "completed",
      reviewSubmitted: true, bookingType: "date_range",
    },
    // approved (active) – v1
    {
      listingId: listing1Id, listingTitle: LISTINGS_DATA[0].title,
      venueId: "seed_v1_venue", venueName: "The Style Collective",
      renterId: RENTERS[1].id, renterName: RENTERS[1].name, renterAvatarUrl: RENTERS[1].avatar,
      startDate: daysFromNow(5), endDate: daysFromNow(9),
      price: 95, priceType: "daily", houseRulesAccepted: true, status: "approved",
      reviewSubmitted: false, bookingType: "date_range",
    },
    // pending – v1
    {
      listingId: listing1Id, listingTitle: LISTINGS_DATA[0].title,
      venueId: "seed_v1_venue", venueName: "The Style Collective",
      renterId: RENTERS[2].id, renterName: RENTERS[2].name, renterAvatarUrl: RENTERS[2].avatar,
      startDate: daysFromNow(18), endDate: daysFromNow(22),
      price: 95, priceType: "daily", houseRulesAccepted: true, status: "pending",
      reviewSubmitted: false, bookingType: "date_range",
    },
    // completed – v2
    {
      listingId: listing2Id, listingTitle: LISTINGS_DATA[1].title,
      venueId: "seed_v2_venue", venueName: "Luxe Beauty Studio",
      renterId: RENTERS[2].id, renterName: RENTERS[2].name, renterAvatarUrl: RENTERS[2].avatar,
      startDate: daysFromNow(-40), endDate: daysFromNow(-36),
      price: 120, priceType: "daily", houseRulesAccepted: true, status: "completed",
      reviewSubmitted: true, bookingType: "date_range",
    },
    // recurring approved – v3
    {
      listingId: listing3Id, listingTitle: LISTINGS_DATA[2].title,
      venueId: "seed_v3_venue", venueName: "The Barber Quarter",
      renterId: RENTERS[3].id, renterName: RENTERS[3].name, renterAvatarUrl: RENTERS[3].avatar,
      startDate: daysFromNow(-90), endDate: daysFromNow(90),
      price: 80, priceType: "daily", houseRulesAccepted: true, status: "approved",
      reviewSubmitted: false, bookingType: "recurring_slot",
      recurringSlot: { day: 1, start: "09:00", end: "18:00" },
    },
    // pending – v4
    {
      listingId: listing4Id, listingTitle: LISTINGS_DATA[3].title,
      venueId: "seed_v4_venue", venueName: "Glow Nail Lounge",
      renterId: RENTERS[4].id, renterName: RENTERS[4].name, renterAvatarUrl: RENTERS[4].avatar,
      startDate: daysFromNow(12), endDate: daysFromNow(14),
      price: 75, priceType: "daily", houseRulesAccepted: true, status: "pending",
      reviewSubmitted: false, bookingType: "date_range",
    },
    // declined – v5
    {
      listingId: listing5Id, listingTitle: LISTINGS_DATA[4].title,
      venueId: "seed_v5_venue", venueName: "Prestige Salon Suites",
      renterId: RENTERS[0].id, renterName: RENTERS[0].name, renterAvatarUrl: RENTERS[0].avatar,
      startDate: daysFromNow(-20), endDate: daysFromNow(-16),
      price: 145, priceType: "daily", houseRulesAccepted: true, status: "declined",
      reviewSubmitted: false, bookingType: "date_range",
    },
  ];

  // If current user is a renter, also create some bookings for them
  const userBookings: typeof BOOKINGS = [];
  if (currentUser && currentUser.role === "renter") {
    userBookings.push(
      {
        listingId: listing1Id, listingTitle: LISTINGS_DATA[0].title,
        venueId: "seed_v1_venue", venueName: "The Style Collective",
        renterId: currentUser.accountId, renterName: currentUser.name, renterAvatarUrl: currentUser.avatarUrl ?? "",
        startDate: daysFromNow(7), endDate: daysFromNow(11),
        price: 95, priceType: "daily", houseRulesAccepted: true, status: "pending",
        reviewSubmitted: false, bookingType: "date_range",
      },
      {
        listingId: listing3Id, listingTitle: LISTINGS_DATA[2].title,
        venueId: "seed_v3_venue", venueName: "The Barber Quarter",
        renterId: currentUser.accountId, renterName: currentUser.name, renterAvatarUrl: currentUser.avatarUrl ?? "",
        startDate: daysFromNow(-14), endDate: daysFromNow(-10),
        price: 80, priceType: "daily", houseRulesAccepted: true, status: "completed",
        reviewSubmitted: false, bookingType: "date_range",
      }
    );
  }

  // If current user is a venue, add mock incoming booking requests to their listings
  let venueListingIds: string[] = [];
  if (currentUser && currentUser.role === "venue") {
    const myListings = await ListingModel.find({ venueId: currentUser.accountId }).lean();
    venueListingIds = myListings.map((l) => (l._id as { toString(): string }).toString());
    if (venueListingIds.length > 0) {
      RENTERS.slice(0, 3).forEach((renter, i) => {
        userBookings.push({
          listingId: venueListingIds[0],
          listingTitle: (myListings[0] as { title: string }).title,
          venueId: currentUser.accountId,
          venueName: currentUser.name,
          renterId: renter.id,
          renterName: renter.name,
          renterAvatarUrl: renter.avatar,
          startDate: daysFromNow(5 + i * 7),
          endDate: daysFromNow(9 + i * 7),
          price: (myListings[0] as { price: number }).price ?? 100,
          priceType: "daily",
          houseRulesAccepted: true,
          status: i === 0 ? "approved" : "pending",
          reviewSubmitted: false,
          bookingType: "date_range",
        });
      });
    }
  }

  await BookingRequestModel.insertMany([...BOOKINGS, ...userBookings]);

  /* ── 5. Reviews for completed bookings ────────────────── */
  const REVIEWS = [
    {
      bookingId: `seed-review-1-${Date.now()}`,
      listingId: listing1Id, venueId: "seed_v1_venue",
      renterId: RENTERS[0].id, renterName: RENTERS[0].name, renterAvatarUrl: RENTERS[0].avatar,
      scores: { cleanliness: 9, accuracy: 10, communication: 10 },
      comment: "Absolutely loved working out of this space. The chair setup is world-class and the other stylists in the venue were lovely. Will definitely be back.",
    },
    {
      bookingId: `seed-review-2-${Date.now()}`,
      listingId: listing2Id, venueId: "seed_v2_venue",
      renterId: RENTERS[2].id, renterName: RENTERS[2].name, renterAvatarUrl: RENTERS[2].avatar,
      scores: { cleanliness: 10, accuracy: 10, communication: 10 },
      comment: "The Bondi suite is everything the listing promised and more. My bridal clients absolutely love the vibe. The natural light is unmatched.",
    },
  ];
  await ReviewModel.insertMany(REVIEWS);

  /* ── 6. Conversations ──────────────────────────────────── */
  // Mock-to-mock conversations (always created)
  const mockConvs = [
    {
      participants: [
        { accountId: "seed_v1_venue", name: "The Style Collective", avatarUrl: VENUES[0].photos[0], lastReadAt: new Date() },
        { accountId: RENTERS[0].id, name: RENTERS[0].name, avatarUrl: RENTERS[0].avatar, lastReadAt: new Date(Date.now() - 120_000) },
      ],
      listingId: listing1Id,
      listingTitle: LISTINGS_DATA[0].title,
      lastMessage: { content: "Looking forward to having you in the venue next week!", senderId: "seed_v1_venue", senderName: "The Style Collective", createdAt: new Date(Date.now() - 60_000) },
      messages: [
        { senderId: RENTERS[0].id, senderName: RENTERS[0].name, senderAvatarUrl: RENTERS[0].avatar, content: "Hi! I'm really interested in the Paddington styling chair. I've just moved to Sydney and I'm looking for a solid base a few days a week.", createdAt: new Date(Date.now() - 3_600_000) },
        { senderId: "seed_v1_venue", senderName: "The Style Collective", content: "Hi Jessica! Welcome to Sydney 🎉 We'd love to have you. When are you looking to start?", createdAt: new Date(Date.now() - 3_300_000) },
        { senderId: RENTERS[0].id, senderName: RENTERS[0].name, senderAvatarUrl: RENTERS[0].avatar, content: "I was thinking from the 3rd of next month — Monday to Thursday ideally.", createdAt: new Date(Date.now() - 3_000_000) },
        { senderId: "seed_v1_venue", senderName: "The Style Collective", content: "Perfect — that week is wide open. Go ahead and submit a booking request and I'll approve it straight away.", createdAt: new Date(Date.now() - 2_700_000) },
        { senderId: RENTERS[0].id, senderName: RENTERS[0].name, senderAvatarUrl: RENTERS[0].avatar, content: "Done! Just submitted. Is there parking near the venue?", createdAt: new Date(Date.now() - 600_000) },
        { senderId: "seed_v1_venue", senderName: "The Style Collective", content: "Looking forward to having you in the venue next week!", createdAt: new Date(Date.now() - 60_000) },
      ],
    },
    {
      participants: [
        { accountId: "seed_v2_venue", name: "Luxe Beauty Studio", avatarUrl: VENUES[1].photos[0], lastReadAt: new Date() },
        { accountId: RENTERS[2].id, name: RENTERS[2].name, avatarUrl: RENTERS[2].avatar, lastReadAt: new Date(Date.now() - 3_000_000) },
      ],
      listingId: listing2Id,
      listingTitle: LISTINGS_DATA[1].title,
      lastMessage: { content: "I've confirmed your booking — see you next Tuesday! ✨", senderId: "seed_v2_venue", senderName: "Luxe Beauty Studio", createdAt: new Date(Date.now() - 900_000) },
      messages: [
        { senderId: RENTERS[2].id, senderName: RENTERS[2].name, senderAvatarUrl: RENTERS[2].avatar, content: "Hi! I'm a lash artist specialising in weddings and I'd love to rent the Bondi suite. Do you have any Tuesday dates coming up?", createdAt: new Date(Date.now() - 86_400_000) },
        { senderId: "seed_v2_venue", senderName: "Luxe Beauty Studio", content: "Hi Emma! We have Tuesday availability for the next 6 weeks. The natural light on Tuesdays is particularly gorgeous 🌅", createdAt: new Date(Date.now() - 82_800_000) },
        { senderId: RENTERS[2].id, senderName: RENTERS[2].name, senderAvatarUrl: RENTERS[2].avatar, content: "That's perfect — I have a bridal party of 5 coming in. Will the suite fit us comfortably?", createdAt: new Date(Date.now() - 79_200_000) },
        { senderId: "seed_v2_venue", senderName: "Luxe Beauty Studio", content: "Absolutely — the suite is 28 sqm with a full vanity and garment rail. Perfect for a bridal party. I've reserved next Tuesday for you.", createdAt: new Date(Date.now() - 7_200_000) },
        { senderId: "seed_v2_venue", senderName: "Luxe Beauty Studio", content: "I've confirmed your booking — see you next Tuesday! ✨", createdAt: new Date(Date.now() - 900_000) },
      ],
    },
    {
      participants: [
        { accountId: "seed_v3_venue", name: "The Barber Quarter", avatarUrl: VENUES[2].photos[0], lastReadAt: new Date(Date.now() - 180_000) },
        { accountId: RENTERS[3].id, name: RENTERS[3].name, avatarUrl: RENTERS[3].avatar, lastReadAt: new Date() },
      ],
      listingId: listing3Id,
      listingTitle: LISTINGS_DATA[2].title,
      lastMessage: { content: "Thanks — see you Monday morning!", senderId: RENTERS[3].id, senderName: RENTERS[3].name, createdAt: new Date(Date.now() - 180_000) },
      messages: [
        { senderId: RENTERS[3].id, senderName: RENTERS[3].name, senderAvatarUrl: RENTERS[3].avatar, content: "Hey! I came across your recurring barber station listing. I've been looking for something like this in Fitzroy for ages.", createdAt: new Date(Date.now() - 604_800_000) },
        { senderId: "seed_v3_venue", senderName: "The Barber Quarter", content: "You've found the right place! We have Monday and Wednesday slots available right now. What days work for you?", createdAt: new Date(Date.now() - 601_200_000) },
        { senderId: RENTERS[3].id, senderName: RENTERS[3].name, senderAvatarUrl: RENTERS[3].avatar, content: "Mondays would be ideal. I do about 8–10 clients on a Monday. Is the vintage Koken chair still available?", createdAt: new Date(Date.now() - 597_600_000) },
        { senderId: "seed_v3_venue", senderName: "The Barber Quarter", content: "That's the one, yes! She's been beautifully restored. Monday slot is all yours — I'll set it up as a recurring booking.", createdAt: new Date(Date.now() - 360_000) },
        { senderId: RENTERS[3].id, senderName: RENTERS[3].name, senderAvatarUrl: RENTERS[3].avatar, content: "Thanks — see you Monday morning!", createdAt: new Date(Date.now() - 180_000) },
      ],
    },
  ];

  await ConversationModel.insertMany(mockConvs);

  // Current-user conversations
  const userConvResults: string[] = [];
  if (currentUser) {
    const isRenter = currentUser.role === "renter";
    const isVenue = currentUser.role === "venue";

    const userConvDocs = [
      isRenter && {
        participants: [
          { accountId: currentUser.accountId, name: currentUser.name, avatarUrl: currentUser.avatarUrl, lastReadAt: new Date(Date.now() - 600_000) },
          { accountId: "seed_v1_venue", name: "The Style Collective", avatarUrl: VENUES[0].photos[0], lastReadAt: new Date() },
        ],
        listingId: listing1Id,
        listingTitle: `SEED:${LISTINGS_DATA[0].title}`,
        lastMessage: { content: "Great! Go ahead and submit a booking request whenever you're ready.", senderId: "seed_v1_venue", senderName: "The Style Collective", createdAt: new Date(Date.now() - 300_000) },
        messages: [
          { senderId: currentUser.accountId, senderName: currentUser.name, senderAvatarUrl: currentUser.avatarUrl, content: "Hi, I'm interested in the Paddington styling chair. Do you have availability next month?", createdAt: new Date(Date.now() - 3_600_000) },
          { senderId: "seed_v1_venue", senderName: "The Style Collective", content: "Hi there! We have plenty of availability next month — what days are you looking at?", createdAt: new Date(Date.now() - 3_300_000) },
          { senderId: currentUser.accountId, senderName: currentUser.name, senderAvatarUrl: currentUser.avatarUrl, content: "Ideally Monday through Thursday — is there a discount for booking a full week?", createdAt: new Date(Date.now() - 3_000_000) },
          { senderId: "seed_v1_venue", senderName: "The Style Collective", content: "Great! Go ahead and submit a booking request whenever you're ready.", createdAt: new Date(Date.now() - 300_000) },
        ],
      },
      isRenter && {
        participants: [
          { accountId: currentUser.accountId, name: currentUser.name, avatarUrl: currentUser.avatarUrl, lastReadAt: new Date() },
          { accountId: "seed_v5_venue", name: "Prestige Salon Suites", avatarUrl: VENUES[4].photos[0], lastReadAt: new Date(Date.now() - 3_600_000) },
        ],
        listingId: listing5Id,
        listingTitle: `SEED:${LISTINGS_DATA[4].title}`,
        lastMessage: { content: "I'd love to book this suite for the next 3 months.", senderId: currentUser.accountId, senderName: currentUser.name, createdAt: new Date(Date.now() - 1_800_000) },
        messages: [
          { senderId: "seed_v5_venue", senderName: "Prestige Salon Suites", content: "Welcome to Prestige Salon Suites! We noticed you viewed our Collins St listing. Feel free to ask if you have any questions.", createdAt: new Date(Date.now() - 7_200_000) },
          { senderId: currentUser.accountId, senderName: currentUser.name, senderAvatarUrl: currentUser.avatarUrl, content: "Thanks for reaching out! The suite looks incredible. What's included in the weekly rate?", createdAt: new Date(Date.now() - 5_400_000) },
          { senderId: "seed_v5_venue", senderName: "Prestige Salon Suites", content: "The daily rate includes the full suite, reception coverage Monday–Friday, shared waiting lounge, and utilities. It's fully self-contained.", createdAt: new Date(Date.now() - 3_600_000) },
          { senderId: currentUser.accountId, senderName: currentUser.name, senderAvatarUrl: currentUser.avatarUrl, content: "I'd love to book this suite for the next 3 months.", createdAt: new Date(Date.now() - 1_800_000) },
        ],
      },
      isVenue && {
        participants: [
          { accountId: currentUser.accountId, name: currentUser.name, avatarUrl: currentUser.avatarUrl, lastReadAt: new Date() },
          { accountId: RENTERS[0].id, name: RENTERS[0].name, avatarUrl: RENTERS[0].avatar, lastReadAt: new Date(Date.now() - 1_200_000) },
        ],
        listingId: venueListingIds[0] ?? listing1Id,
        listingTitle: `SEED:Inquiry about your listing`,
        lastMessage: { content: "Hi! I'm interested in renting a station at your venue. Do you have any availability next week?", senderId: RENTERS[0].id, senderName: RENTERS[0].name, createdAt: new Date(Date.now() - 1_200_000) },
        messages: [
          { senderId: RENTERS[0].id, senderName: RENTERS[0].name, senderAvatarUrl: RENTERS[0].avatar, content: "Hi! I'm interested in renting a station at your venue. Do you have any availability next week?", createdAt: new Date(Date.now() - 1_200_000) },
        ],
      },
      isVenue && {
        participants: [
          { accountId: currentUser.accountId, name: currentUser.name, avatarUrl: currentUser.avatarUrl, lastReadAt: new Date() },
          { accountId: RENTERS[1].id, name: RENTERS[1].name, avatarUrl: RENTERS[1].avatar, lastReadAt: new Date(Date.now() - 86_400_000) },
        ],
        listingId: venueListingIds[0] ?? listing1Id,
        listingTitle: `SEED:Recurring booking inquiry`,
        lastMessage: { content: "Perfect, I'll go ahead and submit a recurring booking request for Mondays.", senderId: RENTERS[1].id, senderName: RENTERS[1].name, createdAt: new Date(Date.now() - 86_400_000) },
        messages: [
          { senderId: RENTERS[1].id, senderName: RENTERS[1].name, senderAvatarUrl: RENTERS[1].avatar, content: "Hey there! I came across your listing and I'm really interested in setting up a recurring weekly booking. Is that possible?", createdAt: new Date(Date.now() - 172_800_000) },
          { senderId: currentUser.accountId, senderName: currentUser.name, senderAvatarUrl: currentUser.avatarUrl, content: "Absolutely! We do offer recurring bookings. You'd just need to select the recurring option when submitting your request.", createdAt: new Date(Date.now() - 169_200_000) },
          { senderId: RENTERS[1].id, senderName: RENTERS[1].name, senderAvatarUrl: RENTERS[1].avatar, content: "That's great. Could I lock in Mondays 9am–6pm?", createdAt: new Date(Date.now() - 165_600_000) },
          { senderId: currentUser.accountId, senderName: currentUser.name, senderAvatarUrl: currentUser.avatarUrl, content: "That slot is available — go ahead and submit the request!", createdAt: new Date(Date.now() - 90_000_000) },
          { senderId: RENTERS[1].id, senderName: RENTERS[1].name, senderAvatarUrl: RENTERS[1].avatar, content: "Perfect, I'll go ahead and submit a recurring booking request for Mondays.", createdAt: new Date(Date.now() - 86_400_000) },
        ],
      },
    ].filter(Boolean);

    if (userConvDocs.length > 0) {
      await ConversationModel.insertMany(userConvDocs);
      userConvResults.push(`${userConvDocs.length} conversation(s) linked to your account`);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Seed complete!",
    created: {
      venueProfiles: venueProfileDocs.length,
      listings: listingDocs.length,
      trustProfiles: 0,
      bookings: BOOKINGS.length + userBookings.length,
      reviews: REVIEWS.length,
      conversations: mockConvs.length,
      userSpecific: userConvResults,
    },
  });
}
