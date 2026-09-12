'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback } from 'react'
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import type { z } from 'zod'
import { useActionToast } from '@/providers/ActionToastProvider'

type Schema<T extends FieldValues> = z.ZodType<T, FieldValues>

interface UseRinseFormOptions<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: Schema<T>
  defaultValues: DefaultValues<T>
}

export function useRinseForm<T extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onSubmit',
  ...rest
}: UseRinseFormOptions<T>): UseFormReturn<T> & {
  submitWithToast: (
    onValid: (values: T) => void | Promise<void>,
    onInvalidMessage?: string,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>
} {
  const { showMessage } = useActionToast()
  const form = useForm<T>({
    resolver: zodResolver(schema) as UseFormProps<T>['resolver'],
    defaultValues,
    mode,
    ...rest,
  })

  const submitWithToast = useCallback(
    (onValid: (values: T) => void | Promise<void>, onInvalidMessage = 'Please fix the highlighted fields.') =>
      form.handleSubmit(
        async (values) => {
          await onValid(values)
        },
        () => {
          showMessage(onInvalidMessage)
        },
      ),
    [form, showMessage],
  )

  return { ...form, submitWithToast }
}
