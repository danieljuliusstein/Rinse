import { computeFormProgress, isFormSubmittable } from './form-progress'

export function computeLeadFormProgress(fields: {
  name: string
  phone: string
  email: string
  quoteAmount: string
  serviceInterest: string
  notes: string
  hasVehicle: boolean
  hasSource: boolean
}): number {
  const textFields = [
    fields.name,
    fields.phone,
    fields.email,
    fields.quoteAmount,
    fields.serviceInterest,
    fields.notes,
  ]
  let extraFilled = 0
  if (fields.hasVehicle) extraFilled++
  if (fields.hasSource) extraFilled++
  return computeFormProgress(textFields, 2, extraFilled)
}

export function isLeadFormSubmittable(progress: number, name: string, isEdit: boolean): boolean {
  return isFormSubmittable(progress, name.trim().length > 0, isEdit)
}
