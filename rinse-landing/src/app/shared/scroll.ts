export const SECTIONS = {
  features: "features",
  workflow: "workflow",
  pricing: "pricing",
  testimonials: "testimonials",
  cta: "cta",
} as const;

export function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
