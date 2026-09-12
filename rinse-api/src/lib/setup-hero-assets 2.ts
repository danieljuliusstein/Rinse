/**
 * Wave 15 hero paths — posters in public/setup/.
 * When a poster is missing, intro uses CSS gradient placeholders in the hero band.
 */
export const SETUP_HERO_WELCOME: string | undefined = undefined
export const SETUP_HERO_BUSINESS: string | undefined = undefined
export const SETUP_HERO_BOOKING: string | undefined = undefined

/** Intro carousel poster stills (one per slide). Replace PNG with WebP when optimized. */
export const SETUP_CAROUSEL_POSTERS = [
  '/setup/setup-carousel-1.png',
  '/setup/setup-carousel-2.png',
  '/setup/setup-carousel-3.png',
] as const

/** @deprecated Use SETUP_CAROUSEL_POSTERS */
export const SETUP_HERO_INTRO: string | undefined = SETUP_CAROUSEL_POSTERS[0]
