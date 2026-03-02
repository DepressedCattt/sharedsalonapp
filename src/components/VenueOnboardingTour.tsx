"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Step definitions ────────────────────────────────────────────────────────

interface PhotoCard {
  emoji: string;
  label: string;
  description: string;
  tips: string[];
}

interface TourStep {
  id: string;
  sectionId: string | null;
  icon: string;
  title: string;
  description: string;
  tips?: Array<{ text: string; accent?: boolean }>;
  photoGuide?: PhotoCard[];
  nextLabel: string;
}

const STEPS: TourStep[] = [
  {
    id: "name",
    sectionId: "tour-about",
    icon: "🏢",
    title: "Name your venue",
    description:
      "Use the name your clients already know — this is what freelancers will search for and remember when recommending your space.",
    tips: [
      { text: "Use your salon or studio's real name" },
      { text: "Keep it concise and recognisable" },
      { text: '"Paddington Beauty Studio" or "The Hair Lab"', accent: true },
    ],
    nextLabel: "Next: Bio",
  },
  {
    id: "bio",
    sectionId: "tour-about",
    icon: "✍️",
    title: "Write a compelling bio",
    description:
      "Your elevator pitch to freelancers. Describe the vibe, the equipment, and the kind of clients who already love your space.",
    tips: [
      { text: "Mention your atmosphere & aesthetic" },
      { text: "Call out key equipment — chairs, lighting, mirrors" },
      { text: "Bios increase profile views by 3×", accent: true },
    ],
    nextLabel: "Next: Photos",
  },
  {
    id: "photos",
    sectionId: "tour-photos",
    icon: "📸",
    title: "Show your space",
    description:
      "Photos are the #1 factor freelancers use when choosing a venue. Here's exactly what to shoot:",
    photoGuide: [
      {
        emoji: "💺",
        label: "Styling Station",
        description: "Chair, mirror & lighting up close",
        tips: ["Well-lit mirror", "Clean surface", "Pro chair"],
      },
      {
        emoji: "🏛️",
        label: "Full Room",
        description: "Wide shot of the whole space",
        tips: ["Shows capacity", "Natural light", "Clean & tidy"],
      },
      {
        emoji: "✨",
        label: "Atmosphere",
        description: "Mood, décor & unique character",
        tips: ["Interesting details", "Ambient lighting", "Brand personality"],
      },
    ],
    tips: [
      { text: "Aim for 5+ photos", accent: true },
      { text: "Natural light always wins" },
    ],
    nextLabel: "Next: Location",
  },
  {
    id: "location",
    sectionId: "tour-location",
    icon: "📍",
    title: "Pin your location",
    description:
      "Freelancers filter by area — a precise address means you show up in local searches and on the map.",
    tips: [
      { text: "Type your full street address" },
      { text: "Select from autocomplete for accuracy" },
      { text: "A map pin preview will appear below", accent: true },
    ],
    nextLabel: "Finish tour",
  },
];

// ─── Exports ─────────────────────────────────────────────────────────────────

export function VenueOnboardingTour({
  onComplete,
  onSkip,
  venueName,
  onSectionChange,
}: {
  onComplete: () => void;
  onSkip: () => void;
  venueName: string;
  onSectionChange: (sectionId: string | null, stepNum: number) => void;
}) {
  const [phase, setPhase] = useState<"welcome" | "steps" | "done">("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = STEPS[stepIndex];

  // Scroll to highlighted section and notify parent
  const activateSection = useCallback(
    (sectionId: string | null, stepNum: number) => {
      onSectionChange(sectionId, stepNum);
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top =
            el.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
      }
    },
    [onSectionChange]
  );

  useEffect(() => {
    if (phase === "steps") {
      activateSection(step.sectionId, stepIndex + 1);
    } else {
      activateSection(null, 0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [phase, stepIndex, step.sectionId, activateSection]);

  const startTour = () => setPhase("steps");

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setDirection(1);
      setStepIndex((i) => i + 1);
    } else {
      onSectionChange(null, 0);
      setPhase("done");
      onComplete();
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    } else {
      setPhase("welcome");
    }
  };

  const handleSkip = () => {
    onSectionChange(null, 0);
    onSkip();
  };

  return (
    <AnimatePresence mode="wait">
      {phase === "welcome" && (
        <WelcomeModal
          key="welcome"
          venueName={venueName}
          onStart={startTour}
          onSkip={handleSkip}
        />
      )}
      {phase === "steps" && (
        <GuidePanel
          key="guide"
          step={step}
          stepIndex={stepIndex}
          totalSteps={STEPS.length}
          direction={direction}
          onNext={goNext}
          onBack={goBack}
          onSkip={handleSkip}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Welcome Modal ────────────────────────────────────────────────────────────

function WelcomeModal({
  venueName,
  onStart,
  onSkip,
}: {
  venueName: string;
  onStart: () => void;
  onSkip: () => void;
}) {
  const firstName = venueName.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Decorative header illustration */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-violet-600">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute right-12 bottom-8 h-20 w-20 rounded-full bg-white/10" />

          {/* Main emoji illustration */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="flex gap-3">
              {["✂️", "💈", "🪮"].map((emoji, i) => (
                <motion.div
                  key={emoji}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 400 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-1 rounded-full bg-white/25 px-4 py-1 text-xs font-semibold text-white backdrop-blur-sm"
            >
              Shared Salon
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-foreground">
              Welcome, {firstName}!
            </h2>
            <p className="mt-1 text-sm text-muted">
              Let&apos;s build your venue profile
            </p>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
              Freelancers discover your space through your profile. A
              well-presented profile gets significantly more enquiries. We&apos;ll
              walk you through the four things that matter most.
            </p>
          </motion.div>

          {/* Step pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex gap-2 flex-wrap"
          >
            {[
              { icon: "🏢", label: "Name" },
              { icon: "✍️", label: "Bio" },
              { icon: "📸", label: "Photos" },
              { icon: "📍", label: "Location" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/10 px-3 py-1.5 text-xs font-medium text-muted"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {i < 3 && (
                  <svg className="h-3 w-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 flex items-center gap-3"
          >
            <button
              onClick={onSkip}
              className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <button
              onClick={onStart}
              className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              Let&apos;s start
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Guide Panel ──────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

function GuidePanel({
  step,
  stepIndex,
  totalSteps,
  direction,
  onNext,
  onBack,
  onSkip,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  direction: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const progress = (stepIndex + 1) / totalSteps;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Pointing arrow */}
      <div className="flex justify-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
        >
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </motion.div>
      </div>

      {/* Panel card */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-t-2xl bg-white shadow-[0_-4px_40px_rgba(0,0,0,0.18)] border-t border-border">
          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-t-2xl bg-muted/20">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          <div className="px-5 pt-4 pb-5">
            {/* Step counter */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Step {stepIndex + 1} of {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Skip tour
              </button>
            </div>

            {/* Animated step content */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <StepContent step={step} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>

              {/* Step dots */}
              <div className="flex flex-1 justify-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === stepIndex
                        ? "w-5 bg-primary"
                        : i < stepIndex
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={onNext}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                {isLast ? "Done" : step.nextLabel}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step content ─────────────────────────────────────────────────────────────

function StepContent({ step }: { step: TourStep }) {
  return (
    <div>
      {/* Title row */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
          {step.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-foreground leading-tight">{step.title}</h3>
          <p className="mt-0.5 text-sm text-muted leading-relaxed">{step.description}</p>
        </div>
      </div>

      {/* Photo guide (photos step) */}
      {step.photoGuide && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {step.photoGuide.map((card) => (
            <PhotoCard key={card.label} card={card} />
          ))}
        </div>
      )}

      {/* Tips */}
      {step.tips && (
        <div className="mt-3 flex flex-wrap gap-2">
          {step.tips.map((tip) => (
            <span
              key={tip.text}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                tip.accent
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/15 text-muted"
              }`}
            >
              {tip.accent && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              )}
              {tip.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Photo card ───────────────────────────────────────────────────────────────

function PhotoCard({ card }: { card: PhotoCard }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/5">
      {/* Emoji header */}
      <div className="flex h-14 items-center justify-center bg-gradient-to-br from-primary/8 to-violet-500/8">
        <span className="text-3xl">{card.emoji}</span>
      </div>
      {/* Content */}
      <div className="p-2">
        <p className="text-[11px] font-bold text-foreground leading-tight">
          {card.label}
        </p>
        <p className="mt-0.5 text-[10px] text-muted leading-tight">
          {card.description}
        </p>
        <div className="mt-1.5 space-y-0.5">
          {card.tips.map((t) => (
            <div key={t} className="flex items-center gap-1">
              <div className="h-1 w-1 shrink-0 rounded-full bg-primary/50" />
              <span className="text-[10px] text-muted">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section highlight wrapper ────────────────────────────────────────────────

export function OnboardingHighlight({
  sectionId,
  activeSectionId,
  children,
  stepNumber,
}: {
  sectionId: string;
  activeSectionId: string | null;
  children: React.ReactNode;
  stepNumber: number;
}) {
  const isActive = activeSectionId === sectionId;

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {isActive && (
          <>
            {/* Glow border overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary"
            />
            {/* Animated outer pulse */}
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: [0, 0.4, 0], scale: [0.99, 1.01, 0.99] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-primary/30"
            />
            {/* Step badge */}
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-3 right-4 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg shadow-primary/30"
            >
              Step {stepNumber}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
