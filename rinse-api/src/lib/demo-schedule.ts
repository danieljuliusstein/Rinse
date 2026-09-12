import { DEFAULT_BOOKING_SCHEDULE, type BookingSchedule } from './booking-availability'

/** Demo operator schedule — Mon–Sat, lunch 12–1, 2h slots (Sun closed for week-strip demo). */
export const DEMO_BOOKING_SCHEDULE: BookingSchedule = { ...DEFAULT_BOOKING_SCHEDULE }

export const DEMO_TRAVEL_RATE_PER_MILE = 0.67

export const DEMO_CLIENT_ADDRESSES: Record<string, string> = {
  cli_marcus: '1420 Peachtree St NE, Atlanta, GA 30309',
  cli_sarah: '245 N Highland Ave NE, Atlanta, GA 30307',
  cli_james: '88 Keys Ferry Rd, McDonough, GA 30253',
}
