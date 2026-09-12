import { useCallback, useEffect, useState } from 'react'
import { Header } from '../App'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import type { DeskForm } from '@/lib/types'
import { colors } from '@/theme/colors'
import FormsList from './forms/FormsList'
import FormEditor from './forms/FormEditor'

type View = 'list' | 'editor'

export default function FormsPage() {
  const { alert, toast } = useUi()
  const [rows, setRows] = useState<DeskForm[]>([])
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const list = await platform.listForms()
      setRows(list)
      return list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not load forms', 'Forms')
      return [] as DeskForm[]
    }
  }, [alert])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const selected = selectedId ? (rows.find((r) => r.id === selectedId) ?? null) : null

  useEffect(() => {
    if (view === 'editor' && selectedId && !selected) {
      setView('list')
      setSelectedId(null)
    }
  }, [view, selectedId, selected])

  function goList() {
    setView('list')
    setSelectedId(null)
    void refresh()
  }

  function openEditor(id: string) {
    setSelectedId(id)
    setView('editor')
  }

  async function onCreate() {
    setBusy(true)
    try {
      const created = await platform.createForm({ name: 'Untitled form', status: 'draft' })
      toast('Form created')
      await refresh()
      openEditor(created.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed', 'Forms')
    } finally {
      setBusy(false)
    }
  }

  async function onDeleteFromList(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!window.confirm(`Delete “${row?.name ?? 'this form'}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await platform.deleteForm(id)
      toast('Form deleted')
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Forms')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Forms" subtitle="Build lead forms and simulate submissions in Desk" />

      {view === 'list' || !selected ? (
        <div className="flex flex-col flex-1 overflow-hidden" style={{ background: colors.bg }}>
          <FormsList
            rows={rows}
            busy={busy}
            onNew={() => void onCreate()}
            onOpen={openEditor}
            onDelete={(id) => void onDeleteFromList(id)}
          />
        </div>
      ) : (
        <FormEditor
          form={selected}
          onBack={goList}
          onSaved={async () => {
            await refresh()
          }}
          onDeleted={goList}
        />
      )}
    </div>
  )
}
