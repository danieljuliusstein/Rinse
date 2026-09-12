import { motion } from "motion/react";
import { Bell, Zap, Shield, MapPin } from "lucide-react";
import { FadeUpWhenVisible } from "../shared/motion";

export function ShowcaseSection() {
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

