import { HomeNav } from '@/components/home/Nav'
import { Hero } from '@/components/home/Hero'
import { LogoBar } from '@/components/home/LogoBar'
import { Workflow } from '@/components/home/Workflow'
import { Showcase } from '@/components/home/Showcase'
import { Ecosystem } from '@/components/home/Ecosystem'
import { Testimonials } from '@/components/home/Testimonials'
import { Pricing } from '@/components/home/Pricing'
import { CTA } from '@/components/home/CTA'
import { HomeFooter } from '@/components/home/Footer'
import { SECTIONS, scrollToSection } from '@/components/home/scroll'

export default function HomePage({ onSignIn }: { onSignIn: () => void }) {
  const handleStartTrial = () => scrollToSection(SECTIONS.cta)

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <HomeNav onSignIn={onSignIn} onStartTrial={handleStartTrial} />
      <Hero onStartTrial={handleStartTrial} />
      <LogoBar />
      <Workflow />
      <Showcase />
      <Ecosystem />
      <Testimonials />
      <Pricing onStartTrial={onSignIn} />
      <CTA onStartTrial={onSignIn} />
      <HomeFooter />
    </div>
  )
}
