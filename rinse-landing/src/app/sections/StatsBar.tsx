import { useRef } from "react";
import { useInView } from "motion/react";
import { useCountUp } from "../shared/hooks";
import { FadeUpWhenVisible } from "../shared/motion";

export function StatsBar() {
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
