export const SECTIONS = {
  workflow: 'workflow',
  pricing: 'pricing',
  testimonials: 'testimonials',
  cta: 'cta',
} as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
