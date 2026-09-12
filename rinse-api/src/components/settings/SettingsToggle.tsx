'use client'

interface SettingsToggleProps {
  on: boolean
  onChange: (value: boolean) => void
  label?: string
}

export default function SettingsToggle({ on, onChange, label }: SettingsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="settings-toggle"
    >
      <span className={`settings-toggle__track${on ? ' settings-toggle__track--on' : ''}`}>
        <span className="settings-toggle__thumb" />
      </span>
    </button>
  )
}
