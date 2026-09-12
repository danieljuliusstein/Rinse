import { type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { colors } from '@/theme/colors'

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[12.5px] font-semibold uppercase tracking-wide text-ink-600/80"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] leading-snug text-ink-500">{hint}</p>}
    </div>
  )
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = 'text',
  inputMode,
  maxLength,
  min,
  max,
  step,
}: {
  id?: string
  value: string | number
  onChange?: (v: string) => void
  placeholder?: string
  prefix?: ReactNode
  suffix?: ReactNode
  type?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal'
  maxLength?: number
  min?: number
  max?: number
  step?: number | string
}) {
  return (
    <div className="group flex items-center rounded-xl border border-ink-200 bg-white transition-all duration-150 hover:border-ink-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
      {prefix && <span className="pl-3.5 text-ink-500 select-none">{prefix}</span>}
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-transparent px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 outline-none"
      />
      {suffix && <span className="pr-3.5 text-ink-500 select-none">{suffix}</span>}
    </div>
  )
}

export function TextArea({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  id?: string
  value: string
  onChange?: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white transition-all duration-150 hover:border-ink-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-900 placeholder:text-ink-400 outline-none"
      />
    </div>
  )
}

export function Select({
  id,
  value,
  onChange,
  children,
}: {
  id?: string
  value: string | number
  onChange?: (v: string) => void
  children: ReactNode
}) {
  return (
    <div className="group relative">
      <select
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full appearance-none rounded-xl border border-ink-200 bg-white py-2.5 pl-3.5 pr-10 text-[14px] text-ink-900 outline-none transition-all duration-150 hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500 transition-transform group-hover:translate-y-[calc(-50%+1px)]"
      />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  size = 'md',
}: {
  checked: boolean
  onChange?: (v: boolean) => void
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6'
  const knob = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const translate =
    size === 'sm'
      ? checked
        ? 'translate-x-4'
        : 'translate-x-0.5'
      : checked
        ? 'translate-x-5'
        : 'translate-x-0.5'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange ? () => onChange(!checked) : undefined}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ${w}`}
      style={{ background: checked ? colors.green : '#d4d7cf' }}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ${knob} ${translate}`}
      />
    </button>
  )
}

export function Card({
  children,
  className = '',
  accent = false,
}: {
  children: ReactNode
  className?: string
  accent?: boolean
}) {
  return (
    <section
      className={`rounded-2xl border bg-white transition-shadow duration-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-settings-card-hover)] ${
        accent ? 'border-brand-200/60' : 'border-ink-200'
      } ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  description,
  icon,
  accent = false,
}: {
  title: string
  description?: string
  icon?: ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex items-start gap-3 border-b border-ink-200/80 px-5 py-4">
      {icon && (
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            accent
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
              : 'bg-brand-50 text-brand-600'
          }`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{description}</p>
        )}
      </div>
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-ink-200 ${className}`} />
}
