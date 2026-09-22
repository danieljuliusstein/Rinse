import { useEffect, useRef, useState } from "react"
import { motion, useInView, animate } from "framer-motion"

const ease = [0.25, 0.46, 0.45, 0.94] as const
const G = "#22c55e"
const GD = "#16a34a"
const P = "#8b5cf6"

function useInViewRef() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  return { ref, inView }
}

function useCountUp(target: number, active: boolean, delay = 0, duration = 1000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
        setVal(Math.round(e * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [active, target, delay, duration])
  return val
}

// ─── Shared mini components ───────────────────────────────────────────────────

function MiniCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf4", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  )
}

function Pill({ children, color = G, bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: bg ?? `${color}18`, borderRadius: 99, padding: "2px 7px", letterSpacing: 0.3 }}>
      {children}
    </span>
  )
}

// ─── 1. Lead Pipeline ─────────────────────────────────────────────────────────

const STAGES = [
  {
    label: "Inquiry", color: "#94a3b8", bg: "#f8fafc",
    leads: [{ name: "Alex C.", car: "BMW M3" }, { name: "Ryan T.", car: "Audi RS7" }],
  },
  {
    label: "Quoted", color: "#f59e0b", bg: "#fffbeb",
    leads: [{ name: "Maria K.", car: "Tesla S" }],
  },
  {
    label: "Scheduled", color: G, bg: "#f0fdf4",
    leads: [{ name: "Jordan P.", car: "Porsche" }, { name: "Sam R.", car: "Mercedes" }],
  },
]

function LeadPipelineGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "flex", gap: 6 }}>
      {STAGES.map((stage, si) => (
        <motion.div
          key={stage.label}
          initial={{ y: 10, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: si * 0.12, duration: 0.4, ease }}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{stage.label}</span>
          </div>
          {stage.leads.map((lead, li) => (
            <motion.div
              key={lead.name}
              initial={{ y: 8, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: si * 0.12 + li * 0.1 + 0.2, duration: 0.35, ease }}
              style={{ background: stage.bg, borderRadius: 7, border: `1px solid ${stage.color}22`, padding: "6px 8px" }}
            >
              <div style={{ fontSize: 10, fontWeight: 650, color: "#0f172a" }}>{lead.name}</div>
              <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}>{lead.car}</div>
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

// ─── 2. Quote Builder ─────────────────────────────────────────────────────────

const QUOTE_LINES = [
  { label: "Full Detail", amount: "$249.00" },
  { label: "Ceramic Boost", amount: "$50.00" },
  { label: "Odor Treatment", amount: "$25.00" },
]

function QuoteBuilderGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <MiniCard>
        <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>Quote #127</div>
            <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}>2023 Porsche Cayenne</div>
          </div>
          <Pill color="#f59e0b">In progress</Pill>
        </div>
        <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          {QUOTE_LINES.map((line, i) => (
            <motion.div
              key={line.label}
              initial={{ opacity: 0, x: -6 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.14, duration: 0.35, ease }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontSize: 10.5, color: "#475569" }}>{line.label}</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{line.amount}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{ borderTop: "1px solid #f1f5f9", paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}
          >
            <span style={{ fontSize: 10, color: "#94a3b8" }}>Total</span>
            <span style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>$324.00</span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.35, ease }}
          style={{ margin: "0 10px 10px", background: "#0f172a", borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#fff", cursor: "pointer" }}
        >
          Send Quote →
        </motion.div>
      </MiniCard>
    </div>
  )
}

// ─── 3. Client Portal ─────────────────────────────────────────────────────────

function ClientPortalGraphic() {
  const { ref, inView } = useInViewRef()
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setSigned(true), 1600)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <MiniCard>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>Service Agreement</div>
              <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1 }}>James Morton · Full Detail + Ceramic</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>$299</span>
          </div>

          {/* Terms bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {["85%", "70%", "55%"].map((w, i) => (
              <motion.div
                key={i}
                initial={{ width: 0, opacity: 0 }}
                animate={inView ? { width: w, opacity: 1 } : {}}
                transition={{ delay: i * 0.1, duration: 0.4, ease }}
                style={{ height: 4, borderRadius: 99, background: "#e8edf4" }}
              />
            ))}
          </div>

          {/* Signature line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{ borderTop: "1px solid #e2e8f0", paddingTop: 6, marginBottom: 8 }}
          >
            <div style={{ fontSize: 8.5, color: "#94a3b8", marginBottom: 4 }}>Client signature</div>
            {signed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ fontSize: 15, fontStyle: "italic", color: "#0f172a", fontFamily: "Georgia, serif", lineHeight: 1 }}
              >
                James Morton
              </motion.div>
            ) : (
              <div style={{ height: 18, borderBottom: "1px dashed #cbd5e1", width: "60%" }} />
            )}
          </motion.div>

          {/* CTA button */}
          <motion.div
            animate={signed
              ? { background: GD, color: "#fff" }
              : { background: "#0f172a", color: "#fff" }}
            transition={{ duration: 0.4 }}
            initial={{ opacity: 0, y: 4 }}
            style={{
              borderRadius: 8, padding: "8px 0", textAlign: "center",
              fontSize: 10.5, fontWeight: 700, cursor: "pointer",
              opacity: inView ? 1 : 0,
            }}
          >
            {signed ? "Signed & Paid ✓" : "Sign & Pay $299"}
          </motion.div>
        </div>
      </MiniCard>
    </div>
  )
}

// ─── 4. Damage Documentation ──────────────────────────────────────────────────

const DAMAGE_POINTS = [
  { cx: 34, cy: 22, label: "1", note: "Hood scratch" },
  { cx: 126, cy: 58, label: "2", note: "Rear dent" },
  { cx: 62, cy: 62, label: "3", note: "Door scuff" },
]

function DamageDocsGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Car overhead diagram */}
      <MiniCard style={{ padding: "10px 8px 6px" }}>
        <svg viewBox="0 0 160 80" width="100%" style={{ display: "block" }}>
          {/* Body */}
          <rect x="22" y="18" width="116" height="44" rx="11" fill="#f1f5f9" stroke="#dde4ef" strokeWidth="1.2" />
          {/* Front bumper */}
          <rect x="10" y="26" width="14" height="28" rx="6" fill="#e2e8f0" />
          {/* Rear bumper */}
          <rect x="136" y="26" width="14" height="28" rx="6" fill="#e2e8f0" />
          {/* Windshield */}
          <rect x="44" y="22" width="26" height="36" rx="3" fill="#d8e8f5" opacity="0.75" />
          {/* Rear window */}
          <rect x="90" y="22" width="26" height="36" rx="3" fill="#d8e8f5" opacity="0.75" />
          {/* Roof */}
          <rect x="72" y="22" width="16" height="36" fill="#e4ecf4" opacity="0.5" />
          {/* Wheels */}
          {[[34, 6], [112, 6], [34, 60], [112, 60]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="20" height="14" rx="5" fill="#cbd5e1" />
          ))}
          {/* Damage pins */}
          {DAMAGE_POINTS.map((d, i) => (
            <motion.g
              key={d.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.25, type: "spring", stiffness: 400, damping: 14 }}
              style={{ transformOrigin: `${d.cx}px ${d.cy}px` }}
            >
              <circle cx={d.cx} cy={d.cy} r={7.5} fill="#ef4444" opacity={0.15} />
              <circle cx={d.cx} cy={d.cy} r={5} fill="#ef4444" />
              <text x={d.cx} y={d.cy + 3.5} textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff">{d.label}</text>
            </motion.g>
          ))}
        </svg>
        <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
          {DAMAGE_POINTS.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.25, duration: 0.3 }}
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 8.5, color: "#64748b" }}>{d.note}</span>
            </motion.div>
          ))}
        </div>
      </MiniCard>
    </div>
  )
}

// ─── 5. Inventory & Supplies ──────────────────────────────────────────────────

const SUPPLIES = [
  { name: "Ceramic Pro", units: 24, max: 50, low: false },
  { name: "Detail Spray", units: 48, max: 60, low: false },
  { name: "Foam Pads", units: 3, max: 40, low: true },
  { name: "Microfiber Cloth", units: 22, max: 50, low: false },
]

function InventoryGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {SUPPLIES.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.35, ease }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 500, color: s.low ? "#ef4444" : "#0f172a" }}>{s.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {s.low && (
                <motion.span
                  animate={inView ? { opacity: [1, 0.4, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  style={{ fontSize: 8, fontWeight: 700, color: "#ef4444", background: "#fee2e2", borderRadius: 99, padding: "1px 6px" }}
                >
                  Low stock
                </motion.span>
              )}
              <span style={{ fontSize: 9.5, color: s.low ? "#ef4444" : "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{s.units} left</span>
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${(s.units / s.max) * 100}%` } : {}}
              transition={{ delay: i * 0.1 + 0.15, duration: 0.6, ease }}
              style={{ height: "100%", borderRadius: 99, background: s.low ? "#ef4444" : G, opacity: s.low ? 0.85 : 0.7 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── 6. Auto Messages & Reviews ───────────────────────────────────────────────

const MESSAGES = [
  { from: "rinse", text: "On my way — arriving in 12 min.", time: "10:02 AM", type: "sms" },
  { from: "rinse", text: "Reminder: your appointment is tomorrow at 10 AM.", time: "9:00 AM", type: "sms" },
  { from: "review", text: "New 5-star review on Google", time: "just now", type: "review", stars: 5 },
]

function AutoMessagesGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      {MESSAGES.map((m, i) => (
        <motion.div
          key={i}
          initial={{ y: 10, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: i * 0.22, duration: 0.4, ease }}
          style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
        >
          <div style={{ width: 24, height: 24, borderRadius: 8, background: m.type === "review" ? "#f0fdf4" : "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            {m.type === "review" ? (
              <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 7.4,4.3 11,4.6 8.4,7 9.2,10.5 6,8.6 2.8,10.5 3.6,7 1,4.6 4.6,4.3" fill={G} /></svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1.5h9v6.5H7.5L5.5 9.5 3.5 8H1V1.5Z" stroke="#fff" strokeWidth="1" strokeLinejoin="round" /></svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: "#0f172a", lineHeight: 1.4, fontWeight: m.type === "review" ? 600 : 400 }}>{m.text}</div>
            {m.type === "review" && (
              <div style={{ display: "flex", gap: 1.5, marginTop: 3 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg key={j} width="9" height="9" viewBox="0 0 9 9"><polygon points="4.5,0.5 5.4,3 8,3.2 6,4.8 6.6,7.5 4.5,6.2 2.4,7.5 3,4.8 1,3.2 3.6,3" fill="#f59e0b" /></svg>
                ))}
              </div>
            )}
            <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 2 }}>{m.time}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── 7. GPS Fleet Tracking (Coming Soon) ─────────────────────────────────────

const TECHS = [
  { x: 28, y: 62, color: "#3b82f6", name: "M" },
  { x: 88, y: 34, color: "#8b5cf6", name: "J" },
  { x: 132, y: 70, color: "#f59e0b", name: "R" },
]
const GPS_ROUTES = [
  "M 28 62 C 44 50 68 42 88 34",
  "M 88 34 C 108 28 122 50 132 70",
]
const H_GPS = [18, 42, 66, 90]
const V_GPS = [24, 56, 90, 124, 152]

function GPSTrackingGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <MiniCard style={{ overflow: "hidden" }}>
        <svg viewBox="0 0 160 100" width="100%" style={{ display: "block" }}>
          <rect width="160" height="100" fill="#eef2eb" />
          {/* Blocks */}
          {[
            [0,0,24,18],[24,0,32,18],[56,0,34,18],[90,0,34,18],[124,0,28,18],[152,0,8,18],
            [0,18,24,24],[24,18,32,24],[56,18,34,24],[90,18,34,24],[124,18,28,24],[152,18,8,24],
            [0,42,24,24],[24,42,32,24],[56,42,34,24],[90,42,34,24],[124,42,28,24],[152,42,8,24],
            [0,66,24,34],[24,66,32,34],[56,66,34,34],[90,66,34,34],[124,66,28,34],[152,66,8,34],
          ].map(([x,y,w,h],i) => <rect key={i} x={x+1} y={y+1} width={w-2} height={h-2} rx={1} fill="#e4eade" />)}
          {H_GPS.map(y => <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="#fff" strokeWidth="3" />)}
          {V_GPS.map(x => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#fff" strokeWidth="3" />)}
          {/* Routes */}
          {GPS_ROUTES.map((d, i) => (
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
              transition={{ delay: 0.3 + i * 0.4, duration: 0.9, ease: "easeInOut" }}
            />
          ))}
          {/* Tech dots */}
          {TECHS.map((t, i) => (
            <motion.g
              key={t.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.3, type: "spring", stiffness: 350, damping: 16 }}
              style={{ transformOrigin: `${t.x}px ${t.y}px` }}
            >
              <motion.circle
                cx={t.x} cy={t.y} r={10}
                fill={t.color}
                opacity={0.15}
                animate={inView ? { r: [10, 14, 10] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: i * 0.4 }}
              />
              <circle cx={t.x} cy={t.y} r={8} fill={t.color} />
              <text x={t.x} y={t.y + 3.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">{t.name}</text>
            </motion.g>
          ))}
        </svg>
      </MiniCard>
    </div>
  )
}

// ─── 8. Integrations Hub (Coming Soon) ───────────────────────────────────────

const INTEGRATIONS = [
  {
    name: "QuickBooks", color: "#16a34a",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect width="16" height="16" rx="4" fill="#dcfce7"/><text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#16a34a">QB</text></svg>,
  },
  {
    name: "Google Cal", color: "#3b82f6",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#3b82f6" strokeWidth="1.1"/><line x1="1" y1="6" x2="15" y2="6" stroke="#3b82f6" strokeWidth="1.1"/><rect x="4" y="2" width="2" height="2" rx="1" fill="#3b82f6"/><rect x="10" y="2" width="2" height="2" rx="1" fill="#3b82f6"/><text x="8" y="13" textAnchor="middle" fontSize="6" fontWeight="700" fill="#3b82f6">8</text></svg>,
  },
  {
    name: "Zapier", color: "#f97316",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1.5 9.2,5.2 13,5.2 10,7.6 11,11.5 8,9 5,11.5 6,7.6 3,5.2 6.8,5.2" fill="#f97316" /></svg>,
  },
  {
    name: "Stripe", color: "#6366f1",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect width="16" height="16" rx="4" fill="#ede9fe"/><text x="8" y="11.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#6366f1">S</text></svg>,
  },
  {
    name: "Gmail", color: "#ef4444",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#ef4444" strokeWidth="1"/><path d="M2 4.5 L8 9 L14 4.5" stroke="#ef4444" strokeWidth="1" strokeLinecap="round"/></svg>,
  },
  {
    name: "Xero", color: "#0ea5e9",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect width="16" height="16" rx="4" fill="#e0f2fe"/><text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0ea5e9">Xe</text></svg>,
  },
]

function IntegrationsGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
      {INTEGRATIONS.map((int, i) => (
        <motion.div
          key={int.name}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: i * 0.08, duration: 0.35, ease }}
          style={{ background: "#fff", borderRadius: 9, border: "1px solid #e8edf4", padding: "10px 6px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
        >
          {int.icon}
          <span style={{ fontSize: 8.5, fontWeight: 600, color: "#64748b", textAlign: "center", lineHeight: 1.2 }}>{int.name}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── 9. Multi-Location (Coming Soon) ─────────────────────────────────────────

const LOCATIONS = [
  { name: "Dallas HQ", city: "Dallas, TX", rev: 8240, max: 10000, techs: 6 },
  { name: "Austin", city: "Austin, TX", rev: 4180, max: 10000, techs: 3 },
  { name: "Houston", city: "Houston, TX", rev: 6000, max: 10000, techs: 4 },
]

function MultiLocationGraphic() {
  const { ref, inView } = useInViewRef()
  const v0 = useCountUp(8240, inView, 100)
  const v1 = useCountUp(4180, inView, 200)
  const v2 = useCountUp(6000, inView, 300)
  const vals = [v0, v1, v2]
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <MiniCard>
        <div style={{ padding: "10px 12px 4px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a" }}>All Locations</span>
          <span style={{ fontSize: 9, color: "#94a3b8" }}>Jul 2025</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {LOCATIONS.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.4, ease }}
              style={{ padding: "8px 12px", borderBottom: i < LOCATIONS.length - 1 ? "1px solid #f8fafc" : "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: G }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{loc.name}</span>
                  <span style={{ fontSize: 9, color: "#94a3b8" }}>{loc.techs} techs</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>${vals[i].toLocaleString()}</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${(loc.rev / loc.max) * 100}%` } : {}}
                  transition={{ delay: i * 0.15 + 0.2, duration: 0.7, ease }}
                  style={{ height: "100%", borderRadius: 99, background: G, opacity: 0.7 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </MiniCard>
    </div>
  )
}

// ─── 10. AI Receipt Scan ─────────────────────────────────────────────────────

const RECEIPT_LINES = [
  { w: "70%", label: "Foam applicator pads", price: "$18.40" },
  { w: "55%", label: "Iron remover spray", price: "$34.90" },
  { w: "60%", label: "Ceramic coating 50ml", price: "$89.00" },
]

function AIReceiptGraphic() {
  const { ref, inView } = useInViewRef()
  const [scanDone, setScanDone] = useState(false)
  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setScanDone(true), 1000)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <div ref={ref} style={{ width: "100%", display: "flex", gap: 8 }}>
      {/* Receipt */}
      <div style={{ flex: 1, background: "#fffdf7", borderRadius: 8, border: "1px solid #e8edf4", padding: "10px 10px", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Receipt · Jun 14</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[["80%"], ["65%"], ["50%"], ["75%"], ["45%"]].map(([w], i) => (
            <div key={i} style={{ height: 4, borderRadius: 99, background: "#e2e8f0", width: w }} />
          ))}
        </div>
        {/* Scan line */}
        {!scanDone && (
          <motion.div
            initial={{ top: "10%" }}
            animate={inView ? { top: "90%" } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            style={{ position: "absolute", left: 0, right: 0, height: 2, background: `${P}88`, boxShadow: `0 0 8px ${P}` }}
          />
        )}
        {scanDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <Pill color={P} bg={`${P}18`}>Scanned</Pill>
          </motion.div>
        )}
      </div>

      {/* Parsed result */}
      <div style={{ flex: 1.2 }}>
        <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Extracted items</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {RECEIPT_LINES.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={scanDone ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.35, ease }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "#fff", borderRadius: 6, border: "1px solid #f1f5f9" }}
            >
              <span style={{ fontSize: 9.5, color: "#475569", flex: 1, marginRight: 4, lineHeight: 1.3 }}>{line.label}</span>
              <span style={{ fontSize: 9.5, fontWeight: 650, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{line.price}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 11. AI Vehicle / Plate Capture ──────────────────────────────────────────

function AIVehicleGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "flex", gap: 10, alignItems: "center" }}>
      {/* Car silhouette + detection */}
      <div style={{ flex: 1, position: "relative" }}>
        <svg viewBox="0 0 100 70" width="100%" style={{ display: "block" }}>
          {/* Ground */}
          <rect width="100" height="70" fill="#f8fafc" rx="8" />
          {/* Car body */}
          <rect x="8" y="28" width="84" height="28" rx="8" fill="#e2e8f0" />
          {/* Roof */}
          <path d="M 24 28 C 28 16 72 16 76 28" fill="#cbd5e1" />
          {/* Windshield */}
          <path d="M 28 28 C 30 20 50 19 55 28" fill="#dbeafe" opacity="0.8" />
          {/* Rear window */}
          <path d="M 58 28 C 62 20 72 20 74 28" fill="#dbeafe" opacity="0.8" />
          {/* Wheels */}
          <circle cx="26" cy="56" r="9" fill="#94a3b8" />
          <circle cx="26" cy="56" r="5" fill="#f1f5f9" />
          <circle cx="74" cy="56" r="9" fill="#94a3b8" />
          <circle cx="74" cy="56" r="5" fill="#f1f5f9" />
          {/* Headlights */}
          <rect x="8" y="36" width="6" height="8" rx="2" fill="#fef08a" />
          <rect x="86" y="36" width="6" height="8" rx="2" fill="#fde68a" />
          {/* License plate box */}
          <rect x="36" y="48" width="28" height="10" rx="2" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
          <text x="50" y="56.5" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#334155">ABC·1234</text>
          {/* Detection box */}
          <motion.rect
            x="34" y="46" width="32" height="14" rx="3"
            fill="none"
            stroke={P}
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 300, damping: 16 }}
            style={{ transformOrigin: "50px 53px" }}
          />
          {/* Corner marks */}
          {[[34,46],[66,46],[34,60],[66,60]].map(([x,y],i) => (
            <motion.circle key={i} cx={x} cy={y} r={1.5} fill={P}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.2 }}
            />
          ))}
        </svg>
      </div>

      {/* Extracted data */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
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
            transition={{ delay: 0.6 + i * 0.12, duration: 0.3, ease }}
          >
            <div style={{ fontSize: 8.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{row.label}</div>
            <div style={{ fontSize: 11, fontWeight: 650, color: "#0f172a" }}>{row.value}</div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.3 }}
        >
          <Pill color={P}>Matched in CRM</Pill>
        </motion.div>
      </div>
    </div>
  )
}

// ─── 12. AI Ops Copilot ───────────────────────────────────────────────────────

const COPILOT_RESPONSE = ["Alex Chen — BMW M3 (94 days)", "Maria K. — Audi RS6 (102 days)", "Tom H. — Tesla S (88 days)"]

function AICopilotGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      {/* User question */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, ease }}
        style={{ alignSelf: "flex-end", background: "#0f172a", borderRadius: "10px 10px 2px 10px", padding: "7px 11px", maxWidth: "75%" }}
      >
        <span style={{ fontSize: 10.5, color: "#fff" }}>Who's overdue for a detail?</span>
      </motion.div>

      {/* AI response */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.35, ease }}
        style={{ background: `${P}0d`, border: `1px solid ${P}25`, borderRadius: "10px 10px 10px 2px", padding: "9px 11px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: P, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 5.5C1 3 3.5 1.5 4 1C4.5 1.5 7 3 7 5.5C7 7 5.7 7.5 4 7.5C2.3 7.5 1 7 1 5.5Z" fill="#fff" /></svg>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: P }}>Rinse AI</span>
        </div>
        <div style={{ fontSize: 10, color: "#475569", marginBottom: 5 }}>3 clients are 88+ days overdue:</div>
        {COPILOT_RESPONSE.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 + i * 0.18, duration: 0.3, ease }}
            style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}
          >
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: P, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#0f172a" }}>{line}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── 13. AI Pricing Assistant ─────────────────────────────────────────────────

function AIPricingGraphic() {
  const { ref, inView } = useInViewRef()
  const price = useCountUp(390, inView, 600)
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <MiniCard>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a" }}>2023 Porsche Cayenne</div>
              <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>Full Detail + Ceramic</div>
            </div>
            <Pill color={P}>AI suggest</Pill>
          </div>

          {/* Price range */}
          <div style={{ background: `${P}0d`, border: `1px solid ${P}20`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: P, fontWeight: 600, marginBottom: 4 }}>Suggested range</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                ${price}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>– $420</span>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: "#94a3b8" }}>Confidence</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: P }}>84%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: "84%" } : {}}
                transition={{ delay: 0.5, duration: 0.8, ease }}
                style={{ height: "100%", borderRadius: 99, background: P, opacity: 0.7 }}
              />
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#94a3b8" }}>Based on 47 similar jobs in your area</div>
        </div>
      </MiniCard>
    </div>
  )
}

// ─── 14. Public / Partner API ─────────────────────────────────────────────────

const API_LINES = [
  { text: "GET /v1/jobs?status=scheduled", color: "#0f172a", bold: true },
  { text: "→ 200 OK", color: G },
  { text: '{', color: "#64748b" },
  { text: '  "total": 14,', color: "#475569" },
  { text: '  "jobs": [', color: "#475569" },
  { text: '    { "id": "j_412", "client": "Alex Chen" },', color: "#94a3b8" },
  { text: '    { "id": "j_413", "status": "en_route" }', color: "#94a3b8" },
  { text: '  ]', color: "#475569" },
  { text: '}', color: "#64748b" },
]

function APIGraphic() {
  const { ref, inView } = useInViewRef()
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map(c => <div key={c} style={{ width: 6, height: 6, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: 4, fontFamily: "monospace" }}>rinse-api</span>
        </div>
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
          {API_LINES.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.09, duration: 0.3, ease }}
              style={{ fontSize: 9.5, color: line.color, fontFamily: "monospace", fontWeight: line.bold ? 700 : 400, whiteSpace: "nowrap" }}
            >
              {line.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

type Tier = "shipped" | "soon" | "ai"

function FeatureCard({
  label, heading, body, graphic, tier = "shipped",
}: {
  label: string; heading: string; body: string; graphic: React.ReactNode; tier?: Tier
}) {
  const accentColor = tier === "ai" ? P : tier === "soon" ? "#64748b" : GD
  const graphicBg = tier === "ai" ? "#faf9ff" : "#f8fafc"

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eaeff6", padding: "20px", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Badge for coming-soon / AI */}
      {tier === "soon" && (
        <div style={{ position: "relative" }}>
          <div style={{ background: graphicBg, borderRadius: 10, padding: "16px 14px", minHeight: 158, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9", overflow: "hidden", position: "relative" }}>
            <div style={{ opacity: 0.55, width: "100%" }}>{graphic}</div>
            <div style={{ position: "absolute", top: 8, right: 8 }}>
              <Pill color="#64748b" bg="#f1f5f9">Coming soon</Pill>
            </div>
          </div>
        </div>
      )}
      {tier !== "soon" && (
        <div style={{ background: graphicBg, borderRadius: 10, padding: "16px 14px", minHeight: 158, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          {graphic}
        </div>
      )}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: -0.2 }}>{heading}</div>
        <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.65 }}>{body}</div>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function TierHeader({ label, description, color = GD }: { label: string; description: string; color?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ height: 1, flex: 1, background: "#f1f5f9" }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1.5, whiteSpace: "nowrap" }}>{label}</span>
        <div style={{ height: 1, flex: 1, background: "#f1f5f9" }} />
      </div>
      <p style={{ fontSize: 12.5, color: "#94a3b8", textAlign: "center", margin: 0 }}>{description}</p>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(148,197,255,0.25) 1px, transparent 1.1px)", backgroundSize: "22px 22px" }} />

      <div style={{ position: "relative", maxWidth: 1060, margin: "0 auto", padding: "72px 24px 100px" }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: GD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: G }} />
            Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07, duration: 0.48, ease }}
            style={{ fontSize: "clamp(26px, 3.6vw, 38px)", fontWeight: 800, color: "#0f172a", lineHeight: 1.12, margin: "0 0 14px", letterSpacing: -0.8 }}
          >
            Everything Rinse does
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.45, ease }}
            style={{ fontSize: 15, color: "#64748b", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}
          >
            One platform built for detail shops, mobile operators, and everyone scaling between them.
          </motion.p>
        </div>

        {/* ── Tier 1: Shipped Now ── */}
        <TierHeader label="Shipped now" description="Live and ready for your shop today." color={GD} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 52 }}>
          <FeatureCard
            label="Lead Pipeline"
            heading="Inquiry → Quoted → Scheduled"
            body="Move leads through your pipeline with a visual board. Every inquiry becomes a booked job — nothing slips through."
            graphic={<LeadPipelineGraphic />}
            tier="shipped"
          />
          <FeatureCard
            label="Quote & Estimate Builder"
            heading="Vehicle + service → sendable quote"
            body="Build itemized quotes in seconds. Send a branded link your client can approve and pay directly."
            graphic={<QuoteBuilderGraphic />}
            tier="shipped"
          />
          <FeatureCard
            label="Client Portal"
            heading="Sign & pay before the job"
            body="Clients get a branded portal to review the scope, sign the agreement, and pay upfront — all from their phone."
            graphic={<ClientPortalGraphic />}
            tier="shipped"
          />
          <FeatureCard
            label="Damage Documentation"
            heading="Pre-job walkthrough + damage map"
            body="Mark existing damage on a vehicle diagram before every job. Protect your shop and keep clients informed."
            graphic={<DamageDocsGraphic />}
            tier="shipped"
          />
          <FeatureCard
            label="Inventory & Supplies"
            heading="Low-stock alerts before you run out"
            body="Track ceramic, foam pads, detailing spray, and everything else. Get alerted the moment stock drops below threshold."
            graphic={<InventoryGraphic />}
            tier="shipped"
          />
          <FeatureCard
            label="Auto Messages & Reviews"
            heading="On-my-way, reminders, review asks"
            body="Automated texts at every stage — arrival, reminders, and a perfectly-timed review request once the job is done."
            graphic={<AutoMessagesGraphic />}
            tier="shipped"
          />
        </div>

        {/* ── Tier 2: Coming Soon ── */}
        <TierHeader label="Coming soon" description="In development — launching later this year." color="#64748b" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 52 }}>
          <FeatureCard
            label="GPS Fleet Tracking"
            heading="Live tech routes & ETAs for clients"
            body="Customers see their technician on a live map. You see your whole fleet from one dashboard."
            graphic={<GPSTrackingGraphic />}
            tier="soon"
          />
          <FeatureCard
            label="Integrations Hub"
            heading="QuickBooks, Google Cal, Zapier, Stripe"
            body="Connect Rinse to the tools you already use. Two-way sync keeps your calendar, books, and payments in lockstep."
            graphic={<IntegrationsGraphic />}
            tier="soon"
          />
          <FeatureCard
            label="Multi-Location / Franchise"
            heading="Several shops, one dashboard"
            body="Run multiple locations from a single login. Roll-up reporting, per-location techs, and centralized client records."
            graphic={<MultiLocationGraphic />}
            tier="soon"
          />
        </div>

        {/* ── Tier 3: Scale — AI ── */}
        <TierHeader label="Scale plan — AI" description="Intelligence features for shops ready to grow." color={P} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          <FeatureCard
            label="AI Receipt Scan"
            heading="Photo → expense line items"
            body="Photograph a supplier receipt and watch it turn into structured expense records. No manual entry."
            graphic={<AIReceiptGraphic />}
            tier="ai"
          />
          <FeatureCard
            label="AI Vehicle Capture"
            heading="Photo → make, model, VIN"
            body="Point the camera at a plate or VIN sticker. Rinse reads it and matches the vehicle to your CRM automatically."
            graphic={<AIVehicleGraphic />}
            tier="ai"
          />
          <FeatureCard
            label="AI Ops Copilot"
            heading="Ask your business anything"
            body='"Who\'s overdue?" "Best day to book?" Draft follow-ups. Your copilot answers in plain English and takes action.'
            graphic={<AICopilotGraphic />}
            tier="ai"
          />
          <FeatureCard
            label="AI Pricing Assistant"
            heading="Smart quotes from history + market"
            body="Tell Rinse the vehicle and package. Get a suggested price range based on your past jobs and local market data."
            graphic={<AIPricingGraphic />}
            tier="ai"
          />
          <FeatureCard
            label="Public / Partner API"
            heading="Read/write jobs, clients, quotes"
            body="Full REST API for agencies, franchisees, and developers building custom workflows on top of Rinse."
            graphic={<APIGraphic />}
            tier="ai"
          />
        </div>
      </div>
    </div>
  )
}
