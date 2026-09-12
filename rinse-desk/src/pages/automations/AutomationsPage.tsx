import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Header } from '../../App'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import {
  ensureWorkflow,
  legacyToWorkflow,
  primaryActionFromWorkflow,
  triggerFromWorkflow,
} from '@/lib/automation-workflow'
import type { DeskAutomation } from '@/lib/types'
import { colors } from '@/theme/colors'
import AutomationEditor from './AutomationEditor'
import { AUTOMATION_TEMPLATES } from '@/components/automations/templates'
import { appById } from '@/components/automations/appCatalog'
import AppBrandIcon from '@/components/automations/AppBrandIcon'
import {
  compactWorkflowChips,
  FlowNodeRow,
  IconActivity,
  IconAlert,
  IconBolt,
  IconDotsVertical,
  IconPlus,
  IconRepeat,
  IconSearch,
  IconTarget,
  workflowStepChips,
} from '@/components/automations/AutomationIcons'
import {
  CATEGORY_PAUSED,
  CATEGORY_STYLES,
  categoryForAutomation,
  categoryFromAccent,
  categoryFromWorkflow,
  categoryIcon,
} from '@/components/automations/categoryStyles'
import {
  displayWorkflowName,
  formatRunSubtitle,
  getWorkflowRunMeta,
} from '@/components/automations/workflowListMeta'

type View = 'list' | 'editor'
type FilterTab = 'all' | 'form' | 'deal' | 'chat'

const SECTION_TITLE: CSSProperties = {
  fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
}

const WORKFLOW_PAGE_SIZE = 8

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'form', label: 'Forms' },
  { id: 'deal', label: 'Deals' },
  { id: 'chat', label: 'Chat' },
]

export default function AutomationsPage() {
  const { alert, toast } = useUi()
  const [rows, setRows] = useState<DeskAutomation[]>([])
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await platform.listAutomations()
      setRows(list)
      return list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not load automations', 'Automations')
      return [] as DeskAutomation[]
    }
  }, [alert])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!menuOpenId) return
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpenId])

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
    setMenuOpenId(null)
  }

  async function createBlank() {
    setBusy(true)
    try {
      const workflow = legacyToWorkflow('form_submitted', 'create_activity', {
        subject: 'Automation note',
        body: 'Triggered by form submit',
      })
      const created = await platform.createAutomation({
        name: 'New automation',
        trigger: 'form_submitted',
        action: 'create_activity',
        workflow,
        enabled: true,
      })
      toast('Automation created')
      await refresh()
      openEditor(created.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed', 'Automations')
    } finally {
      setBusy(false)
    }
  }

  async function createFromTemplate(templateId: string) {
    const t = AUTOMATION_TEMPLATES.find((x) => x.id === templateId)
    if (!t) return
    setBusy(true)
    try {
      const workflow = t.workflow()
      const trigger = triggerFromWorkflow(workflow) ?? 'form_submitted'
      const action = primaryActionFromWorkflow(workflow)
      const created = await platform.createAutomation({
        name: t.name,
        trigger,
        action,
        workflow,
        enabled: true,
      })
      toast('Template applied')
      await refresh()
      openEditor(created.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed', 'Automations')
    } finally {
      setBusy(false)
    }
  }

  async function duplicateWorkflow(automation: DeskAutomation) {
    setBusy(true)
    setMenuOpenId(null)
    try {
      const workflow = ensureWorkflow(automation)
      const created = await platform.createAutomation({
        name: `${displayWorkflowName(automation)} (copy)`,
        trigger: automation.trigger,
        action: automation.action,
        workflow,
        config: { ...automation.config },
        enabled: false,
      })
      toast('Workflow duplicated')
      await refresh()
      openEditor(created.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Duplicate failed', 'Automations')
    } finally {
      setBusy(false)
    }
  }

  async function deleteWorkflow(automation: DeskAutomation) {
    setMenuOpenId(null)
    if (!window.confirm(`Delete “${displayWorkflowName(automation)}”? This cannot be undone.`)) {
      return
    }
    try {
      await platform.deleteAutomation(automation.id)
      toast('Automation deleted')
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Automations')
    }
  }

  async function toggleEnabled(automation: DeskAutomation) {
    try {
      await platform.updateAutomation(automation.id, { enabled: !automation.enabled })
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed', 'Automations')
    }
  }

  const activeCount = rows.filter((r) => r.enabled).length

  const templateUsage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of AUTOMATION_TEMPLATES) {
      counts.set(
        t.id,
        rows.filter((r) => r.name === t.name || r.name.startsWith(`${t.name} (`)).length,
      )
    }
    let popularId: string | null = null
    let max = 0
    for (const [id, n] of counts) {
      if (n > max) {
        max = n
        popularId = id
      }
    }
    return { counts, popularId: max > 0 ? popularId : null }
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const cat = categoryForAutomation(r)
      if (filter === 'deal') {
        // Branching workflows share deal colors / pipeline triggers
        if (cat !== 'deal' && cat !== 'branch') return false
      } else if (filter !== 'all' && cat !== filter) {
        return false
      }
      if (!q) return true
      return displayWorkflowName(r).toLowerCase().includes(q)
    })
  }, [rows, filter, search])

  const filterCounts = useMemo(() => {
    const base = { all: rows.length, form: 0, deal: 0, chat: 0, branch: 0 }
    for (const r of rows) {
      const cat = categoryForAutomation(r)
      base[cat] += 1
    }
    // Deals tab includes deal + branch for scannability (branch uses deal colors)
    base.deal += base.branch
    return base
  }, [rows])

  const visibleRows = expanded ? filteredRows : filteredRows.slice(0, WORKFLOW_PAGE_SIZE)
  const hiddenCount = filteredRows.length - visibleRows.length

  if (view === 'editor' && selected) {
    return (
      <AutomationEditor
        automation={selected}
        onBack={goList}
        onSaved={async () => {
          await refresh()
        }}
        onDeleted={goList}
      />
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Automations"
        subtitle="Routing desk — trigger → actions → stamps"
        actions={
          <button
            type="button"
            disabled={busy}
            onClick={() => void createBlank()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-full px-4 py-2 disabled:opacity-50"
            style={{ background: colors.green }}
          >
            <IconPlus size={14} />
            New workflow
          </button>
        }
      />

      <div className="flex-1 overflow-auto" style={{ background: colors.bg }}>
        <div className="p-5 space-y-7 max-w-5xl mx-auto">
          {/* Stats overview */}
          <section className="automations-stats-strip grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Active workflows"
              value={String(activeCount)}
              iconBg="#EAF9EF"
              iconFg="#16A34A"
              Icon={IconBolt}
            />
            <StatCard
              label="Total workflows"
              value={String(rows.length)}
              iconBg="#DBEAFE"
              iconFg="#1E40AF"
              Icon={IconRepeat}
            />
            <StatCard
              label="Paused"
              value={String(rows.length - activeCount)}
              iconBg="#EDE9FE"
              iconFg="#5B21B6"
              Icon={IconTarget}
            />
            <StatCard
              label="Run history"
              value="—"
              iconBg="#CCFBF1"
              iconFg="#0F766E"
              Icon={IconActivity}
            />
          </section>

          {/* Journey templates */}
          <section>
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <p className="text-[15px] font-medium tracking-tight text-gray-900" style={SECTION_TITLE}>
                Journeys
              </p>
              <p className="text-xs text-gray-500">One click → editable canvas</p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AUTOMATION_TEMPLATES.map((t, index) => {
                const wf = t.workflow()
                const cat = categoryFromWorkflow(
                  triggerFromWorkflow(wf) ?? 'form_submitted',
                  wf,
                )
                // Featured deal templates with conditions already resolve to branch
                const accentCat =
                  cat === 'branch' ? 'branch' : categoryFromAccent(t.accent)
                const style = CATEGORY_STYLES[accentCat]
                const Icon = categoryIcon(accentCat)
                const chips = workflowStepChips(wf)
                const featured = t.featuredAppId ? appById(t.featuredAppId) : undefined
                const used = templateUsage.counts.get(t.id) ?? 0
                const popular = templateUsage.popularId === t.id
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void createFromTemplate(t.id)}
                      className="automations-journey-card group w-full text-left bg-white border rounded-xl p-4 hover:border-green-400 disabled:opacity-60 transition-[border-color] duration-150 h-full flex flex-col"
                      style={{
                        borderColor: popular ? colors.green : colors.border,
                        borderWidth: popular ? 2 : 1,
                        animationDelay: `${80 + index * 40}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="inline-flex items-center justify-center size-8 rounded-lg shrink-0"
                          style={{ background: style.bg, color: style.fg }}
                        >
                          <Icon size={16} />
                        </span>
                        {popular ? (
                          <span
                            className="inline-flex items-center rounded-full text-[11px] font-medium px-2 py-0.5"
                            style={{ background: colors.greenSoft, color: colors.greenText }}
                          >
                            Popular
                          </span>
                        ) : featured ? (
                          <span
                            className="inline-flex items-center justify-center size-[22px] rounded-md shrink-0"
                            style={{ background: `#${featured.color.replace(/^#/, '')}` }}
                            title={featured.label}
                          >
                            <AppBrandIcon
                              slug={featured.slug}
                              label={featured.label}
                              color="ffffff"
                              size={11}
                            />
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {used === 0
                              ? 'Not used yet'
                              : used === 1
                                ? 'Used in 1 workflow'
                                : `Used in ${used} workflows`}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[14px] font-medium text-gray-900 mt-2.5 leading-snug group-hover:text-green-800"
                        style={SECTION_TITLE}
                      >
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 mb-2.5 leading-snug line-clamp-2 flex-1">
                        {t.description}
                      </p>
                      <FlowNodeRow chips={chips.slice(0, 3)} compact />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Your workflows */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <p className="text-[15px] font-medium tracking-tight text-gray-900" style={SECTION_TITLE}>
                Your workflows
              </p>
              <label
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-gray-400 w-[180px]"
                style={{ background: colors.bg }}
              >
                <IconSearch size={13} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setExpanded(false)
                  }}
                  placeholder="Search workflows"
                  className="bg-transparent outline-none flex-1 min-w-0 text-gray-700 placeholder:text-gray-400"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.id === 'all'
                    ? filterCounts.all
                    : tab.id === 'deal'
                      ? filterCounts.deal
                      : filterCounts[tab.id as 'form' | 'chat']
                const sel = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setFilter(tab.id)
                      setExpanded(false)
                    }}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      background: sel ? colors.sidebarFrom : 'transparent',
                      color: sel ? '#fff' : colors.textMuted,
                      fontWeight: sel ? 500 : 400,
                    }}
                  >
                    {tab.label} {count}
                  </button>
                )
              })}
            </div>

            {rows.length === 0 ? (
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-1 py-2"
                style={{ borderTop: `1px solid ${colors.border}` }}
              >
                <p className="text-xs text-gray-500">
                  Pick a journey above, or start blank on the canvas.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createBlank()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
                  style={{ background: colors.green }}
                >
                  <IconPlus size={14} />
                  New workflow
                </button>
              </div>
            ) : filteredRows.length === 0 ? (
              <div
                className="bg-white border rounded-xl px-4 py-8 text-center text-xs text-gray-500"
                style={{ borderColor: colors.border }}
              >
                No workflows match this filter.
              </div>
            ) : (
              <>
                <ul
                  className="bg-white border rounded-xl overflow-hidden"
                  style={{ borderColor: colors.border }}
                >
                  {visibleRows.map((r, i) => {
                    const wf = ensureWorkflow(r)
                    const chips = compactWorkflowChips(workflowStepChips(wf))
                    const cat = categoryForAutomation(r)
                    const style = r.enabled ? CATEGORY_STYLES[cat] : CATEGORY_PAUSED
                    const Icon = categoryIcon(cat)
                    const meta = getWorkflowRunMeta(r)
                    const name = displayWorkflowName(r)
                    const failed = meta.lastFailed
                    const isLast = i === visibleRows.length - 1
                    return (
                      <li
                        key={r.id}
                        className="flex items-center gap-3.5 px-4 py-3.5 relative"
                        style={{
                          background: failed ? '#FEF7F7' : undefined,
                          borderBottom: isLast ? undefined : `1px solid ${colors.borderSubtle}`,
                        }}
                      >
                        <button
                          type="button"
                          className="flex flex-1 min-w-0 items-center gap-3.5 text-left"
                          onClick={() => openEditor(r.id)}
                        >
                          <span
                            className="inline-flex items-center justify-center size-[34px] rounded-lg shrink-0"
                            style={{ background: style.bg, color: style.fg }}
                          >
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-[13px] font-medium truncate"
                              style={{
                                ...SECTION_TITLE,
                                color: r.enabled ? colors.text : colors.textMuted,
                              }}
                            >
                              {name}
                            </p>
                            <p
                              className="text-[11px] mt-0.5 truncate"
                              style={{
                                color: failed ? '#991B1B' : '#9CA3AF',
                              }}
                            >
                              {failed ? (
                                <span className="inline-flex items-center gap-1">
                                  <IconAlert size={12} />
                                  {formatRunSubtitle(meta, r.enabled)}
                                </span>
                              ) : (
                                formatRunSubtitle(meta, r.enabled)
                              )}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {failed ? (
                            <span
                              className="inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-0.5"
                              style={{ background: '#FEE2E2', color: '#991B1B' }}
                            >
                              Error
                            </span>
                          ) : (
                            <FlowNodeRow
                              chips={chips}
                              compact
                              className={!r.enabled ? 'opacity-60' : undefined}
                            />
                          )}
                        </div>

                        <button
                          type="button"
                          title={r.enabled ? 'Turn off' : 'Turn on'}
                          aria-pressed={r.enabled}
                          aria-label={r.enabled ? 'Disable workflow' : 'Enable workflow'}
                          className="relative h-[18px] w-[34px] rounded-full transition-colors shrink-0"
                          style={{
                            background: r.enabled ? colors.green : '#D3D1C7',
                          }}
                          onClick={() => void toggleEnabled(r)}
                        >
                          <span
                            className="absolute top-[2px] size-[14px] rounded-full bg-white transition-[left] duration-150"
                            style={{ left: r.enabled ? 18 : 2 }}
                          />
                        </button>

                        <div className="relative shrink-0" ref={menuOpenId === r.id ? menuRef : undefined}>
                          <button
                            type="button"
                            aria-label="Workflow actions"
                            aria-expanded={menuOpenId === r.id}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuOpenId((id) => (id === r.id ? null : r.id))
                            }}
                          >
                            <IconDotsVertical size={16} />
                          </button>
                          {menuOpenId === r.id ? (
                            <div
                              className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-white border rounded-lg py-1 shadow-md"
                              style={{ borderColor: colors.border }}
                              role="menu"
                            >
                              <MenuItem
                                label="Edit"
                                onClick={() => openEditor(r.id)}
                              />
                              <MenuItem
                                label="Duplicate"
                                onClick={() => void duplicateWorkflow(r)}
                              />
                              <MenuItem
                                label="Delete"
                                danger
                                onClick={() => void deleteWorkflow(r)}
                              />
                            </div>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {filteredRows.length > WORKFLOW_PAGE_SIZE ? (
                  <div className="text-center pt-3.5 pb-1">
                    <button
                      type="button"
                      className="text-[13px] font-medium"
                      style={{ color: colors.greenText }}
                      onClick={() => setExpanded((v) => !v)}
                    >
                      {expanded
                        ? 'Show fewer'
                        : `View all ${filteredRows.length} workflows →`}
                    </button>
                    {!expanded && hiddenCount > 0 ? (
                      <span className="sr-only">{hiddenCount} more hidden</span>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  iconBg,
  iconFg,
  Icon,
}: {
  label: string
  value: string
  iconBg: string
  iconFg: string
  Icon: (props: { size?: number }) => ReactNode
}) {
  return (
    <div
      className="bg-white flex items-center gap-3"
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-lg shrink-0"
        style={{ width: 34, height: 34, background: iconBg, color: iconFg }}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-gray-500">{label}</div>
        <div className="text-[19px] font-medium text-gray-900 leading-tight" style={SECTION_TITLE}>
          {value}
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`w-full text-left text-xs px-3 py-2 hover:bg-gray-50 ${
        danger ? 'text-red-600' : 'text-gray-700'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
