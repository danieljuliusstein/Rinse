import Image from 'next/image'

export type SetupHeroBandVariant = 'default' | 'compact' | 'tall'

export type SetupHeroBandTone = 'default' | 'dark-footer'

export interface SetupHeroBandProps {
  /** Local path under public/ — omit to hide band until Wave 15 assets */
  src?: string | null
  alt?: string
  variant?: SetupHeroBandVariant
  /** Dark scrim on photo footers (carousel / overlap layouts) */
  tone?: SetupHeroBandTone
  decorative?: boolean
  className?: string
  priority?: boolean
  onImageError?: () => void
}

export default function SetupHeroBand({
  src,
  alt = '',
  variant = 'default',
  tone = 'default',
  decorative = true,
  className,
  priority = false,
  onImageError,
}: SetupHeroBandProps) {
  if (!src) return null

  const classes = [
    'setup-hero-band',
    variant !== 'default' ? `setup-hero-band--${variant}` : '',
    tone === 'dark-footer' ? 'setup-hero-band--dark-footer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role={decorative ? 'presentation' : undefined}
      aria-hidden={decorative ? true : undefined}
    >
      <Image
        src={src}
        alt={decorative ? '' : alt}
        fill
        className="setup-hero-band__img"
        sizes="100vw"
        priority={priority}
        onError={onImageError}
      />
    </div>
  )
}
