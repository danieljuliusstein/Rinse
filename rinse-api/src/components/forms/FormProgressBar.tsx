interface Props {
  progress: number
  label?: string
}

export default function FormProgressBar({ progress, label = 'Completion' }: Props) {
  return (
    <div className="form-progress">
      <div className="form-progress__row">
        <span className="form-progress__label">{label}</span>
        <span className="form-progress__pct">{progress}%</span>
      </div>
      <div className="form-progress__bar">
        <div className="form-progress__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
