import { useState, type ElementType } from "react";
import { motion } from "motion/react";
import { Calendar, ArrowRight, Zap, Smartphone, MapPin, CreditCard, Mail, BookOpen } from "lucide-react";
import { FadeUpWhenVisible } from "../shared/motion";

export const ECOSYSTEM_INTEGRATIONS = [
  { id: 0, name: "Stripe", color: "#635BFF", icon: CreditCard },
  { id: 1, name: "Google Calendar", color: "#4285F4", icon: Calendar },
  { id: 2, name: "QuickBooks", color: "#2CA01C", icon: BookOpen },
  { id: 4, name: "Zapier", color: "#FF4A00", icon: Zap },
  { id: 5, name: "Google Maps", color: "#34A853", icon: MapPin },
  { id: 6, name: "Apple Pay", color: "#A0A0A0", icon: Smartphone },
  { id: 7, name: "Mailchimp", color: "#FFE01B", icon: Mail },
] as const;

export const ECOSYSTEM_TOP_ROW = [
  ...ECOSYSTEM_INTEGRATIONS,
  ...ECOSYSTEM_INTEGRATIONS,
];
export const ECOSYSTEM_BOTTOM_ROW = [
  ...ECOSYSTEM_INTEGRATIONS.slice(4),
  ...ECOSYSTEM_INTEGRATIONS.slice(0, 4),
  ...ECOSYSTEM_INTEGRATIONS.slice(4),
  ...ECOSYSTEM_INTEGRATIONS.slice(0, 4),
];

interface EcosystemCardProps {
  id: number;
  name: string;
  color: string;
  icon: ElementType;
}

export function EcosystemCard({ name, color, icon: Icon }: EcosystemCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        scale: hovered ? 1.03 : 1,
        borderColor: hovered ? `${color}60` : "rgba(0,0,0,0.09)",
        boxShadow: hovered
          ? `0 0 0 1px ${color}18, 0 8px 24px rgba(0,0,0,0.08)`
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex items-center gap-3.5 px-5 shrink-0 cursor-default select-none"
      style={{
        width: 200,
        height: 80,
        borderRadius: 9999,
        border: "1px solid rgba(0,0,0,0.09)",
        background: "#ffffff",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-full"
        style={{
          width: 36,
          height: 36,
          background: `${color}15`,
          border: `1px solid ${color}28`,
        }}
      >
        <Icon size={15} color={color} strokeWidth={2.2} />
      </div>
      <span
        className="text-sm font-medium whitespace-nowrap tracking-tight"
        style={{ color: "rgba(0,0,0,0.55)" }}
      >
        {name}
      </span>
    </motion.div>
  );
}

export function EcosystemSection() {
  return (
    <section className="relative w-full py-32 bg-white overflow-hidden border-t border-black/6">
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .eco-scroll-left { animation: marquee-left 32s linear infinite; }
        .eco-marquee-zone:hover .eco-scroll-left {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header — left-aligned, with CTA on the right */}
      <div className="relative z-10 px-6 lg:px-12 mb-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <FadeUpWhenVisible className="mb-4">
              <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#4bac50] font-mono">
                Ecosystem
              </p>
            </FadeUpWhenVisible>
            <FadeUpWhenVisible delay={0.06}>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-neutral-900">
                Plays well with the tools
                <br />
                you already run.
              </h2>
            </FadeUpWhenVisible>
          </div>
          <FadeUpWhenVisible delay={0.1}>
            <motion.button
              onClick={() => scrollToSection(SECTIONS.cta)}
              whileHover={{
                borderColor: "rgba(75,172,80,0.55)",
                background: "rgba(75,172,80,0.1)",
              }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors flex-shrink-0"
              style={{
                border: "1px solid rgba(75,172,80,0.28)",
                color: "#4bac50",
                background: "rgba(75,172,80,0.05)",
              }}
            >
              See all integrations
              <ArrowRight size={13} strokeWidth={2.5} />
            </motion.button>
          </FadeUpWhenVisible>
        </div>
      </div>

      {/* Single marquee row */}
      <div className="relative eco-marquee-zone">
        {/* Edge fades */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: 140,
            background: "linear-gradient(to right, #ffffff 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 z-10 pointer-events-none"
          style={{
            width: 140,
            background: "linear-gradient(to left, #ffffff 0%, transparent 100%)",
          }}
        />
        <div className="overflow-hidden">
          <div
            className="eco-scroll-left flex gap-4 py-3"
            style={{ width: "max-content" }}
          >
            {ECOSYSTEM_TOP_ROW.map((item, i) => (
              <EcosystemCard key={`t-${i}`} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
