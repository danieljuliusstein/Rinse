'use client'

interface SetupLoadingScreenProps {
  /** shell = hero + progress + field rows; inline = compact rows only */
  variant?: 'shell' | 'inline'
}

export default function SetupLoadingScreen({ variant = 'shell' }: SetupLoadingScreenProps) {
  return (
    <div
      className={[
        'setup-loading',
        'setup-flow',
        'client-light-root',
        variant === 'inline' ? 'setup-loading--inline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {variant === 'shell' ? (
        <>
          <div className="setup-loading__nav">
            <div className="setup-loading__pill setup-loading__pill--sm" />
            <div className="setup-loading__pill setup-loading__pill--title" />
          </div>
          <div className="setup-loading__progress" />
        </>
      ) : null}
      <div className="setup-loading__body">
        <div className="setup-loading__pill setup-loading__pill--lead" />
        <div className="setup-loading__group">
          <div className="setup-loading__row" />
          <div className="setup-loading__row" />
          <div className="setup-loading__row" />
        </div>
      </div>
    </div>
  )
}
