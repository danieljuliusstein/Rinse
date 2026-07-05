'use client'

import { useCallback } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import FloatingField from './FloatingField'
import { formatPhoneAsYouType, formatUSPhoneDisplay } from '@/lib/phone-format'

interface FloatingPhoneFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  id: string
  label: string
  optional?: boolean
}

export default function FloatingPhoneField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  optional,
}: FloatingPhoneFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const display =
          field.value && !fieldState.isDirty
            ? formatUSPhoneDisplay(String(field.value))
            : formatPhoneAsYouType(String(field.value ?? ''))

        return (
          <FloatingField
            id={id}
            label={label}
            optional={optional}
            filled={Boolean(String(field.value ?? '').trim())}
            error={fieldState.error?.message}
          >
            <input
              id={id}
              className={`f-input${field.value ? ' hv' : ''}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={display}
              onChange={(e) => field.onChange(formatPhoneAsYouType(e.target.value))}
              onBlur={field.onBlur}
              placeholder=" "
              aria-invalid={fieldState.error ? true : undefined}
              aria-describedby={fieldState.error ? `${id}-error` : undefined}
            />
          </FloatingField>
        )
      }}
    />
  )
}
