import type { ImageSourcePropType } from 'react-native'
import type { IconProps } from 'phosphor-react-native'
import {
  Briefcase,
  CalendarCheck,
  Camera,
  CurrencyDollar,
  LinkSimple,
  Receipt,
  DeviceMobile,
  Users,
} from 'phosphor-react-native'

export type IntroSlide =
  | {
      kind: 'hero'
      eyebrow: string
      title: string
      body: string
      cta: string
      image: ImageSourcePropType
    }
  | {
      kind: 'checklist'
      title: string
      accent: string
      items: { icon: React.ComponentType<IconProps>; label: string }[]
    }
  | {
      kind: 'showcase'
      title: string
      accent: string
      body: string
      image: ImageSourcePropType
    }
  | {
      kind: 'timeline'
      title: string
      accent: string
      items: { icon: React.ComponentType<IconProps>; label: string }[]
    }
  | {
      kind: 'closing'
      title: string
      cta: string
      image: ImageSourcePropType
    }

export const INTRO_SLIDES: IntroSlide[] = [
  {
    kind: 'hero',
    eyebrow: 'Welcome',
    title: 'Run your detailing business from your phone',
    body: 'Booking, jobs, clients, and invoices — everything you need between appointments, in one app.',
    cta: 'Get started',
    image: require('../../assets/onboarding/home.png'),
  },
  {
    kind: 'showcase',
    accent: 'Fast',
    title: 'Share your booking link',
    body: 'Clients pick a service, date, and time — it lands right on your schedule. No back-and-forth texts.',
    image: require('../../assets/onboarding/client-portal.png'),
  },
  {
    kind: 'checklist',
    accent: 'What you get',
    title: 'Everything in one app',
    items: [
      { icon: LinkSimple, label: 'Online booking link' },
      { icon: Briefcase, label: 'Jobs & schedule' },
      { icon: Users, label: 'Clients & vehicles' },
      { icon: Receipt, label: 'Invoices & payments' },
      { icon: Camera, label: 'Before & after photos' },
      { icon: DeviceMobile, label: 'Works on the go' },
    ],
  },
  {
    kind: 'showcase',
    accent: 'Organized',
    title: 'Jobs and revenue at a glance',
    body: "See today's schedule, track every job to paid, and know your margin — down to the job.",
    image: require('../../assets/onboarding/job-detail.png'),
  },
  {
    kind: 'timeline',
    accent: 'How it works',
    title: 'Book → Job → Invoice → Paid',
    items: [
      { icon: CalendarCheck, label: 'Client books online' },
      { icon: Briefcase, label: 'Job lands on your schedule' },
      { icon: Receipt, label: "Send the invoice when it's done" },
      { icon: CurrencyDollar, label: 'Get paid — Stripe or tap to pay' },
    ],
  },
  {
    kind: 'closing',
    title: 'Ready to grow your detailing business?',
    cta: 'Get started',
    image: require('../../assets/onboarding/invoice.png'),
  },
]
