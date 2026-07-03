'use client'

import { useEffect, useRef, useState } from 'react'
import { PencilSimple, Plus, Package as PackageIcon } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { FloatingAffixField, FloatingField, SheetSubmitButton } from '@/components/forms'
import { ListRow, SectionGroup } from '@/components/ui'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { createPackage, getAllPackages, updatePackage } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { CADENCE_PRESETS, cadencePresetLabel, DEFAULT_RETURN_DAYS } from '@/lib/package-cadence'
import { PACKAGE_DURATION_PRESETS, durationPresetLabel } from '@/lib/package-duration'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import type { Package } from '@/lib/types'

export default function PackagesSettings() {
  const goBack = useSettingsBack()
  const formRef = useRef<HTMLDivElement>(null)
  const returnDaysRef = useRef<HTMLSelectElement>(null)
  const durationRef = useRef<HTMLSelectElement>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [description, setDescription] = useState('')
  const [returnDays, setReturnDays] = useState(DEFAULT_RETURN_DAYS)
  const [durationMinutes, setDurationMinutes] = useState(120)
  const [customDuration, setCustomDuration] = useState('')

  const load = async () => setPackages(await getAllPackages())
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!showAdd && !editingId) return
    syncPrefilledFloatingLabels(formRef.current)
    syncSelectFloatingLabel(returnDaysRef.current)
    syncSelectFloatingLabel(durationRef.current)
  }, [showAdd, editingId, name, price, description, returnDays, durationMinutes, customDuration])

  const resolvedDuration = (): number => {
    if (durationMinutes === 0) {
      const custom = Number(customDuration)
      return custom > 0 ? custom : 120
    }
    return durationMinutes
  }

  const resetForm = () => {
    setName('')
    setPrice(0)
    setDescription('')
    setReturnDays(DEFAULT_RETURN_DAYS)
    setDurationMinutes(120)
    setCustomDuration('')
  }

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setName(pkg.name)
    setPrice(pkg.base_price)
    setDescription(pkg.description ?? '')
    setReturnDays(pkg.expected_return_days)
    const preset = PACKAGE_DURATION_PRESETS.find((p) => p.minutes === pkg.duration_minutes)
    if (preset) {
      setDurationMinutes(pkg.duration_minutes)
      setCustomDuration('')
    } else {
      setDurationMinutes(0)
      setCustomDuration(String(pkg.duration_minutes))
    }
    setShowAdd(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  const handleToggle = async (pkg: Package) => {
    await updatePackage(pkg.id, { active: !pkg.active })
    await load()
  }

  const handleSaveEdit = async () => {
    if (!editingId || !name.trim()) return
    await updatePackage(editingId, {
      name: name.trim(),
      base_price: price,
      description: description.trim() || undefined,
      expected_return_days: returnDays,
      duration_minutes: resolvedDuration(),
    })
    cancelEdit()
    await load()
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    await createPackage({
      name: name.trim(),
      base_price: price,
      description: description.trim() || undefined,
      expected_return_days: returnDays,
      duration_minutes: resolvedDuration(),
      active: true,
    })
    setShowAdd(false)
    resetForm()
    await load()
  }

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Services &amp; pricing</h1>
        <button
          type="button"
          className="page-header__action"
          onClick={() => {
            setShowAdd(!showAdd)
            cancelEdit()
          }}
          aria-label="Add service"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <p className="settings-lead">
        Set base prices and revisit cadence for each service. Client follow-up timing and visit
        frequency scores use the cadence from their last booked service.
      </p>

      {(showAdd || editingId) && (
        <div ref={formRef} className="page-form-card page-form job-form-section">
          <div className="section-title">{editingId ? 'Edit service' : 'New service'}</div>

          <FloatingField id="pkg-name" label="Service name" filled={name.trim().length > 0}>
            <input
              id="pkg-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingAffixField
            id="pkg-price"
            label="Price"
            filled={price > 0}
            type="number"
            min={0}
            step={1}
            value={price || ''}
            onChange={(e) => setPrice(Number(e.target.value))}
          />

          <FloatingField id="pkg-description" label="Description" filled={description.trim().length > 0} optional>
            <input
              id="pkg-description"
              className={`f-input${description.trim() ? ' hv' : ''}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          <FloatingField id="pkg-return-days" label="Expected revisit" filled={Boolean(returnDays)}>
            <select
              ref={returnDaysRef}
              id="pkg-return-days"
              className={`f-select${returnDays ? ' hv' : ''}`}
              value={returnDays}
              onChange={(e) => {
                setReturnDays(Number(e.target.value))
                syncSelectFloatingLabel(returnDaysRef.current)
              }}
            >
              {CADENCE_PRESETS.map((preset) => (
                <option key={preset.days} value={preset.days}>
                  {preset.label} — {preset.hint}
                </option>
              ))}
            </select>
          </FloatingField>

          <FloatingField id="pkg-duration" label="Booking duration" filled={Boolean(durationMinutes || customDuration)}>
            <select
              ref={durationRef}
              id="pkg-duration"
              className={`f-select${durationMinutes || customDuration ? ' hv' : ''}`}
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(Number(e.target.value))
                syncSelectFloatingLabel(durationRef.current)
              }}
            >
              {PACKAGE_DURATION_PRESETS.map((preset) => (
                <option key={preset.minutes} value={preset.minutes}>
                  {preset.label}
                </option>
              ))}
              <option value={0}>Custom</option>
            </select>
          </FloatingField>

          {durationMinutes === 0 && (
            <FloatingField id="pkg-duration-custom" label="Custom minutes" filled={customDuration.trim().length > 0}>
              <input
                id="pkg-duration-custom"
                type="number"
                min={15}
                step={15}
                className={`f-input${customDuration.trim() ? ' hv' : ''}`}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder=" "
              />
            </FloatingField>
          )}

          <p className="form-field-hint-block">Used to block your calendar when clients book online.</p>

          <div className="package-form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => (showAdd ? setShowAdd(false) : cancelEdit())}
            >
              Cancel
            </button>
            <div className="page-form-save">
              <SheetSubmitButton
                label={editingId ? 'Save' : 'Add service'}
                ready={name.trim().length > 0}
                onClick={() => void (editingId ? handleSaveEdit() : handleAdd())}
              />
            </div>
          </div>
        </div>
      )}

      <SectionGroup title="Your services">
        {packages.map((pkg) => (
          <ListRow
            key={pkg.id}
            icon={<PackageIcon size={18} weight="duotone" />}
            iconTone="green"
            title={pkg.name}
            subtitle={`${fmt(pkg.base_price)}${pkg.description ? ` · ${pkg.description}` : ''} · ${cadencePresetLabel(pkg.expected_return_days)} · ${durationPresetLabel(pkg.duration_minutes)}`}
            trailing={
              <div className="package-row-actions">
                <button type="button" className="btn-ghost" onClick={() => startEdit(pkg)}>
                  <PencilSimple size={14} weight="bold" aria-hidden="true" />
                  Edit
                </button>
                <button type="button" className="btn-ghost" onClick={() => void handleToggle(pkg)}>
                  {pkg.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            }
          />
        ))}
      </SectionGroup>
    </div>
  )
}
