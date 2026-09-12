/** Static Rinse platform branding (not per-tenant business logos). */
import rinseIcon from '@/assets/brand/rinse-icon-green.svg'
import rinseLockup from '@/assets/brand/rinse-lockup-green-icon-black-text.svg'
import rinseLockupOnDark from '@/assets/brand/rinse-lockup-green-icon-white-text.svg'

export const BRAND = {
  name: 'Rinse',
  product: 'Rinse Desk',
  icon: rinseIcon,
  /** Green icon + dark wordmark — light surfaces (login, help). */
  lockup: rinseLockup,
  /** Green icon + white wordmark — dark / sidebar surfaces. */
  lockupOnDark: rinseLockupOnDark,
} as const
