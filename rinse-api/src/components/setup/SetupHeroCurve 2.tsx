export type SetupHeroCurveTone = 'dark' | 'light'

export interface SetupHeroCurveProps {
  /** Fill matches the panel below the hero */
  tone?: SetupHeroCurveTone
  className?: string
}

/** Asymmetric wave between hero media and content panel (IF-style). */
export default function SetupHeroCurve({ tone = 'dark', className }: SetupHeroCurveProps) {
  return (
    <div
      className={['setup-hero-curve', `setup-hero-curve--${tone}`, className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <svg className="setup-hero-curve__svg" viewBox="0 0 390 32" preserveAspectRatio="none">
        <path d="M0,32 L0,16 C52,28 128,10 195,20 S310,6 390,14 L390,32 Z" />
      </svg>
    </div>
  )
}
