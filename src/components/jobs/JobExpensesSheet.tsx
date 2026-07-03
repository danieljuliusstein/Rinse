'use client'

import { useEffect, useRef, useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import { FloatingAffixField, FloatingField, SheetFooter } from '@/components/forms'
import { syncPrefilledFloatingLabels } from '@/lib/floating-label'

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
  const [travel, setTravel] = useState(String(value.travel_cost || ''))
  const [marketing, setMarketing] = useState(String(value.marketing_cost || ''))
  const [equipment, setEquipment] = useState(String(value.equipment_depreciation || ''))
  const [travelManual, setTravelManual] = useState(value.travel_cost > 0)

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [miles, travel, marketing, equipment])

  useEffect(() => {
    if (travelManual || !travelRatePerMile || travelRatePerMile <= 0) return
    const m = Number(miles)
    if (!m || m <= 0) return
    setTravel(String(roundMoney(m * travelRatePerMile)))
  }, [miles, travelRatePerMile, travelManual])

  const handleSave = () => {
    onSave({
      travel_cost: Number(travel) || 0,
      marketing_cost: Number(marketing) || 0,
      equipment_depreciation: Number(equipment) || 0,
    })
    onClose()
  }

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
          onSave={handleSave}
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

        <FloatingAffixField
          id="job-exp-travel"
          label="Travel / gas"
          type="number"
          inputMode="decimal"
          value={travel}
          filled={travel.trim().length > 0}
          onChange={(e) => {
            setTravel(e.target.value)
            setTravelManual(true)
          }}
        />

        <FloatingAffixField
          id="job-exp-marketing"
          label="Marketing"
          type="number"
          inputMode="decimal"
          value={marketing}
          filled={marketing.trim().length > 0}
          onChange={(e) => setMarketing(e.target.value)}
        />
        <FloatingAffixField
          id="job-exp-equipment"
          label="Equipment depreciation"
          type="number"
          inputMode="decimal"
          value={equipment}
          filled={equipment.trim().length > 0}
          onChange={(e) => setEquipment(e.target.value)}
        />
      </div>
    </BottomSheet>
  )
}
