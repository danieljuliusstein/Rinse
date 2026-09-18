import { useCallback, useEffect, useState } from 'react'
import { Header } from '../App'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import type { DeskCampaign } from '@/lib/types'
import { useOptionalTour } from '@/components/tour/tour-provider'
import CampaignsList from './campaigns/CampaignsList'
import CampaignEditor from './campaigns/CampaignEditor'

type View = 'list' | 'editor'

export default function CampaignsPage() {
  const { alert, toast } = useUi()
  const tour = useOptionalTour()
  const [rows, setRows] = useState<DeskCampaign[]>([])
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const list = await platform.listCampaigns()
      setRows(list)
      return list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not load campaigns', 'Campaigns')
      return [] as DeskCampaign[]
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
    if (tour?.active) {
      const created: DeskCampaign = {
        id: `tour-camp-${Date.now()}`,
        name: 'Untitled campaign',
        status: 'draft',
        channel: 'email',
        subject: 'Seasonal Detailing Special',
        body: 'Special offer for our valued clients!',
        audience_ids: [],
        stats_sent: 0,
        stats_opened: 0,
        stats_clicked: 0,
        created: new Date().toISOString(),
      }
      setRows((prev) => [created, ...prev])
      toast('Campaign created')
      setBusy(false)
      openEditor(created.id)
      return
    }

    try {
      const created = await platform.createCampaign({ name: 'Untitled campaign' })
      toast('Campaign created')
      await refresh()
      openEditor(created.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed', 'Campaigns')
    } finally {
      setBusy(false)
    }
  }

  async function onDeleteFromList(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!window.confirm(`Delete “${row?.name ?? 'this campaign'}”? This cannot be undone.`)) return
    setBusy(true)
    if (tour?.active || id.startsWith('tour-')) {
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast('Campaign deleted')
      setBusy(false)
      return
    }

    try {
      await platform.deleteCampaign(id)
      toast('Campaign deleted')
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Campaigns')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Campaigns" subtitle="Build and track your outreach campaigns" />

      {view === 'list' || !selected ? (
        <div
          className={`flex flex-col flex-1 overflow-hidden bg-rinse-bg ${
            tour?.isArmed('campaigns-panel') ? 'tour-armed relative z-[55] pointer-events-auto' : ''
          }`}
          data-tour-target="campaigns-panel"
          onClick={() => {
            if (tour?.active && tour.stop.id === 'campaigns') {
              tour.completeStop('campaigns')
            }
          }}
        >
          <CampaignsList
            rows={rows}
            busy={busy}
            onNew={() => {
              if (tour?.active && tour.stop.id === 'campaigns') tour.completeStop('campaigns')
              void onCreate()
            }}
            onOpen={(id) => {
              if (tour?.active && tour.stop.id === 'campaigns') {
                toast('Campaign template inspected')
                tour.completeStop('campaigns')
              }
              openEditor(id)
            }}
            onDelete={(id) => void onDeleteFromList(id)}
          />
        </div>
      ) : (
        <CampaignEditor
          campaign={selected}
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
