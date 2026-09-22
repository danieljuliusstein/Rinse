import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { Check, ArrowRight, X, Star, Plus } from "lucide-react";
import { SECTIONS } from "../shared/scroll";
import { FadeUpWhenVisible } from "../shared/motion";

export const COMPARISON_FEATURES: {
  label: string;
  starter: boolean;
  group: 1 | 2 | 3;
}[] = [
  { label: "Up to 3 clients", starter: true, group: 1 },
  { label: "Up to 10 jobs", starter: true, group: 1 },
  { label: "Basic job tracking", starter: true, group: 1 },
  { label: "Client portal", starter: true, group: 1 },
  { label: "Unlimited clients", starter: false, group: 2 },
  { label: "Unlimited jobs", starter: false, group: 2 },
  { label: "Advanced reporting", starter: false, group: 2 },
  { label: "Team collaboration", starter: false, group: 2 },
  { label: "Automations & workflows", starter: false, group: 2 },
  { label: "Priority support", starter: false, group: 2 },
  { label: "Unlimited technicians", starter: false, group: 3 },
  { label: "Multi-location support", starter: false, group: 3 },
  { label: "Custom branding", starter: false, group: 3 },
  { label: "API access", starter: false, group: 3 },
  { label: "Dedicated onboarding", starter: false, group: 3 },
];

// ─── Billing toggle ───────────────────────────────────────────────────────────
export function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-0.5 rounded-full p-1"
        style={{ background: "rgba(0,0,0,0.06)" }}
      >
        {(["monthly", "annual"] as BillingCycle[]).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className="relative px-4 py-1.5 text-sm font-semibold capitalize rounded-full focus:outline-none"
            style={{
              color: cycle === option ? "#0f1210" : "rgba(15,18,16,0.4)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {cycle === option && (
              <motion.span
                layoutId="billing-pill"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                style={{ zIndex: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative z-10">{option}</span>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {cycle === "annual" && (
          <motion.span
            key="save"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
            className="text-xs font-bold"
            style={{ color: "#4bac50" }}
          >
            Save 20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────
export function FeatureRow({
  label,
  available,
  isPro,
}: {
  label: string;
  available: boolean;
  isPro: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5">
      {available ? (
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(75,172,80,0.10)" }}
        >
          <Check size={11} strokeWidth={2.8} color="#4bac50" />
        </span>
      ) : (
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          <X size={10} strokeWidth={2.5} color="rgba(0,0,0,0.25)" />
        </span>
      )}
      <span
        className="text-sm font-medium leading-snug"
        style={{
          color: available
            ? "rgba(0,0,0,0.72)"
            : isPro
              ? "rgba(0,0,0,0.72)"
              : "rgba(0,0,0,0.30)",
        }}
      >
        {label}
      </span>
    </li>
  );
}

// ─── Founder progress bar ─────────────────────────────────────────────────────
export function FounderProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const claimed = 12;
  const total = 20;
  const pct = (claimed / total) * 100;

  return (
    <div ref={ref} className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <span
          className="text-xs font-semibold"
          style={{ color: "rgba(0,0,0,0.38)" }}
        >
          {claimed} of {total} spots claimed
        </span>
        <span className="text-xs font-bold" style={{ color: "#4bac50" }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(0,0,0,0.06)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "#4bac50" }}
          initial={{ width: "0%" }}
          animate={inView ? { width: `${pct}%` } : { width: "0%" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        />
      </div>
    </div>
  );
}

// ─── Founder banner ───────────────────────────────────────────────────────────
export function FounderBanner({ onStartTrial }: { onStartTrial: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-3xl rounded-2xl bg-white border p-8 sm:p-10 flex flex-col gap-6"
      style={{ borderColor: "rgba(0,0,0,0.08)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(75,172,80,0.08)",
              color: "#4bac50",
              border: "1px solid rgba(75,172,80,0.18)",
              letterSpacing: "0.01em",
            }}
          >
            <Star size={10} strokeWidth={2.5} fill="#4bac50" color="#4bac50" />
            Founding Member Offer
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-neutral-900">
              Free for life.{" "}
              <span style={{ color: "#4bac50" }}>
                First 20 businesses only.
              </span>
            </h2>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "rgba(0,0,0,0.42)" }}
            >
              Get every Pro feature, forever, for being one of our first
              partners.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 sm:pt-1">
          <motion.button
            onClick={onStartTrial}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white whitespace-nowrap focus:outline-none"
            style={{ background: "#4bac50" }}
          >
            Claim your Founder spot
            <ArrowRight size={14} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
      <FounderProgress />
    </motion.div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
export function PricingCard({
  name,
  tagline,
  badge,
  price,
  priceNote,
  cta,
  isPro,
  isScale,
  features,
  index,
  onCta,
  cycle,
}: {
  name: string;
  tagline: string;
  badge?: string;
  price: { monthly: string; annual: string };
  priceNote: string | { monthly: string; annual: string };
  cta: string;
  isPro: boolean;
  isScale?: boolean;
  features: typeof COMPARISON_FEATURES;
  index: number;
  onCta: () => void;
  cycle: BillingCycle;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const priceVal = price[cycle];
  const isFree = priceVal === "Free";
  const note = typeof priceNote === "object" ? priceNote[cycle] : priceNote;

  const group1 = features.filter((f) => f.group === 1);
  const group2 = features.filter((f) => f.group === 2);
  const group3 = features.filter((f) => f.group === 3);

  const featureAvailable = (f: (typeof COMPARISON_FEATURES)[number]) => {
    if (isScale) return true;
    if (isPro) return f.group !== 3;
    return f.starter;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        duration: 0.52,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative flex-1"
    >
      <div
        className="flex flex-col h-full rounded-2xl bg-white border p-7"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        {badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <span
              className="inline-block px-3.5 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: isPro ? "#4bac50" : "#0f1210" }}
            >
              {badge}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-base font-bold text-neutral-900">{name}</span>
            <span
              className="text-sm leading-snug"
              style={{ color: "rgba(0,0,0,0.38)" }}
            >
              {tagline}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-1.5 leading-none">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={priceVal}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.32, 0, 0.67, 0] }}
                  className={`font-extrabold tracking-tight text-neutral-900 ${isFree || priceVal === "Custom" ? "text-4xl" : "text-5xl"}`}
                >
                  {priceVal}
                </motion.span>
              </AnimatePresence>
              {!isFree && priceVal !== "Custom" && (
                <span
                  className="text-sm font-medium mb-2"
                  style={{ color: "rgba(0,0,0,0.35)" }}
                >
                  /mo
                </span>
              )}
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: "rgba(0,0,0,0.30)" }}
            >
              {note}
            </span>
          </div>
          {isPro ? (
            <motion.button
              onClick={onCta}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full py-3 rounded-full text-sm font-bold text-white focus:outline-none"
              style={{ background: "#4bac50" }}
            >
              {cta}
            </motion.button>
          ) : isScale ? (
            <motion.button
              onClick={onCta}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full py-3 rounded-full text-sm font-bold text-white focus:outline-none"
              style={{ background: "#0f1210" }}
            >
              {cta}
            </motion.button>
          ) : (
            <motion.button
              onClick={onCta}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full py-3 rounded-full text-sm font-bold border focus:outline-none"
              style={{
                color: "#0f1210",
                borderColor: "rgba(0,0,0,0.12)",
                background: "transparent",
              }}
            >
              {cta}
            </motion.button>
          )}
          <div
            className="h-px w-full"
            style={{ background: "rgba(0,0,0,0.06)" }}
          />
          <ul className="flex flex-col gap-3">
            {group1.map((f) => (
              <FeatureRow
                key={f.label}
                label={f.label}
                available={featureAvailable(f)}
                isPro={isPro || !!isScale}
              />
            ))}
          </ul>
          <div
            className="h-px w-full"
            style={{ background: "rgba(0,0,0,0.05)" }}
          />
          <ul className="flex flex-col gap-3">
            {group2.map((f) => (
              <FeatureRow
                key={f.label}
                label={f.label}
                available={featureAvailable(f)}
                isPro={isPro || !!isScale}
              />
            ))}
          </ul>
          {group3.length > 0 && (
            <>
              <div
                className="h-px w-full"
                style={{ background: "rgba(0,0,0,0.05)" }}
              />
              <ul className="flex flex-col gap-3">
                {group3.map((f) => (
                  <FeatureRow
                    key={f.label}
                    label={f.label}
                    available={featureAvailable(f)}
                    isPro={!!isScale}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PricingSection({ onStartTrial }: { onStartTrial: () => void }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-40px" });

  return (
    <section
      id={SECTIONS.pricing}
      className="w-full flex flex-col items-center px-6 py-24 gap-10 border-t border-black/6"
      style={{
        background: "#f7f8f6",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Header */}
      <motion.div
        ref={headingRef}
        initial={{ opacity: 0, y: 20 }}
        animate={headingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4 text-center max-w-xl"
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "#4bac50" }}
        >
          Pricing
        </span>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-neutral-900">
          Simple, honest pricing.
        </h2>
        <p
          className="text-base font-medium leading-relaxed max-w-sm"
          style={{ color: "rgba(0,0,0,0.42)" }}
        >
          Start free. Upgrade only when you outgrow it.
        </p>
      </motion.div>

      {/* Founder banner */}
      <FounderBanner onStartTrial={onStartTrial} />

      {/* Starter / Pro / Scale */}
      <div className="w-full max-w-5xl flex flex-col items-center gap-6">
        <BillingToggle cycle={cycle} onChange={setCycle} />

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          <PricingCard
            name="Starter"
            tagline="For solo operators getting organized."
            price={{ monthly: "Free", annual: "Free" }}
            priceNote="Always free"
            cta="Start free"
            isPro={false}
            features={COMPARISON_FEATURES}
            index={0}
            onCta={onStartTrial}
            cycle={cycle}
          />
          <PricingCard
            name="Pro"
            tagline="For growing teams who need full ops."
            badge="Most popular"
            price={{ monthly: "$6", annual: "$5" }}
            priceNote={{
              monthly: "per month",
              annual: "per month, billed annually",
            }}
            cta="Upgrade to Pro"
            isPro={true}
            features={COMPARISON_FEATURES}
            index={1}
            onCta={onStartTrial}
            cycle={cycle}
          />
          <PricingCard
            name="Scale"
            tagline="For multi-van, high-volume operations."
            badge="Enterprise"
            price={{ monthly: "Custom", annual: "Custom" }}
            priceNote="Contact us for volume pricing"
            cta="Talk to sales"
            isPro={false}
            isScale={true}
            features={COMPARISON_FEATURES}
            index={2}
            onCta={() =>
              window.open(
                "mailto:hello@rinse.app?subject=Scale%20plan%20inquiry",
                "_blank",
              )
            }
            cycle={cycle}
          />
        </div>
      </div>

      {/* Trust bar */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={headingInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="text-xs font-medium text-center"
        style={{ color: "rgba(0,0,0,0.30)" }}
      >
        No credit card required&nbsp;&nbsp;·&nbsp;&nbsp;Cancel any
        time&nbsp;&nbsp;·&nbsp;&nbsp;Upgrade anytime
      </motion.p>
    </section>
  );
}

