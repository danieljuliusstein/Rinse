import { PRIMARY_CTA } from '../shared/urls';
import { ArrowRight, ChevronRight } from "lucide-react";
import { SECTIONS } from "../shared/scroll";
import { FadeUpWhenVisible } from "../shared/motion";

export function CTASection({
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
                Coming to iOS · A Free plan will be available
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight mb-5">
                Run your business
                <br />
                like the pros do.
              </h2>
              <p className="text-base lg:text-lg text-black/40 max-w-xl mx-auto mb-10 leading-relaxed">
                Start with your clients, jobs and invoices in one place.
                Join the waitlist and we’ll let you know when Rinse is ready for iOS.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onStartTrial}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-white text-sm font-semibold px-6 py-3 rounded-xl"
                >
                  {PRIMARY_CTA}
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={onBookDemo}
                  className="flex items-center gap-2 text-black/50 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)] text-sm font-semibold px-6 py-3"
                >
                  Take a walkthrough
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

