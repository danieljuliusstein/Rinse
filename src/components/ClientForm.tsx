'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { FloatingField, PillGroup, SheetSubmitButton } from '@/components/forms'
import { createClient, updateClient } from '@/lib/api'
import { syncPrefilledFloatingLabels, syncSelectFloatingLabel } from '@/lib/floating-label'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { Client, ClientInput } from '@/lib/types'

const LEAD_SOURCE_PILLS = [
  { value: 'google', label: 'Google' },
  { value: 'referral', label: 'Referral' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'word_of_mouth', label: 'Word of mouth' },
  { value: 'other', label: 'Other' },
] as const

interface Props {
  client?: Client
}

export default function ClientForm({ client }: Props) {
  const router = useRouter()
  const { handleWriteError } = useActionToast()
  const formRef = useRef<HTMLDivElement>(null)
  const isEdit = !!client
  const [name, setName] = useState(client?.name ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [address, setAddress] = useState(client?.address ?? '')
  const [leadSource, setLeadSource] = useState(client?.lead_source ?? 'other')
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    syncPrefilledFloatingLabels(formRef.current)
  }, [name, phone, email, address, notes])

  const buildInput = (): ClientInput => ({
    name,
    phone: phone || undefined,
    email: email || undefined,
    address: address || undefined,
    lead_source: leadSource || undefined,
    notes: notes || undefined,
  })

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit && client) {
        const updated = await updateClient(client.id, buildInput())
        if (!updated) throw new Error('Update failed')
        setSaved(true)
        window.setTimeout(() => router.push(`/clients/${client.id}`), 1500)
      } else {
        const created = await createClient(buildInput())
        setSaved(true)
        window.setTimeout(() => router.push(`/clients/${created.id}`), 1500)
      }
    } catch (err) {
      if (handleWriteError(err)) return
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen page-content">
      <header className="job-form-header">
        <BackButton onClick={() => router.back()} />
        <div className="job-form-header__title">{isEdit ? 'Edit client' : 'New client'}</div>
      </header>

      <div ref={formRef} className="page-form-card page-form">
        <div className="page-form__grid2">
          <FloatingField id="client-name" label="Name" filled={name.trim().length > 0}>
            <input
              id="client-name"
              className={`f-input${name.trim() ? ' hv' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField id="client-phone" label="Phone" filled={phone.trim().length > 0}>
            <input
              id="client-phone"
              className={`f-input${phone.trim() ? ' hv' : ''}`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=" "
            />
          </FloatingField>
        </div>

        <FloatingField id="client-email" label="Email" filled={email.trim().length > 0}>
          <input
            id="client-email"
            className={`f-input${email.trim() ? ' hv' : ''}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField id="client-address" label="Address" filled={address.trim().length > 0} optional>
          <input
            id="client-address"
            className={`f-input${address.trim() ? ' hv' : ''}`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <PillGroup
          label="Lead source"
          options={[...LEAD_SOURCE_PILLS]}
          value={LEAD_SOURCE_PILLS.some((p) => p.value === leadSource) ? leadSource : 'other'}
          onChange={setLeadSource}
        />

        <FloatingField id="client-notes" label="Notes" filled={notes.trim().length > 0} optional textarea>
          <textarea
            id="client-notes"
            className={`f-textarea${notes.trim() ? ' hv' : ''}`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=" "
          />
        </FloatingField>
      </div>

      {error ? <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="page-form-save">
        <SheetSubmitButton
          label={saved ? 'Saved' : saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
          ready={name.trim().length > 0}
          done={saved}
          disabled={saving || saved}
          onClick={() => void handleSave()}
        />
        {saved ? <p className="form-save-flash">Saved</p> : null}
      </div>
    </div>
  )
}
