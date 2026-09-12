import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { FadeUpWhenVisible } from "../shared/motion";

export const FM_EASE = [0.25, 0.46, 0.45, 0.94] as const;
export const FM_G = "#22c55e";
export const FM_GD = "#16a34a";
export const FM_P = "#8b5cf6";

export function useCountUpActive(
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
export function useLoopTick(ms: number) {
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

export function FMiniCard({
  children,
  style,
}: {
  children: ReactNode;
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

export function FPill({
  children,
  color = FM_G,
  bg,
}: {
  children: ReactNode;
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
export const FM_STAGES = [
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
export const CursorSVG = () => (
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

export function LeadPipelineGraphic() {
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
export const FM_QUOTE_LINES = [
  { label: "Full Detail", amount: "$249.00" },
  { label: "Ceramic Boost", amount: "$50.00" },
  { label: "Odor Treatment", amount: "$25.00" },
];

export function QuoteBuilderGraphic() {
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
export const PORTAL_PAGES = [
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

export function ClientPortalGraphic() {
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
export const FM_DAMAGE_PTS = [
  { cx: 34, cy: 22, label: "1", note: "Hood scratch" },
  { cx: 126, cy: 58, label: "2", note: "Rear dent" },
  { cx: 62, cy: 62, label: "3", note: "Door scuff" },
];

export function DamageDocsGraphic() {
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
export const FM_SUPPLIES = [
  { name: "Ceramic Pro", units: 24, max: 50, low: false },
  { name: "Detail Spray", units: 48, max: 60, low: false },
  { name: "Foam Pads", units: 3, max: 40, low: true },
  { name: "Microfiber Cloth", units: 22, max: 50, low: false },
];

export function InventoryGraphic() {
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
export const ALL_AUTO_MESSAGES = [
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

export function AutoMessagesGraphic() {
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
export const FM_TECHS = [
  { x: 28, y: 62, color: "#3b82f6", name: "M" },
  { x: 88, y: 34, color: "#8b5cf6", name: "J" },
  { x: 132, y: 70, color: "#f59e0b", name: "R" },
];
export const FM_GPS_ROUTES = [
  "M 28 62 C 44 50 68 42 88 34",
  "M 88 34 C 108 28 122 50 132 70",
];

export function GPSTrackingGraphic() {
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
export const FM_INTEGRATIONS = [
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

export function IntegrationsGraphic() {
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
export const FM_LOCATIONS = [
  { name: "Dallas HQ", rev: 8240, max: 10000, techs: 6 },
  { name: "Austin", rev: 4180, max: 10000, techs: 3 },
  { name: "Houston", rev: 6000, max: 10000, techs: 4 },
];

export function MultiLocationGraphic() {
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
export const FM_RECEIPT_LINES = [
  { label: "Foam applicator pads", price: "$18.40" },
  { label: "Iron remover spray", price: "$34.90" },
  { label: "Ceramic coating 50ml", price: "$89.00" },
];

export function AIReceiptGraphic() {
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
export function AIVehicleGraphic() {
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
export const COPILOT_QA = [
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

export function AICopilotGraphic() {
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
export function AIPricingGraphic() {
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
export const FM_API_LINES = [
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

export function APIGraphic() {
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

export function FMFeatureCard({
  label,
  heading,
  body,
  graphic,
  tier = "shipped",
}: {
  label: string;
  heading: string;
  body: string;
  graphic: ReactNode;
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

export function FMTierHeader({
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

export function FeaturesSection() {
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

