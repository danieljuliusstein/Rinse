import type { DeskFormStyle } from '@/lib/types'
import { FORM_FONTS, STYLE_PRESETS, resolveFormStyle } from '@/pages/forms/formStyle'

const fieldClass =
  'mt-1 w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:bg-white focus:border-green-400'

type Props = {
  style: DeskFormStyle
  onChange: (style: DeskFormStyle) => void
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500">
      <span>{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="color"
          value={value.startsWith('#') && value.length >= 7 ? value.slice(0, 7) : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
        />
        <input
          className="w-[72px] text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-1 font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  suffix = 'px',
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <label className="block text-[11px] font-medium text-gray-500">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="text-gray-400 font-normal">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-green-600"
      />
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 pt-3 border-t border-gray-100 first:border-0 first:pt-0">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  )
}

export default function FormStylePanel({ style, onChange }: Props) {
  const s = resolveFormStyle(style)

  function patch(partial: Partial<DeskFormStyle>) {
    onChange({ ...style, ...partial, preset: partial.preset ?? style.preset })
  }

  return (
    <div className="space-y-3">
      <Section title="Presets">
        <div className="grid grid-cols-1 gap-1.5">
          {STYLE_PRESETS.map((p) => {
            const active = style.preset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ ...p.style })}
                className={`text-left px-2.5 py-2 rounded-lg border transition-colors ${
                  active
                    ? 'border-green-400 bg-green-50 ring-1 ring-green-100'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-gray-800">{p.label}</p>
                <p className="text-[10px] text-gray-400">{p.hint}</p>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Content">
        <label className="block text-[11px] font-medium text-gray-500">
          Heading
          <input
            className={fieldClass}
            value={s.heading ?? ''}
            placeholder="Get in touch"
            onChange={(e) => patch({ heading: e.target.value || undefined })}
          />
        </label>
        <label className="block text-[11px] font-medium text-gray-500">
          Description
          <textarea
            className={fieldClass}
            rows={2}
            value={s.description ?? ''}
            placeholder="We’ll reply within one business day."
            onChange={(e) => patch({ description: e.target.value || undefined })}
          />
        </label>
      </Section>

      <Section title="Typography">
        <label className="block text-[11px] font-medium text-gray-500">
          Font
          <select
            className={fieldClass}
            value={FORM_FONTS.find((f) => f.stack === s.fontFamily)?.id ?? FORM_FONTS[0].id}
            onChange={(e) => {
              const font = FORM_FONTS.find((f) => f.id === e.target.value)
              if (font) patch({ fontFamily: font.stack })
            }}
          >
            {FORM_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <SliderRow label="Label size" value={s.labelSize} min={11} max={18} onChange={(labelSize) => patch({ labelSize })} />
        <ColorRow label="Label" value={s.labelColor} onChange={(labelColor) => patch({ labelColor })} />
        <ColorRow label="Help text" value={s.helpColor} onChange={(helpColor) => patch({ helpColor })} />
      </Section>

      <Section title="Form surface">
        <label className="block text-[11px] font-medium text-gray-500">
          Width
          <select
            className={fieldClass}
            value={s.formWidth}
            onChange={(e) => patch({ formWidth: e.target.value as DeskFormStyle['formWidth'] })}
          >
            <option value="sm">Narrow</option>
            <option value="md">Medium</option>
            <option value="lg">Wide</option>
            <option value="full">Full</option>
          </select>
        </label>
        <ColorRow label="Background" value={s.backgroundColor} onChange={(backgroundColor) => patch({ backgroundColor })} />
        <ColorRow label="Border" value={s.borderColor} onChange={(borderColor) => patch({ borderColor })} />
        <SliderRow label="Border width" value={s.borderWidth} min={0} max={4} onChange={(borderWidth) => patch({ borderWidth })} />
        <SliderRow label="Corner radius" value={s.borderRadius} min={0} max={32} onChange={(borderRadius) => patch({ borderRadius })} />
        <SliderRow label="Padding" value={s.padding} min={0} max={48} onChange={(padding) => patch({ padding })} />
        <label className="block text-[11px] font-medium text-gray-500">
          Shadow
          <select
            className={fieldClass}
            value={s.shadow}
            onChange={(e) => patch({ shadow: e.target.value as DeskFormStyle['shadow'] })}
          >
            <option value="none">None</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>
      </Section>

      <Section title="Fields">
        <label className="block text-[11px] font-medium text-gray-500">
          Input style
          <select
            className={fieldClass}
            value={s.inputStyle}
            onChange={(e) => patch({ inputStyle: e.target.value as DeskFormStyle['inputStyle'] })}
          >
            <option value="box">Boxed</option>
            <option value="underline">Underline</option>
            <option value="filled">Filled</option>
          </select>
        </label>
        <ColorRow label="Input fill" value={s.inputBackground} onChange={(inputBackground) => patch({ inputBackground })} />
        <ColorRow label="Input border" value={s.inputBorderColor} onChange={(inputBorderColor) => patch({ inputBorderColor })} />
        <ColorRow label="Input text" value={s.inputTextColor} onChange={(inputTextColor) => patch({ inputTextColor })} />
        <SliderRow label="Input radius" value={s.inputRadius} min={0} max={24} onChange={(inputRadius) => patch({ inputRadius })} />
        <SliderRow label="Input height" value={s.inputHeight} min={28} max={56} onChange={(inputHeight) => patch({ inputHeight })} />
        <SliderRow label="Field spacing" value={s.fieldGap} min={6} max={32} onChange={(fieldGap) => patch({ fieldGap })} />
      </Section>

      <Section title="Button">
        <ColorRow label="Background" value={s.buttonBackground} onChange={(buttonBackground) => patch({ buttonBackground })} />
        <ColorRow label="Text" value={s.buttonTextColor} onChange={(buttonTextColor) => patch({ buttonTextColor })} />
        <SliderRow label="Radius" value={s.buttonRadius} min={0} max={999} onChange={(buttonRadius) => patch({ buttonRadius })} />
        <SliderRow label="Height" value={s.buttonHeight} min={32} max={56} onChange={(buttonHeight) => patch({ buttonHeight })} />
        <label className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
          <input
            type="checkbox"
            checked={s.buttonFullWidth}
            onChange={(e) => patch({ buttonFullWidth: e.target.checked })}
            className="rounded border-gray-300"
          />
          Full width
        </label>
        <label className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
          <input
            type="checkbox"
            checked={s.buttonShadow}
            onChange={(e) => patch({ buttonShadow: e.target.checked })}
            className="rounded border-gray-300"
          />
          Drop shadow
        </label>
      </Section>
    </div>
  )
}
