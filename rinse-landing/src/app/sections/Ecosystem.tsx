export const ECO_INTEGRATIONS = [
  { name: 'Stripe', slug: 'stripe', status: 'Payments · requires setup' },
  { name: 'Google Maps', slug: 'googlemaps', status: 'Address tools · requires setup' },
  { name: 'QuickBooks', slug: 'quickbooks', status: 'Planned · not connected' },
  { name: 'Google Calendar', slug: 'googlecalendar', status: 'Planned · not connected' },
];

// Triple the list so the loop never shows a gap during drag
export const ECO_ROW = [...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS, ...ECO_INTEGRATIONS];

export function EcosystemInlinePanel() {
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
          <p className="text-base text-white/70 max-w-md mx-auto leading-relaxed">
            Our direction, built one useful connection at a time. Stripe payment
            setup and Google Maps address tools are implemented. Accounting and
            calendar sync are planned, not available today.
          </p>
        </div>

        <div aria-hidden="true" className="h-10 w-px bg-white/20 mx-auto" />
        {/* Integration status; no autoplay. */}
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
            className="flex flex-wrap gap-6 justify-center px-8 relative"

          >
            {ECO_INTEGRATIONS.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 items-center justify-center shrink-0 rounded-2xl text-white text-center relative"
                style={{
                  width: 180,
                  minHeight: 140,
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
                <span className="text-sm">{item.name}</span><span className="text-xs text-white/70 px-2">{item.status}</span>
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
