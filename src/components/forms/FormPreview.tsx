import type { DeskFormField, DeskFormSettings } from '@/lib/types'
import FormRenderer from './FormRenderer'

type Props = {
  fields: DeskFormField[]
  settings?: DeskFormSettings
  selectedFieldId?: string | null
  onFieldClick?: (id: string) => void
  /** Ambient stage behind the form so surface colors read clearly */
  stage?: boolean
  className?: string
}

/** Same FormRenderer as live — wrapped in an embed-style stage. */
export default function FormPreview({
  fields,
  settings,
  selectedFieldId,
  onFieldClick,
  stage = true,
  className,
}: Props) {
  const form = (
    <FormRenderer
      fields={fields}
      settings={settings}
      mode="edit-preview"
      selectedFieldId={selectedFieldId}
      onFieldClick={onFieldClick}
    />
  )

  if (!stage) {
    return <div className={className}>{form}</div>
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Live form</p>
        <p className="text-[10px] text-gray-400">What submitters see</p>
      </div>
      <div
        className="rounded-xl border border-gray-200/80 p-6 sm:p-8 flex justify-center overflow-auto"
        style={{
          backgroundColor: '#e8eaed',
          backgroundImage:
            'linear-gradient(45deg, #dde0e4 25%, transparent 25%), linear-gradient(-45deg, #dde0e4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dde0e4 75%), linear-gradient(-45deg, transparent 75%, #dde0e4 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          minHeight: 280,
        }}
      >
        {form}
      </div>
    </div>
  )
}
