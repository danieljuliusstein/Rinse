'use client'

interface TourWelcomeModalProps {
  onStart: () => void
  onSkip: () => void
}

export default function TourWelcomeModal({ onStart, onSkip }: TourWelcomeModalProps) {
  return (
    <div className="tour-welcome-root" role="presentation">
      <button type="button" className="tour-welcome-backdrop" aria-label="Skip tour" onClick={onSkip} />
      <div className="tour-welcome-card" role="dialog" aria-labelledby="tour-welcome-title" aria-modal="true">
        <p className="tour-welcome-eyebrow">Welcome</p>
        <h2 id="tour-welcome-title" className="tour-welcome-title">
          Take a quick tour?
        </h2>
        <p className="tour-welcome-lead">
          Six quick stops — Home, Jobs, Clients, money, and your pipeline. Use Next to move through; you can skip or
          end anytime.
        </p>
        <div className="tour-welcome-actions">
          <button type="button" className="btn-primary tour-welcome-actions__primary" onClick={onStart}>
            Start tour
          </button>
          <button type="button" className="btn-ghost tour-welcome-actions__skip" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
