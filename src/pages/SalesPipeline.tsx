import { useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, Star } from 'lucide-react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useUi } from '@/providers/UiProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import * as api from '@/lib/api'
import * as platform from '@/lib/platform-api'
import type { DeskLead, LeadStage } from '@/lib/types'
import { initials, money, todayISO } from '@/lib/metrics'
import { colors } from '@/theme/colors'
import { EmptyState } from '@/components/graphics/SoftBlobs'

interface Deal {
  id: string
  title: string
  value: number
  company: string
  contact: string
  vehicle?: string
  source?: string
  stars: number
  avatar: string
  stage: LeadStage
  lead: DeskLead
}

const COLUMN_DEFS: {
  id: LeadStage
  label: string
  accent: string
  soft: string
  text: string
}[] = [
  {
    id: 'inquiry',
    label: 'Inquiry',
    accent: colors.green,
    soft: colors.greenSoft,
    text: colors.greenText,
  },
  {
    id: 'quoted',
    label: 'Quoted',
    accent: colors.amber,
    soft: '#fef3e2',
    text: '#b45309',
  },
  {
    id: 'booked',
    label: 'Scheduled',
    accent: colors.teal,
    soft: '#e6f7f5',
    text: '#0f766e',
  },
]

/** Visual ticket-size cue from quote amount — not a customer rating. */
function tierStars(amount: number): number {
  if (amount >= 1200) return 5
  if (amount >= 900) return 4
  if (amount >= 500) return 3
  if (amount >= 200) return 2
  return 1
}

function Stars({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" title="Deal size by quote amount">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < n ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#e5e7eb]'}
        />
      ))}
    </div>
  )
}

function leadToDeal(lead: DeskLead): Deal {
  const amount = lead.quote_amount || 0
  return {
    id: lead.id,
    title: lead.service_interest || lead.name,
    value: amount,
    company: lead.name,
    contact: lead.email || lead.phone || '',
    vehicle: lead.vehicle_type,
    source: lead.source,
    stars: tierStars(amount),
    avatar: initials(lead.name),
    stage: lead.stage,
    lead,
  }
}

function columnForDeal(deal: Deal): LeadStage {
  return deal.stage
}

function DealCardBody({ deal, dragging }: { deal: Deal; dragging?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_4px_12px_-4px_rgba(17,24,39,0.08)] transition-[box-shadow,transform,border-color] duration-150 ${
        dragging
          ? 'border-green-300 shadow-xl shadow-green-900/10 scale-[1.02] rotate-[0.6deg] ring-2 ring-[#22c55e]/40'
          : 'hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(17,24,39,0.12),0_8px_24px_-8px_rgba(17,24,39,0.1)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-[#111827]">{deal.title}</h4>
          <p className="mt-0.5 truncate text-xs text-[#6b7280]">
            {deal.company}
            {deal.contact ? ` · ${deal.contact}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-[#111827]">{money(deal.value)}</span>
      </div>

      {(deal.vehicle || deal.source) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {deal.vehicle && (
            <span className="inline-flex items-center rounded-md bg-[#e6f7f5] px-2 py-0.5 text-[11px] font-medium text-[#0f766e] ring-1 ring-[#99f6e4]/60">
              {deal.vehicle}
            </span>
          )}
          {deal.source && (
            <span className="inline-flex items-center rounded-md bg-[#eaf9ef] px-2 py-0.5 text-[11px] font-medium text-[#16a34a] ring-1 ring-[#bbf7d0]/60">
              {deal.source}
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <Stars n={deal.stars} />
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#22c55e] text-[10px] font-semibold text-white">
            {deal.avatar}
          </span>
          <span className="select-none text-xs text-[#9ca3af]" title="Drag">
            ⠿
          </span>
        </div>
      </div>
    </div>
  )
}

function DraggableDeal({
  deal,
  onEdit,
  onConvert,
  onDelete,
}: {
  deal: Deal
  onEdit: (deal: Deal) => void
  onConvert: (deal: Deal) => void
  onDelete: (deal: Deal) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal, columnId: columnForDeal(deal) },
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative touch-none outline-none">
      <div className="cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
        <DealCardBody deal={deal} />
      </div>
      <div className="pointer-events-none absolute inset-x-2 -bottom-3 z-10 flex translate-y-1 items-center justify-center gap-1.5 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <button
          type="button"
          title="Edit deal"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(deal)
          }}
          className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-medium text-[#374151] shadow-sm hover:bg-gray-50"
        >
          Edit
        </button>
        {deal.stage !== 'booked' && (
          <button
            type="button"
            title="Convert to job"
            onClick={(e) => {
              e.stopPropagation()
              onConvert(deal)
            }}
            className="rounded-md border border-[#bbf7d0] bg-[#eaf9ef] px-2 py-1 text-[11px] font-medium text-[#16a34a] shadow-sm hover:bg-[#dcfce7]"
          >
            Book
          </button>
        )}
        <button
          type="button"
          title="Delete deal"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(deal)
          }}
          className="rounded-md border border-[#fecaca] bg-white px-2 py-1 text-[11px] font-medium text-[#dc2626] shadow-sm hover:bg-[#fef2f2]"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function DropColumn({
  id,
  label,
  accent,
  soft,
  text,
  total,
  count,
  onAdd,
  children,
}: {
  id: LeadStage
  label: string
  accent: string
  soft: string
  text: string
  total: string
  count: number
  onAdd: () => void
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex min-w-[280px] w-[300px] shrink-0 flex-col max-h-full">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: accent,
              boxShadow: `0 0 0 3px ${soft}`,
            }}
          />
          <h3 className="text-sm font-bold text-[#111827]">{label}</h3>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: soft, color: text }}
          >
            {count}
          </span>
          <span className="ml-auto text-xs font-medium text-[#6b7280]">{total}</span>
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Add deal to ${label}`}
            className="grid h-6 w-6 place-items-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#22c55e] hover:text-[#16a34a]"
          >
            <Plus size={13} />
          </button>
        </div>
        <div
          className="mt-2 h-0.5 rounded-full"
          style={{
            backgroundColor: accent,
            opacity: 0.35,
            boxShadow: `0 0 8px ${accent}40`,
          }}
        />
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border p-3 transition-colors duration-150 ${
          isOver
            ? 'border-[#bbf7d0] bg-[#eaf9ef] shadow-[inset_0_0_0_1px_#bbf7d0]'
            : 'border-transparent bg-[#f9fafb]'
        }`}
      >
        {children}
        <button
          type="button"
          onClick={onAdd}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#d1d5db] py-2.5 text-xs font-medium text-[#9ca3af] transition-colors hover:border-[#22c55e] hover:bg-[#eaf9ef]/40 hover:text-[#16a34a]"
        >
          <Plus size={13} /> Add Deal
        </button>
      </div>
    </div>
  )
}

export default function SalesPipeline() {
  const { leads, setLeads, setJobs, setClients, packages } = useData()
  const { alert, confirm, promptForm, toast } = useUi()
  const { setPage } = useDeskNav()
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const allDeals = useMemo(() => leads.map(leadToDeal), [leads])
  const deals = allDeals

  const activeDeal = activeId ? (allDeals.find((d) => d.id === activeId) ?? null) : null

  const columns = COLUMN_DEFS.map((col) => {
    const colDeals = deals.filter((d) => {
      if (columnForDeal(d) !== col.id) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.title.toLowerCase().includes(q) ||
        d.company.toLowerCase().includes(q) ||
        d.contact.toLowerCase().includes(q)
      )
    })
    const total = colDeals.reduce((s, d) => s + d.value, 0)
    return {
      ...col,
      deals: colDeals,
      total: money(total),
    }
  })

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)

  async function moveToColumn(dealId: string, stage: LeadStage) {
    const deal = allDeals.find((d) => d.id === dealId)
    if (!deal) return
    const previous = deal.lead
    if (previous.stage === stage) return

    setLeads((prev) => prev.map((l) => (l.id === dealId ? { ...l, stage } : l)))

    try {
      const updated = await api.updateLead(dealId, { stage })
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      void platform.runAutomationsForTrigger('deal_stage_changed', {
        lead_id: updated.id,
        stage: updated.stage,
        contact_id: updated.client_id || '',
        previous_stage: previous.stage,
      })
    } catch (err) {
      setLeads((prev) => prev.map((l) => (l.id === dealId ? previous : l)))
      alert(err instanceof Error ? err.message : 'Could not move lead', 'Move failed')
    }
  }

  async function editDeal(deal: Deal) {
    const values = await promptForm({
      title: 'Edit deal',
      submitLabel: 'Save',
      fields: [
        { name: 'name', label: 'Lead name', required: true, defaultValue: deal.lead.name },
        {
          name: 'amount',
          label: 'Quote amount',
          type: 'number',
          defaultValue: String(deal.lead.quote_amount || 0),
        },
        {
          name: 'interest',
          label: 'Service interest',
          defaultValue: deal.lead.service_interest || '',
        },
        {
          name: 'package_id',
          label: 'Package',
          type: 'select',
          defaultValue: deal.lead.package_id || packages[0]?.id || '',
          options: packages.map((p) => ({ value: p.id, label: `${p.name} · $${p.base_price}` })),
        },
      ],
    })
    if (!values?.name) return
    try {
      const updated = await api.updateLead(deal.id, {
        name: values.name,
        quote_amount: Number(values.amount) || 0,
        service_interest: values.interest || undefined,
        package_id: values.package_id || undefined,
      })
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      toast('Deal updated')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update deal', 'Update failed')
    }
  }

  async function convertDeal(deal: Deal) {
    const values = await promptForm({
      title: 'Book as job',
      submitLabel: 'Convert to job',
      fields: [
        {
          name: 'date',
          label: 'Job date',
          type: 'date',
          required: true,
          defaultValue: todayISO(),
        },
        { name: 'start_time', label: 'Start time (HH:MM)', placeholder: '09:00' },
      ],
    })
    if (!values?.date) return
    try {
      const result = await api.convertLeadToJob(deal.id, {
        date: values.date,
        start_time: values.start_time || undefined,
      })
      setLeads((prev) => prev.map((l) => (l.id === result.lead.id ? result.lead : l)))
      setJobs((prev) => [result.job, ...prev.filter((j) => j.id !== result.job.id)])
      setClients((prev) => {
        if (prev.some((c) => c.id === result.client.id)) return prev
        return [...prev, result.client].sort((a, b) => a.name.localeCompare(b.name))
      })
      toast('Lead booked as job')
      setPage('calendar')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not convert lead', 'Convert failed')
    }
  }

  async function addDeal(stage: LeadStage) {
    const values = await promptForm({
      title: 'New deal',
      submitLabel: 'Add deal',
      fields: [
        { name: 'name', label: 'Lead name', required: true, placeholder: 'Acme Detailing' },
        {
          name: 'amount',
          label: 'Quote amount',
          type: 'number',
          placeholder: '0',
          defaultValue: '0',
        },
        { name: 'interest', label: 'Service interest', placeholder: 'Full detail' },
      ],
    })
    if (!values?.name) return

    try {
      const created = await api.createLead({
        name: values.name,
        stage,
        quote_amount: Number(values.amount) || 0,
        service_interest: values.interest || undefined,
      })
      setLeads((prev) => [created, ...prev])
      toast('Deal created')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create lead', 'Create failed')
    }
  }

  async function deleteDeal(deal: Deal) {
    const label = deal.title || deal.company || 'this deal'
    const ok = await confirm({
      title: 'Delete deal',
      message: `Delete “${label}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteLead(deal.id)
      setLeads((prev) => prev.filter((l) => l.id !== deal.id))
      toast('Deal deleted')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete deal', 'Delete failed')
    }
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const dealId = String(active.id)
    let targetStage = String(over.id) as LeadStage

    if (!COLUMN_DEFS.some((c) => c.id === targetStage)) {
      const overDeal = allDeals.find((d) => d.id === targetStage)
      if (!overDeal) return
      targetStage = columnForDeal(overDeal)
    }

    const fromDeal = allDeals.find((d) => d.id === dealId)
    if (!fromDeal) return
    if (columnForDeal(fromDeal) === targetStage) return
    void moveToColumn(dealId, targetStage)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Deals" subtitle="Inquiry · Quoted · Scheduled" />

      <div className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#e5e7eb] bg-white/90 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-[#111827]">Pipeline</span>
          <span className="text-[#d1d5db]">/</span>
          <span className="text-[#6b7280]">Opportunities</span>
        </div>

        <div className="relative w-full max-w-md min-w-[18rem]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] py-1.5 pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22c55e]/15"
          />
        </div>

        <div className="flex items-center justify-end gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1.5 text-sm justify-self-end">
          <span className="text-[#6b7280]">Total:</span>
          <span className="font-semibold text-[#111827]">{money(totalValue)}</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-x-auto p-5">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#22c55e]/[0.04] blur-3xl" />
          <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-[#14b8a6]/[0.04] blur-3xl" />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="relative flex h-full gap-4">
            {columns.map((col) => (
              <DropColumn
                key={col.id}
                id={col.id}
                label={col.label}
                accent={col.accent}
                soft={col.soft}
                text={col.text}
                total={col.total}
                count={col.deals.length}
                onAdd={() => void addDeal(col.id)}
              >
                {col.deals.length === 0 ? (
                  <EmptyState
                    scene="deals"
                    compact
                    title="Drop deals here"
                    description={`New ${col.label.toLowerCase()} leads land here. Drag a card in or add one.`}
                  />
                ) : (
                  col.deals.map((deal) => (
                    <DraggableDeal
                      key={deal.id}
                      deal={deal}
                      onEdit={(d) => void editDeal(d)}
                      onConvert={(d) => void convertDeal(d)}
                      onDelete={(d) => void deleteDeal(d)}
                    />
                  ))
                )}
              </DropColumn>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
            {activeDeal ? (
              <div className="w-[300px] cursor-grabbing">
                <DealCardBody deal={activeDeal} dragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
