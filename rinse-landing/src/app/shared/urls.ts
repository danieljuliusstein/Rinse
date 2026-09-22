/** No public desktop signup is advertised during the iOS prelaunch. */
export const SIGN_IN_URL: string | null = null;
export const API_URL = (import.meta.env.VITE_APP_API_URL || '').replace(/\/$/, '');
const listing = import.meta.env.VITE_APP_STORE_URL || '';
export const APP_STORE_URL: string | null = /^https:\/\/apps\.apple\.com\//.test(listing) ? listing : null;
export const PRIMARY_CTA = APP_STORE_URL ? 'Get the free app' : 'Join the iOS waitlist';
