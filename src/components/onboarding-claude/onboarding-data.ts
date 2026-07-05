import type { LucideIcon } from 'lucide-react'
import {
  Link2,
  Briefcase,
  Users,
  Receipt,
  Camera,
  Smartphone,
  CalendarCheck,
  DollarSign,
} from 'lucide-react'
import { ONBOARDING_SCREENS } from './onboarding-assets'

export type PhoneAngle = { x?: number; y?: number; z?: number }

export type PhoneScreen = {
  src: string
  alt: string
  glow?: boolean
  angle?: PhoneAngle
}

export type ChecklistItem = {
  icon: LucideIcon
  label: string
}

export type TimelineItem = {
  icon: LucideIcon
  label: string
}

export type OnboardingStep =
  | {
      kind: 'hero'
      eyebrow: string
      title: string
      body: string
      cta: string
      phone: PhoneScreen
    }
  | {
      kind: 'checklist'
      title: string
      accent: string
      items: ChecklistItem[]
    }
  | {
      kind: 'showcase'
      title: string
      accent: string
      body: string
      phone: PhoneScreen
    }
  | {
      kind: 'timeline'
      title: string
      accent: string
      items: TimelineItem[]
    }
  | {
      kind: 'closing'
      title: string
      cta: string
      phone: PhoneScreen
    }

export const onboardingSteps: OnboardingStep[] = [
  {
    kind: 'hero',
    eyebrow: 'Welcome',
    title: 'Run your detailing business from your phone',
    body: 'Booking, jobs, clients, and invoices — everything you need between appointments, in one app.',
    cta: 'Get started',
    phone: {
      ...ONBOARDING_SCREENS.home,
      glow: true,
      angle: { x: 3, y: -9, z: -1 },
    },
  },
  {
    kind: 'showcase',
    accent: 'Fast',
    title: 'Share your booking link',
    body: 'Clients pick a service, date, and time — it lands right on your schedule. No back-and-forth texts.',
    phone: {
      ...ONBOARDING_SCREENS.clientPortal,
      glow: true,
      angle: { x: 2, y: 10, z: 1 },
    },
  },
  {
    kind: 'checklist',
    accent: 'What you get',
    title: 'Everything in one app',
    items: [
      { icon: Link2, label: 'Online booking link' },
      { icon: Briefcase, label: 'Jobs & schedule' },
      { icon: Users, label: 'Clients & vehicles' },
      { icon: Receipt, label: 'Invoices & payments' },
      { icon: Camera, label: 'Before & after photos' },
      { icon: Smartphone, label: 'Works on the go' },
    ],
  },
  {
    kind: 'showcase',
    accent: 'Organized',
    title: 'Jobs and revenue at a glance',
    body: "See today's schedule, track every job to paid, and know your margin — down to the job.",
    phone: {
      ...ONBOARDING_SCREENS.jobDetail,
      glow: false,
      angle: { x: 3, y: -10, z: -1 },
    },
  },
  {
    kind: 'timeline',
    accent: 'How it works',
    title: 'Book → Job → Invoice → Paid',
    items: [
      { icon: CalendarCheck, label: 'Client books online' },
      { icon: Briefcase, label: 'Job lands on your schedule' },
      { icon: Receipt, label: "Send the invoice when it's done" },
      { icon: DollarSign, label: 'Get paid — Stripe or tap to pay' },
    ],
  },
  {
    kind: 'closing',
    title: 'Ready to grow your detailing business?',
    cta: 'Get started',
    phone: {
      ...ONBOARDING_SCREENS.invoice,
      glow: false,
      angle: { x: 2, y: 8, z: 1 },
    },
  },
]
