"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import Navbar from "@/components/Navbar";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

// ─── Salon Chair SVG Illustration ────────────────────────────────────────────

// Brand blue palette — frame/metal uses primary blue, cushions use deep navy
const G = "#2563eb";   // primary blue  (replaces gold for all frame/metal parts)
const GD = "#1d4ed8";  // primary dark  (shadows on blue parts)
const GL = "#93c5fd";  // blue highlight (replaces gold highlight for shine)
const C = "#0f172a";   // deep navy cushion (brand foreground)
const CH = "#1e293b";  // cushion highlight panel
const B = "#060d1c";   // near-black base/column

function SalonChairIllustration() {
  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[420px]">
      {/* Gold glow behind chair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-72 h-72 rounded-full animate-pulse-soft"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 65%)" }}
        />
      </div>

      {/* Floating sparkles */}
      <div className="absolute top-8 left-8 animate-drift" style={{ animationDelay: "0s" }}>
        <SparkleIcon className="w-6 h-6 text-accent opacity-80" />
      </div>
      <div className="absolute top-14 right-10 animate-float" style={{ animationDelay: "1.5s" }}>
        <SparkleIcon className="w-4 h-4 text-primary opacity-60" />
      </div>
      <div className="absolute bottom-28 left-10 animate-float-reverse" style={{ animationDelay: "0.8s" }}>
        <SparkleIcon className="w-5 h-5 text-accent opacity-55" />
      </div>

      {/* Floating scissors */}
      <div className="absolute top-10 right-5 animate-float" style={{ animationDelay: "2s" }}>
        <ScissorsIcon className="w-10 h-10 text-primary/35" />
      </div>

      {/* Floating comb */}
      <div className="absolute bottom-14 right-6 animate-float-slow" style={{ animationDelay: "1s" }}>
        <CombIcon className="w-10 h-10 text-accent/45" />
      </div>

      {/* Floating mirror */}
      <div className="absolute bottom-20 left-5 animate-float-reverse" style={{ animationDelay: "0.3s" }}>
        <MirrorIcon className="w-8 h-8 text-foreground/15" />
      </div>

      {/* Main chair */}
      <div className="relative z-10 animate-float-slow" style={{ animationDelay: "0s" }}>
        <svg
          viewBox="0 0 310 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-56 h-[23rem] drop-shadow-2xl"
        >
          {/* ── DISC BASE ── */}
          {/* Soft shadow beneath base */}
          <ellipse cx="152" cy="414" rx="108" ry="13" fill="#000" opacity="0.18" />
          {/* Main disc */}
          <ellipse cx="152" cy="400" rx="108" ry="21" fill={B} />
          {/* Gold outer trim ring */}
          <ellipse cx="152" cy="398" rx="108" ry="21" fill="none" stroke={G} strokeWidth="5" />
          {/* Gold inner ring */}
          <ellipse cx="152" cy="397" rx="100" ry="17" fill="none" stroke={G} strokeWidth="1.5" opacity="0.35" />
          {/* Disc surface sheen */}
          <ellipse cx="130" cy="393" rx="42" ry="10" fill="#1a1a26" opacity="0.5" />

          {/* ── PEDESTAL COLUMN ── */}
          {/* Column body */}
          <rect x="136" y="260" width="32" height="142" rx="16" fill={B} />
          {/* Column left sheen */}
          <rect x="141" y="264" width="9" height="134" rx="4.5" fill="#18181e" opacity="0.55" />
          {/* Gold collar at base of column */}
          <ellipse cx="152" cy="400" rx="24" ry="8" fill={G} />
          <ellipse cx="152" cy="399" rx="18" ry="5.5" fill={GD} />
          {/* Gold collar at top of column (below seat frame) */}
          <rect x="130" y="252" width="44" height="14" rx="7" fill={G} />
          <rect x="134" y="254" width="36" height="10" rx="5" fill={GL} opacity="0.3" />

          {/* ── ORNATE FILIGREE SIDE PANELS ── */}
          {/* Left panel */}
          <rect x="62" y="258" width="72" height="52" rx="12" fill={G} />
          <rect x="68" y="264" width="60" height="40" rx="9" fill={GD} />
          {/* Left medallion */}
          <circle cx="98" cy="284" r="14" fill="none" stroke={GL} strokeWidth="2.5" />
          <circle cx="98" cy="284" r="8" fill="none" stroke={GL} strokeWidth="1.5" />
          <circle cx="98" cy="284" r="3.5" fill={GL} />
          {/* Left corner scrolls */}
          <path d="M70 268 Q78 260 86 266" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M70 296 Q78 304 86 298" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M110 266 Q118 260 126 268" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M110 298 Q118 304 126 296" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

          {/* Right panel */}
          <rect x="176" y="258" width="72" height="52" rx="12" fill={G} />
          <rect x="182" y="264" width="60" height="40" rx="9" fill={GD} />
          {/* Right medallion */}
          <circle cx="212" cy="284" r="14" fill="none" stroke={GL} strokeWidth="2.5" />
          <circle cx="212" cy="284" r="8" fill="none" stroke={GL} strokeWidth="1.5" />
          <circle cx="212" cy="284" r="3.5" fill={GL} />
          {/* Right corner scrolls */}
          <path d="M184 268 Q192 260 200 266" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M184 296 Q192 304 200 298" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M222 266 Q230 260 238 268" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M222 298 Q230 304 238 296" fill="none" stroke={GL} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

          {/* ── SEAT ── */}
          {/* Gold seat band / frame */}
          <rect x="56" y="222" width="196" height="48" rx="18" fill={G} />
          <rect x="60" y="224" width="188" height="44" rx="16" fill={GD} opacity="0.5" />
          {/* Seat cushion */}
          <rect x="62" y="202" width="184" height="50" rx="16" fill={C} />
          {/* Seat cushion highlight */}
          <rect x="68" y="207" width="172" height="38" rx="13" fill={CH} />
          {/* Seat centre crease */}
          <line x1="154" y1="207" x2="154" y2="240" stroke={B} strokeWidth="2" opacity="0.35" />
          {/* Seat front shadow */}
          <rect x="64" y="242" width="180" height="8" rx="4" fill={B} opacity="0.3" />

          {/* ── ARMRESTS (curved gold tubes) ── */}
          {/* Left tube outer (thick gold stroke = tube) */}
          <path d="M 66 220 Q 46 208 42 186 Q 38 162 50 152" fill="none" stroke={G} strokeWidth="16" strokeLinecap="round" />
          {/* Left tube inner shadow */}
          <path d="M 66 220 Q 46 208 42 186 Q 38 162 50 152" fill="none" stroke={GD} strokeWidth="9" strokeLinecap="round" />
          {/* Left tube highlight */}
          <path d="M 62 216 Q 44 204 41 184 Q 38 164 48 155" fill="none" stroke={GL} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
          {/* Left armrest pad */}
          <rect x="32" y="143" width="52" height="18" rx="9" fill={C} />
          <rect x="36" y="147" width="44" height="10" rx="5" fill={CH} />
          {/* Left pad gold edge */}
          <rect x="32" y="155" width="52" height="6" rx="3" fill={G} opacity="0.5" />

          {/* Right tube outer */}
          <path d="M 244 220 Q 264 208 268 186 Q 272 162 260 152" fill="none" stroke={G} strokeWidth="16" strokeLinecap="round" />
          {/* Right tube inner shadow */}
          <path d="M 244 220 Q 264 208 268 186 Q 272 162 260 152" fill="none" stroke={GD} strokeWidth="9" strokeLinecap="round" />
          {/* Right tube highlight */}
          <path d="M 248 216 Q 266 204 269 184 Q 272 164 262 155" fill="none" stroke={GL} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
          {/* Right armrest pad */}
          <rect x="226" y="143" width="52" height="18" rx="9" fill={C} />
          <rect x="230" y="147" width="44" height="10" rx="5" fill={CH} />
          <rect x="226" y="155" width="52" height="6" rx="3" fill={G} opacity="0.5" />

          {/* ── BACKREST ── */}
          {/* Gold outer frame */}
          <rect x="72" y="34" width="164" height="176" rx="28" fill={G} />
          {/* Gold frame inner shadow */}
          <rect x="76" y="38" width="156" height="168" rx="25" fill={GD} opacity="0.4" />
          {/* Dark cushion */}
          <rect x="80" y="40" width="148" height="164" rx="24" fill={C} />
          {/* Cushion inner panel */}
          <rect x="88" y="48" width="132" height="148" rx="20" fill={CH} />
          {/* Vertical quilting */}
          <rect x="118" y="56" width="4" height="132" rx="2" fill={B} opacity="0.45" />
          <rect x="152" y="56" width="4" height="132" rx="2" fill={B} opacity="0.45" />
          <rect x="186" y="56" width="4" height="132" rx="2" fill={B} opacity="0.45" />
          {/* Horizontal stitching */}
          <line x1="82" y1="104" x2="226" y2="104" stroke={B} strokeWidth="1.5" opacity="0.35" />
          <line x1="82" y1="156" x2="226" y2="156" stroke={B} strokeWidth="1.5" opacity="0.35" />
          {/* Subtle left sheen on cushion */}
          <rect x="90" y="50" width="30" height="144" rx="10" fill="#ffffff" opacity="0.03" />

          {/* ── HEADREST ── */}
          {/* Gold adjustment neck */}
          <rect x="130" y="14" width="48" height="32" rx="14" fill={G} />
          <rect x="134" y="16" width="40" height="28" rx="11" fill={GD} opacity="0.5" />
          {/* Headrest cushion */}
          <rect x="90" y="2" width="128" height="46" rx="20" fill={C} />
          <rect x="96" y="8" width="116" height="34" rx="16" fill={CH} />
          {/* Headrest stitching */}
          <line x1="93" y1="25" x2="215" y2="25" stroke={B} strokeWidth="1.5" opacity="0.35" />
          {/* Headrest gold trim edge */}
          <rect x="90" y="43" width="128" height="5" rx="2.5" fill={G} opacity="0.45" />

          {/* ── FOOTREST (right side) ── */}
          {/* Gold swing arm */}
          <path d="M 248 228 L 278 228 L 278 256" fill="none" stroke={G} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arm inner shadow */}
          <path d="M 248 228 L 278 228 L 278 256" fill="none" stroke={GD} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Footrest pad */}
          <rect x="260" y="252" width="46" height="18" rx="9" fill={C} />
          <rect x="264" y="256" width="38" height="10" rx="5" fill={CH} />
          {/* Footrest gold trim */}
          <rect x="260" y="264" width="46" height="6" rx="3" fill={G} opacity="0.45" />
        </svg>
      </div>
    </div>
  );
}

// ─── Icon Components ──────────────────────────────────────────────────────────

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z" opacity="0.6" />
      <path d="M19 3l.6 1.4L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.6L19 3z" opacity="0.6" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function CombIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h18v8H3z" rx="2" />
      <line x1="6" y1="8" x2="6" y2="4" />
      <line x1="9" y1="8" x2="9" y2="4" />
      <line x1="12" y1="8" x2="12" y2="4" />
      <line x1="15" y1="8" x2="15" y2="4" />
      <line x1="18" y1="8" x2="18" y2="4" />
    </svg>
  );
}

function MirrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="9" rx="7" ry="8" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #dbeafe 0%, #fdf8f2 45%, #eff6ff 85%, #fdf8f2 100%)",
            backgroundSize: "300% 300%",
            animation: "gradient-shift 12s ease infinite",
          }}
        />

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Left — copy */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-dark mb-6">
                  <SparkleIcon className="w-3 h-3" />
                  For Freelance Stylists & Salons
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-5xl font-normal leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Rent a Chair
                <span className="block text-primary italic">Without a Care</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
                The simplest way to connect freelance stylists with salon venues.
                Find a chair to rent or list your space — all in one place.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
              >
                <Link
                  href="/login?intent=renter"
                  className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 sm:w-auto"
                >
                  Find a Chair
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/login?intent=venue"
                  className="inline-flex h-14 w-full items-center justify-center rounded-xl border-2 border-foreground/20 bg-white/60 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary-light hover:text-primary hover:-translate-y-0.5 sm:w-auto"
                >
                  List Your Chair
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="hidden lg:block"
            >
              <SalonChairIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature Strip ─────────────────────────────────────────────────── */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="border-y border-border bg-white/70 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              {
                label: "Easy sign up — always free",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ),
              },
              {
                label: "List or book in 2 minutes",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
              },
              {
                label: "Secure your spot in the industry",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
              },
              {
                label: "Verified professionals only",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
            ].map(({ label, icon }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {i > 0 && <div className="h-4 w-px bg-border hidden sm:block mr-5" />}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {icon}
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">How It Works</span>
            <h2
              className="mt-3 text-4xl font-normal text-foreground sm:text-5xl"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Up & running in minutes
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create an account",
                description: "Sign up as a freelance stylist looking for a chair, or as a venue with space to share.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Browse or list",
                description: "Renters explore available chairs by location and availability. Venues create a listing in under 2 minutes.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Book & connect",
                description: "Send a request, get approved, and message directly. Start working from your new chair, your way.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.669c.188.143.39.291.59.409M5.904 18.669a.75.75 0 01-.752-.726c-.012-.198-.017-.4-.017-.604a3.75 3.75 0 013.75-3.75h.75" />
                  </svg>
                ),
              },
            ].map(({ step, title, description, icon }, i) => (
              <motion.div
                key={step}
                variants={fadeUp}
                custom={i}
                className="group relative"
              >
                {/* Connector line (desktop) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%+1px)] w-8 border-t-2 border-dashed border-border z-10" />
                )}

                <div className="rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                      {icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-primary/60">{step}</span>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Value Props ────────────────────────────────────────────────────── */}
      <section className="bg-card-warm">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Made For Everyone</span>
              <h2
                className="mt-3 text-4xl font-normal text-foreground sm:text-5xl"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Whether you cut or host
              </h2>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* For Renters */}
              <motion.div
                variants={fadeUp}
                className="group rounded-2xl border border-primary/20 bg-primary-light/30 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">For Stylists</p>
                    <h2 className="text-2xl font-semibold text-foreground">Find Your Perfect Chair</h2>
                  </div>
                </div>

                <ul className="space-y-4">
                  {[
                    { label: "Trusted venues", detail: "every salon is verified so you can book with confidence" },
                    { label: "Simple booking", detail: "browse, request, and get approved in minutes" },
                    { label: "Flexible terms", detail: "rent by the day, week, or month on your schedule" },
                  ].map(({ label, detail }) => (
                    <li key={label} className="flex items-start gap-3 text-muted">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span><strong className="text-foreground">{label}</strong> — {detail}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login?intent=renter"
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary-dark hover:shadow-md hover:shadow-primary/30"
                >
                  Start browsing
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </motion.div>

              {/* For Venues */}
              <motion.div
                variants={fadeUp}
                className="group rounded-2xl border border-accent/30 bg-accent-light/40 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/50"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/30">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">For Venues</p>
                    <h2 className="text-2xl font-semibold text-foreground">List Your Chair</h2>
                  </div>
                </div>

                <ul className="space-y-4">
                  {[
                    { label: "Increase revenue", detail: "fill empty chairs and earn from unused space" },
                    { label: "Simple listing", detail: "create a listing in under 2 minutes" },
                    { label: "Trust & safety", detail: "insurance policies and verified renters" },
                  ].map(({ label, detail }) => (
                    <li key={label} className="flex items-start gap-3 text-muted">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20">
                        <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span><strong className="text-foreground">{label}</strong> — {detail}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login?intent=venue"
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/20 transition-all duration-200 hover:bg-amber-600 hover:shadow-md hover:shadow-accent/30"
                >
                  List your space
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-foreground text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                  SS
                </div>
                <span
                  className="text-xl font-normal text-white"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  Shared Salon
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-white/50">
                Connecting freelance stylists with salon venues across Australia.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Platform</h4>
              <ul className="space-y-2.5">
                {["Browse Listings", "List a Chair", "How It Works", "Pricing"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-white/60 transition-colors hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Company</h4>
              <ul className="space-y-2.5">
                {["About Us", "Blog", "Press", "Careers"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-white/60 transition-colors hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Support</h4>
              <ul className="space-y-2.5">
                {["Help Centre", "Contact Us", "Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-white/60 transition-colors hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/40">
              &copy; 2026 Shared Salon. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-white/30">
              <SparkleIcon className="w-3 h-3 text-primary" />
              <span>Made for creative people</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
