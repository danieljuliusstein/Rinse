import { useState, useEffect, useRef, useCallback } from "react";
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
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <div className="text-sm font-semibold text-neutral-900">Rinse product tour</div>
            <div className="text-[11px] text-black/35 font-mono mt-0.5">2-minute overview</div>
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
              See how Rinse handles bookings, scheduling, and payments in one workflow.
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
        <span className="text-sm font-semibold text-neutral-900">New Booking</span>
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
        <span className="text-sm font-semibold text-neutral-900">June 9–14, 2025</span>
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
                  <div className="text-[9px] font-bold text-[#4bac50]">Tesla S</div>
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
        <div className="text-sm font-semibold text-neutral-900">Assign Technician</div>
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
                t.active ? "bg-[#4bac50] text-white" : "bg-black/8 text-black/50"
              }`}
            >
              {t.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900">{t.name}</div>
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
    { user: "Priya (Dispatch)", av: "PD", color: "bg-[#4bac50]", text: "Marcus just clocked in for the M3 job on 5th St" },
    { user: "Marcus T.", av: "MT", color: "bg-sky-500", text: "On site now, starting paint correction" },
    { user: "Priya (Dispatch)", av: "PD", color: "bg-[#4bac50]", text: "Got it — customer added a ceramic add-on, invoice will update" },
    { user: "Jordan K.", av: "JK", color: "bg-violet-500", text: "Heads up, running 10 min behind on the GT3 detail" },
    { user: "Priya (Dispatch)", av: "PD", color: "bg-[#4bac50]", text: "No worries, I've nudged the 2pm slot automatically" },
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
      style={{ width: 236, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 50px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.08)" }}
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
            <div className={`w-5 h-5 rounded-full ${m.color} flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white mt-0.5`}>
              {m.av}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[9px] font-semibold text-neutral-900">{m.user}</span>
              <span className="text-[10px] leading-[1.4] text-black/45">{m.text}</span>
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
      style={{ width: 268, background: "#111219", border: "1px solid rgba(0,0,0,0.2)", boxShadow: "0 20px 50px rgba(0,0,0,0.2), 0 4px 14px rgba(0,0,0,0.1)" }}
    >
      <WindowChrome title="zsh — rinse-cli" dark />
      <div className="px-3 py-2.5 flex flex-col gap-1 h-[132px] font-mono overflow-hidden">
        {history.map((l, i) => (
          <div key={i} className="text-[10px] leading-[1.6] text-white/25 truncate">
            {l}
          </div>
        ))}
        <div className="text-[10px] leading-[1.6] text-white/80 flex items-start gap-1.5">
          {!text.startsWith("→") && <span className="text-[#4bac50] flex-shrink-0">➜</span>}
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
    const id = setInterval(() => setActive((a) => (a + 1) % transcript.length), 2200);
    return () => clearInterval(id);
  }, [transcript.length]);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ width: 272, background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 50px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.08)" }}
    >
      <WindowChrome title="Product Overview" />
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: 108, background: "linear-gradient(135deg, #0d1a12 0%, #163420 100%)" }}
      >
        <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(ellipse at 30% 60%, #4bac50 0%, transparent 60%)" }} />
        <motion.div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          animate={{ backgroundPosition: ["0px 0px", "20px 20px"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <button
          onClick={() => setPlaying((p) => !p)}
          className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
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
              animate={{ width: `${((active + 1) / transcript.length) * 100}%` }}
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
            style={{ borderLeft: i === active ? "2px solid #4bac50" : "2px solid transparent" }}
            animate={{ opacity: i === active ? 1 : 0.35 }}
            transition={TRANSITION_MACRO}
          >
            <span className="text-[9px] flex-shrink-0 mt-0.5 font-mono text-[#4bac50] w-7">{line.t}</span>
            <span className="text-[9px] leading-[1.5] text-black/55">{line.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Main window — cycles a "live booking coming in" state to feel alive.
function HeroMainWindow() {
  const jobs = [
    { time: "9:00 AM", client: "James W.", vehicle: "BMW M3 Competition", service: "Paint Correction", tech: "Marcus T.", status: "in-progress", amount: "$480" },
    { time: "11:30 AM", client: "Sarah K.", vehicle: "Porsche 911 GT3", service: "Full Detail", tech: "Jordan K.", status: "upcoming", amount: "$299" },
    { time: "2:00 PM", client: "Alex C.", vehicle: "Tesla Model S", service: "Ceramic Coating", tech: "Unassigned", status: "new", amount: "$899" },
    { time: "4:30 PM", client: "Derek M.", vehicle: "Range Rover SVR", service: "Interior Detail", tech: "Ryan S.", status: "upcoming", amount: "$195" },
  ];
  const statusStyle: Record<string, string> = {
    "in-progress": "bg-[#4bac50]/20 text-[#4bac50]",
    upcoming: "bg-black/8 text-black/50",
    new: "bg-emerald-500/15 text-emerald-400",
  };

  const cycle = ["New booking arriving…", "Processing…", "Confirmed · $899.00"];
  const [cycleIdx, setCycleIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCycleIdx((i) => (i + 1) % cycle.length), 1800);
    return () => clearInterval(id);
  }, [cycle.length]);

  return (
    <div
      className="rounded-2xl overflow-hidden flex select-none"
      style={{ width: 620, height: 400, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 40px 90px rgba(0,0,0,0.16), 0 6px 20px rgba(0,0,0,0.1)" }}
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
            <div className="text-sm font-bold text-neutral-900">Good morning, Jason ☀</div>
            <div className="text-[10px] text-black/30 font-mono mt-0.5">Monday, June 9, 2025</div>
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
            <div key={s.label} className="bg-black/3 border border-black/5 rounded-lg p-2.5">
              <div className="text-[8px] font-mono text-black/30 uppercase tracking-wider">{s.label}</div>
              <div className="text-sm font-bold text-neutral-900 mt-1 font-mono">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-black/5 overflow-hidden flex-1">
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
            <span className="text-[11px] font-semibold text-neutral-900">Today's Schedule</span>
            <span className="text-[9px] text-black/25 font-mono">8 jobs · $1,873</span>
          </div>
          {jobs.map((job, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 ${i < jobs.length - 1 ? "border-b border-black/4" : ""}`}>
              <span className="text-[9px] font-mono text-black/30 w-12 flex-shrink-0">{job.time}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-neutral-900 truncate">{job.client} · {job.vehicle}</div>
                <div className="text-[9px] text-black/30 font-mono truncate">{job.service} · {job.tech}</div>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusStyle[job.status]}`}>{job.status}</span>
              <span className="text-[11px] font-bold font-mono text-black/60 flex-shrink-0">{job.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Draggable floating window wrapper — grab/throw physics, constrained to the hero container.
function DraggableWindow({
  children,
  containerRef,
  style,
  reveal,
}: {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  style: React.CSSProperties;
  reveal: { x?: number; y?: number; delay: number };
}) {
  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing"
      style={style}
      drag
      dragMomentum
      dragElastic={0.18}
      dragConstraints={containerRef}
      whileDrag={{ scale: 1.02 }}
      initial={{ opacity: 0, x: reveal.x ?? 0, y: reveal.y ?? 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: reveal.delay }}
    >
      {children}
    </motion.div>
  );
}

function HeroWindowCluster() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative mx-auto hidden lg:block" style={{ width: 1040, height: 460 }}>
      {/* Main window — front and center */}
      <motion.div
        className="absolute z-30"
        style={{ top: 8, left: "50%", x: "-50%" }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <HeroMainWindow />
      </motion.div>

      <DraggableWindow containerRef={containerRef} style={{ top: 20, left: 0, zIndex: 20 }} reveal={{ x: -20, delay: 0.15 }}>
        <HeroChatPanel />
      </DraggableWindow>

      <DraggableWindow containerRef={containerRef} style={{ bottom: 0, left: 40, zIndex: 20 }} reveal={{ x: -20, delay: 0.15 }}>
        <HeroLogPanel />
      </DraggableWindow>

      <DraggableWindow containerRef={containerRef} style={{ top: 44, right: 0, zIndex: 20 }} reveal={{ x: 20, delay: 0.25 }}>
        <HeroVideoPanel />
      </DraggableWindow>
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
              { label: "Today's Revenue", value: "$1,873", delta: "+18%", up: true },
              { label: "Jobs Today", value: "8", delta: "6 active", up: true },
              { label: "New Bookings", value: "3", delta: "This week", up: false },
              { label: "Avg Rating", value: "4.9★", delta: "↑ from 4.7", up: true },
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
        transition={{ delay: 1.6, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <div className="w-8 h-8 rounded-xl bg-[#4bac50]/20 flex items-center justify-center flex-shrink-0">
          <Bell size={14} className="text-[#4bac50]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-neutral-900">New booking</div>
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
        transition={{ delay: 1.8, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider mb-1">
          This Month
        </div>
        <div className="text-xl font-bold text-neutral-900 font-mono">$18,420</div>
        <div className="flex items-center gap-1 mt-0.5">
          <TrendingUp size={10} className="text-emerald-400" />
          <span className="text-[9px] font-mono text-emerald-400">+23% vs last month</span>
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
  { nodes: [{ icon: Users, label: "Customer" }, { icon: Smartphone, label: "Booking Portal" }, { icon: Calendar, label: "Calendar" }], pill: { icon: CheckCircle, label: "Booked" } },
  { nodes: [{ icon: Calendar, label: "New Booking" }, { icon: Zap, label: "Calendar Engine" }, { icon: Users, label: "Team Schedule" }], pill: { icon: CheckCircle, label: "Synced" } },
  { nodes: [{ icon: Car, label: "Job Queue" }, { icon: Route, label: "Route Engine" }, { icon: Users, label: "Technician" }], pill: { icon: CheckCircle, label: "Assigned" } },
  { nodes: [{ icon: FileText, label: "Job Complete" }, { icon: DollarSign, label: "Invoice Engine" }, { icon: CreditCard, label: "Stripe" }], pill: { icon: CheckCircle, label: "Paid" } },
  { nodes: [{ icon: BarChart2, label: "Live Data" }, { icon: Zap, label: "Analytics Engine" }, { icon: TrendingUp, label: "Dashboard" }], pill: { icon: CheckCircle, label: "Live" } },
];

const NODE_POS = [
  { x: 40, y: 210 },
  { x: 260, y: 70 },
  { x: 480, y: 210 },
];

function NodeGraph({ graph, replayKey }: { graph: (typeof NODE_GRAPHS)[number]; replayKey: number }) {
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
          <span className="text-[10px] font-mono text-black/40 whitespace-nowrap">{node.label}</span>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Map scroll progress through the section into equal brackets, one per
  // step. This only reads scroll position — the page always scrolls
  // completely natively, nothing pins or locks.
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const clamped = Math.min(1, Math.max(0, latest));
    const bracket = Math.min(
      WORKFLOW_STEPS.length - 1,
      Math.floor(clamped * WORKFLOW_STEPS.length)
    );
    setActiveStep((prev) => (prev === bracket ? prev : bracket));
  });

  const goToStep = useCallback((i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerTop = rect.top + window.scrollY;
    const containerHeight = el.offsetHeight;
    const viewportH = window.innerHeight;
    const targetProgress = (i + 0.5) / WORKFLOW_STEPS.length;
    const targetY = targetProgress * (containerHeight + viewportH) + containerTop - viewportH;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }, []);

  return (
    <section id={SECTIONS.workflow} className="py-32 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="mb-8 lg:mb-10">
          <FadeUpWhenVisible>
            <span className="text-[10px] font-mono text-[#4bac50] uppercase tracking-[0.2em]">
              How it works
            </span>
          </FadeUpWhenVisible>
        </div>

        {/* Desktop: natural page scroll drives the active tab and re-triggers
            the node canvas draw animation — no sticky pinning, no scroll-jacking. */}
        <div ref={containerRef} className="hidden lg:grid grid-cols-2 gap-20" style={{ minHeight: "230vh" }}>
          <div className="sticky top-32 self-start space-y-2">
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                className={`w-full flex gap-4 p-4 rounded-2xl border cursor-pointer text-left transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === activeStep ? "border-black/10 bg-black/4" : "border-transparent"
                }`}
                animate={{
                  opacity: i === activeStep ? 1 : i === activeStep - 1 || i === activeStep + 1 ? 0.45 : 0.2,
                }}
                transition={TRANSITION_MACRO}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    i === activeStep ? "bg-[#4bac50]/25 text-[#4bac50]" : "bg-black/5 text-black/25"
                  }`}
                >
                  <step.icon size={15} />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-semibold transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      i === activeStep ? "text-neutral-900" : "text-black/50"
                    }`}
                  >
                    {step.label}
                  </div>
                  {i === activeStep && (
                    <motion.div
                      className="text-xs text-black/40 mt-1.5 leading-relaxed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={TRANSITION_MICRO}
                    >
                      {step.desc}
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}

            {/* Progress bar */}
            <div className="mt-6 px-4">
              <div className="flex gap-1.5">
                {WORKFLOW_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-400 ${
                      i <= activeStep ? "bg-[#4bac50]" : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
              <div className="text-[10px] font-mono text-black/25 mt-2">
                {activeStep + 1} / {WORKFLOW_STEPS.length}
              </div>
            </div>
          </div>

          {/* Right: the node canvas — swaps + redraws on demand, in place. */}
          <div className="sticky top-32 self-start flex items-center justify-center" style={{ minHeight: "min(70vh, 520px)" }}>
            <AnimatePresence mode="wait">
              <NodeGraph key={activeStep} graph={NODE_GRAPHS[activeStep]} replayKey={activeStep} />
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile/tablet: plain stacked layout — no scroll-jacking, so nothing
            can be clipped or misbehave on shorter/smaller screens. */}
        <div className="lg:hidden max-w-xl mx-auto">
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
                  <div className="text-base font-semibold text-neutral-900 mb-2">
                    {step.label}
                  </div>
                  <p className="text-sm text-black/40 leading-relaxed mb-6">
                    {step.desc}
                  </p>
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
const NAV_LINKS = [
  { label: "Features", id: SECTIONS.features },
  { label: "Workflow", id: SECTIONS.workflow },
  { label: "Pricing", id: SECTIONS.pricing },
  { label: "Reviews", id: SECTIONS.testimonials },
] as const;

function Nav({
  onStartTrial,
}: {
  onStartTrial: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleNav = useCallback((id: string) => {
    scrollToSection(id);
    setOpen(false);
  }, []);

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

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.id)}
              className="text-sm text-black/45 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] duration-200"
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

        {/* Mobile menu */}
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
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.id)}
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
            onClick={() => {
              onStartTrial();
              setOpen(false);
            }}
            className="block w-full text-sm font-semibold text-white bg-neutral-900 px-4 py-2.5 rounded-xl text-center mt-2"
          >
            Start free trial
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Drag-and-drop calendar with route optimization, real-time availability, and automated conflict detection.",
    tag: "Scheduling",
    large: true,
    color: "#7C3AED",
    preview: (
      <div className="mt-4 rounded-xl border border-black/6 bg-black/3 p-3 space-y-1.5">
        {["9:00 AM · BMW M3 · Marcus T.", "11:30 AM · Porsche 911 · Jordan K.", "2:00 PM · Tesla Model S · Unassigned"].map((line, i) => (
          <div key={i} className={`flex items-center gap-2 text-[10px] font-mono ${i === 2 ? "text-orange-400" : "text-black/40"}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-[#4bac50]" : i === 1 ? "bg-emerald-500" : "bg-orange-500"}`} />
            {line}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    title: "Customer CRM",
    desc: "Full customer history, vehicle profiles, before/after galleries, and automated follow-up sequences.",
    tag: "CRM",
    large: false,
    color: "#4bac50",
    preview: null,
  },
  {
    icon: FileText,
    title: "Auto Invoicing",
    desc: "Branded PDF invoices generated instantly. Payment reminders, partial payments, and deposit handling.",
    tag: "Invoicing",
    large: false,
    color: "#059669",
    preview: null,
  },
  {
    icon: CreditCard,
    title: "Payments",
    desc: "Stripe-powered card processing, Apple Pay, and bank transfers. Instant payouts. No hidden fees.",
    tag: "Payments",
    large: false,
    color: "#F59E0B",
    preview: null,
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Revenue tracking, technician performance, service mix, customer retention, and profit margins.",
    tag: "Analytics",
    large: true,
    color: "#4bac50",
    preview: (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Revenue", v: "$18,420", d: "+23%" },
          { l: "Jobs", v: "62", d: "+12%" },
          { l: "Avg Ticket", v: "$297", d: "+8%" },
        ].map((m) => (
          <div key={m.l} className="rounded-xl bg-black/3 border border-black/5 p-2.5">
            <div className="text-[9px] font-mono text-black/30 uppercase">{m.l}</div>
            <div className="text-sm font-bold text-neutral-900 font-mono mt-1">{m.v}</div>
            <div className="text-[9px] text-emerald-400 font-mono">{m.d}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Smartphone,
    title: "Technician App",
    desc: "Mobile-first app for field techs. Job details, route navigation, photo capture, and digital sign-off.",
    tag: "Mobile",
    large: false,
    color: "#06B6D4",
    preview: null,
  },
];

function FeaturesSection() {
  return (
    <section id={SECTIONS.features} className="py-32 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <FadeUpWhenVisible className="mb-4">
          <span className="text-[10px] font-mono text-[#4bac50] uppercase tracking-[0.2em]">
            Platform
          </span>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.05} className="mb-3">
          <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
            Everything in one place.
            <br />
            <span className="text-black/30">Nothing left out.</span>
          </h2>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.1} className="mb-16">
          <p className="text-base text-black/40 max-w-xl leading-relaxed">
            Six core modules that replace six separate tools. Designed to work together, not cobbled from acquisitions.
          </p>
        </FadeUpWhenVisible>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-flow-row-dense gap-4">
          {FEATURES.map((f, i) => (
            <FadeUpWhenVisible key={f.title} delay={i * 0.06} className={f.large ? "lg:col-span-2" : ""}>
              <div className="group relative h-full rounded-2xl border border-black/6 bg-black/2 hover:bg-black/4 hover:border-black/10 transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-300 p-6 overflow-hidden cursor-pointer">
                {/* Subtle gradient on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${f.color}08, transparent)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: f.color + "20" }}
                    >
                      <f.icon size={16} style={{ color: f.color }} />
                    </div>
                    <span className="text-[9px] font-mono text-black/20 uppercase tracking-widest">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-black/40 leading-relaxed">{f.desc}</p>
                  {f.preview}
                </div>
              </div>
            </FadeUpWhenVisible>
          ))}
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
    <div
      ref={ref}
      className="border-y border-black/6 py-14 px-6 lg:px-12"
    >
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
interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  city: string;
  quote: string;
  stars: number;
  avatar: string;
  featured?: boolean;
  hasVideo?: boolean;
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "marcus",
    name: "Marcus Rivera",
    role: "Owner",
    company: "Apex Mobile Detailing",
    city: "Los Angeles, CA",
    quote:
      "We were drowning in spreadsheets — separate sheets for invoicing, scheduling, follow-ups. The moment we moved to Rinse, everything collapsed into one place. Six bookings a week became twenty-two in under ninety days. I stopped doing admin at midnight.",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=88&h=88&fit=crop&auto=format",
    featured: true,
  },
  {
    id: "dominique",
    name: "Dominique Osei",
    role: "CEO",
    company: "Prestige Auto Spa",
    city: "Atlanta, GA",
    quote:
      "Route optimization alone saves us two hours every single day. That's ten hours a week we put back into client work, not logistics. Our techs actually show up on time now — customers noticed before we even told them.",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=88&h=88&fit=crop&auto=format",
    hasVideo: true,
  },
  {
    id: "priya",
    name: "Priya Nair",
    role: "Founder",
    company: "Shine Theory Detailing",
    city: "Austin, TX",
    quote:
      "Running solo used to mean flying blind. Now my dashboards give me a real picture of revenue, retention, and where I'm losing jobs. It feels like I have a full operations team backing me up.",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=88&h=88&fit=crop&auto=format",
  },
];

const TESTIMONIAL_STATS: StatItem[] = [
  { value: 4200, suffix: "+", label: "detailers on Rinse" },
  { value: 2.1, suffix: "M", label: "jobs completed", decimals: 1 },
  { value: 4.9, suffix: " ★", label: "avg rating", decimals: 1 },
];

function useTestimonialCountUp(target: number, decimals = 0, active: boolean) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const duration = 1600;
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, target, decimals]);
  return count;
}

function StatCounter({ stat, active }: { stat: StatItem; active: boolean }) {
  const count = useTestimonialCountUp(stat.value, stat.decimals ?? 0, active);
  const display = stat.decimals ? count.toFixed(stat.decimals) : Math.floor(count).toLocaleString();
  return (
    <div className="flex flex-col items-center gap-1 px-8 first:pl-0 last:pr-0">
      <span className="font-mono text-4xl font-bold tracking-tight text-neutral-900">
        {display}{stat.suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-black/35">
        {stat.label}
      </span>
    </div>
  );
}

function TestimonialStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#4bac50">
          <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }: { t: TestimonialItem; index: number }) {
  const featured = t.featured;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.52, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "rounded-2xl p-6 shadow-sm break-inside-avoid",
        featured
          ? "border-l-4 border-[#4bac50] bg-[#4bac50]/[0.04] border border-black/[0.06]"
          : "bg-white border border-black/[0.06]",
      ].join(" ")}
    >
      <TestimonialStars count={t.stars} />
      <p className={["mt-3 leading-relaxed text-neutral-700", featured ? "text-lg font-medium" : "text-sm"].join(" ")}>
        &ldquo;{t.quote}&rdquo;
      </p>
      {t.hasVideo && (
        <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#4bac50] px-3 py-1.5 text-xs font-semibold text-[#4bac50] hover:bg-[#4bac50]/[0.06] transition-colors">
          <Play size={11} strokeWidth={2.5} className="fill-[#4bac50]" />
          Watch story →
        </button>
      )}
      <div className="mt-5 flex items-center gap-3">
        <img
          src={t.avatar}
          alt={t.name}
          width={44}
          height={44}
          className={["size-11 rounded-full object-cover bg-neutral-100", featured ? "ring-2 ring-[#4bac50]/40 ring-offset-1" : ""].join(" ")}
        />
        <div>
          <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
          <p className="text-xs text-black/40">{t.role}, {t.company} · {t.city}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialsSection() {
  const statRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    if (!statRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsActive(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    observer.observe(statRef.current);
    return () => observer.disconnect();
  }, []);

  const columns = [[TESTIMONIALS[0]], [TESTIMONIALS[1]], [TESTIMONIALS[2]]];

  return (
    <section id={SECTIONS.testimonials} className="py-32 px-6 lg:px-12 bg-white">
      <div className="mx-auto max-w-6xl">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-5 flex items-center gap-2"
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4bac50]">
            Social proof
          </span>
          <span className="h-px w-8 bg-[#4bac50]/40" />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mb-14"
        >
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900 leading-tight sm:text-5xl">
            Built by operators,
          </h2>
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900/25 leading-tight sm:text-5xl">
            for operators.
          </h2>
        </motion.div>

        {/* Stat bar */}
        <div
          ref={statRef}
          className="mb-16 flex flex-wrap items-center justify-start gap-y-6 divide-x divide-black/10"
        >
          {TESTIMONIAL_STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} active={statsActive} />
          ))}
        </div>

        {/* 3-column grid — desktop */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:items-start">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-4">
              {col.map((t, ti) => (
                <TestimonialCard key={t.id} t={t} index={ci + ti} />
              ))}
            </div>
          ))}
        </div>

        {/* Single column — mobile */}
        <div className="flex flex-col gap-4 md:hidden">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.id} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: 49,
    desc: "For solo operators getting organized.",
    features: [
      "Up to 40 jobs/month",
      "1 technician",
      "Customer CRM",
      "Online booking page",
      "Digital invoices",
      "Payment processing",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: 99,
    desc: "For growing teams who need full ops.",
    features: [
      "Unlimited jobs",
      "Up to 5 technicians",
      "Route optimization",
      "Analytics dashboard",
      "Automated reminders",
      "Before/after gallery",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Scale",
    price: 249,
    desc: "For multi-van, high-volume operations.",
    features: [
      "Everything in Professional",
      "Unlimited technicians",
      "Multi-location support",
      "Custom branding",
      "API access",
      "Dedicated onboarding",
      "SLA guarantee",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

function PricingSection({ onStartTrial }: { onStartTrial: () => void }) {
  const [annual, setAnnual] = useState(true);

  return (
    <section id={SECTIONS.pricing} className="py-32 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <FadeUpWhenVisible className="mb-4">
          <span className="text-[10px] font-mono text-[#4bac50] uppercase tracking-[0.2em]">
            Pricing
          </span>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.05} className="mb-3">
          <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
            Simple, honest pricing.
          </h2>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.1} className="mb-10">
          <p className="text-base text-black/40 leading-relaxed">
            No per-transaction fees. No feature gating. Cancel any time.
          </p>
        </FadeUpWhenVisible>

        {/* Toggle */}
        <FadeUpWhenVisible delay={0.12} className="mb-12">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${!annual ? "text-neutral-900" : "text-black/35"}`}
            >
              Monthly
            </span>
            <button
              className="relative w-11 h-6 rounded-full bg-black/10 border border-black/8 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
              onClick={() => setAnnual(!annual)}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#4bac50] transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-200 ${annual ? "left-5" : "left-0.5"}`}
              />
            </button>
            <span
              className={`text-sm ${annual ? "text-neutral-900" : "text-black/35"}`}
            >
              Annual
            </span>
            {annual && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </FadeUpWhenVisible>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => {
            const price = annual
              ? Math.round(plan.price * 0.8)
              : plan.price;
            return (
              <FadeUpWhenVisible key={plan.name} delay={i * 0.07}>
                <div
                  className={`relative h-full rounded-2xl border p-6 flex flex-col ${
                    plan.highlight
                      ? "border-[#4bac50]/40 bg-[#4bac50]/8"
                      : "border-black/6 bg-black/2"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 text-[9px] font-mono font-semibold text-[#4bac50] bg-[#4bac50]/20 border border-[#4bac50]/30 px-3 py-0.5 rounded-full whitespace-nowrap">
                      Most popular
                    </div>
                  )}
                  <div className="mb-5">
                    <div className="text-base font-bold text-neutral-900 mb-1">
                      {plan.name}
                    </div>
                    <div className="text-xs text-black/35 leading-relaxed">
                      {plan.desc}
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 mb-6">
                    <span className="text-4xl font-bold text-neutral-900 font-mono">
                      ${price}
                    </span>
                    <span className="text-sm text-black/30 pb-1.5 font-mono">
                      /mo
                    </span>
                  </div>
                  <div className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.highlight ? "bg-[#4bac50]/30" : "bg-black/8"}`}
                        >
                          <Check
                            size={9}
                            className={
                              plan.highlight ? "text-[#4bac50]" : "text-black/40"
                            }
                          />
                        </div>
                        <span className="text-sm text-black/50">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      plan.cta === "Talk to sales"
                        ? window.open("mailto:hello@rinse.app?subject=Scale%20plan%20inquiry", "_blank")
                        : onStartTrial()
                    }
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      plan.highlight
                        ? "bg-neutral-900 hover:bg-neutral-800 text-white"
                        : "bg-black/6 hover:bg-black/10 text-black/70 hover:text-neutral-900 border border-black/8"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </FadeUpWhenVisible>
            );
          })}
        </div>
      </div>
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
    <section id={SECTIONS.cta} className="py-32 px-6 lg:px-12">
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
                Join 2,400+ detailing businesses using Rinse to book more, earn more, and build something worth owning.
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
const FOOTER_LINKS: Record<string, { label: string; href?: string; action?: "scroll" | "mailto" }[]> = {
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
  const handleFooterClick = (link: { label: string; href?: string; action?: "scroll" | "mailto" }) => {
    if (link.action === "scroll" && link.href) {
      scrollToSection(link.href);
      return;
    }
    if (link.href) {
      window.open(link.href, link.href.startsWith("mailto:") ? "_self" : "_blank", "noopener,noreferrer");
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
              { label: "LinkedIn", href: "https://linkedin.com/company/rinseapp" },
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
                  for{" "}
                  <span className="text-[#4bac50]">mobile</span>
                  {" "}detailing.
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
          Bookings, scheduling, CRM, invoices, payments, and analytics — unified in one platform built exclusively for detailing professionals.
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
    <div className="py-12 px-6 lg:px-12 border-b border-black/5">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-[10px] font-mono text-black/20 uppercase tracking-[0.2em] mb-8">
          Trusted by 2,400+ detailing businesses
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((n) => (
            <span key={n} className="text-xs font-semibold text-black/18 hover:text-black/35 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] cursor-default">
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
    <section className="py-32 px-6 lg:px-12 border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
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
                Real-time GPS, job status updates, photo documentation, and performance dashboards — all from one screen. Know exactly where every tech is and what they're working on.
              </p>
            </FadeUpWhenVisible>
            <FadeUpWhenVisible delay={0.13}>
              <div className="space-y-3">
                {[
                  { icon: MapPin, text: "Live GPS tracking for all technicians" },
                  { icon: Bell, text: "Push notifications for new and updated jobs" },
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

          <FadeUpWhenVisible delay={0.15}>
            {/* Team mockup */}
            <div className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)]">
              <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">Live Team View</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400">3 active</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: "Marcus T.", status: "In transit", job: "BMW M3 · 1.2 mi away", pct: 72, color: "#4bac50" },
                  { name: "Jordan K.", status: "On job", job: "Porsche 911 · In progress", pct: 45, color: "#22C55E" },
                  { name: "Ryan S.", status: "Wrapping up", job: "Range Rover · Final rinse", pct: 91, color: "#A855F7" },
                ].map((tech) => (
                  <div key={tech.name} className="rounded-xl border border-black/5 bg-black/2 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold text-neutral-900">
                          {tech.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-neutral-900">{tech.name}</div>
                          <div className="text-[10px] text-black/30 font-mono">{tech.job}</div>
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
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-right text-[9px] font-mono text-black/20 mt-1">{tech.pct}% complete</div>
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
  { id: 0, name: "Stripe",          color: "#635BFF", icon: CreditCard    },
  { id: 1, name: "Google Calendar", color: "#4285F4", icon: Calendar      },
  { id: 2, name: "QuickBooks",      color: "#2CA01C", icon: BookOpen      },
  { id: 4, name: "Zapier",          color: "#FF4A00", icon: Zap           },
  { id: 5, name: "Google Maps",     color: "#34A853", icon: MapPin        },
  { id: 6, name: "Apple Pay",       color: "#A0A0A0", icon: Smartphone    },
  { id: 7, name: "Mailchimp",       color: "#FFE01B", icon: Mail          },
] as const;

const ECOSYSTEM_TOP_ROW    = [...ECOSYSTEM_INTEGRATIONS, ...ECOSYSTEM_INTEGRATIONS];
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
        borderColor: hovered ? `${color}55` : "rgba(255,255,255,0.07)",
        boxShadow: hovered
          ? `0 0 0 1px ${color}22, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 0 0 0px transparent, 0 2px 8px rgba(0,0,0,0.3)",
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex items-center gap-3.5 px-5 shrink-0 cursor-default select-none"
      style={{
        width: 200,
        height: 80,
        borderRadius: 9999,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-full"
        style={{
          width: 36,
          height: 36,
          background: `${color}1A`,
          boxShadow: `0 0 14px ${color}33`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon size={15} color={color} strokeWidth={2.2} />
      </div>
      <span
        className="text-sm font-medium whitespace-nowrap tracking-tight"
        style={{ color: "rgba(255,255,255,0.58)" }}
      >
        {name}
      </span>
    </motion.div>
  );
}

function EcosystemSection() {
  return (
    <section className="relative w-full py-32 bg-white overflow-hidden">
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .eco-scroll-left  { animation: marquee-left  32s linear infinite; }
        .eco-scroll-right { animation: marquee-right 32s linear infinite; }
        .eco-marquee-zone:hover .eco-scroll-left,
        .eco-marquee-zone:hover .eco-scroll-right {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div className="relative z-10 text-center px-6 mb-16">
        <FadeUpWhenVisible className="mb-5">
          <p className="text-xs tracking-[0.28em] uppercase font-medium text-[#4bac50] font-mono">
            Ecosystem
          </p>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.06} className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
            Plays well with the tools
            <br />
            you already run.
          </h2>
        </FadeUpWhenVisible>
        <FadeUpWhenVisible delay={0.12}>
          <motion.button
            onClick={() => scrollToSection(SECTIONS.cta)}
            whileHover={{ borderColor: "rgba(75,172,80,0.55)", background: "rgba(75,172,80,0.1)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
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

      {/* Marquee rows */}
      <div className="relative eco-marquee-zone">
        {/* Edge fades */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{ width: 120, background: "linear-gradient(to right, #ffffff 0%, transparent 100%)" }}
        />
        <div
          className="absolute inset-y-0 right-0 z-10 pointer-events-none"
          style={{ width: 120, background: "linear-gradient(to left, #ffffff 0%, transparent 100%)" }}
        />

        {/* Row 1 — scrolls left */}
        <div className="overflow-hidden mb-4">
          <div className="eco-scroll-left flex gap-4 py-3" style={{ width: "max-content" }}>
            {ECOSYSTEM_TOP_ROW.map((item, i) => (
              <EcosystemCard key={`t-${i}`} {...item} />
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="overflow-hidden">
          <div className="eco-scroll-right flex gap-4 py-3" style={{ width: "max-content" }}>
            {ECOSYSTEM_BOTTOM_ROW.map((item, i) => (
              <EcosystemCard key={`b-${i}`} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
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
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Nav onStartTrial={handleStartTrial} />
      <HeroSection onStartTrial={handleStartTrial} onOpenDemo={handleOpenDemo} />
      <LogoBar />
      <StatsBar />

      {/* Workflow section header */}
      <div className="pt-32 px-6 lg:px-12">
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
              From the moment a customer books to the second the money hits your account — Rinse handles every step automatically.
            </p>
          </FadeUpWhenVisible>
        </div>
      </div>

      <NodeCanvasSection />
      <FeaturesSection />
      <ShowcaseSection />
      <EcosystemSection />
      <TestimonialsSection />
      <PricingSection onStartTrial={handleStartTrial} />
      <CTASection onStartTrial={handleStartTrial} onBookDemo={handleBookDemo} />
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
