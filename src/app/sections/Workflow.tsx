import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Calendar, BarChart2, Users, Car, FileText, DollarSign, TrendingUp, CheckCircle, Zap, Route, Smartphone, CreditCard } from "lucide-react";
import { SECTIONS } from "../shared/scroll";
import { FadeUpWhenVisible } from "../shared/motion";

export function BookingMockup() {
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

export function CalendarMockup() {
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

export function AssignMockup() {
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

export function InvoiceMockup() {
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

export function AnalyticsMockup() {
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

export const WORKFLOW_STEPS = [
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
export const NODE_GRAPHS = [
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

export const NODE_POS = [
  { x: 40, y: 210 },
  { x: 260, y: 70 },
  { x: 480, y: 210 },
];

export function NodeGraph({
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

export function NodeCanvasSection() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll listener — always picks whichever step's top is nearest to the
  // 35 % trigger line, falling back to the last step that has passed it.
  useEffect(() => {
    const onScroll = () => {
      const trigger = window.innerHeight * 0.35;
      let best = 0;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        if (top <= trigger) best = i;
      });
      setActiveStep(best);
    };
    onScroll(); // set correct state on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
                className={`block w-full text-center py-2.5 border-l-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                className="border-b border-black/6"
                style={{ minHeight: "80vh", paddingTop: "8vh", paddingBottom: "8vh" }}
              >
                {/* Text block */}
                <div className="mb-8 max-w-lg mx-auto text-center">
                  <div className="flex items-center justify-center gap-2.5 mb-4">
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
                <div className="flex items-center justify-center">
                  {step.mockup}
                </div>
              </div>
            ))}

            {/* Integration logos marquee — beneath all steps */}
            <WorkflowIntegrationStrip />
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

