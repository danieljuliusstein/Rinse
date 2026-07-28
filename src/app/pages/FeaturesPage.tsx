import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { FeaturesSection } from "../sections/Features";

export function FeaturesPage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/6 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-black/40 hover:text-neutral-900 transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <ChevronRight size={14} className="rotate-180" />
            Home
          </button>
          <div className="w-px h-4 bg-black/10" />
          <span className="text-sm font-semibold text-neutral-900">Features</span>
        </div>
      </nav>
      <div className="pt-16">
        <FeaturesSection />
      </div>
    </div>
  );
}
