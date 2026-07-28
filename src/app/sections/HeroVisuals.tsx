import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { Calendar, BarChart2, Users, Bell, Check, Car, FileText, TrendingUp, CheckCircle, Route, Plus, CreditCard } from "lucide-react";

export const WinDots = () => (
  <div className="flex gap-[5px] items-center flex-shrink-0">
    <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]/70" />
    <div className="w-[9px] h-[9px] rounded-full bg-[#ffbd2e]/70" />
    <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]/70" />
  </div>
);

export function WindowChrome({
  title,
  dark = false,
  right,
}: {
  title: string;
  dark?: boolean;
  right?: ReactNode;
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
export function HeroChatPanel() {
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
export function HeroLogPanel() {
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
export function HeroVideoPanel() {
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
export function HeroMainWindow() {
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

export function HeroWindowCluster() {
  // dragRef spans the full viewport width — windows can be dragged to screen edges
  const dragRef      = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [focused, setFocused] = useState<"main" | "chat" | "log" | "video" | null>(null);
  const [showSide, setShowSide]       = useState(false);
  const [sideEntered, setSideEntered] = useState(false);

  const { scrollY } = useScroll();

  // Scroll-driven scale: large at top → normal once side panels appear
  const mainScale = useTransform(scrollY, [0, 220], [1.22, 1.0]);

  useMotionValueEvent(scrollY, "change", (v) => {
    if (v > 100)  { setShowSide(true); }
    if (v <= 100) { setShowSide(false); setSideEntered(false); }
  });

  const zFor = (id: "main" | "chat" | "log" | "video", base: number) =>
    focused === id ? 50 : base;

  const ENTER_T = (delay: number) => ({ duration: 0.4, ease: EASE, delay });
  const EXIT_T  = { duration: 0.28, ease: "easeIn" as const };

  const dragProps = {
    drag: true as const,
    dragMomentum: false,
    dragElastic: 0.06,
    dragConstraints: dragRef,   // ← full-viewport constraint, not the 1040px box
    whileDrag: { zIndex: 99 },
  };

  return (
    <div className="relative mx-auto" style={{ width: 1040, height: 520 }}>
      {/*
        Full-viewport-width invisible zone used only as drag bounds.
        Positioned by getBoundingClientRect so framer-motion can compare
        it against each window's rect regardless of DOM hierarchy.
      */}
      <div
        ref={dragRef}
        className="pointer-events-none absolute"
        style={{
          top: -40,
          height: "calc(100% + 80px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
        }}
      />
      {/* Positioning anchor — windows are placed relative to this 1040px box */}
      <div
        ref={containerRef}
        className="absolute inset-0"
      />
      {/* ── Main dashboard — large at top, shrinks as side panels emerge ──── */}
      <motion.div
        {...dragProps}
        className="absolute cursor-grab active:cursor-grabbing select-none"
        style={{
          top: 8,
          left: "calc(50% - 310px)",
          zIndex: zFor("main", 30),
          scale: mainScale,
          transformOrigin: "top center",
        }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ opacity: { duration: 0.5, ease: EASE }, y: { duration: 0.5, ease: EASE } }}
        onPointerDown={() => setFocused("main")}
      >
        <HeroMainWindow />
      </motion.div>

      {/* ── Side panels — staggered in on scroll, staggered out on scroll back ── */}
      <AnimatePresence>
        {showSide && (
          <motion.div
            key="chat"
            {...dragProps}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ top: 20, left: 0, zIndex: zFor("chat", 20) }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={sideEntered ? EXIT_T : ENTER_T(0)}
            onPointerDown={() => setFocused("chat")}
            onAnimationComplete={() => { if (!sideEntered) setSideEntered(true); }}
          >
            <HeroChatPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSide && (
          <motion.div
            key="log"
            {...dragProps}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ bottom: 0, left: 40, zIndex: zFor("log", 20) }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={sideEntered ? EXIT_T : ENTER_T(0.14)}
            onPointerDown={() => setFocused("log")}
          >
            <HeroLogPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSide && (
          <motion.div
            key="video"
            {...dragProps}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ top: 44, right: 0, zIndex: zFor("video", 20) }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={sideEntered ? EXIT_T : ENTER_T(0.26)}
            onPointerDown={() => setFocused("video")}
          >
            <HeroVideoPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Hero Dashboard Mockup (mobile/tablet fallback — static, no drag) ──────────
export function HeroDashboard() {
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

