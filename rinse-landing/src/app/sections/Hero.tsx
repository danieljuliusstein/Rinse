import { PRIMARY_CTA } from '../shared/urls';
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { EASE, fadeUp, stagger } from "../shared/motion";
import { SECTIONS, scrollToSection } from "../shared/scroll";
import { HeroDashboard, HeroWindowCluster } from "./HeroVisuals";

export function HeroSection({
  onStartTrial,
  onOpenDemo,
}: {
  onStartTrial: () => void;
  onOpenDemo: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const tiltX = useTransform(scrollYProgress, [0, 0.6], [6, 0]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      data-section="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden px-6 lg:px-12"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(51,90,255,0.08), transparent)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 20%, black, transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-7"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => scrollToSection(SECTIONS.workflow)}
            className="inline-flex items-center gap-2 text-[11px] font-mono text-black/50 border border-black/10 bg-black/3 px-4 py-1.5 rounded-full hover:border-black/20 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#4bac50]" />
            Built for mobile detailing businesses
            <ChevronRight size={11} className="text-black/30" />
          </button>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-center text-5xl sm:text-6xl lg:text-[80px] xl:text-[90px] font-extrabold text-neutral-900 tracking-tight leading-[1.05] mb-6"
          initial="hidden"
          animate="show"
          variants={stagger(0.05)}
        >
          {["The operating system", "for mobile detailing."].map((line) => (
            <motion.span key={line} className="block" variants={fadeUp}>
              {line.includes("mobile") ? (
                <>
                  for <span className="text-[#4bac50]">mobile</span> detailing.
                </>
              ) : (
                line
              )}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-center text-base lg:text-lg text-black/40 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55 }}
        >
          Starting a detailing business? Organize your clients and jobs, send invoices,
          and get paid without an expensive subscription. Coming to iOS with a Free plan.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={onStartTrial}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-all ease-[cubic-bezier(0.16,1,0.3,1)] text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.24)]"
          >
            {PRIMARY_CTA}
            <ArrowRight size={15} />
          </button>
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-2 text-black/50 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-sm font-semibold px-6 py-3 rounded-xl border border-black/8 hover:border-black/16 bg-black/2"
          >
            Explore Rinse
          </button>
        </motion.div>

        {/* Window cluster — desktop: draggable multi-window reveal */}
        <motion.div
          className="hidden lg:block"
          style={{ y: mockupY, opacity: mockupOpacity }}
        >
          <HeroWindowCluster />
        </motion.div>

        {/* Mobile/tablet fallback: single static dashboard mockup */}
        <motion.div
          className="lg:hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
        >
          <HeroDashboard />
        </motion.div>
      </div>
    </section>
  );
}

