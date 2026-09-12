'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import BottomSheet from '@/components/BottomSheet'
import { FloatingAffixField, FloatingField, SheetFooter } from '@/components/forms'
import { useRinseForm } from '@/hooks/useRinseForm'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'
import { jobExpensesSchema, type JobExpensesFormValues } from '@/lib/validation'

export interface JobExpenseDraft {
  travel_cost: number
  marketing_cost: number
  equipment_depreciation: number
}

interface JobExpensesSheetProps {
  value: JobExpenseDraft
  travelRatePerMile?: number
  onSave: (value: JobExpenseDraft) => void
  onClose: () => void
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100
}

export default function JobExpensesSheet({
  value,
  travelRatePerMile,
  onSave,
  onClose,
}: JobExpensesSheetProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const [miles, setMiles] = useState('')
  const [travelManual, setTravelManual] = useState(value.travel_cost > 0)

  const {
    control,
    watch,
    setValue,
    submitWithToast,
  } = useRinseForm<JobExpensesFormValues>({
    schema: jobExpensesSchema,
    defaultValues: {
      travel_cost: value.travel_cost,
      marketing_cost: value.marketing_cost,
      equipment_depreciation: value.equipment_depreciation,
    },
  })

  const travel = watch('travel_cost')
  const marketing = watch('marketing_cost')
  const equipment = watch('equipment_depreciation')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [miles, travel, marketing, equipment])

  useEffect(() => {
    if (travelManual || !travelRatePerMile || travelRatePerMile <= 0) return
    const m = Number(miles)
    if (!m || m <= 0) return
    setValue('travel_cost', roundMoney(m * travelRatePerMile))
  }, [miles, travelRatePerMile, travelManual, setValue])

  const handleSave = submitWithToast((values) => {
    onSave({
      travel_cost: values.travel_cost,
      marketing_cost: values.marketing_cost,
      equipment_depreciation: values.equipment_depreciation,
    })
    onClose()
  })

  return (
    <BottomSheet
      variant="light"
      title="Job expenses"
      subtitle="Travel, marketing, and equipment for this job"
      ariaLabel="Job expenses"
      onClose={onClose}
      footer={
        <SheetFooter
          saveLabel="Done"
          ready
          layout="split"
          onSave={() => void handleSave()}
          onCancel={onClose}
        />
      }
    >
      <div ref={formRef} className="premium-sheet__form">
        {travelRatePerMile && travelRatePerMile > 0 ? (
          <FloatingField id="job-exp-miles" label="Miles" filled={miles.trim().length > 0} optional>
            <input
              id="job-exp-miles"
              className={`f-input${miles.trim() ? ' hv' : ''}`}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={miles}
              onChange={(e) => {
                setMiles(e.target.value)
                setTravelManual(false)
              }}
              placeholder=" "
            />
          </FloatingField>
        ) : null}

        <Controller
          control={control}
          name="travel_cost"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="job-exp-travel"
              label="Travel / gas"
              currency
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                setTravelManual(true)
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="marketing_cost"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="job-exp-marketing"
              label="Marketing"
              currency
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="equipment_depreciation"
          render={({ field, fieldState }) => (
            <FloatingAffixField
              id="job-exp-equipment"
              label="Equipment depreciation"
              currency
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </BottomSheet>
  )
}
