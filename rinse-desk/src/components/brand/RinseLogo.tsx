import { BRAND } from '@/lib/brand-assets'

/** Green Rinse mark — favicon-equivalent for chrome and splash. */
export function RinseLogo({
  size = 48,
  className = '',
  title = BRAND.name,
}: {
  size?: number
  className?: string
  title?: string
}) {
  return (
    <img
      src={BRAND.icon}
      width={size}
      height={size}
      alt={title}
      className={`flex-shrink-0 select-none ${className}`}
      draggable={false}
    />
  )
}

/** Icon + wordmark lockup. Use `onDark` on green/sidebar surfaces. */
export function RinseLockup({
  height = 28,
  onDark = false,
  className = '',
}: {
  height?: number
  onDark?: boolean
  className?: string
}) {
  const width = Math.round(height * 3.95)
  return (
    <img
      src={onDark ? BRAND.lockupOnDark : BRAND.lockup}
      width={width}
      height={height}
      alt={BRAND.name}
      className={`flex-shrink-0 select-none ${className}`}
      draggable={false}
    />
  )
}
