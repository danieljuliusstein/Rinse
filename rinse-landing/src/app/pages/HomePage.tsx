import { Nav } from "../layout/Nav";
import { Footer } from "../layout/Footer";
import { FadeUpWhenVisible } from "../shared/motion";
import { HeroSection } from "../sections/Hero";
import { LogoBar } from "../sections/LogoBar";
import { NodeCanvasSection } from "../sections/Workflow";
import { ShowcaseSection } from "../sections/Showcase";
import { EcosystemInlinePanel } from "../sections/Ecosystem";
import { TestimonialsSection } from "../sections/Testimonials";
import { PricingSection } from "../sections/Pricing";
import { CTASection } from "../sections/CTA";

export function HomePage({
  onStartTrial,
  onOpenDemo,
  onBookDemo,
}: {
  onStartTrial: () => void;
  onOpenDemo: () => void;
  onBookDemo: () => void;
}) {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Nav onStartTrial={onStartTrial} />
      <HeroSection onStartTrial={onStartTrial} onOpenDemo={onOpenDemo} />
      <LogoBar />

      {/* Workflow section header */}
      <div className="pt-32 px-6 lg:px-12 border-t border-black/6">
        <div className="max-w-7xl mx-auto">
          <FadeUpWhenVisible className="mb-3">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
              One workflow.
              <br />
              <span className="text-black/30">End to end.</span>
            </h2>
          </FadeUpWhenVisible>
          <FadeUpWhenVisible delay={0.07} className="mb-0">
            <p className="text-base text-black/35 max-w-lg leading-relaxed">
              From the moment a customer books to the second the money hits your
              account — Rinse handles every step automatically.
            </p>
          </FadeUpWhenVisible>
        </div>
      </div>

      <NodeCanvasSection />
      <ShowcaseSection />
      <EcosystemInlinePanel />
      <TestimonialsSection />
      <PricingSection onStartTrial={onStartTrial} />
      <CTASection onStartTrial={onStartTrial} onBookDemo={onBookDemo} />
      <Footer />
    </div>
  );
}
