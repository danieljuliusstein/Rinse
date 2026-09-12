import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import type { DeskActivity } from '@/lib/types'
import { readIdentifier } from '@/lib/contact-identifier'
import {
  LogForm,
  activityToForm,
  emptyForm,
  type ActivityFormState,
} from '@/components/activities/LogForm'
import { Timeline } from '@/components/activities/Timeline'
import {
  type ActivityFilter,
  type ActivityRow,
} from '@/components/activities/activityMeta'

export default function ActivitiesPage() {
  const { clients, leads } = useData()
  const { alert, toast } = useUi()

  const [rows, setRows] = useState<DeskActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ActivityFormState>(emptyForm())

  const contactName = useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name || id.slice(0, 8),
    [clients],
  )

  const dealLabel = useCallback(
    (id?: string) => {
      if (!id) return undefined
      const lead = leads.find((l) => l.id === id)
      if (!lead) return undefined
      return lead.packageName || lead.service_interest || lead.name
    },
    [leads],
  )

  const contacts = useMemo(
    () =>
      clients.map((c) => ({
        id: c.id,
        name: c.name,
        kind: readIdentifier(c),
      })),
    [clients],
  )

  const deals = useMemo(
    () =>
      leads.map((l) => ({
        id: l.id,
        clientId: l.client_id,
        label: [l.name, l.stage].filter(Boolean).join(' · '),
      })),
    [leads],
  )

  const activities = useMemo((): ActivityRow[] => {
    return [...rows]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .map((a) => ({
        id: a.id,
        type: a.type,
        contactId: a.contact_id,
        contactName: contactName(a.contact_id),
        dealId: a.deal_id,
        dealLabel: dealLabel(a.deal_id),
        subject: a.subject,
        body: a.body ?? '',
        at: a.occurred_at,
      }))
  }, [rows, contactName, dealLabel])

  const shownCount = useMemo(
    () => (filter === 'all' ? activities.length : activities.filter((a) => a.type === filter).length),
    [activities, filter],
  )

  const refresh = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (opts?.soft) setRefreshing(true)
      else setLoading(true)
      try {
        setRows(await platform.listActivities())
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Could not load activities', 'Activities')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [alert],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  function resetForm() {
    setEditingId(null)
    setDraft(emptyForm())
  }

  function handleEdit(a: ActivityRow) {
    setEditingId(a.id)
    setDraft(activityToForm(a))
  }

  async function handleSave() {
    if (!draft.contactId || !draft.subject.trim()) {
      alert('Contact and subject are required', 'Activities')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await platform.updateActivity(editingId, {
          contact_id: draft.contactId,
          deal_id: draft.dealId || null,
          type: draft.type,
          subject: draft.subject.trim(),
          body: draft.body.trim() || undefined,
          direction: draft.type === 'email' ? 'out' : undefined,
        })
        toast('Activity updated')
      } else {
        await platform.createActivity({
          contact_id: draft.contactId,
          deal_id: draft.dealId || undefined,
          type: draft.type,
          subject: draft.subject.trim(),
          body: draft.body.trim() || undefined,
          direction: draft.type === 'email' ? 'out' : undefined,
        })
        toast('Activity logged')
      }
      resetForm()
      await refresh({ soft: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save', 'Activities')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await platform.deleteActivity(id)
      if (editingId === id) resetForm()
      toast('Activity deleted')
      await refresh({ soft: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Activities')
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Activities"
        subtitle="Calls, emails, notes, meetings — the touchpoint log for every client."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-ink-500 ring-1 ring-ink-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {shownCount} shown
          </span>
        }
      />

      <main className="min-h-0 flex-1 overflow-hidden px-5 pb-5 pt-1">
        <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <section className="min-h-0 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70">
            <LogForm
              editingId={editingId}
              draft={draft}
              onDraftChange={setDraft}
              onSave={() => void handleSave()}
              onCancel={resetForm}
              contacts={contacts}
              deals={deals}
              saving={saving}
            />
          </section>
          <section className="min-h-0 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70">
            <Timeline
              activities={activities}
              filter={filter}
              onFilterChange={setFilter}
              editingId={editingId}
              onEdit={handleEdit}
              onDelete={(id) => void handleDelete(id)}
              onRefresh={() => void refresh({ soft: true })}
              refreshing={refreshing}
              loading={loading}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
