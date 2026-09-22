import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Star, Route, Plus, Play } from "lucide-react";
import { SECTIONS } from "../shared/scroll";
import { FadeUpWhenVisible } from "../shared/motion";
import { useCountUp } from "../shared/hooks";

export function TestimonialStars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill="#4bac50" color="#4bac50" />
      ))}
    </div>
  );
}

export function TestimonialAvatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: "rgba(75,172,80,0.10)", color: "#4bac50" }}
    >
      {initials}
    </div>
  );
}

export const TESTIMONIALS = [
  {
    id: "marcus",
    quote:
      "We were drowning in spreadsheets — separate sheets for invoicing, scheduling, follow-ups. The moment we moved to Rinse, everything collapsed into one place. Six bookings a week became twenty-two in under ninety days. I stopped doing admin at midnight.",
    name: "Marcus Rivera",
    title: "Owner",
    company: "Apex Mobile Detailing",
    location: "Los Angeles, CA",
    initials: "MR",
    featured: true,
    watchStory: false,
  },
  {
    id: "dominique",
    quote:
      "Route optimization alone saves us two hours every single day. That's ten hours a week we put back into client work, not logistics. Our techs actually show up on time now — customers noticed before we even told them.",
    name: "Dominique Osei",
    title: "CEO",
    company: "Prestige Auto Spa",
    location: "Atlanta, GA",
    initials: "DO",
    watchStory: true,
    featured: false,
  },
  {
    id: "priya",
    quote:
      "Running solo used to mean flying blind. Now my dashboards give me a real picture of revenue, retention, and where I'm losing jobs. It feels like I have a full operations team backing me up.",
    name: "Priya Nair",
    title: "Founder",
    company: "Shine Theory Detailing",
    location: "Austin, TX",
    initials: "PN",
    featured: false,
    watchStory: false,
  },
];

export const TESTIMONIAL_STATS = [
  { label: "Early access", sub: "Now open" },
  { label: "Founding cohort", sub: "Limited spots" },
  { label: "No contracts", sub: "Cancel any time" },
];

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const featured = TESTIMONIALS.find((t) => t.featured)!;
  const secondary = TESTIMONIALS.filter((t) => !t.featured);

  return (
    <section
      id={SECTIONS.testimonials}
      className="w-full flex flex-col items-center px-6 py-24 gap-16 border-t border-black/6"
      style={{
        background: "#f7f8f6",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ── Header: headline + stats strip ── */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-end justify-between gap-8"
      >
        {/* Headline */}
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.07] text-neutral-900">
            Built by operators,
          </h2>
          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.07]"
            style={{ color: "rgba(0,0,0,0.22)" }}
          >
            for operators.
          </h2>
        </div>

        {/* Stats strip */}
        <div className="flex items-center flex-shrink-0">
          {TESTIMONIAL_STATS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col gap-0.5 px-5 first:pl-0">
                <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">
                  {s.label}
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#4bac50", letterSpacing: "0.08em" }}
                >
                  {s.sub}
                </span>
              </div>
              {i < TESTIMONIAL_STATS.length - 1 && (
                <div
                  className="w-px h-8 flex-shrink-0"
                  style={{ background: "rgba(0,0,0,0.10)" }}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Testimonials grid ── */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
        {/* Featured — spans 3 cols */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-3 bg-white rounded-2xl border p-8 flex flex-col justify-between gap-10"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="flex flex-col gap-6">
            <TestimonialStars />
            <p className="text-xl font-semibold leading-relaxed text-neutral-900">
              "{featured.quote}"
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TestimonialAvatar initials={featured.initials} size="md" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-neutral-900">
                {featured.name}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(0,0,0,0.42)" }}
              >
                {featured.title}, {featured.company} · {featured.location}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Secondary cards — spans 2 cols, stacked */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {secondary.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              transition={{
                duration: 0.52,
                delay: 0.16 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-white rounded-2xl border p-6 flex flex-col justify-between gap-6 flex-1"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            >
              <div className="flex flex-col gap-4">
                <TestimonialStars />
                <p
                  className="text-sm font-medium leading-relaxed"
                  style={{ color: "rgba(0,0,0,0.72)" }}
                >
                  "{t.quote}"
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {t.watchStory && (
                  <button
                    className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full text-xs font-bold border transition-colors hover:bg-neutral-50 focus:outline-none"
                    style={{
                      borderColor: "rgba(0,0,0,0.12)",
                      color: "#0f1210",
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#4bac50" }}
                    >
                      <Play size={9} fill="white" color="white" />
                    </span>
                    Watch story
                  </button>
                )}
                <div className="flex items-center gap-2.5">
                  <TestimonialAvatar initials={t.initials} size="sm" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-neutral-900">
                      {t.name}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "rgba(0,0,0,0.38)" }}
                    >
                      {t.title}, {t.company} · {t.location}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
type PricingPlan = "founder" | "starter" | "pro";
type BillingCycle = "monthly" | "annual";
