type Props = {
  slug: string
  label: string
  /** Official brand hex without # (from Simple Icons) */
  color: string
  size?: number
  className?: string
}

/**
 * Simple Icons brand mark via jsDelivr CDN, tinted to the official brand color
 * (monochrome SVGs colored with CSS mask).
 */
export default function AppBrandIcon({ slug, label, color, size = 16, className }: Props) {
  const src = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: `#${color}`,
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
