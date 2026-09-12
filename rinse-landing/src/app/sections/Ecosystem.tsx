import { useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { FadeUpWhenVisible } from "../shared/motion";

export const ECO_INTEGRATIONS = [
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
export const ECO_ROW = [...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS];

// ─── Compact integration marquee — reused inside the workflow section ──────────
export function WorkflowIntegrationStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number>(0);
  const state    = useRef({ offset: 0, dragging: false, startX: 0, startOffset: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const TILE   = 64 + 10; // tile width + gap
    const LOOP_W = ECO_INTEGRATIONS.length * TILE;
    const SPEED  = 0.28;
    const tick = () => {
      if (!state.current.dragging)
        state.current.offset = (state.current.offset + SPEED) % LOOP_W;
      track.style.transform = `translateX(${-state.current.offset}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const onDown = (x: number) => { state.current.dragging = true; state.current.startX = x; state.current.startOffset = state.current.offset; };
    const onMove = (x: number) => { if (!state.current.dragging) return; state.current.offset = ((state.current.startOffset + state.current.startX - x) % LOOP_W + LOOP_W) % LOOP_W; };
    const onUp   = () => { state.current.dragging = false; };
    const md = (e: MouseEvent) => { onDown(e.clientX); e.preventDefault(); };
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const ts = (e: TouchEvent) => onDown(e.touches[0].clientX);
    const tm = (e: TouchEvent) => { onMove(e.touches[0].clientX); e.preventDefault(); };
    track.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", onUp);
    track.addEventListener("touchstart", ts, { passive: true });
    track.addEventListener("touchmove", tm, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      cancelAnimationFrame(rafRef.current);
      track.removeEventListener("mousedown", md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", onUp);
      track.removeEventListener("touchstart", ts);
      track.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div className="pt-10 pb-4 border-t border-black/6">
      <p className="text-center text-[9px] font-mono text-black/25 tracking-[0.2em] uppercase mb-6">
        Works with your stack
      </p>
      <div className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none">
        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        {/* Doubled list so the loop is seamless */}
        <div
          ref={trackRef}
          className="flex gap-[10px] py-1"
          style={{ width: "max-content" }}
        >
          {[...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5"
              style={{ width: 64 }}
            >
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center justify-center">
                <img
                  src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${item.slug}.svg`}
                  alt={item.name}
                  className="w-4 h-4"
                  style={{ opacity: 0.35 }}
                  draggable={false}
                />
              </div>
              <span className="text-[8px] font-mono text-black/30 text-center leading-tight whitespace-nowrap">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EcosystemInlinePanel() {
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
