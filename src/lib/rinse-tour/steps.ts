import { coachSelector, tourSelector } from '../tour-targets'
import type { RinseTourStep } from './types'

/** Six-step overview tour — Next only, no overlays or tap-through. */
export function buildRinseTourSteps(): RinseTourStep[] {
  return [
    {
      id: 'welcome',
      section: 'home',
      title: 'Welcome to Rinse',
      description:
        'A quick tour of Home, Jobs, Clients, money, and your lead pipeline. Tap Next to walk through each screen.',
    },
    {
      id: 'home',
      section: 'home',
      route: '/',
      selector: tourSelector('fab'),
      title: 'Home',
      description:
        'Your dashboard shows today’s work and weekly stats. The green + button adds jobs, leads, quotes, invoices, and expenses.',
      cardMode: 'viewport-top',
      placement: 'top',
      spotlightRadius: 999,
      spotlightPad: 6,
    },
    {
      id: 'jobs',
      section: 'jobs',
      route: '/jobs',
      selector: coachSelector('jobs-search'),
      title: 'Jobs',
      description:
        'Search and filter every job from scheduled through paid. Tap + on this screen to schedule new work.',
      cardMode: 'viewport-top',
      spotlightRadius: 12,
    },
    {
      id: 'clients',
      section: 'clients',
      route: '/clients',
      selector: coachSelector('clients-segments'),
      title: 'Clients',
      description:
        'Your client list with follow-ups, top clients, and history. Tap + to add someone new.',
      cardMode: 'viewport-top',
      spotlightRadius: 12,
    },
    {
      id: 'money',
      section: 'money',
      route: '/reports',
      selector: coachSelector('money-hero'),
      title: 'Money',
      description: 'Revenue, expenses, net profit, and exports for any period you choose.',
      cardMode: 'viewport-top',
      spotlightRadius: 16,
    },
    {
      id: 'pipeline',
      section: 'pipeline',
      route: '/pipeline',
      selector: coachSelector('pipeline-stages'),
      title: 'Lead pipeline',
      description:
        'Track inquiries from first contact to booked. Move leads across stages as deals progress — you’re all set.',
      cardMode: 'viewport-top',
      spotlightRadius: 16,
    },
  ]
}

export const RINSE_TOUR_HOME_TARGETS = ['fab'] as const
