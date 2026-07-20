import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route as ReactRoute, useNavigate } from "react-router";
import rinseLogo from "../assets/rinse-logo.svg";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useInView,
} from "motion/react";
import {
  Calendar,
  BarChart2,
  Users,
  Bell,
  Check,
  ArrowRight,
  Menu,
  X,
  Car,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Route,
  Smartphone,
  Shield,
  MapPin,
  Plus,
  MoreHorizontal,
  ChevronRight,
  CreditCard,
  Package,
  MessageSquare,
  Wallet,
  Mail,
  BookOpen,
  Play,
} from "lucide-react";

const SECTIONS = {
  features: "features",
  workflow: "workflow",
  pricing: "pricing",
  testimonials: "testimonials",
  cta: "cta",
} as const;

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Demo Modal ────────────────────────────────────────────────────────────────
function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Product demo"
    >
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close demo"
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-black/10 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
          <div>
            <div className="text-sm font-semibold text-neutral-900">
              Rinse product tour
            </div>
            <div className="text-[11px] text-black/35 font-mono mt-0.5">
              2-minute overview
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/50 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="aspect-video bg-[#06060C] flex items-center justify-center relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#4bac50]/20 border border-[#4bac50]/30 flex items-center justify-center mx-auto mb-4">
              <div className="w-0 h-0 border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent border-l-[14px] border-l-[#4bac50] ml-1" />
            </div>
            <p className="text-sm text-black/50 mb-4">
              See how Rinse handles bookings, scheduling, and payments in one
              workflow.
            </p>
            <button
              onClick={() => {
                onClose();
                scrollToSection(SECTIONS.cta);
              }}
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Start free trial instead
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2200, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

// ─── Shared motion system ───────────────────────────────────────────────────────
// Attio-style motion personality: mechanical, structured, never bouncy.
// Micro-interactions (hover/tab/toggle): 0.15–0.2s. Macro (section/page reveals): 0.4–0.6s.
const EASE = [0.16, 1, 0.3, 1] as const;
const TRANSITION_MICRO = { duration: 0.18, ease: EASE };
const TRANSITION_MACRO = { duration: 0.5, ease: EASE };

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_MACRO,
  },
};
const stagger = (d = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

function FadeUpWhenVisible({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            ...TRANSITION_MACRO,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Workflow step mockups ─────────────────────────────────────────────────────
function BookingMockup() {
  const fields = [
    ["Customer", "Alex Chen"],
    ["Service", "Full Detail + Ceramic"],
    ["Vehicle", "2023 Tesla Model S"],
    ["Date", "Thursday, June 12"],
    ["Time", "10:00 AM"],
  ];
  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.7)]">
      <div className="px-5 py-4 border-b border-black/6 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#4bac50]/20 flex items-center justify-center">
          <Car size={13} className="text-[#4bac50]" />
        </div>
        <span className="text-sm font-semibold text-neutral-900">
          New Booking
        </span>
        <span className="ml-auto text-[10px] font-mono text-[#4bac50] bg-[#4bac50]/10 px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>
      <div className="p-5 space-y-2.5">
        {fields.map(([label, value], i) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[11px] text-black/35 font-mono uppercase tracking-wider">
              {label}
            </span>
            <motion.span
              className="text-xs font-semibold text-neutral-900"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.11, duration: 0.4 }}
            >
              {value}
            </motion.span>
          </div>
        ))}
        <div className="pt-3 border-t border-black/6 flex items-center justify-between">
          <span className="text-[11px] text-black/35 font-mono uppercase tracking-wider">
            Estimate
          </span>
          <span className="text-base font-bold text-[#4bac50] font-mono">
            $299.00
          </span>
        </div>
        <motion.button
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-white text-sm font-semibold mt-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          Confirm Booking
        </motion.button>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = [9, 10, 11, 12, 13, 14];
  const existing = [
    { day: 0, label: "BMW M4", color: "#7C3AED" },
    { day: 0, label: "Porsche 911", color: "#2563EB" },
    { day: 1, label: "Audi RS7", color: "#0891B2" },
    { day: 2, label: "Range Rover", color: "#059669" },
    { day: 2, label: "Merc AMG", color: "#7C3AED" },
    { day: 4, label: "Ferrari 488", color: "#EA580C" },
    { day: 5, label: "Lamborghini", color: "#CA8A04" },
    { day: 5, label: "Rolls Royce", color: "#DB2777" },
  ];
  return (
    <div className="w-full max-w-[440px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.7)]">
      <div className="px-5 py-3.5 border-b border-black/6 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">
          June 9–14, 2025
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-black/30">Week</span>
          <div className="w-6 h-6 rounded-lg bg-black/6 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]">
            <Plus size={11} className="text-black/50" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-6 gap-1 mb-3">
          {days.map((d, i) => (
            <div
              key={d}
              className={`text-center py-1.5 rounded-lg ${i === 3 ? "bg-[#4bac50]/15" : ""}`}
            >
              <div className="text-[9px] font-mono text-black/30 uppercase">
                {d}
              </div>
              <div
                className={`text-sm font-bold mt-0.5 ${i === 3 ? "text-[#4bac50]" : "text-black/70"}`}
              >
                {dates[i]}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1 min-h-[130px]">
          {days.map((_, col) => (
            <div key={col} className="space-y-1">
              {existing
                .filter((j) => j.day === col)
                .map((job, ji) => (
                  <div
                    key={ji}
                    className="rounded-md p-1.5 cursor-pointer"
                    style={{ background: job.color + "55" }}
                  >
                    <div
                      className="text-[9px] font-semibold truncate"
                      style={{ color: job.color + "FF" }}
                    >
                      {job.label}
                    </div>
                  </div>
                ))}
              {col === 3 && (
                <motion.div
                  className="rounded-md p-1.5 ring-1 ring-[#4bac50]/60 cursor-pointer"
                  style={{ background: "rgba(20,104,255,0.35)" }}
                  initial={{ opacity: 0, scale: 0.75, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.45, type: "spring", bounce: 0.35 }}
                >
                  <div className="text-[9px] font-bold text-[#4bac50]">
                    Tesla S
                  </div>
                  <div className="text-[9px] text-[#4bac50]/70">10 AM ✦</div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssignMockup() {
  const techs = [
    {
      name: "Marcus T.",
      rating: "4.9",
      jobs: 127,
      status: "available",
      active: true,
    },
    {
      name: "Jordan K.",
      rating: "4.8",
      jobs: 94,
      status: "available",
      active: false,
    },
    {
      name: "Ryan S.",
      rating: "4.7",
      jobs: 82,
      status: "on job",
      active: false,
    },
  ];
  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.7)]">
      <div className="px-5 py-4 border-b border-black/6">
        <div className="text-sm font-semibold text-neutral-900">
          Assign Technician
        </div>
        <div className="text-[11px] text-black/35 mt-0.5 font-mono">
          Tesla Model S · Full Detail · Jun 12
        </div>
      </div>
      <div className="p-4 space-y-2">
        {techs.map((t, i) => (
          <motion.div
            key={t.name}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${
              t.active
                ? "border-[#4bac50]/40 bg-[#4bac50]/10"
                : "border-black/5 bg-black/2 hover:border-black/10"
            }`}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                t.active
                  ? "bg-[#4bac50] text-white"
                  : "bg-black/8 text-black/50"
              }`}
            >
              {t.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900">
                {t.name}
              </div>
              <div className="text-[10px] text-black/35 font-mono">
                ★ {t.rating} · {t.jobs} jobs
              </div>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                t.status === "available"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-orange-500/15 text-orange-400"
              }`}
            >
              {t.status}
            </span>
            {t.active && (
              <motion.div
                className="w-5 h-5 rounded-full bg-[#4bac50] flex items-center justify-center flex-shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.55, type: "spring" }}
              >
                <Check size={10} className="text-white" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <motion.button
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-white text-sm font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Assign Marcus T. →
        </motion.button>
      </div>
    </div>
  );
}

function InvoiceMockup() {
  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.7)]">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono text-black/30 uppercase tracking-widest">
              Invoice
            </div>
            <div className="text-lg font-bold text-neutral-900 mt-0.5 font-mono">
              #INV-2847
            </div>
            <div className="text-[11px] text-black/35 mt-1">Alex Chen</div>
          </div>
          <motion.div
            className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            ✓ Sent
          </motion.div>
        </div>
        <div className="space-y-0">
          {[
            ["Full Detail", "$249.00"],
            ["Ceramic Boost", "$50.00"],
          ].map(([name, price]) => (
            <div
              key={name}
              className="flex justify-between py-2.5 border-b border-black/5"
            >
              <span className="text-xs text-black/50">{name}</span>
              <span className="text-xs font-semibold text-neutral-900 font-mono">
                {price}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-2.5">
            <span className="text-sm font-bold text-neutral-900">Total</span>
            <span className="text-base font-bold text-[#4bac50] font-mono">
              $299.00
            </span>
          </div>
        </div>
        <motion.div
          className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-emerald-300">
              Payment received
            </div>
            <div className="text-[10px] text-emerald-400/60 font-mono">
              $299.00 · Visa ····4892 · just now
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [38, 52, 45, 61, 58, 72, 68, 80, 75, 88, 82, 100];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const metrics = [
    { label: "Jobs", value: "62", delta: "+12%" },
    { label: "Avg Ticket", value: "$297", delta: "+8%" },
    { label: "Retention", value: "94%", delta: "+3%" },
  ];
  return (
    <div className="w-full max-w-[400px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.7)]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-neutral-900">
            Revenue Overview
          </span>
          <span className="text-[10px] font-mono text-black/30">2025</span>
        </div>
        <div className="flex items-end gap-2.5 mb-5">
          <span className="text-3xl font-bold text-neutral-900 font-mono">
            $18,420
          </span>
          <div className="flex items-center gap-1 pb-1">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">+23%</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background:
                  i === 11
                    ? "#4bac50"
                    : i >= 9
                      ? "rgba(20,104,255,0.3)"
                      : "rgba(0,0,0,0.08)",
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                delay: i * 0.04,
                duration: 0.5,
                ease: "easeOut",
                originY: 1,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 mb-4">
          {months.map((m, i) => (
            <span
              key={i}
              className={`text-[9px] font-mono ${i === 11 ? "text-[#4bac50]" : "text-black/20"}`}
            >
              {m}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-black/3 border border-black/5 rounded-xl p-2.5"
            >
              <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider">
                {m.label}
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-1 font-mono">
                {m.value}
              </div>
              <div className="text-[9px] text-emerald-400 font-mono">
                {m.delta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero window cluster ────────────────────────────────────────────────────────
const WinDots = () => (
  <div className="flex gap-[5px] items-center flex-shrink-0">
    <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]/70" />
    <div className="w-[9px] h-[9px] rounded-full bg-[#ffbd2e]/70" />
    <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]/70" />
  </div>
);

function WindowChrome({
  title,
  dark = false,
  right,
}: {
  title: string;
  dark?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2.5 border-b flex-shrink-0 ${
        dark ? "border-white/8 bg-white/[0.03]" : "border-black/6 bg-[#fafafa]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <WinDots />
        <span
          className={`text-[11px] font-medium tracking-wide ml-1 ${dark ? "text-white/35" : "text-black/35"}`}
        >
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

// Dispatch team chat — new messages cycle in continuously to feel alive.
function HeroChatPanel() {
  const allMsgs = [
    {
      user: "Priya (Dispatch)",
      av: "PD",
      color: "bg-[#4bac50]",
      text: "Marcus just clocked in for the M3 job on 5th St",
    },
    {
      user: "Marcus T.",
      av: "MT",
      color: "bg-sky-500",
      text: "On site now, starting paint correction",
    },
    {
      user: "Priya (Dispatch)",
      av: "PD",
      color: "bg-[#4bac50]",
      text: "Got it — customer added a ceramic add-on, invoice will update",
    },
    {
      user: "Jordan K.",
      av: "JK",
      color: "bg-violet-500",
      text: "Heads up, running 10 min behind on the GT3 detail",
    },
    {
      user: "Priya (Dispatch)",
      av: "PD",
      color: "bg-[#4bac50]",
      text: "No worries, I've nudged the 2pm slot automatically",
    },
  ];
  const [count, setCount] = useState(3);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c >= allMsgs.length ? 3 : c + 1));
    }, 2600);
    return () => clearInterval(id);
  }, [allMsgs.length]);
  const visible = allMsgs.slice(0, count);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col bg-white"
      style={{
        width: 236,
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <WindowChrome
        title="#dispatch"
        right={
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4bac50]" />
            <span className="text-[10px] text-black/30">3 online</span>
          </div>
        }
      />
      <div className="flex flex-col gap-0.5 px-2 py-2 h-[168px] overflow-hidden justify-end">
        {visible.map((m, i) => (
          <motion.div
            key={`${m.text}-${i}`}
            className="flex gap-2 py-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TRANSITION_MACRO}
          >
            <div
              className={`w-5 h-5 rounded-full ${m.color} flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white mt-0.5`}
            >
              {m.av}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[9px] font-semibold text-neutral-900">
                {m.user}
              </span>
              <span className="text-[10px] leading-[1.4] text-black/45">
                {m.text}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Automation log — terminal-style typewriter cycling through real Rinse automation events.
function HeroLogPanel() {
  const commands = [
    "rinse sync --bookings",
    "→ 3 new bookings pulled from portal",
    "rinse notify --sms-reminder",
    "→ 12 reminders sent · 0 failed",
    "rinse invoice --auto-close job_2291",
    "→ invoice #INV-2291 sent · $299.00",
    "rinse payout --settle",
    "→ settled to Stripe · $18,420.00",
  ];
  const [lineIdx, setLineIdx] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    let charIdx = 0;
    setText("");
    const full = commands[lineIdx];
    const typeId = setInterval(() => {
      charIdx++;
      setText(full.slice(0, charIdx));
      if (charIdx >= full.length) {
        clearInterval(typeId);
        setTimeout(() => setLineIdx((i) => (i + 1) % commands.length), 700);
      }
    }, 28);
    return () => clearInterval(typeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIdx]);

  const history = commands.slice(Math.max(0, lineIdx - 3), lineIdx);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        width: 268,
        background: "#111219",
        border: "1px solid rgba(0,0,0,0.2)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.2), 0 4px 14px rgba(0,0,0,0.1)",
      }}
    >
      <WindowChrome title="zsh — rinse-cli" dark />
      <div className="px-3 py-2.5 flex flex-col gap-1 h-[132px] font-mono overflow-hidden">
        {history.map((l, i) => (
          <div
            key={i}
            className="text-[10px] leading-[1.6] text-white/25 truncate"
          >
            {l}
          </div>
        ))}
        <div className="text-[10px] leading-[1.6] text-white/80 flex items-start gap-1.5">
          {!text.startsWith("→") && (
            <span className="text-[#4bac50] flex-shrink-0">➜</span>
          )}
          <span className={text.startsWith("→") ? "text-[#4bac50]" : ""}>
            {text}
            <span
              className="inline-block w-[5px] h-[10px] align-middle ml-0.5 bg-[#4bac50]"
              style={{ animation: "rinseBlink 1s step-end infinite" }}
            />
          </span>
        </div>
      </div>
      <style>{`@keyframes rinseBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

// Product walkthrough video + transcript, synced auto-scroll.
function HeroVideoPanel() {
  const [playing, setPlaying] = useState(true);
  const transcript = [
    { t: "0:00", text: "Welcome to the Rinse product walkthrough." },
    { t: "0:08", text: "Customers book online — no phone tag required." },
    { t: "0:19", text: "Jobs auto-assign to the nearest available tech." },
    { t: "0:31", text: "Invoices go out the second a job closes." },
    { t: "0:44", text: "And your revenue dashboard updates in real time." },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => (a + 1) % transcript.length),
      2200,
    );
    return () => clearInterval(id);
  }, [transcript.length]);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        width: 272,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <WindowChrome title="Product Overview" />
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: 108,
          background: "linear-gradient(135deg, #0d1a12 0%, #163420 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(ellipse at 30% 60%, #4bac50 0%, transparent 60%)",
          }}
        />
        <motion.div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          animate={{ backgroundPosition: ["0px 0px", "20px 20px"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <button
          onClick={() => setPlaying((p) => !p)}
          className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {playing ? (
            <div className="flex gap-[3px]">
              <div className="w-[3px] h-3 bg-white rounded-sm" />
              <div className="w-[3px] h-3 bg-white rounded-sm" />
            </div>
          ) : (
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[9px] border-l-white ml-0.5" />
          )}
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 flex items-center gap-2">
          <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/15">
            <motion.div
              className="h-full rounded-full bg-[#4bac50]"
              animate={{
                width: `${((active + 1) / transcript.length) * 100}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0 px-2.5 py-2 h-[108px] overflow-hidden">
        {transcript.map((line, i) => (
          <motion.div
            key={i}
            className="flex gap-2 py-1 pl-1.5"
            style={{
              borderLeft:
                i === active ? "2px solid #4bac50" : "2px solid transparent",
            }}
            animate={{ opacity: i === active ? 1 : 0.35 }}
            transition={TRANSITION_MACRO}
          >
            <span className="text-[9px] flex-shrink-0 mt-0.5 font-mono text-[#4bac50] w-7">
              {line.t}
            </span>
            <span className="text-[9px] leading-[1.5] text-black/55">
              {line.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Main window — cycles a "live booking coming in" state to feel alive.
function HeroMainWindow() {
  const jobs = [
    {
      time: "9:00 AM",
      client: "James W.",
      vehicle: "BMW M3 Competition",
      service: "Paint Correction",
      tech: "Marcus T.",
      status: "in-progress",
      amount: "$480",
    },
    {
      time: "11:30 AM",
      client: "Sarah K.",
      vehicle: "Porsche 911 GT3",
      service: "Full Detail",
      tech: "Jordan K.",
      status: "upcoming",
      amount: "$299",
    },
    {
      time: "2:00 PM",
      client: "Alex C.",
      vehicle: "Tesla Model S",
      service: "Ceramic Coating",
      tech: "Unassigned",
      status: "new",
      amount: "$899",
    },
    {
      time: "4:30 PM",
      client: "Derek M.",
      vehicle: "Range Rover SVR",
      service: "Interior Detail",
      tech: "Ryan S.",
      status: "upcoming",
      amount: "$195",
    },
  ];
  const statusStyle: Record<string, string> = {
    "in-progress": "bg-[#4bac50]/20 text-[#4bac50]",
    upcoming: "bg-black/8 text-black/50",
    new: "bg-emerald-500/15 text-emerald-400",
  };

  const cycle = ["New booking arriving…", "Processing…", "Confirmed · $899.00"];
  const [cycleIdx, setCycleIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setCycleIdx((i) => (i + 1) % cycle.length),
      1800,
    );
    return () => clearInterval(id);
  }, [cycle.length]);

  return (
    <div
      className="rounded-2xl overflow-hidden flex select-none"
      style={{
        width: 620,
        height: 400,
        background: "#FAFAFA",
        border: "1px solid rgba(0,0,0,0.09)",
        boxShadow: "0 40px 90px rgba(0,0,0,0.16), 0 6px 20px rgba(0,0,0,0.1)",
      }}
    >
      {/* Sidebar */}
      <div className="w-[150px] flex-shrink-0 border-r border-black/5 p-3.5 flex flex-col gap-1 hidden lg:flex">
        <div className="flex items-center mb-5 px-1.5">
          <img src={rinseLogo} alt="Rinse" className="h-3.5 w-auto" />
        </div>
        {[
          { icon: BarChart2, label: "Dashboard", active: true },
          { icon: Calendar, label: "Schedule" },
          { icon: Users, label: "Customers" },
          { icon: Car, label: "Jobs" },
          { icon: FileText, label: "Invoices" },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${
              item.active ? "bg-[#4bac50]/15 text-[#4bac50]" : "text-black/35"
            }`}
          >
            <item.icon size={13} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-neutral-900">
              Good morning, Jason ☀
            </div>
            <div className="text-[10px] text-black/30 font-mono mt-0.5">
              Monday, June 9, 2025
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={cycleIdx}
              className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#4bac50]/12 text-[#4bac50]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={TRANSITION_MICRO}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#4bac50]" />
              {cycle[cycleIdx]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Today's Revenue", value: "$1,873" },
            { label: "Jobs Today", value: "8" },
            { label: "New Bookings", value: "3" },
            { label: "Avg Rating", value: "4.9★" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-black/3 border border-black/5 rounded-lg p-2.5"
            >
              <div className="text-[8px] font-mono text-black/30 uppercase tracking-wider">
                {s.label}
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-1 font-mono">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-black/5 overflow-hidden flex-1">
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
            <span className="text-[11px] font-semibold text-neutral-900">
              Today's Schedule
            </span>
            <span className="text-[9px] text-black/25 font-mono">
              8 jobs · $1,873
            </span>
          </div>
          {jobs.map((job, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2 ${i < jobs.length - 1 ? "border-b border-black/4" : ""}`}
            >
              <span className="text-[9px] font-mono text-black/30 w-12 flex-shrink-0">
                {job.time}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-neutral-900 truncate">
                  {job.client} · {job.vehicle}
                </div>
                <div className="text-[9px] text-black/30 font-mono truncate">
                  {job.service} · {job.tech}
                </div>
              </div>
              <span
                className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusStyle[job.status]}`}
              >
                {job.status}
              </span>
              <span className="text-[11px] font-bold font-mono text-black/60 flex-shrink-0">
                {job.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroWindowCluster() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Which window is on top / focused
  const [focused, setFocused] = useState<"main" | "chat" | "log" | "video" | null>(null);

  // Side panels are hidden until the user scrolls even a little
  const [showSide, setShowSide] = useState(false);
  // Once the entrance animation finishes, flip to fast focus transitions
  const [sideEntered, setSideEntered] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => {
    if (v > 50) setShowSide(true);
  });

  // ── helpers ──────────────────────────────────────────────────────────────────
  const dimmed   = (id: string) => focused !== null && focused !== id;
  const wOpacity = (id: string) => (dimmed(id) ? 0.65 : 1);
  const wScale   = (id: string) => (dimmed(id) ? 0.984 : 1);
  const zFor     = (id: "main" | "chat" | "log" | "video", base: number) =>
    focused === id ? 50 : base;

  // Fast transition for focus changes; slower for entrance
  const FOCUS_T  = { duration: 0.13, ease: "easeOut" as const };
  const enterT   = (delay: number) => ({ duration: 0.38, ease: EASE, delay });

  // Per-element transition: fast once entered, staggered on entrance
  const trans = (id: string, delay: number, dir: "x" | "y" = "x") =>
    sideEntered
      ? FOCUS_T
      : { opacity: enterT(delay), [dir]: enterT(delay), scale: FOCUS_T };

  const dragProps = {
    drag: true as const,
    dragMomentum: false,
    dragElastic: 0.08,
    dragConstraints: containerRef,
    whileDrag: { scale: 1.018, zIndex: 99 },
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{ width: 1040, height: 460 }}
    >
      {/* ── Main dashboard — draggable, visible immediately on load ─────────── */}
      <motion.div
        {...dragProps}
        className="absolute cursor-grab active:cursor-grabbing select-none"
        style={{ top: 8, left: "calc(50% - 310px)", zIndex: zFor("main", 30) }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: wOpacity("main"), y: 0, scale: wScale("main") }}
        transition={
          sideEntered
            ? FOCUS_T
            : {
                opacity: { duration: 0.5, ease: EASE },
                y:       { duration: 0.5, ease: EASE },
                scale:   FOCUS_T,
              }
        }
        onPointerDown={() => setFocused("main")}
      >
        <HeroMainWindow />
      </motion.div>

      {/* ── Side panels — revealed staggered on first scroll ─────────────────── */}
      {showSide && (
        <>
          {/* Chat — top-left */}
          <motion.div
            {...dragProps}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ top: 20, left: 0, zIndex: zFor("chat", 20) }}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: wOpacity("chat"), x: 0, scale: wScale("chat") }}
            transition={trans("chat", 0)}
            onPointerDown={() => setFocused("chat")}
            onAnimationComplete={() => { if (!sideEntered) setSideEntered(true); }}
          >
            <HeroChatPanel />
          </motion.div>

          {/* Log — bottom-left */}
          <motion.div
            {...dragProps}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ bottom: 0, left: 40, zIndex: zFor("log", 20) }}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: wOpacity("log"), x: 0, scale: wScale("log") }}
            transition={trans("log", 0.14)}
            onPointerDown={() => setFocused("log")}
          >
            <HeroLogPanel />
          </motion.div>

          {/* Video — top-right */}
          <motion.div
            {...dragProps}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ top: 44, right: 0, zIndex: zFor("video", 20) }}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: wOpacity("video"), x: 0, scale: wScale("video") }}
            transition={trans("video", 0.26)}
            onPointerDown={() => setFocused("video")}
          >
            <HeroVideoPanel />
          </motion.div>
        </>
      )}
    </div>
  );
}

// ─── Hero Dashboard Mockup (mobile/tablet fallback — static, no drag) ──────────
function HeroDashboard() {
  const jobs = [
    {
      time: "9:00 AM",
      client: "James W.",
      vehicle: "BMW M3 Competition",
      service: "Paint Correction",
      tech: "Marcus T.",
      status: "in-progress",
      amount: "$480",
    },
    {
      time: "11:30 AM",
      client: "Sarah K.",
      vehicle: "Porsche 911 GT3",
      service: "Full Detail",
      tech: "Jordan K.",
      status: "upcoming",
      amount: "$299",
    },
    {
      time: "2:00 PM",
      client: "Alex C.",
      vehicle: "Tesla Model S",
      service: "Ceramic Coating",
      tech: "Unassigned",
      status: "new",
      amount: "$899",
    },
    {
      time: "4:30 PM",
      client: "Derek M.",
      vehicle: "Range Rover SVR",
      service: "Interior Detail",
      tech: "Ryan S.",
      status: "upcoming",
      amount: "$195",
    },
  ];
  const statusStyle: Record<string, string> = {
    "in-progress": "bg-[#4bac50]/20 text-[#4bac50]",
    upcoming: "bg-black/8 text-black/50",
    new: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <div className="relative w-full select-none">
      {/* Dashboard frame */}
      <div className="rounded-2xl overflow-hidden border border-black/8 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.9)] bg-[#FAFAFA] flex">
        {/* Sidebar */}
        <div className="w-[180px] flex-shrink-0 bg-[#07071000] border-r border-black/5 p-4 flex flex-col gap-1 hidden lg:flex">
          <div className="flex items-center mb-5 px-2">
            <img src={rinseLogo} alt="Rinse" className="h-4 w-auto" />
          </div>
          {[
            { icon: BarChart2, label: "Dashboard", active: true },
            { icon: Calendar, label: "Schedule", active: false },
            { icon: Users, label: "Customers", active: false },
            { icon: Car, label: "Jobs", active: false },
            { icon: FileText, label: "Invoices", active: false },
            { icon: CreditCard, label: "Payments", active: false },
            { icon: Route, label: "Routes", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${
                item.active
                  ? "bg-[#4bac50]/15 text-[#4bac50]"
                  : "text-black/35 hover:text-black/60 hover:bg-black/4"
              }`}
            >
              <item.icon size={14} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
          <div className="mt-auto flex items-center gap-2 px-2 py-2">
            <div className="w-6 h-6 rounded-full bg-[#4bac50] flex items-center justify-center text-[10px] font-bold text-white">
              J
            </div>
            <span className="text-[10px] text-black/30">Jason M.</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-bold text-neutral-900">
                Good morning, Jason ☀
              </div>
              <div className="text-[11px] text-black/30 font-mono mt-0.5">
                Monday, June 9, 2025
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black/5 border border-black/6 flex items-center justify-center cursor-pointer">
                <Bell size={13} className="text-black/40" />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              {
                label: "Today's Revenue",
                value: "$1,873",
                delta: "+18%",
                up: true,
              },
              { label: "Jobs Today", value: "8", delta: "6 active", up: true },
              {
                label: "New Bookings",
                value: "3",
                delta: "This week",
                up: false,
              },
              {
                label: "Avg Rating",
                value: "4.9★",
                delta: "↑ from 4.7",
                up: true,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-black/3 border border-black/5 rounded-xl p-3"
              >
                <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider">
                  {s.label}
                </div>
                <div className="text-base font-bold text-neutral-900 mt-1 font-mono">
                  {s.value}
                </div>
                <div
                  className={`text-[9px] font-mono mt-0.5 ${s.up ? "text-emerald-400" : "text-black/30"}`}
                >
                  {s.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Jobs table */}
          <div className="rounded-xl border border-black/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
              <span className="text-xs font-semibold text-neutral-900">
                Today's Schedule
              </span>
              <span className="text-[10px] text-black/25 font-mono">
                8 jobs · $1,873
              </span>
            </div>
            {jobs.map((job, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < jobs.length - 1 ? "border-b border-black/4" : ""} hover:bg-black/2 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer`}
              >
                <span className="text-[10px] font-mono text-black/30 w-14 flex-shrink-0">
                  {job.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 truncate">
                    {job.client} · {job.vehicle}
                  </div>
                  <div className="text-[10px] text-black/30 font-mono truncate">
                    {job.service} · {job.tech}
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle[job.status]}`}
                >
                  {job.status}
                </span>
                <span className="text-xs font-bold font-mono text-black/60 flex-shrink-0">
                  {job.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <motion.div
        className="absolute -bottom-5 -right-5 rounded-xl border border-black/10 bg-white/95 backdrop-blur-xl p-3 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-[240px]"
        initial={{ opacity: 0, y: 20, x: 10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{
          delay: 1.6,
          duration: 0.6,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-[#4bac50]/20 flex items-center justify-center flex-shrink-0">
          <Bell size={14} className="text-[#4bac50]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-neutral-900">
            New booking
          </div>
          <div className="text-[10px] text-black/40 font-mono">
            Ferrari 488 · Sat Jun 14
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#4bac50] flex-shrink-0" />
      </motion.div>

      {/* Floating revenue card */}
      <motion.div
        className="absolute -top-4 -left-4 rounded-xl border border-black/10 bg-white/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        initial={{ opacity: 0, y: -15, x: -10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{
          delay: 1.8,
          duration: 0.6,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
      >
        <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider mb-1">
          This Month
        </div>
        <div className="text-xl font-bold text-neutral-900 font-mono">
          $18,420
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <TrendingUp size={10} className="text-emerald-400" />
          <span className="text-[9px] font-mono text-emerald-400">
            +23% vs last month
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Workflow Section ─────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    icon: Car,
    label: "Customer books online",
    desc: "Customers self-book via your branded portal 24/7. Smart availability, service pricing, and vehicle details — all captured automatically.",
    mockup: <BookingMockup />,
  },
  {
    icon: Calendar,
    label: "Calendar updates instantly",
    desc: "Every booking lands on your live schedule in real time. No double-bookings, no phone tags. Your week populates itself.",
    mockup: <CalendarMockup />,
  },
  {
    icon: Users,
    label: "Technician gets assigned",
    desc: "Route-optimized auto-assignment or manual override — your call. Techs receive push notifications with full job details.",
    mockup: <AssignMockup />,
  },
  {
    icon: FileText,
    label: "Invoice sent & payment collected",
    desc: "Branded invoices are auto-generated and emailed the moment a job closes. Stripe-powered payments hit your account within minutes.",
    mockup: <InvoiceMockup />,
  },
  {
    icon: BarChart2,
    label: "Analytics update in real time",
    desc: "Revenue, retention, and technician performance track automatically. See what's working and where to grow — without spreadsheets.",
    mockup: <AnalyticsMockup />,
  },
];

// Node/edge graph data per step — powers the animated "Interactive Node Canvas".
const NODE_GRAPHS = [
  {
    nodes: [
      { icon: Users, label: "Customer" },
      { icon: Smartphone, label: "Booking Portal" },
      { icon: Calendar, label: "Calendar" },
    ],
    pill: { icon: CheckCircle, label: "Booked" },
  },
  {
    nodes: [
      { icon: Calendar, label: "New Booking" },
      { icon: Zap, label: "Calendar Engine" },
      { icon: Users, label: "Team Schedule" },
    ],
    pill: { icon: CheckCircle, label: "Synced" },
  },
  {
    nodes: [
      { icon: Car, label: "Job Queue" },
      { icon: Route, label: "Route Engine" },
      { icon: Users, label: "Technician" },
    ],
    pill: { icon: CheckCircle, label: "Assigned" },
  },
  {
    nodes: [
      { icon: FileText, label: "Job Complete" },
      { icon: DollarSign, label: "Invoice Engine" },
      { icon: CreditCard, label: "Stripe" },
    ],
    pill: { icon: CheckCircle, label: "Paid" },
  },
  {
    nodes: [
      { icon: BarChart2, label: "Live Data" },
      { icon: Zap, label: "Analytics Engine" },
      { icon: TrendingUp, label: "Dashboard" },
    ],
    pill: { icon: CheckCircle, label: "Live" },
  },
];

const NODE_POS = [
  { x: 40, y: 210 },
  { x: 260, y: 70 },
  { x: 480, y: 210 },
];

function NodeGraph({
  graph,
  replayKey,
}: {
  graph: (typeof NODE_GRAPHS)[number];
  replayKey: number;
}) {
  return (
    <div
      key={replayKey}
      className="relative rounded-2xl border border-black/8 bg-[#FAFAFA] overflow-hidden"
      style={{ width: 520, height: 300 }}
    >
      <svg viewBox="0 0 520 300" className="absolute inset-0 w-full h-full">
        <motion.path
          d={`M ${NODE_POS[0].x + 34} ${NODE_POS[0].y} Q ${(NODE_POS[0].x + NODE_POS[1].x) / 2} ${NODE_POS[0].y} ${NODE_POS[1].x - 34} ${NODE_POS[1].y + 6}`}
          fill="none"
          stroke="#4bac50"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
        />
        <motion.path
          d={`M ${NODE_POS[1].x + 34} ${NODE_POS[1].y + 6} Q ${(NODE_POS[1].x + NODE_POS[2].x) / 2} ${NODE_POS[1].y} ${NODE_POS[2].x - 34} ${NODE_POS[2].y}`}
          fill="none"
          stroke="#4bac50"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.5 }}
        />
      </svg>

      {graph.nodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center gap-2"
          style={{ left: NODE_POS[i].x - 34, top: NODE_POS[i].y - 34 }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE, delay: i * 0.15 }}
        >
          <div className="w-[68px] h-[68px] rounded-2xl bg-white border border-black/8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-center">
            <node.icon size={22} className="text-[#4bac50]" />
          </div>
          <span className="text-[10px] font-mono text-black/40 whitespace-nowrap">
            {node.label}
          </span>
        </motion.div>
      ))}

      <motion.div
        className="absolute flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4bac50] text-white text-[10px] font-mono shadow-[0_8px_20px_rgba(75,172,80,0.35)]"
        style={{ left: NODE_POS[2].x - 24, top: NODE_POS[2].y + 42 }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.9 }}
      >
        <graph.pill.icon size={11} />
        {graph.pill.label}
      </motion.div>
    </div>
  );
}

function NodeCanvasSection() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver — step becomes active when it crosses into the top
  // 40 % of the viewport. Real native scroll, no pinning.
  useEffect(() => {
    const observers = stepRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStep(i); },
        { rootMargin: "0px 0px -55% 0px", threshold: 0 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const scrollToStep = useCallback((i: number) => {
    const el = stepRefs.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <section id={SECTIONS.workflow} className="px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="pt-0 pb-16">
          <FadeUpWhenVisible>
            <span className="text-[10px] font-mono text-[#4bac50] uppercase tracking-[0.2em]">
              How it works
            </span>
          </FadeUpWhenVisible>
        </div>

        {/* ── Desktop: sticky label-only left nav + naturally scrolling right ── */}
        <div className="hidden lg:flex gap-20">

          {/* LEFT — sticky, just step names, green border-l on active */}
          <div className="sticky top-32 self-start w-48 flex-shrink-0 pt-1">
            {WORKFLOW_STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => scrollToStep(i)}
                className={`block w-full text-left py-2.5 pl-4 border-l-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === activeStep
                    ? "border-[#4bac50] text-neutral-900"
                    : "border-black/8 text-black/25 hover:text-black/50 hover:border-black/20"
                }`}
              >
                <span className={`text-sm leading-snug transition-all duration-300 ${
                  i === activeStep ? "font-semibold" : "font-normal"
                }`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>

          {/* RIGHT — real content; each step ~80 vh so scroll feels substantial */}
          <div className="flex-1 min-w-0">
            {WORKFLOW_STEPS.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                className={i < WORKFLOW_STEPS.length - 1 ? "border-b border-black/6" : ""}
                style={{ minHeight: "80vh", paddingTop: "8vh", paddingBottom: "8vh" }}
              >
                {/* Text block */}
                <div className="mb-8 max-w-lg">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-[#4bac50]/15 text-[#4bac50] flex items-center justify-center flex-shrink-0">
                      <step.icon size={12} />
                    </div>
                    <span className="text-[10px] font-mono text-black/25 tracking-widest uppercase">
                      {String(i + 1).padStart(2, "0")} / {String(WORKFLOW_STEPS.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-2xl lg:text-[28px] font-bold text-neutral-900 mb-3 leading-tight">
                    {step.label}
                  </h3>
                  <p className="text-sm text-black/40 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Faint divider between description and mockup */}
                <div className="border-t border-black/6 mb-10" />

                {/* Mockup */}
                <div className="flex items-center justify-start">
                  {step.mockup}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile: plain stacked ── */}
        <div className="lg:hidden max-w-xl mx-auto pb-16">
          <div className="space-y-16">
            {WORKFLOW_STEPS.map((step, i) => (
              <FadeUpWhenVisible key={i} delay={Math.min(i * 0.05, 0.2)}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#4bac50]/25 text-[#4bac50] flex items-center justify-center flex-shrink-0">
                      <step.icon size={15} />
                    </div>
                    <span className="text-[10px] font-mono text-black/25">
                      {i + 1} / {WORKFLOW_STEPS.length}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-neutral-900 mb-2">{step.label}</div>
                  <p className="text-sm text-black/40 leading-relaxed mb-6">{step.desc}</p>
                  <div className="border-t border-black/6 mb-6" />
                  <div className="flex justify-center">{step.mockup}</div>
                </div>
              </FadeUpWhenVisible>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────────
// Scroll-only links — in page order
const SCROLL_NAV_LINKS = [
  { label: "Workflow", id: SECTIONS.workflow },
  { label: "Reviews",  id: SECTIONS.testimonials },
  { label: "Pricing",  id: SECTIONS.pricing },
] as const;

const NAV_LINK_CLS =
  "text-sm text-black/45 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] duration-200";

function Nav({ onStartTrial }: { onStartTrial: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleScroll = useCallback((id: string) => {
    scrollToSection(id);
    setOpen(false);
  }, []);

  const handleFeatures = useCallback(() => {
    navigate("/features");
    setOpen(false);
  }, [navigate]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-300 ${
        scrolled
          ? "border-b border-black/6 bg-white/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="Rinse home"
        >
          <img src={rinseLogo} alt="Rinse" className="h-6 w-auto" />
        </button>

        {/* Desktop links — Features first (own page), then scroll links in page order */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={handleFeatures} className={NAV_LINK_CLS}>
            Features
          </button>
          {SCROLL_NAV_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleScroll(item.id)}
              className={NAV_LINK_CLS}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://app.rinse.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-black/50 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            Sign in
          </a>
          <button
            onClick={onStartTrial}
            className="text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] px-4 py-2 rounded-xl"
          >
            Start free trial
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center text-black/50"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/6 bg-white/95 backdrop-blur-xl px-6 py-4 space-y-3">
          <button
            onClick={handleFeatures}
            className="block w-full text-left text-sm text-black/50 hover:text-neutral-900 py-1.5"
          >
            Features
          </button>
          {SCROLL_NAV_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleScroll(item.id)}
              className="block w-full text-left text-sm text-black/50 hover:text-neutral-900 py-1.5"
            >
              {item.label}
            </button>
          ))}
          <a
            href="https://app.rinse.app/login"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full text-left text-sm text-black/50 hover:text-neutral-900 py-1.5"
          >
            Sign in
          </a>
          <button
            onClick={() => { onStartTrial(); setOpen(false); }}
            className="block w-full text-sm font-semibold text-white bg-neutral-900 px-4 py-2.5 rounded-xl text-center mt-2"
          >
            Start free trial
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Features Page ────────────────────────────────────────────────────────────
function FeaturesPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Minimal back nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/6 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-black/40 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <ChevronRight size={14} className="rotate-180" />
            Home
          </button>
          <div className="w-px h-4 bg-black/10" />
          <span className="text-sm font-semibold text-neutral-900">Features</span>
        </div>
      </nav>
      <div className="pt-16">
        <FeaturesSection />
      </div>
    </div>
  );
}

// ─── Ecosystem Modal ──────────────────────────────────────────────────────────
// ─── Ecosystem Inline Panel ───────────────────────────────────────────────────
const ECO_INTEGRATIONS = [
  { name: "Notion",          slug: "notion" },
  { name: "Slack",           slug: "slack" },
  { name: "ChatGPT",         slug: "openai" },
  { name: "Claude",          slug: "anthropic" },
  { name: "Stripe",          slug: "stripe" },
  { name: "Zapier",          slug: "zapier" },
  { name: "Mailchimp",       slug: "mailchimp" },
  { name: "Google Calendar", slug: "googlecalendar" },
  { name: "Google Maps",     slug: "googlemaps" },
  { name: "Linear",          slug: "linear" },
  { name: "Apple",           slug: "apple" },
  { name: "Twilio",          slug: "twilio" },
  { name: "QuickBooks",      slug: "quickbooks" },
  { name: "HubSpot",         slug: "hubspot" },
  { name: "Xero",            slug: "xero" },
  { name: "GitHub",          slug: "github" },
];

// Triple the list so the loop never shows a gap during drag
const ECO_ROW = [...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS];

function EcosystemInlinePanel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number>(0);
  const state    = useRef({ offset: 0, dragging: false, startX: 0, startOffset: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const TILE   = 92 + 12; // width + gap
    const LOOP_W = ECO_INTEGRATIONS.length * TILE;
    const SPEED  = 0.3; // px per frame — slow

    const tick = () => {
      if (!state.current.dragging) {
        state.current.offset = (state.current.offset + SPEED) % LOOP_W;
      }
      track.style.transform = `translateX(${-state.current.offset}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onDown = (clientX: number) => {
      state.current.dragging    = true;
      state.current.startX      = clientX;
      state.current.startOffset = state.current.offset;
    };
    const onMove = (clientX: number) => {
      if (!state.current.dragging) return;
      const delta = state.current.startX - clientX;
      state.current.offset = ((state.current.startOffset + delta) % LOOP_W + LOOP_W) % LOOP_W;
    };
    const onUp = () => { state.current.dragging = false; };

    const md = (e: MouseEvent) => { onDown(e.clientX); e.preventDefault(); };
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const ts = (e: TouchEvent) => onDown(e.touches[0].clientX);
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientX);

    track.addEventListener("mousedown",  md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup",   onUp);
    track.addEventListener("touchstart", ts, { passive: true });
    track.addEventListener("touchmove",  tm, { passive: true });
    track.addEventListener("touchend",   onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      track.removeEventListener("mousedown",  md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup",   onUp);
      track.removeEventListener("touchstart", ts);
      track.removeEventListener("touchmove",  tm);
      track.removeEventListener("touchend",   onUp);
    };
  }, []);

  return (
    <section className="border-t border-black/6 px-6 lg:px-12 py-16">
      <div
        className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative"
        style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* Centered text block */}
        <div className="relative text-center px-8 pt-16 pb-14">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-7 text-[11px] font-medium tracking-wide"
            style={{
              background: "rgba(75,172,80,0.15)",
              color: "#4bac50",
              border: "1px solid rgba(75,172,80,0.25)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4bac50] inline-block" />
            Ecosystem
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
            Every tool your business<br />runs on, connected.
          </h2>
          <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed">
            Stripe, Slack, QuickBooks, Claude, and 50+ more — your whole stack
            in one place, no switching tabs.
          </p>
        </div>

        {/* Draggable marquee */}
        <div
          className="relative pb-16 overflow-hidden select-none"
          style={{ cursor: "grab" }}
          onMouseDown={(e) => e.currentTarget.style.cursor = "grabbing"}
          onMouseUp={(e) => e.currentTarget.style.cursor = "grab"}
        >
          {/* Edge fades */}
          <div
            className="absolute inset-y-0 left-0 z-10 pointer-events-none"
            style={{ width: 120, background: "linear-gradient(to right, #0D0D0D, transparent)" }}
          />
          <div
            className="absolute inset-y-0 right-0 z-10 pointer-events-none"
            style={{ width: 120, background: "linear-gradient(to left, #0D0D0D, transparent)" }}
          />

          <div
            ref={trackRef}
            className="flex gap-3"
            style={{ width: "max-content", willChange: "transform" }}
          >
            {ECO_ROW.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-center shrink-0 rounded-2xl"
                style={{
                  width: 92,
                  height: 92,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <img
                  src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${item.slug}.svg`}
                  alt={item.name}
                  width={38}
                  height={38}
                  draggable={false}
                  style={{ userSelect: "none", pointerEvents: "none", filter: "brightness(0) invert(1)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
// ─── Features animated graphics ───────────────────────────────────────────────

const FM_EASE = [0.25, 0.46, 0.45, 0.94] as const;
const FM_G = "#22c55e";
const FM_GD = "#16a34a";
const FM_P = "#8b5cf6";

function useCountUpActive(
  target: number,
  active: boolean,
  delay = 0,
  dur = 1000,
  resetKey = 0,
) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(0);
    if (!active) return;
    const t = setTimeout(() => {
      const start = Date.now();
      const raf = () => {
        const p = Math.min((Date.now() - start) / dur, 1);
        const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        setVal(Math.round(e * target));
        if (p < 1) requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(t);
  }, [active, target, delay, dur, resetKey]);
  return val;
}

// Fires once on scroll-entry, then loops on a timer while in view.
// key={tick} on an inner wrapper remounts Framer Motion children → replays initial→animate.
function useLoopTick(ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-40px" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [inView, ms]);
  return { ref, inView, tick };
}

function FMiniCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e8edf4",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function FPill({
  children,
  color = FM_G,
  bg,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color,
        background: bg ?? `${color}18`,
        borderRadius: 99,
        padding: "2px 7px",
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

// ── 1. Lead Pipeline ──
const FM_STAGES = [
  {
    label: "Inquiry",
    color: "#94a3b8",
    bg: "#f8fafc",
    leads: [
      { name: "Alex C.", car: "BMW M3" },
      { name: "Ryan T.", car: "Audi RS7" },
    ],
  },
  {
    label: "Quoted",
    color: "#f59e0b",
    bg: "#fffbeb",
    leads: [{ name: "Maria K.", car: "Tesla S" }],
  },
  {
    label: "Scheduled",
    color: FM_G,
    bg: "#f0fdf4",
    leads: [
      { name: "Jordan P.", car: "Porsche" },
      { name: "Sam R.", car: "Mercedes" },
    ],
  },
];

// Mouse cursor SVG path (OS-style arrow pointer)
const CursorSVG = () => (
  <svg
    width="14"
    height="18"
    viewBox="0 0 14 18"
    fill="none"
    style={{ display: "block" }}
  >
    <path
      d="M2 1.5 L2 13.5 L5 10.5 L7.5 16 L9.5 15 L7 9.5 L11.5 9.5 Z"
      fill="white"
      stroke="#0f172a"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

function LeadPipelineGraphic() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -60px 0px" });
  const [phase, setPhase] = useState<"idle" | "hover" | "drag" | "drop">(
    "idle",
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clear = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    if (!inView) {
      clear();
      setPhase("idle");
      return;
    }
    const run = () => {
      clear();
      setPhase("idle");
      timersRef.current = [
        setTimeout(() => setPhase("hover"), 600),
        setTimeout(() => setPhase("drag"), 1200),
        setTimeout(() => setPhase("drop"), 2600),
        setTimeout(run, 4400),
      ];
    };
    run();
    return clear;
  }, [inView]);

  const isGrabbing = phase === "drag";
  const isDropped = phase === "drop";

  // Cursor animate targets (x/y relative to container top-left)
  const cursorAnim =
    phase === "idle"
      ? { x: 190, y: 54, opacity: 0 }
      : phase === "hover"
        ? { x: 18, y: 54, opacity: 1 }
        : phase === "drag"
          ? { x: 86, y: 50, opacity: 1 }
          : { x: 86, y: 50, opacity: 0 };

  const cursorTransition =
    phase === "hover"
      ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      : phase === "drag"
        ? { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
        : { duration: 0.25 };

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      {/* Board columns */}
      <div style={{ display: "flex", gap: 6 }}>
        {FM_STAGES.map((stage, si) => (
          <div
            key={stage.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: stage.color,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {stage.label}
              </span>
            </div>
            {stage.leads.map((lead) => {
              // Ryan T. in Inquiry: ghost during drag, hidden after drop
              if (si === 0 && lead.name === "Ryan T.") {
                return (
                  <div
                    key={lead.name}
                    style={{
                      background: stage.bg,
                      borderRadius: 7,
                      border: `1px solid ${stage.color}22`,
                      padding: "6px 8px",
                      opacity: isGrabbing ? 0.18 : 1,
                      visibility: isDropped ? "hidden" : "visible",
                      transition: "opacity 0.2s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 650,
                        color: "#0f172a",
                      }}
                    >
                      {lead.name}
                    </div>
                    <div
                      style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}
                    >
                      {lead.car}
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={lead.name}
                  style={{
                    background: stage.bg,
                    borderRadius: 7,
                    border: `1px solid ${stage.color}22`,
                    padding: "6px 8px",
                  }}
                >
                  <div
                    style={{ fontSize: 10, fontWeight: 650, color: "#0f172a" }}
                  >
                    {lead.name}
                  </div>
                  <div
                    style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}
                  >
                    {lead.car}
                  </div>
                </div>
              );
            })}
            {/* Ryan T. drops into Quoted column */}
            {si === 1 && (
              <AnimatePresence>
                {isDropped && (
                  <motion.div
                    key="ryan-dropped"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: stage.bg,
                      borderRadius: 7,
                      border: `1px solid ${stage.color}22`,
                      padding: "6px 8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 650,
                        color: "#0f172a",
                      }}
                    >
                      Ryan T.
                    </div>
                    <div
                      style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}
                    >
                      Audi RS7
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>

      {/* Dragged card flying across columns */}
      <AnimatePresence>
        {isGrabbing && (
          <motion.div
            key="dragged-card"
            initial={{ x: 2, y: 58, scale: 1.0, opacity: 0.95, rotate: 0 }}
            animate={{ x: 70, y: 52, scale: 1.06, opacity: 1, rotate: 1.5 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "30%",
              background: "#fffbeb",
              borderRadius: 7,
              border: "1px solid #f59e0b55",
              padding: "6px 8px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 650, color: "#0f172a" }}>
              Ryan T.
            </div>
            <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}>
              Audi RS7
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mouse cursor */}
      <motion.div
        animate={cursorAnim}
        transition={cursorTransition}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <CursorSVG />
      </motion.div>
    </div>
  );
}

// ── 2. Quote Builder ──
const FM_QUOTE_LINES = [
  { label: "Full Detail", amount: "$249.00" },
  { label: "Ceramic Boost", amount: "$50.00" },
  { label: "Odor Treatment", amount: "$25.00" },
];

function QuoteBuilderGraphic() {
  const { ref, inView, tick } = useLoopTick(4000);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <FMiniCard>
        <div
          style={{
            padding: "10px 12px 8px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>
              Quote #127
            </div>
            <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}>
              2023 Porsche Cayenne
            </div>
          </div>
          <FPill color="#f59e0b">In progress</FPill>
        </div>
        <div
          key={tick}
          style={{
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {FM_QUOTE_LINES.map((line, i) => (
            <motion.div
              key={line.label}
              initial={{ opacity: 0, x: -6 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.14, duration: 0.35, ease: FM_EASE }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10.5, color: "#475569" }}>
                {line.label}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#0f172a",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {line.amount}
              </span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{
              borderTop: "1px solid #f1f5f9",
              paddingTop: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 10, color: "#94a3b8" }}>Total</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 750,
                color: "#0f172a",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              $324.00
            </span>
          </motion.div>
        </div>
        <motion.div
          key={`btn-${tick}`}
          initial={{ opacity: 0, y: 4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.35, ease: FM_EASE }}
          style={{
            margin: "0 10px 10px",
            background: "#0f172a",
            borderRadius: 8,
            padding: "8px 0",
            textAlign: "center",
            fontSize: 10.5,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Send Quote →
        </motion.div>
      </FMiniCard>
    </div>
  );
}

// ── 3. Client Portal ──
const PORTAL_PAGES = [
  {
    id: "scope",
    label: "Service Scope",
    step: "1 of 3",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a" }}>
              Full Detail + Ceramic
            </div>
            <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}>
              2023 BMW M3 · James Morton
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#0f172a" }}>
            $299
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            paddingTop: 4,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {[
            "Exterior hand wash & clay bar",
            "Interior vacuum & wipe-down",
            "Ceramic coating application",
          ].map((item) => (
            <div
              key={item}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: FM_G,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 9.5, color: "#475569" }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 2 }}>
          Sat, Jun 14 · 10:00 AM · 123 Maple St
        </div>
      </div>
    ),
  },
  {
    id: "sign",
    label: "Sign Agreement",
    step: "2 of 3",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>
          By signing you agree to the service scope above. Payment is collected
          after completion.
        </div>
        <div>
          <div style={{ fontSize: 8.5, color: "#94a3b8", marginBottom: 4 }}>
            Client signature
          </div>
          <div style={{ position: "relative", height: 28 }}>
            <div
              style={{
                borderBottom: "1px dashed #cbd5e1",
                width: "70%",
                position: "absolute",
                bottom: 0,
              }}
            />
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.6,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                fontSize: 17,
                fontStyle: "italic",
                color: "#0f172a",
                fontFamily: "Georgia, serif",
                lineHeight: 1,
                position: "absolute",
                bottom: 2,
              }}
            >
              James Morton
            </motion.div>
          </div>
        </div>
        <div
          style={{
            background: "#0f172a",
            borderRadius: 8,
            padding: "7px 0",
            textAlign: "center",
            fontSize: 10.5,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Sign & Pay $299
        </div>
      </div>
    ),
  },
  {
    id: "paid",
    label: "All Done!",
    step: "3 of 3",
    content: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          paddingTop: 4,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 18,
            delay: 0.2,
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: FM_GD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M4 9.5 L7.5 13 L14 6"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0f172a",
            textAlign: "center",
          }}
        >
          Signed & Paid ✓
        </div>
        <div style={{ fontSize: 9, color: "#64748b", textAlign: "center" }}>
          Receipt sent to james@email.com
        </div>
        <div style={{ fontSize: 8.5, color: "#94a3b8", textAlign: "center" }}>
          See you Saturday at 10 AM, James!
        </div>
      </div>
    ),
  },
];

function ClientPortalGraphic() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -60px 0px" });
  const [pageIdx, setPageIdx] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = back

  useEffect(() => {
    if (!inView) {
      setPageIdx(0);
      setDir(1);
      return;
    }
    const advance = () => {
      setDir(1);
      setPageIdx((p) => (p + 1) % PORTAL_PAGES.length);
    };
    const timer = setInterval(advance, 2800);
    return () => clearInterval(timer);
  }, [inView]);

  const page = PORTAL_PAGES[pageIdx];

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <FMiniCard style={{ overflow: "hidden" }}>
        <div style={{ padding: "10px 12px 8px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: FM_G,
                }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#0f172a" }}>
                Rinse Client Portal
              </span>
            </div>
            <span style={{ fontSize: 8.5, color: "#94a3b8" }}>{page.step}</span>
          </div>
          {/* Sliding page content */}
          <div
            style={{ position: "relative", overflow: "hidden", minHeight: 110 }}
          >
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={page.id}
                custom={dir}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {page.label}
                </div>
                {page.content}
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Dot indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 5,
              marginTop: 8,
            }}
          >
            {PORTAL_PAGES.map((p, i) => (
              <div
                key={p.id}
                style={{
                  width: i === pageIdx ? 14 : 5,
                  height: 5,
                  borderRadius: 99,
                  background: i === pageIdx ? FM_G : "#e2e8f0",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </FMiniCard>
    </div>
  );
}

// ── 4. Damage Documentation ──
const FM_DAMAGE_PTS = [
  { cx: 34, cy: 22, label: "1", note: "Hood scratch" },
  { cx: 126, cy: 58, label: "2", note: "Rear dent" },
  { cx: 62, cy: 62, label: "3", note: "Door scuff" },
];

function DamageDocsGraphic() {
  const { ref, inView, tick } = useLoopTick(4000);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <FMiniCard key={tick} style={{ padding: "10px 8px 6px" }}>
        <svg viewBox="0 0 160 80" width="100%" style={{ display: "block" }}>
          <rect
            x="22"
            y="18"
            width="116"
            height="44"
            rx="11"
            fill="#f1f5f9"
            stroke="#dde4ef"
            strokeWidth="1.2"
          />
          <rect x="10" y="26" width="14" height="28" rx="6" fill="#e2e8f0" />
          <rect x="136" y="26" width="14" height="28" rx="6" fill="#e2e8f0" />
          <rect
            x="44"
            y="22"
            width="26"
            height="36"
            rx="3"
            fill="#d8e8f5"
            opacity="0.75"
          />
          <rect
            x="90"
            y="22"
            width="26"
            height="36"
            rx="3"
            fill="#d8e8f5"
            opacity="0.75"
          />
          <rect
            x="72"
            y="22"
            width="16"
            height="36"
            fill="#e4ecf4"
            opacity="0.5"
          />
          {(
            [
              [34, 6],
              [112, 6],
              [34, 60],
              [112, 60],
            ] as [number, number][]
          ).map(([x, y], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width="20"
              height="14"
              rx="5"
              fill="#cbd5e1"
            />
          ))}
          {FM_DAMAGE_PTS.map((d, i) => (
            <motion.g
              key={d.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{
                delay: 0.3 + i * 0.25,
                type: "spring",
                stiffness: 400,
                damping: 14,
              }}
              style={{ transformOrigin: `${d.cx}px ${d.cy}px` }}
            >
              <circle
                cx={d.cx}
                cy={d.cy}
                r={7.5}
                fill="#ef4444"
                opacity={0.15}
              />
              <circle cx={d.cx} cy={d.cy} r={5} fill="#ef4444" />
              <text
                x={d.cx}
                y={d.cy + 3.5}
                textAnchor="middle"
                fontSize="6"
                fontWeight="700"
                fill="#fff"
              >
                {d.label}
              </text>
            </motion.g>
          ))}
        </svg>
        <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
          {FM_DAMAGE_PTS.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.25, duration: 0.3 }}
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ef4444",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 8.5, color: "#64748b" }}>{d.note}</span>
            </motion.div>
          ))}
        </div>
      </FMiniCard>
    </div>
  );
}

// ── 5. Inventory & Supplies ──
const FM_SUPPLIES = [
  { name: "Ceramic Pro", units: 24, max: 50, low: false },
  { name: "Detail Spray", units: 48, max: 60, low: false },
  { name: "Foam Pads", units: 3, max: 40, low: true },
  { name: "Microfiber Cloth", units: 22, max: 50, low: false },
];

function InventoryGraphic() {
  const { ref, inView, tick } = useLoopTick(4000);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div
        key={tick}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {FM_SUPPLIES.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.35, ease: FM_EASE }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: s.low ? "#ef4444" : "#0f172a",
                }}
              >
                {s.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {s.low && (
                  <motion.span
                    animate={inView ? { opacity: [1, 0.4, 1] } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 1.6,
                      ease: "easeInOut",
                    }}
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: "#ef4444",
                      background: "#fee2e2",
                      borderRadius: 99,
                      padding: "1px 6px",
                    }}
                  >
                    Low stock
                  </motion.span>
                )}
                <span
                  style={{
                    fontSize: 9.5,
                    color: s.low ? "#ef4444" : "#94a3b8",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.units} left
                </span>
              </div>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 99,
                background: "#f1f5f9",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${(s.units / s.max) * 100}%` } : {}}
                transition={{
                  delay: i * 0.1 + 0.15,
                  duration: 0.6,
                  ease: FM_EASE,
                }}
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: s.low ? "#ef4444" : FM_G,
                  opacity: s.low ? 0.85 : 0.7,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── 6. Auto Messages & Reviews ──
const ALL_AUTO_MESSAGES = [
  {
    trigger: "Booking confirmed",
    text: "You're booked for Sat 2 PM. See you then! – Rinse",
    accent: "#3b82f6",
    icon: "✓",
  },
  {
    trigger: "On my way",
    text: "Heading your way — ETA 12 min 🚗",
    accent: "#8b5cf6",
    icon: "→",
  },
  {
    trigger: "Reminder",
    text: "Your detail is tomorrow at 10 AM. Reply CONFIRM.",
    accent: "#f59e0b",
    icon: "!",
  },
  {
    trigger: "Job complete",
    text: "All done! Invoice sent. Thanks for choosing Rinse 🎉",
    accent: "#22c55e",
    icon: "✓",
  },
  {
    trigger: "Review request",
    text: "How'd we do? A quick Google review means the world ⭐",
    accent: "#f59e0b",
    icon: "★",
  },
  {
    trigger: "On my way",
    text: "On my way! Should be there in about 8 minutes 🚗",
    accent: "#8b5cf6",
    icon: "→",
  },
  {
    trigger: "Reminder",
    text: "Just a heads-up — appointment in 24 hours. See you soon!",
    accent: "#f59e0b",
    icon: "!",
  },
  {
    trigger: "Booking confirmed",
    text: "Booking confirmed for Sun 11 AM. We'll remind you the day before!",
    accent: "#3b82f6",
    icon: "✓",
  },
  {
    trigger: "Job complete",
    text: "Your vehicle is looking sharp! Receipt in your inbox.",
    accent: "#22c55e",
    icon: "✓",
  },
  {
    trigger: "Review request",
    text: "Glad you loved it! Mind leaving a 5-star review? [link]",
    accent: "#f59e0b",
    icon: "★",
  },
];

let _autoMsgCounter = 0;

function AutoMessagesGraphic() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -60px 0px" });
  const [msgs, setMsgs] = useState<
    {
      id: number;
      trigger: string;
      text: string;
      accent: string;
      icon: string;
    }[]
  >([]);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!inView) {
      setMsgs([]);
      idxRef.current = 0;
      return;
    }
    const add = () => {
      const m = ALL_AUTO_MESSAGES[idxRef.current % ALL_AUTO_MESSAGES.length];
      idxRef.current++;
      const id = ++_autoMsgCounter;
      setMsgs((prev) => [...prev, { ...m, id }].slice(-4));
    };
    add(); // first message immediately
    const timer = setInterval(add, 1700);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minHeight: 130,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 0,
      }}
    >
      <AnimatePresence initial={false}>
        {msgs.map((m) => (
          <motion.div
            key={m.id}
            initial={{ y: 18, opacity: 0, height: 0 }}
            animate={{ y: 0, opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                paddingTop: 7,
              }}
            >
              {/* colored pill icon */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: m.accent + "22",
                  border: `1.5px solid ${m.accent}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                  fontSize: 9,
                  color: m.accent,
                  fontWeight: 700,
                }}
              >
                {m.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: m.accent,
                    marginBottom: 1,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {m.trigger}
                </div>
                <div
                  style={{ fontSize: 10.5, color: "#0f172a", lineHeight: 1.4 }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── 7. GPS Fleet Tracking (Coming Soon) ──
const FM_TECHS = [
  { x: 28, y: 62, color: "#3b82f6", name: "M" },
  { x: 88, y: 34, color: "#8b5cf6", name: "J" },
  { x: 132, y: 70, color: "#f59e0b", name: "R" },
];
const FM_GPS_ROUTES = [
  "M 28 62 C 44 50 68 42 88 34",
  "M 88 34 C 108 28 122 50 132 70",
];

function GPSTrackingGraphic() {
  const { ref, inView, tick } = useLoopTick(5000);
  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <FMiniCard key={tick} style={{ overflow: "hidden" }}>
        <svg viewBox="0 0 160 100" width="100%" style={{ display: "block" }}>
          <rect width="160" height="100" fill="#eef2eb" />
          {(
            [
              [0, 0, 24, 18],
              [24, 0, 32, 18],
              [56, 0, 34, 18],
              [90, 0, 34, 18],
              [124, 0, 28, 18],
              [152, 0, 8, 18],
              [0, 18, 24, 24],
              [24, 18, 32, 24],
              [56, 18, 34, 24],
              [90, 18, 34, 24],
              [124, 18, 28, 24],
              [152, 18, 8, 24],
              [0, 42, 24, 24],
              [24, 42, 32, 24],
              [56, 42, 34, 24],
              [90, 42, 34, 24],
              [124, 42, 28, 24],
              [152, 42, 8, 24],
              [0, 66, 24, 34],
              [24, 66, 32, 34],
              [56, 66, 34, 34],
              [90, 66, 34, 34],
              [124, 66, 28, 34],
              [152, 66, 8, 34],
            ] as [number, number, number, number][]
          ).map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x + 1}
              y={y + 1}
              width={w - 2}
              height={h - 2}
              rx={1}
              fill="#e4eade"
            />
          ))}
          {[18, 42, 66, 90].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="160"
              y2={y}
              stroke="#fff"
              strokeWidth="3"
            />
          ))}
          {[24, 56, 90, 124, 152].map((x) => (
            <line
              key={x}
              x1={x}
              y1="0"
              x2={x}
              y2="100"
              stroke="#fff"
              strokeWidth="3"
            />
          ))}
          {FM_GPS_ROUTES.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="200"
              initial={{ strokeDashoffset: 200 }}
              animate={inView ? { strokeDashoffset: 0 } : {}}
              transition={{
                delay: 0.3 + i * 0.4,
                duration: 0.9,
                ease: "easeInOut",
              }}
            />
          ))}
          {FM_TECHS.map((t, i) => (
            <motion.g
              key={t.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{
                delay: 0.5 + i * 0.3,
                type: "spring",
                stiffness: 350,
                damping: 16,
              }}
              style={{ transformOrigin: `${t.x}px ${t.y}px` }}
            >
              <motion.circle
                cx={t.x}
                cy={t.y}
                r={10}
                fill={t.color}
                opacity={0.15}
                animate={inView ? { r: [10, 14, 10] } : {}}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
              <circle cx={t.x} cy={t.y} r={8} fill={t.color} />
              <text
                x={t.x}
                y={t.y + 3.5}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="#fff"
              >
                {t.name}
              </text>
            </motion.g>
          ))}
        </svg>
      </FMiniCard>
    </div>
  );
}

// ── 8. Integrations Hub (Coming Soon) ──
const FM_INTEGRATIONS = [
  {
    name: "QuickBooks",
    color: "#16a34a",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="4" fill="#dcfce7" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#16a34a"
        >
          QB
        </text>
      </svg>
    ),
  },
  {
    name: "Google Cal",
    color: "#3b82f6",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="1"
          y="2"
          width="14"
          height="13"
          rx="2"
          stroke="#3b82f6"
          strokeWidth="1.1"
        />
        <line x1="1" y1="6" x2="15" y2="6" stroke="#3b82f6" strokeWidth="1.1" />
        <rect x="4" y="2" width="2" height="2" rx="1" fill="#3b82f6" />
        <rect x="10" y="2" width="2" height="2" rx="1" fill="#3b82f6" />
        <text
          x="8"
          y="13"
          textAnchor="middle"
          fontSize="6"
          fontWeight="700"
          fill="#3b82f6"
        >
          8
        </text>
      </svg>
    ),
  },
  {
    name: "Zapier",
    color: "#f97316",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <polygon
          points="8,1.5 9.2,5.2 13,5.2 10,7.6 11,11.5 8,9 5,11.5 6,7.6 3,5.2 6.8,5.2"
          fill="#f97316"
        />
      </svg>
    ),
  },
  {
    name: "Stripe",
    color: "#6366f1",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="4" fill="#ede9fe" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fontSize="10"
          fontWeight="800"
          fill="#6366f1"
        >
          S
        </text>
      </svg>
    ),
  },
  {
    name: "Gmail",
    color: "#ef4444",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="1"
          y="3"
          width="14"
          height="10"
          rx="2"
          stroke="#ef4444"
          strokeWidth="1"
        />
        <path
          d="M2 4.5 L8 9 L14 4.5"
          stroke="#ef4444"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Xero",
    color: "#0ea5e9",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="4" fill="#e0f2fe" />
        <text
          x="8"
          y="11.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#0ea5e9"
        >
          Xe
        </text>
      </svg>
    ),
  },
];

function IntegrationsGraphic() {
  const { ref, inView, tick } = useLoopTick(3500);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div
        key={tick}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {FM_INTEGRATIONS.map((int, i) => (
          <motion.div
            key={int.name}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: i * 0.08, duration: 0.35, ease: FM_EASE }}
            style={{
              background: "#fff",
              borderRadius: 9,
              border: "1px solid #e8edf4",
              padding: "10px 6px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
            }}
          >
            {int.icon}
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 600,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {int.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── 9. Multi-Location (Coming Soon) ──
const FM_LOCATIONS = [
  { name: "Dallas HQ", rev: 8240, max: 10000, techs: 6 },
  { name: "Austin", rev: 4180, max: 10000, techs: 3 },
  { name: "Houston", rev: 6000, max: 10000, techs: 4 },
];

function MultiLocationGraphic() {
  const { ref, inView, tick } = useLoopTick(5000);
  const v0 = useCountUpActive(8240, inView, 100, 1000, tick);
  const v1 = useCountUpActive(4180, inView, 200, 1000, tick);
  const v2 = useCountUpActive(6000, inView, 300, 1000, tick);
  const vals = [v0, v1, v2];
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <FMiniCard key={tick}>
        <div
          style={{
            padding: "10px 12px 4px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a" }}>
            All Locations
          </span>
          <span style={{ fontSize: 9, color: "#94a3b8" }}>Jul 2025</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {FM_LOCATIONS.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.4, ease: FM_EASE }}
              style={{
                padding: "8px 12px",
                borderBottom:
                  i < FM_LOCATIONS.length - 1 ? "1px solid #f8fafc" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: FM_G,
                    }}
                  />
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}
                  >
                    {loc.name}
                  </span>
                  <span style={{ fontSize: 9, color: "#94a3b8" }}>
                    {loc.techs} techs
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0f172a",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ${vals[i].toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 99,
                  background: "#f1f5f9",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={
                    inView ? { width: `${(loc.rev / loc.max) * 100}%` } : {}
                  }
                  transition={{
                    delay: i * 0.15 + 0.2,
                    duration: 0.7,
                    ease: FM_EASE,
                  }}
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background: FM_G,
                    opacity: 0.7,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </FMiniCard>
    </div>
  );
}

// ── 10. AI Receipt Scan ──
const FM_RECEIPT_LINES = [
  { label: "Foam applicator pads", price: "$18.40" },
  { label: "Iron remover spray", price: "$34.90" },
  { label: "Ceramic coating 50ml", price: "$89.00" },
];

function AIReceiptGraphic() {
  const { ref, inView, tick } = useLoopTick(4500);
  const [scanDone, setScanDone] = useState(false);
  useEffect(() => {
    setScanDone(false);
    if (!inView) return;
    const t = setTimeout(() => setScanDone(true), 1000);
    return () => clearTimeout(t);
  }, [inView, tick]);

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div key={tick} style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            flex: 1,
            background: "#fffdf7",
            borderRadius: 8,
            border: "1px solid #e8edf4",
            padding: "10px 10px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#94a3b8",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Receipt · Jun 14
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[["80%"], ["65%"], ["50%"], ["75%"], ["45%"]].map(([w], i) => (
              <div
                key={i}
                style={{
                  height: 4,
                  borderRadius: 99,
                  background: "#e2e8f0",
                  width: w,
                }}
              />
            ))}
          </div>
          {!scanDone && (
            <motion.div
              initial={{ top: "10%" }}
              animate={inView ? { top: "90%" } : {}}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 2,
                background: `${FM_P}88`,
                boxShadow: `0 0 8px ${FM_P}`,
              }}
            />
          )}
          {scanDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ position: "absolute", top: 8, right: 8 }}
            >
              <FPill color={FM_P} bg={`${FM_P}18`}>
                Scanned
              </FPill>
            </motion.div>
          )}
        </div>
        <div style={{ flex: 1.2 }}>
          <div
            style={{
              fontSize: 9,
              color: "#94a3b8",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Extracted items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {FM_RECEIPT_LINES.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={scanDone ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.35, ease: FM_EASE }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "5px 8px",
                  background: "#fff",
                  borderRadius: 6,
                  border: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    color: "#475569",
                    flex: 1,
                    marginRight: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {line.label}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 650,
                    color: "#0f172a",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {line.price}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 11. AI Vehicle Capture ──
function AIVehicleGraphic() {
  const { ref, inView, tick } = useLoopTick(4500);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div
        key={tick}
        style={{ display: "flex", gap: 10, alignItems: "center" }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <svg viewBox="0 0 100 70" width="100%" style={{ display: "block" }}>
            <rect width="100" height="70" fill="#f8fafc" rx="8" />
            <rect x="8" y="28" width="84" height="28" rx="8" fill="#e2e8f0" />
            <path d="M 24 28 C 28 16 72 16 76 28" fill="#cbd5e1" />
            <path
              d="M 28 28 C 30 20 50 19 55 28"
              fill="#dbeafe"
              opacity="0.8"
            />
            <path
              d="M 58 28 C 62 20 72 20 74 28"
              fill="#dbeafe"
              opacity="0.8"
            />
            <circle cx="26" cy="56" r="9" fill="#94a3b8" />
            <circle cx="26" cy="56" r="5" fill="#f1f5f9" />
            <circle cx="74" cy="56" r="9" fill="#94a3b8" />
            <circle cx="74" cy="56" r="5" fill="#f1f5f9" />
            <rect x="8" y="36" width="6" height="8" rx="2" fill="#fef08a" />
            <rect x="86" y="36" width="6" height="8" rx="2" fill="#fde68a" />
            <rect
              x="36"
              y="48"
              width="28"
              height="10"
              rx="2"
              fill="#fff"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <text
              x="50"
              y="56.5"
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="700"
              fill="#334155"
            >
              ABC·1234
            </text>
            <motion.rect
              x="34"
              y="46"
              width="32"
              height="14"
              rx="3"
              fill="none"
              stroke={FM_P}
              strokeWidth="1.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                delay: 0.4,
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 16,
              }}
              style={{ transformOrigin: "50px 53px" }}
            />
            {(
              [
                [34, 46],
                [66, 46],
                [34, 60],
                [66, 60],
              ] as [number, number][]
            ).map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={1.5}
                fill={FM_P}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.2 }}
              />
            ))}
          </svg>
        </div>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}
        >
          {[
            { label: "Make", value: "BMW" },
            { label: "Model", value: "M3 Sedan" },
            { label: "Year", value: "2022" },
            { label: "Plate", value: "ABC·1234" },
          ].map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: 6 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{
                delay: 0.6 + i * 0.12,
                duration: 0.3,
                ease: FM_EASE,
              }}
            >
              <div
                style={{
                  fontSize: 8.5,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {row.label}
              </div>
              <div style={{ fontSize: 11, fontWeight: 650, color: "#0f172a" }}>
                {row.value}
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 1.2, duration: 0.3 }}
          >
            <FPill color={FM_P}>Matched in CRM</FPill>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── 12. AI Ops Copilot ──
const COPILOT_QA = [
  {
    q: "Who's overdue for a detail?",
    a: "3 clients: Alex C. (94d), Maria K. (102d), Tom H. (88d)",
  },
  {
    q: "Best day to book next week?",
    a: "Tuesday — only 2 jobs so far. Plenty of room to fill.",
  },
  {
    q: "Draft a follow-up for Alex Chen",
    a: "Hey Alex! It's been 94 days — time for a refresh? Book here: rinse.app/alex",
  },
  {
    q: "How much did I make this month?",
    a: "$4,820 across 19 jobs. Up 12% from last month 📈",
  },
  {
    q: "Which service is most profitable?",
    a: "Full Detail + Ceramic — avg $380, 68% margin.",
  },
  {
    q: "Any no-shows this week?",
    a: "1 no-show (Thu, 2 PM). Auto follow-up sent at 2:05 PM.",
  },
];

let _copilotCounter = 0;

function AICopilotGraphic() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -60px 0px" });
  const [msgs, setMsgs] = useState<
    { id: number; kind: "q" | "a"; text: string }[]
  >([]);
  const seqRef = useRef<{ qaIdx: number; step: "q" | "a" }>({
    qaIdx: 0,
    step: "q",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!timerRef.current) return;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!inView) {
      setMsgs([]);
      seqRef.current = { qaIdx: 0, step: "q" };
      return;
    }

    const schedule = (delay: number) => {
      timerRef.current = setTimeout(tick, delay);
    };

    const tick = () => {
      const { qaIdx, step } = seqRef.current;
      const pair = COPILOT_QA[qaIdx % COPILOT_QA.length];
      if (step === "q") {
        const id = ++_copilotCounter;
        setMsgs((prev) => [...prev, { id, kind: "q", text: pair.q }].slice(-5));
        seqRef.current = { qaIdx, step: "a" };
        schedule(1300);
      } else {
        const id = ++_copilotCounter;
        setMsgs((prev) => [...prev, { id, kind: "a", text: pair.a }].slice(-5));
        seqRef.current = { qaIdx: qaIdx + 1, step: "q" };
        schedule(2400);
      }
    };

    schedule(200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inView]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <AnimatePresence initial={false}>
        {msgs.map((m) => (
          <motion.div
            key={m.id}
            initial={{ y: 14, opacity: 0, height: 0 }}
            animate={{ y: 0, opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            {m.kind === "q" ? (
              /* User question — right-aligned dark bubble */
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: 6,
                }}
              >
                <div
                  style={{
                    background: "#0f172a",
                    borderRadius: "10px 10px 2px 10px",
                    padding: "6px 10px",
                    maxWidth: "76%",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#fff" }}>{m.text}</span>
                </div>
              </div>
            ) : (
              /* AI answer — left-aligned purple bubble */
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 5,
                  paddingTop: 5,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 5,
                    background: FM_P,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1 5.5C1 3 3.5 1.5 4 1C4.5 1.5 7 3 7 5.5C7 7 5.7 7.5 4 7.5C2.3 7.5 1 7 1 5.5Z"
                      fill="#fff"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    background: `${FM_P}12`,
                    border: `1px solid ${FM_P}22`,
                    borderRadius: "10px 10px 10px 2px",
                    padding: "6px 10px",
                    maxWidth: "82%",
                  }}
                >
                  <span
                    style={{ fontSize: 10, color: "#0f172a", lineHeight: 1.4 }}
                  >
                    {m.text}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── 13. AI Pricing Assistant ──
function AIPricingGraphic() {
  const { ref, inView, tick } = useLoopTick(4500);
  const price = useCountUpActive(390, inView, 600, 1000, tick);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <FMiniCard key={tick}>
        <div style={{ padding: "10px 12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div>
              <div
                style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a" }}
              >
                2023 Porsche Cayenne
              </div>
              <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
                Full Detail + Ceramic
              </div>
            </div>
            <FPill color={FM_P}>AI suggest</FPill>
          </div>
          <div
            style={{
              background: `${FM_P}0d`,
              border: `1px solid ${FM_P}20`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: FM_P,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Suggested range
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${price}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>– $420</span>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 9, color: "#94a3b8" }}>Confidence</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: FM_P }}>
                84%
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 99,
                background: "#f1f5f9",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: "84%" } : {}}
                transition={{ delay: 0.5, duration: 0.8, ease: FM_EASE }}
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: FM_P,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#94a3b8" }}>
            Based on 47 similar jobs in your area
          </div>
        </div>
      </FMiniCard>
    </div>
  );
}

// ── 14. Public / Partner API ──
const FM_API_LINES = [
  { text: "GET /v1/jobs?status=scheduled", color: "#0f172a", bold: true },
  { text: "→ 200 OK", color: FM_G },
  { text: "{", color: "#64748b" },
  { text: '  "total": 14,', color: "#475569" },
  { text: '  "jobs": [', color: "#475569" },
  { text: '    { "id": "j_412", "client": "Alex Chen" },', color: "#94a3b8" },
  { text: '    { "id": "j_413", "status": "en_route" }', color: "#94a3b8" },
  { text: "  ]", color: "#475569" },
  { text: "}", color: "#64748b" },
];

function APIGraphic() {
  const { ref, inView, tick } = useLoopTick(4000);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div
        key={tick}
        style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "8px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <div
              key={c}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: c,
                opacity: 0.7,
              }}
            />
          ))}
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              marginLeft: 4,
              fontFamily: "monospace",
            }}
          >
            rinse-api
          </span>
        </div>
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {FM_API_LINES.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.09, duration: 0.3, ease: FM_EASE }}
              style={{
                fontSize: 9.5,
                color: line.color,
                fontFamily: "monospace",
                fontWeight: line.bold ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {line.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feature card shell ──
type FMTier = "shipped" | "soon" | "ai";

function FMFeatureCard({
  label,
  heading,
  body,
  graphic,
  tier = "shipped",
}: {
  label: string;
  heading: string;
  body: string;
  graphic: React.ReactNode;
  tier?: FMTier;
}) {
  const accentColor =
    tier === "ai" ? FM_P : tier === "soon" ? "#64748b" : FM_GD;
  const graphicBg = tier === "ai" ? "#faf9ff" : "#f8fafc";
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #eaeff6",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        height: "100%",
      }}
    >
      <div
        style={{
          background: graphicBg,
          borderRadius: 10,
          padding: "16px 14px",
          minHeight: 158,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ opacity: tier === "soon" ? 0.55 : 1, width: "100%" }}>
          {graphic}
        </div>
        {tier === "soon" && (
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <FPill color="#64748b" bg="#f1f5f9">
              Coming soon
            </FPill>
          </div>
        )}
      </div>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: accentColor,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 4,
            letterSpacing: -0.2,
          }}
        >
          {heading}
        </div>
        <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.65 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

function FMTierHeader({
  label,
  description,
  color = FM_GD,
}: {
  label: string;
  description: string;
  color?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div style={{ height: 1, flex: 1, background: "#f1f5f9" }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <div style={{ height: 1, flex: 1, background: "#f1f5f9" }} />
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: "#94a3b8",
          textAlign: "center",
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section
      id={SECTIONS.features}
      className="py-32 px-6 lg:px-12 border-t border-black/6"
      style={{ background: "#f9fafb" }}
    >
      <div className="max-w-5xl mx-auto">
        <FadeUpWhenVisible className="mb-4 text-center">
          <span
            className="text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ color: FM_GD }}
          >
            Features
          </span>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.05} className="mb-3 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
            Everything Rinse does
          </h2>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.1} className="mb-16 text-center">
          <p
            className="text-base max-w-md mx-auto leading-relaxed"
            style={{ color: "#64748b" }}
          >
            One platform built for detail shops, mobile operators, and everyone
            scaling between them.
          </p>
        </FadeUpWhenVisible>

        {/* ── Tier 1: Shipped Now ── */}
        <FMTierHeader
          label="Shipped now"
          description="Live and ready for your shop today."
          color={FM_GD}
        />
        <div
          className="grid gap-4 mb-14"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          <FMFeatureCard
            label="Lead Pipeline"
            heading="Inquiry → Quoted → Scheduled"
            body="Move leads through your pipeline with a visual board. Every inquiry becomes a booked job — nothing slips through."
            graphic={<LeadPipelineGraphic />}
            tier="shipped"
          />
          <FMFeatureCard
            label="Quote & Estimate Builder"
            heading="Vehicle + service → sendable quote"
            body="Build itemized quotes in seconds. Send a branded link your client can approve and pay directly."
            graphic={<QuoteBuilderGraphic />}
            tier="shipped"
          />
          <FMFeatureCard
            label="Client Portal"
            heading="Sign & pay before the job"
            body="Clients get a branded portal to review the scope, sign the agreement, and pay upfront — all from their phone."
            graphic={<ClientPortalGraphic />}
            tier="shipped"
          />
          <FMFeatureCard
            label="Damage Documentation"
            heading="Pre-job walkthrough + damage map"
            body="Mark existing damage on a vehicle diagram before every job. Protect your shop and keep clients informed."
            graphic={<DamageDocsGraphic />}
            tier="shipped"
          />
          <FMFeatureCard
            label="Inventory & Supplies"
            heading="Low-stock alerts before you run out"
            body="Track ceramic, foam pads, detailing spray, and everything else. Get alerted the moment stock drops below threshold."
            graphic={<InventoryGraphic />}
            tier="shipped"
          />
          <FMFeatureCard
            label="Auto Messages & Reviews"
            heading="On-my-way, reminders, review asks"
            body="Automated texts at every stage — arrival, reminders, and a perfectly-timed review request once the job is done."
            graphic={<AutoMessagesGraphic />}
            tier="shipped"
          />
        </div>

        {/* ── Tier 2: Coming Soon ── */}
        <FMTierHeader
          label="Coming soon"
          description="In development — launching later this year."
          color="#64748b"
        />
        <div
          className="grid gap-4 mb-14"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          <FMFeatureCard
            label="GPS Fleet Tracking"
            heading="Live tech routes & ETAs for clients"
            body="Customers see their technician on a live map. You see your whole fleet from one dashboard."
            graphic={<GPSTrackingGraphic />}
            tier="soon"
          />
          <FMFeatureCard
            label="Integrations Hub"
            heading="QuickBooks, Google Cal, Zapier, Stripe"
            body="Connect Rinse to the tools you already use. Two-way sync keeps your calendar, books, and payments in lockstep."
            graphic={<IntegrationsGraphic />}
            tier="soon"
          />
          <FMFeatureCard
            label="Multi-Location / Franchise"
            heading="Several shops, one dashboard"
            body="Run multiple locations from a single login. Roll-up reporting, per-location techs, and centralized client records."
            graphic={<MultiLocationGraphic />}
            tier="soon"
          />
        </div>

        {/* ── Tier 3: Scale — AI ── */}
        <FMTierHeader
          label="Scale plan — AI"
          description="Intelligence features for shops ready to grow."
          color={FM_P}
        />
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          <FMFeatureCard
            label="AI Receipt Scan"
            heading="Photo → expense line items"
            body="Photograph a supplier receipt and watch it turn into structured expense records. No manual entry."
            graphic={<AIReceiptGraphic />}
            tier="ai"
          />
          <FMFeatureCard
            label="AI Vehicle Capture"
            heading="Photo → make, model, VIN"
            body="Point the camera at a plate or VIN sticker. Rinse reads it and matches the vehicle to your CRM automatically."
            graphic={<AIVehicleGraphic />}
            tier="ai"
          />
          <FMFeatureCard
            label="AI Ops Copilot"
            heading="Ask your business anything"
            body={
              '"Who\'s overdue?" "Best day to book?" Draft follow-ups. Your copilot answers in plain English and takes action.'
            }
            graphic={<AICopilotGraphic />}
            tier="ai"
          />
          <FMFeatureCard
            label="AI Pricing Assistant"
            heading="Smart quotes from history + market"
            body="Tell Rinse the vehicle and package. Get a suggested price range based on your past jobs and local market data."
            graphic={<AIPricingGraphic />}
            tier="ai"
          />
          <FMFeatureCard
            label="Public / Partner API"
            heading="Read/write jobs, clients, quotes"
            body="Full REST API for agencies, franchisees, and developers building custom workflows on top of Rinse."
            graphic={<APIGraphic />}
            tier="ai"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const businesses = useCountUp(2400, 2000, inView);
  const revenue = useCountUp(42, 2200, inView);
  const rating = useCountUp(49, 1800, inView);

  return (
    <div ref={ref} className="border-y border-black/6 py-14 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/6">
        {[
          {
            value: `${businesses.toLocaleString()}+`,
            label: "businesses on Rinse",
            sub: "and growing every day",
          },
          {
            value: `$${revenue}M+`,
            label: "revenue processed",
            sub: "in the last 12 months",
          },
          {
            value: `${(rating / 10).toFixed(1)}★`,
            label: "average rating",
            sub: "across 12,000+ reviews",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="md:px-12 text-center md:text-left first:pl-0"
          >
            <div className="text-4xl lg:text-5xl font-bold text-neutral-900 font-mono tracking-tight">
              {s.value}
            </div>
            <div className="text-base font-semibold text-black/60 mt-2">
              {s.label}
            </div>
            <div className="text-sm text-black/25 font-mono mt-1">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialStars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill="#4bac50" color="#4bac50" />
      ))}
    </div>
  );
}

function TestimonialAvatar({
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

const TESTIMONIALS = [
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

const TESTIMONIAL_STATS = [
  { label: "Early access", sub: "Now open" },
  { label: "Founding cohort", sub: "Limited spots" },
  { label: "No contracts", sub: "Cancel any time" },
];

function TestimonialsSection() {
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

const COMPARISON_FEATURES: {
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
function BillingToggle({
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
function FeatureRow({
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
function FounderProgress() {
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
function FounderBanner({ onStartTrial }: { onStartTrial: () => void }) {
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
function PricingCard({
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

function PricingSection({ onStartTrial }: { onStartTrial: () => void }) {
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

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection({
  onStartTrial,
  onBookDemo,
}: {
  onStartTrial: () => void;
  onBookDemo: () => void;
}) {
  return (
    <section id={SECTIONS.cta} className="py-32 px-6 lg:px-12 border-t border-black/6">
      <div className="max-w-7xl mx-auto">
        <FadeUpWhenVisible>
          <div
            className="rounded-3xl border border-black/8 overflow-hidden relative p-12 lg:p-20 text-center"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(51,90,255,0.07), transparent), #FFFFFF",
            }}
          >
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono text-[#4bac50] border border-[#4bac50]/25 bg-[#4bac50]/10 px-3 py-1.5 rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4bac50] animate-pulse" />
                Free 14-day trial · No credit card required
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight mb-5">
                Run your business
                <br />
                like the pros do.
              </h2>
              <p className="text-base lg:text-lg text-black/40 max-w-xl mx-auto mb-10 leading-relaxed">
                Join 2,400+ detailing businesses using Rinse to book more, earn
                more, and build something worth owning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onStartTrial}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-white text-sm font-semibold px-6 py-3 rounded-xl"
                >
                  Start your free trial
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={onBookDemo}
                  className="flex items-center gap-2 text-black/50 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-sm font-semibold px-6 py-3"
                >
                  Book a 15-min demo
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </FadeUpWhenVisible>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_LINKS: Record<
  string,
  { label: string; href?: string; action?: "scroll" | "mailto" }[]
> = {
  Product: [
    { label: "Features", action: "scroll", href: SECTIONS.features },
    { label: "Pricing", action: "scroll", href: SECTIONS.pricing },
    { label: "Changelog", href: "https://rinse.app/changelog" },
    { label: "Roadmap", href: "https://rinse.app/roadmap" },
    { label: "Status", href: "https://status.rinse.app" },
  ],
  Company: [
    { label: "About", href: "https://rinse.app/about" },
    { label: "Blog", href: "https://rinse.app/blog" },
    { label: "Careers", href: "https://rinse.app/careers" },
    { label: "Press", href: "mailto:press@rinse.app" },
    { label: "Contact", href: "mailto:hello@rinse.app" },
  ],
  Resources: [
    { label: "Documentation", href: "https://docs.rinse.app" },
    { label: "API Reference", href: "https://docs.rinse.app/api" },
    { label: "Community", href: "https://community.rinse.app" },
    { label: "Templates", href: "https://rinse.app/templates" },
    { label: "Integrations", href: "https://rinse.app/integrations" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "https://rinse.app/privacy" },
    { label: "Terms of Service", href: "https://rinse.app/terms" },
    { label: "Cookie Policy", href: "https://rinse.app/cookies" },
    { label: "GDPR", href: "https://rinse.app/gdpr" },
  ],
};

function Footer() {
  const handleFooterClick = (link: {
    label: string;
    href?: string;
    action?: "scroll" | "mailto";
  }) => {
    if (link.action === "scroll" && link.href) {
      scrollToSection(link.href);
      return;
    }
    if (link.href) {
      window.open(
        link.href,
        link.href.startsWith("mailto:") ? "_self" : "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    <footer className="border-t border-black/6 px-6 lg:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center mb-4 hover:opacity-80 transition-opacity"
            >
              <img src={rinseLogo} alt="Rinse" className="h-6 w-auto" />
            </button>
            <p className="text-xs text-black/30 leading-relaxed max-w-[160px]">
              The operating system for mobile detailing professionals.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="text-[10px] font-mono text-black/25 uppercase tracking-widest mb-4">
                {title}
              </div>
              <div className="space-y-2.5">
                {links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleFooterClick(link)}
                    className="block text-xs text-black/35 hover:text-black/70 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-left"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-black/5">
          <div className="text-[11px] font-mono text-black/20">
            © 2025 Rinse Technologies, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Twitter", href: "https://twitter.com/rinseapp" },
              {
                label: "LinkedIn",
                href: "https://linkedin.com/company/rinseapp",
              },
              { label: "GitHub", href: "https://github.com/rinseapp" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-black/20 hover:text-black/50 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({
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
            Introducing Route Optimization 2.0
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
          Bookings, scheduling, CRM, invoices, payments, and analytics — unified
          in one platform built exclusively for detailing professionals.
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
            Start free — no card needed
            <ArrowRight size={15} />
          </button>
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-2 text-black/50 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-sm font-semibold px-6 py-3 rounded-xl border border-black/8 hover:border-black/16 bg-black/2"
          >
            Watch 2-min demo
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

// ─── Logo bar ─────────────────────────────────────────────────────────────────
function LogoBar() {
  const names = [
    "Detail King",
    "Auto Elegance",
    "Clean Machine Co.",
    "Apex Detailing",
    "Prestige Auto Spa",
    "Shine Theory",
    "Mirror Finish",
    "ProWash Mobile",
  ];
  return (
    <div className="py-12 px-6 lg:px-12 border-y border-black/6">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-[10px] font-mono text-black/20 uppercase tracking-[0.2em] mb-8">
          Built for detailing professionals
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((n) => (
            <span
              key={n}
              className="text-xs font-semibold text-black/18 hover:text-black/35 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] cursor-default"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Product Showcase ─────────────────────────────────────────────────────────
function ShowcaseSection() {
  return (
    <section className="px-6 lg:px-12 border-t border-black/6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="py-24 lg:py-32 lg:pr-16 lg:border-r border-black/6">
            <FadeUpWhenVisible className="mb-4">
              <span className="text-[10px] font-mono text-[#4bac50] uppercase tracking-[0.2em]">
                Technician Management
              </span>
            </FadeUpWhenVisible>
            <FadeUpWhenVisible delay={0.06} className="mb-5">
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-snug">
                Your team,
                <br />
                always in sync.
              </h2>
            </FadeUpWhenVisible>
            <FadeUpWhenVisible delay={0.1} className="mb-8">
              <p className="text-sm text-black/40 leading-relaxed">
                Real-time GPS, job status updates, photo documentation, and
                performance dashboards — all from one screen. Know exactly where
                every tech is and what they're working on.
              </p>
            </FadeUpWhenVisible>
            <FadeUpWhenVisible delay={0.13}>
              <div className="space-y-3">
                {[
                  {
                    icon: MapPin,
                    text: "Live GPS tracking for all technicians",
                  },
                  {
                    icon: Bell,
                    text: "Push notifications for new and updated jobs",
                  },
                  { icon: Shield, text: "Photo capture and digital sign-off" },
                  { icon: Zap, text: "Performance scoring and leaderboards" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#4bac50]/15 flex items-center justify-center flex-shrink-0">
                      <item.icon size={13} className="text-[#4bac50]" />
                    </div>
                    <span className="text-sm text-black/55">{item.text}</span>
                  </div>
                ))}
              </div>
            </FadeUpWhenVisible>
          </div>

          <FadeUpWhenVisible delay={0.15} className="flex items-center py-24 lg:py-32 lg:pl-16">
            {/* Team mockup */}
            <div className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)]">
              <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">
                  Live Team View
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400">
                    3 active
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  {
                    name: "Marcus T.",
                    status: "In transit",
                    job: "BMW M3 · 1.2 mi away",
                    pct: 72,
                    color: "#4bac50",
                  },
                  {
                    name: "Jordan K.",
                    status: "On job",
                    job: "Porsche 911 · In progress",
                    pct: 45,
                    color: "#22C55E",
                  },
                  {
                    name: "Ryan S.",
                    status: "Wrapping up",
                    job: "Range Rover · Final rinse",
                    pct: 91,
                    color: "#A855F7",
                  },
                ].map((tech) => (
                  <div
                    key={tech.name}
                    className="rounded-xl border border-black/5 bg-black/2 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold text-neutral-900">
                          {tech.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-neutral-900">
                            {tech.name}
                          </div>
                          <div className="text-[10px] text-black/30 font-mono">
                            {tech.job}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/5 text-black/40">
                        {tech.status}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-black/6 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: tech.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${tech.pct}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1,
                          delay: 0.2,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <div className="text-right text-[9px] font-mono text-black/20 mt-1">
                      {tech.pct}% complete
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUpWhenVisible>
        </div>
      </div>
    </section>
  );
}

// ─── Integration Ecosystem Showcase ────────────────────────────────────────────
const ECOSYSTEM_INTEGRATIONS = [
  { id: 0, name: "Stripe", color: "#635BFF", icon: CreditCard },
  { id: 1, name: "Google Calendar", color: "#4285F4", icon: Calendar },
  { id: 2, name: "QuickBooks", color: "#2CA01C", icon: BookOpen },
  { id: 4, name: "Zapier", color: "#FF4A00", icon: Zap },
  { id: 5, name: "Google Maps", color: "#34A853", icon: MapPin },
  { id: 6, name: "Apple Pay", color: "#A0A0A0", icon: Smartphone },
  { id: 7, name: "Mailchimp", color: "#FFE01B", icon: Mail },
] as const;

const ECOSYSTEM_TOP_ROW = [
  ...ECOSYSTEM_INTEGRATIONS,
  ...ECOSYSTEM_INTEGRATIONS,
];
const ECOSYSTEM_BOTTOM_ROW = [
  ...ECOSYSTEM_INTEGRATIONS.slice(4),
  ...ECOSYSTEM_INTEGRATIONS.slice(0, 4),
  ...ECOSYSTEM_INTEGRATIONS.slice(4),
  ...ECOSYSTEM_INTEGRATIONS.slice(0, 4),
];

interface EcosystemCardProps {
  id: number;
  name: string;
  color: string;
  icon: React.ElementType;
}

function EcosystemCard({ name, color, icon: Icon }: EcosystemCardProps) {
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

function EcosystemSection() {
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

// ─── App ─────────────────────────────────────────────────────────────────────
function HomePage({
  onStartTrial,
  onOpenDemo,
  onBookDemo,
}: {
  onStartTrial: () => void;
  onOpenDemo: () => void;
  onBookDemo: () => void;
}) {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Nav onStartTrial={onStartTrial} />
      <HeroSection onStartTrial={onStartTrial} onOpenDemo={onOpenDemo} />
      <LogoBar />

      {/* Workflow section header */}
      <div className="pt-32 px-6 lg:px-12 border-t border-black/6">
        <div className="max-w-7xl mx-auto">
          <FadeUpWhenVisible className="mb-3">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
              One workflow.
              <br />
              <span className="text-black/30">End to end.</span>
            </h2>
          </FadeUpWhenVisible>
          <FadeUpWhenVisible delay={0.07} className="mb-0">
            <p className="text-base text-black/35 max-w-lg leading-relaxed">
              From the moment a customer books to the second the money hits your
              account — Rinse handles every step automatically.
            </p>
          </FadeUpWhenVisible>
        </div>
      </div>

      <NodeCanvasSection />
      <ShowcaseSection />
      <EcosystemInlinePanel />
      <TestimonialsSection />
      <PricingSection onStartTrial={onStartTrial} />
      <CTASection onStartTrial={onStartTrial} onBookDemo={onBookDemo} />
      <Footer />
    </div>
  );
}

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false);

  const handleStartTrial = useCallback(() => {
    scrollToSection(SECTIONS.cta);
  }, []);

  const handleBookDemo = useCallback(() => {
    window.open("mailto:hello@rinse.app?subject=Book%20a%20demo", "_blank");
  }, []);

  const handleOpenDemo = useCallback(() => {
    setDemoOpen(true);
  }, []);

  return (
    <Routes>
      <ReactRoute
        path="/"
        element={
          <>
            <HomePage
              onStartTrial={handleStartTrial}
              onOpenDemo={handleOpenDemo}
              onBookDemo={handleBookDemo}
            />
            <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
          </>
        }
      />
      <ReactRoute path="/features" element={<FeaturesPage />} />
    </Routes>
  );
}
