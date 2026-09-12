import type { CSSProperties, HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: string | number
  height?: string | number
  radius?: string | number
  /** Stagger index for list entrance (0-based). */
  stagger?: number
}

export default function Skeleton({
  className = '',
  width,
  height,
  radius,
  stagger,
  style,
  ...rest
}: SkeletonProps) {
  const inlineStyle: CSSProperties = {
    ...style,
    ...(width != null ? { width } : null),
    ...(height != null ? { height } : null),
    ...(radius != null ? { borderRadius: radius } : null),
    ...(stagger != null ? { ['--skeleton-stagger' as string]: `${stagger * 55}ms` } : null),
  }

  return (
    <span
      className={['skeleton', stagger != null ? 'skeleton--stagger' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={inlineStyle}
      aria-hidden="true"
      {...rest}
    />
  )
}
