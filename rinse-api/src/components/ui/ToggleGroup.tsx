import type { ReactNode } from 'react'

export interface ToggleOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

export interface ToggleGroupProps<T extends string> {
  value: T
  options: ToggleOption<T>[]
  onChange: (value: T) => void
  className?: string
  optionClassName?: string
  selectedClassName?: string
}

export default function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
  className = 'book-location-toggle',
  optionClassName = 'book-location-opt',
  selectedClassName = ' book-location-opt--selected',
}: ToggleGroupProps<T>) {
  return (
    <div className={className} role="group">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={`${optionClassName}${selected ? selectedClassName : ''}`}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
