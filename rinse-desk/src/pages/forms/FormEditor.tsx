import { useEffect, useMemo, useState } from 'react'
import { useData } from '@/providers/DataProvider'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import type { DeskForm, DeskFormField, DeskFormSettings, DeskFormSubmission } from '@/lib/types'
import { colors } from '@/theme/colors'
import FormBuilder from '@/components/forms/FormBuilder'
import FormRenderer from '@/components/forms/FormRenderer'

type Tab = 'edit' | 'preview' | 'submissions'

type Props = {
  form: DeskForm
  onBack: () => void
  onSaved: () => Promise<void>
  onDeleted: () => void
}

export default function FormEditor({ form, onBack, onSaved, onDeleted }: Props) {
  const { clients } = useData()
  const { alert, toast } = useUi()

  const [name, setName] = useState(form.name)
  const [status, setStatus] = useState<DeskForm['status']>(form.status)
  const [fields, setFields] = useState<DeskFormField[]>(form.fields)
  const [settings, setSettings] = useState<DeskFormSettings>(form.settings ?? {})
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('edit')
  const [busy, setBusy] = useState(false)
  const [subs, setSubs] = useState<DeskFormSubmission[]>([])
  const [simContact, setSimContact] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setName(form.name)
    setStatus(form.status)
    setFields(form.fields)
    setSettings(form.settings ?? {})
    setSelectedFieldId(null)
  }, [form])

  useEffect(() => {
    if (tab !== 'submissions') return
    void platform.listFormSubmissions(form.id).then(setSubs).catch(() => setSubs([]))
  }, [tab, form.id])

  const dirty = useMemo(() => {
    const settingsEqual = JSON.stringify(settings) === JSON.stringify(form.settings ?? {})
    const fieldsEqual = JSON.stringify(fields) === JSON.stringify(form.fields)
    return name !== form.name || status !== form.status || !fieldsEqual || !settingsEqual
  }, [name, status, fields, settings, form])

  async function onSave() {
    setBusy(true)
    try {
      await platform.updateForm(form.id, {
        name: name.trim() || form.name,
        status,
        fields,
        settings,
      })
      toast('Form saved')
      await onSaved()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed', 'Forms')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete “${form.name}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await platform.deleteForm(form.id)
      toast('Form deleted')
      onDeleted()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Forms')
      setBusy(false)
    }
  }

  async function onSimulateSubmit(payload: Record<string, string>) {
    setSubmitting(true)
    try {
      await platform.submitForm({
        form_id: form.id,
        payload,
        contact_id: simContact || undefined,
      })
      toast('Submission saved' + (simContact ? ' · activity logged' : ''))
      if (tab === 'submissions') {
        setSubs(await platform.listFormSubmissions(form.id))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submit failed', 'Forms')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'preview', label: 'Preview' },
    { id: 'submissions', label: 'Submissions' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Forms
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 text-sm font-semibold text-gray-900 border-b border-transparent focus:border-green-400 focus:outline-none py-0.5"
        />

        <button
          type="button"
          onClick={() => setStatus((s) => (s === 'live' ? 'draft' : 'live'))}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
            status === 'live'
              ? 'border-rinse-green-border bg-rinse-green-soft text-rinse-green-text hover:bg-white'
              : 'border-ink-200 bg-ink-50 text-ink-500 hover:bg-white',
          ].join(' ')}
          title="Desk status — Live shows as published on the Forms list; Draft stays unpublished"
        >
          <span
            className={[
              'h-1.5 w-1.5 rounded-full',
              status === 'live' ? 'bg-rinse-green' : 'bg-ink-400',
            ].join(' ')}
          />
          {status === 'live' ? 'Live' : 'Draft'}
        </button>

        <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1 text-xs rounded-md ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => void onSave()}
          className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
          style={{ background: colors.green }}
        >
          {busy ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete()}
          className="text-xs text-gray-400 hover:text-red-600 px-2 py-1.5"
        >
          Delete
        </button>
      </div>

      {tab === 'edit' ? (
        <FormBuilder
          fields={fields}
          settings={settings}
          selectedFieldId={selectedFieldId}
          showPreview
          onFieldsChange={setFields}
          onSettingsChange={setSettings}
          onSelectField={setSelectedFieldId}
        />
      ) : null}

      {tab === 'preview' ? (
        <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#e8eaed' }}>
          <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
            <div className="flex justify-center p-4 sm:p-8">
              <FormRenderer
                fields={fields}
                settings={settings}
                mode="edit-preview"
                selectedFieldId={selectedFieldId}
                onFieldClick={setSelectedFieldId}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Simulate submission
              </p>
              <FormRenderer
                fields={fields}
                settings={settings}
                mode="simulate"
                submitting={submitting}
                onSubmit={onSimulateSubmit}
                contactSlot={
                  <label className="block text-xs text-gray-500 mb-2">
                    Link to contact (optional)
                    <select
                      value={simContact}
                      onChange={(e) => setSimContact(e.target.value)}
                      className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="">None</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'submissions' ? (
        <div className="flex-1 overflow-auto p-5">
          {subs.length === 0 ? (
            <p className="text-xs text-gray-400">No submissions yet.</p>
          ) : (
            <ul className="space-y-2 max-w-2xl">
              {subs.map((s) => (
                <li key={s.id} className="text-xs border border-gray-100 rounded-lg px-3 py-2 bg-white">
                  <div className="flex justify-between gap-2 text-gray-400 mb-1">
                    <span>{s.created ? new Date(s.created).toLocaleString() : s.id}</span>
                    {s.contact_id ? <span>contact · {s.contact_id.slice(0, 8)}</span> : null}
                  </div>
                  <pre className="text-[11px] text-gray-700 whitespace-pre-wrap break-all">
                    {JSON.stringify(s.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
