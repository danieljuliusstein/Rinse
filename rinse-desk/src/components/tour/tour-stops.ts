// ---------------------------------------------------------------------------
// tour-stops.ts — live Desk stop config
// ---------------------------------------------------------------------------

import type { PageId } from '@/lib/types'

export type CompletionMode = 'click-target' | 'custom-event' | 'next-only'
export type CardAnchor = 'sidebar' | 'bottom-left' | 'bottom-right'

export interface TourStop {
  id: string
  tag: string
  title: string
  body: string
  task?: string
  targetId: string | null
  spotlightTargetId?: string
  requiresAction: boolean
  completion: CompletionMode
  /** Real Desk page to show while this stop is active. */
  page: PageId
  anchor: CardAnchor
  agentNotes?: string
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'dashboard',
    tag: 'Overview',
    title: 'Welcome to your shop',
    body: 'This is your home base. Track revenue coming in, today’s booked details, and recent shop updates at a glance.',
    task: 'Tap the revenue card to see how your numbers break down.',
    targetId: 'dashboard-revenue',
    spotlightTargetId: 'dashboard-revenue',
    requiresAction: true,
    completion: 'custom-event',
    page: 'dashboard',
    anchor: 'bottom-right',
  },
  {
    id: 'contacts',
    tag: 'Clients',
    title: 'Your client book',
    body: 'Keep every customer’s phone number, address, and vehicle history in one spot. We loaded Marcus Vance as an example.',
    task: 'Click Marcus to see his cars, notes, and past visits.',
    targetId: 'contacts-row',
    spotlightTargetId: 'contacts-row',
    requiresAction: true,
    completion: 'custom-event',
    page: 'contacts',
    anchor: 'bottom-left',
  },
  {
    id: 'cars',
    tag: 'Fleet',
    title: 'Vehicle condition & intake',
    body: 'Log swirl marks, rock chips, and curb rash before touching a car with a buffer. It builds trust and keeps everyone protected.',
    task: 'Click Marcus’s Porsche 911 GT3 to view its inspection notes.',
    targetId: 'cars-vehicle',
    spotlightTargetId: 'cars-vehicle',
    requiresAction: true,
    completion: 'custom-event',
    page: 'cars',
    anchor: 'bottom-right',
  },
  {
    id: 'deals',
    tag: 'Quotes',
    title: 'Never lose a lead',
    body: 'When someone asks about ceramic coating or paint correction, track the quote here until they’re locked in on the calendar.',
    task: 'Click “Advance” on Marcus’s quote to move him to Quoted.',
    targetId: 'deals-card',
    spotlightTargetId: 'deals-card',
    requiresAction: true,
    completion: 'custom-event',
    page: 'deals',
    anchor: 'bottom-right',
  },
  {
    id: 'calendar',
    tag: 'Schedule',
    title: 'Today’s bookings',
    body: 'Your master calendar syncs straight to the mobile app in your pocket so you always know what’s coming up next.',
    task: 'Click Marcus’s 10:00 AM booking to pull up his job ticket.',
    targetId: 'calendar-event',
    spotlightTargetId: 'calendar-event',
    requiresAction: true,
    completion: 'custom-event',
    page: 'calendar',
    anchor: 'bottom-left',
  },
  {
    id: 'routes',
    tag: 'Routes',
    title: 'Smart driving routes',
    body: 'Running mobile? Let Rinse sequence your daily appointments so you spend less time in traffic and more time detailing.',
    task: 'Click the 10:00 AM stop to preview today’s driving path.',
    targetId: 'routes-stop',
    spotlightTargetId: 'routes-stop',
    requiresAction: true,
    completion: 'custom-event',
    page: 'routes',
    anchor: 'bottom-right',
  },
  {
    id: 'invoices',
    tag: 'Billing',
    title: 'Collect without chasing',
    body: 'Once a job wraps, the invoice is ready immediately. Marcus’s $1,028 invoice has a Stripe card link built right in.',
    task: 'Hit “Mark sent” to send Marcus his invoice.',
    targetId: 'invoices-send',
    spotlightTargetId: 'invoices-send',
    requiresAction: true,
    completion: 'custom-event',
    page: 'invoices',
    anchor: 'bottom-right',
  },
  {
    id: 'money',
    tag: 'Profit & Loss',
    title: 'Your actual profit',
    body: 'Great revenue is nice, but keeping it is what matters. See your real profit after factoring in ceramic kits, towels, and van gas.',
    task: 'Tap “This month” to see your margins and expense breakdown.',
    targetId: 'money-range',
    spotlightTargetId: 'money-range',
    requiresAction: true,
    completion: 'custom-event',
    page: 'money',
    anchor: 'bottom-right',
  },
  {
    id: 'campaigns',
    tag: 'Outreach',
    title: 'Bring past clients back',
    body: 'Ceramic coatings need booster washes, and daily drivers get dirty again. Fire off quick re-engagement emails in two clicks.',
    task: 'Click the Spring Ceramic campaign to preview the email.',
    targetId: 'campaigns-row',
    spotlightTargetId: 'campaigns-row',
    requiresAction: true,
    completion: 'custom-event',
    page: 'campaigns',
    anchor: 'bottom-right',
  },
  {
    id: 'settings',
    tag: 'Settings',
    title: 'Make it your own',
    body: 'Dial in your shop hours, tune your pricing packages, and link up your phone so you’re ready to take on real clients.',
    task: 'Click “Schedule” to check your shop availability.',
    targetId: 'settings-schedule-tab',
    spotlightTargetId: 'settings-schedule-tab',
    requiresAction: true,
    completion: 'custom-event',
    page: 'settings',
    anchor: 'bottom-right',
  },
]
