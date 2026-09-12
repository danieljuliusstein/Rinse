import Image from 'next/image'

interface AppLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

export default function AppLogo({ size = 48, className = '', priority = false }: AppLogoProps) {
  return (
    <span
      className={`business-logo-wrap business-logo-wrap--badge ${className}`.trim()}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <Image
        src="/logo.png"
        alt="Rinse"
        fill
        className="business-logo"
        priority={priority}
        sizes={`${size}px`}
      />
    </span>
  )
}
