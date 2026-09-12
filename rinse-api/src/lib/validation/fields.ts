import { z } from 'zod'
import { isValidUSPhone, isValidUSPhoneOptional } from '@/lib/phone-format'

export const requiredString = (message = 'Required') =>
  z.string().trim().min(1, message)

export const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined)

export const emailField = z
  .string()
  .trim()
  .refine((v) => !v || z.string().email().safeParse(v).success, 'Enter a valid email')
  .optional()
  .transform((v) => v || undefined)

export const requiredEmailField = z.string().trim().email('Enter a valid email')

export const phoneField = z
  .string()
  .trim()
  .min(1, 'Phone is required')
  .refine(isValidUSPhone, 'Enter a valid US phone number')

export const optionalPhoneField = z
  .string()
  .trim()
  .refine(isValidUSPhoneOptional, 'Enter a valid US phone number')
  .optional()
  .transform((v) => v || undefined)

export const moneyField = (message = 'Enter an amount greater than zero') =>
  z.coerce.number().positive(message)

export const optionalMoneyField = z.coerce.number().min(0, 'Amount cannot be negative')

export const isoDateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
