import { useEffect } from "react";
import { ArrowRight, X } from "lucide-react";

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
            <div className="text-sm font-semibold text-neutral-900">
              Rinse product tour
            </div>
            <div className="text-[11px] text-black/35 font-mono mt-0.5">
              2-minute overview
            </div>
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
              See how Rinse handles bookings, scheduling, and payments in one
              workflow.
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

