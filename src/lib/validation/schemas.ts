import { z } from 'zod'
import {
  emailField,
  isoDateField,
  moneyField,
  optionalMoneyField,
  optionalPhoneField,
  optionalString,
  phoneField,
  requiredEmailField,
  requiredString,
} from './fields'

export const clientFormSchema = z.object({
  name: requiredString('Name is required'),
  phone: optionalPhoneField,
  email: emailField,
  address: optionalString,
  lead_source: z.string().optional(),
  notes: optionalString,
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const quickJobFormSchema = z.object({
  clientId: requiredString('Select a client'),
  packageId: requiredString('Select a service package'),
  vehicleType: requiredString(),
  locationType: z.enum(['mobile', 'fixed']),
  revenue: moneyField('Enter revenue greater than zero'),
  tip: optionalMoneyField,
  date: isoDateField,
  start_time: optionalString,
  notes: optionalString,
  travel_cost: optionalMoneyField,
  marketing_cost: optionalMoneyField,
  equipment_depreciation: optionalMoneyField,
  recurrence_cadence: z.enum(['none', 'weekly', 'biweekly', 'monthly']).optional(),
})

export type QuickJobFormValues = z.infer<typeof quickJobFormSchema>

export const businessExpenseSchema = z.object({
  date: isoDateField,
  name: requiredString('Name is required'),
  amount: moneyField('Enter an amount greater than zero'),
  category: z.string().min(1),
  vendor: optionalString,
  notes: optionalString,
})

export type BusinessExpenseFormValues = z.infer<typeof businessExpenseSchema>

export const supplyPurchaseSchema = z.object({
  supply_id: requiredString('Select a supply'),
  quantity: z.coerce.number().positive('Enter a quantity'),
  total_cost: moneyField('Enter total cost'),
  date: isoDateField,
  vendor: optionalString,
  notes: optionalString,
})

export type SupplyPurchaseFormValues = z.infer<typeof supplyPurchaseSchema>

export const leadFormSchema = z.object({
  name: requiredString('Name is required'),
  phone: optionalPhoneField,
  email: emailField,
  service_interest: optionalString,
  vehicle_type: optionalString,
  notes: optionalString,
  estimated_value: optionalMoneyField,
  source: z.string().optional(),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

export const onboardingBusinessSchema = z.object({
  business_name: requiredString('Business name is required'),
  business_phone: phoneField,
  business_email: emailField,
  business_address: optionalString,
})

export type OnboardingBusinessFormValues = z.infer<typeof onboardingBusinessSchema>

export const bookingContactSchema = z.object({
  name: requiredString('Name is required'),
  phone: phoneField,
  email: emailField,
  notes: optionalString,
})

export type BookingContactFormValues = z.infer<typeof bookingContactSchema>

const vehicleYearField = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().int().min(1900).max(2100).optional(),
)

const vehicleTypeField = z.enum(['sedan', 'suv', 'truck', 'van', 'boat', 'other'])

export const vehicleFormSchema = z.object({
  make: requiredString('Make is required'),
  model: requiredString('Model is required'),
  year: vehicleYearField,
  plate: optionalString,
  vin: optionalString,
  color: optionalString,
  color_hex: optionalString,
  type: vehicleTypeField,
})

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export const quoteFormSchema = z.object({
  client_id: requiredString('Select a client'),
  package_id: requiredString('Select a package'),
  date: isoDateField,
  vehicle_type: vehicleTypeField,
  location_type: z.enum(['mobile', 'fixed']),
  subtotal: moneyField(),
  valid_until: isoDateField,
  notes: optionalString,
})

export type QuoteFormValues = z.infer<typeof quoteFormSchema>

const jobStatusField = z.enum(['scheduled', 'in_progress', 'completed', 'invoiced', 'paid'])

export const jobEditFormSchema = z.object({
  date: isoDateField,
  revenue: moneyField(),
  tip: optionalMoneyField,
  hours_worked: optionalMoneyField,
  start_time: optionalString,
  travel_cost: optionalMoneyField,
  marketing_cost: optionalMoneyField,
  equipment_depreciation: optionalMoneyField,
  notes: optionalString,
  status: jobStatusField,
  recurrence_cadence: z.enum(['none', 'weekly', 'biweekly', 'monthly']).optional(),
})

export type JobEditFormValues = z.infer<typeof jobEditFormSchema>

export const invoiceAdjustmentsSchema = z.object({
  discount_amount: optionalMoneyField,
  tax_rate: z.coerce.number().min(0).max(100, 'Tax rate cannot exceed 100%'),
  po_number: optionalString,
})

export type InvoiceAdjustmentsFormValues = z.infer<typeof invoiceAdjustmentsSchema>

const invoiceLineTemplateSchema = z.object({
  id: z.string(),
  description: z.string(),
  default_amount: z.number(),
  category: optionalString,
  active: z.boolean().optional(),
})

export const invoiceCustomizeSchema = z.object({
  termsFooter: optionalString,
  adjustments: invoiceAdjustmentsSchema.optional(),
  extraLineItems: z.array(invoiceLineTemplateSchema).optional(),
})

export type InvoiceCustomizeFormValues = z.infer<typeof invoiceCustomizeSchema>

export const invoicePaymentSchema = z.object({
  amount: moneyField('Enter payment amount'),
  method: requiredString('Select a payment method'),
  date: isoDateField,
  notes: optionalString,
})

export type InvoicePaymentFormValues = z.infer<typeof invoicePaymentSchema>

export const packageFormSchema = z
  .object({
    name: requiredString('Name is required'),
    description: optionalString,
    base_price: moneyField(),
    expected_return_days: z.coerce.number().positive(),
    duration_minutes: z.coerce.number(),
    custom_duration_minutes: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
      z.number().positive('Enter duration').optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.duration_minutes === 0 && !data.custom_duration_minutes) {
      ctx.addIssue({ code: 'custom', message: 'Enter duration', path: ['custom_duration_minutes'] })
    }
  })

export const jobExpensesSchema = z.object({
  travel_cost: optionalMoneyField,
  marketing_cost: optionalMoneyField,
  equipment_depreciation: optionalMoneyField,
})

export type JobExpensesFormValues = z.infer<typeof jobExpensesSchema>

export type PackageFormValues = z.infer<typeof packageFormSchema>

export const overheadExpenseSchema = z.object({
  name: requiredString('Name is required'),
  amount: moneyField(),
  category: z.string().min(1),
})

export type OverheadExpenseFormValues = z.infer<typeof overheadExpenseSchema>

export const settingsBusinessSchema = z.object({
  business_name: requiredString('Business name is required'),
  business_phone: optionalPhoneField,
  business_email: emailField,
  business_address: optionalString,
})

export type SettingsBusinessFormValues = z.infer<typeof settingsBusinessSchema>

export const settingsAccountSchema = z
  .object({
    current_password: optionalString,
    new_password: optionalString,
    confirm_password: optionalString,
  })
  .superRefine((data, ctx) => {
    const changing = Boolean(data.new_password?.trim())
    if (!changing) return
    if (!data.current_password?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Current password is required', path: ['current_password'] })
    }
    if ((data.new_password?.length ?? 0) < 8) {
      ctx.addIssue({ code: 'custom', message: 'Password must be at least 8 characters', path: ['new_password'] })
    }
    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({ code: 'custom', message: 'Passwords do not match', path: ['confirm_password'] })
    }
  })

export type SettingsAccountFormValues = z.infer<typeof settingsAccountSchema>

export const settingsScheduleBlockSchema = z.object({
  date: isoDateField,
  start_time: requiredString('Start time is required'),
  end_time: requiredString('End time is required'),
  label: optionalString,
})

export type SettingsScheduleBlockFormValues = z.infer<typeof settingsScheduleBlockSchema>

export const autoMessageEditSchema = z.object({
  emailBody: requiredString('Email body is required'),
})

export type AutoMessageEditFormValues = z.infer<typeof autoMessageEditSchema>

const optionalQuantityField = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().min(0).optional(),
)

export const supplyFormSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('add'),
    name: requiredString('Name is required'),
    qty: z.coerce.number().positive('Enter a quantity'),
    total_cost: optionalMoneyField,
    cost_per_unit_manual: optionalMoneyField,
    reorder_threshold: optionalQuantityField,
    supplier: optionalString,
    notes: optionalString,
  }),
  z.object({
    mode: z.literal('edit'),
    name: requiredString('Name is required'),
    quantity_on_hand: z.coerce.number().min(0, 'Quantity cannot be negative'),
    reorder_threshold: optionalQuantityField,
    supplier: optionalString,
    notes: optionalString,
  }),
  z.object({
    mode: z.literal('restock'),
    restock_qty: z.coerce.number().positive('Enter quantity to add'),
    restock_cost: optionalMoneyField,
  }),
])

export type SupplyFormValues = z.infer<typeof supplyFormSchema>

export const equipmentFormSchema = z.object({
  name: requiredString('Name is required'),
  purchase_price: optionalMoneyField,
  purchase_date: z.string().optional(),
  supplier: optionalString,
  notes: optionalString,
  status: z.enum(['active', 'retired']),
})

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>

export const inventoryEditFormSchema = z.object({
  name: requiredString('Name is required'),
  price_estimate: optionalMoneyField,
  notes: optionalString,
})

export type InventoryEditFormValues = z.infer<typeof inventoryEditFormSchema>
