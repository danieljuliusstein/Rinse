import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AutomationAction, AutomationTrigger } from '@/lib/types'
import { ACTION_LABELS, TRIGGER_LABELS } from '@/lib/automation-workflow'
import { colors } from '@/theme/colors'
import { AUTOMATION_TEMPLATES } from './templates'
import {
  ACCENT_ICON,
  IconCondition,
  IconWorkflow,
  StepBadge,
  actionIcon,
  triggerIcon,
  type StepTone,
} from './AutomationIcons'
import {
  APP_CATALOG,
  readinessLabel,
  type AppCatalogItem,
  type AppFormation,
} from './appCatalog'
import AppBrandIcon from './AppBrandIcon'
import { PanelEdgeToggle } from './PanelEdgeToggle'
import {
  readPaletteSections,
  writePaletteSections,
  type PaletteSectionId,
} from './palettePrefs'

const ACCENT_TONE: Record<string, StepTone> = {
  form: 'trigger',
  deal: 'condition',
  chat: 'action',
}

/** All catalog apps under one Apps section (spine + later spokes). */
const APP_FORMATIONS: AppFormation[] = ['ai', 'notify', 'money', 'sync', 'escape', 'later']

type Props = {
  open: boolean
  onToggle: () => void
  hasTrigger: boolean
  onAddTrigger: (kind: AutomationTrigger) => void
  onAddAction: (kind: AutomationAction) => void
  onAddCondition: () => void
  onAddApp: (app: AppCatalogItem) => void
  onApplyTemplate: (templateId: string) => void
}

function Section({
  id,
  title,
  titleColor,
  open,
  onToggle,
  hint,
  children,
}: {
  id: PaletteSectionId
  title: string
  titleColor?: string
  open: boolean
  onToggle: () => void
  hint?: string
  children: ReactNode
}) {
  return (
    <section>
      <button
        type="button"
        id={`palette-sec-${id}`}
        aria-expanded={open}
        aria-controls={`palette-panel-${id}`}
        onClick={onToggle}
        className="mb-1.5 flex w-full items-center gap-1.5 rounded-md px-0.5 py-0.5 text-left hover:bg-gray-50"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span
          className="flex-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: titleColor || '#6B7280' }}
        >
          {title}
        </span>
        {hint ? <span className="text-[9px] text-gray-400">{hint}</span> : null}
      </button>
      {open ? (
        <div id={`palette-panel-${id}`} role="region" aria-labelledby={`palette-sec-${id}`}>
          {children}
        </div>
      ) : null}
    </section>
  )
}

export default function AutomationPalette({
  open,
  onToggle,
  hasTrigger,
  onAddTrigger,
  onAddAction,
  onAddCondition,
  onAddApp,
  onApplyTemplate,
}: Props) {
  const [sections, setSections] = useState(readPaletteSections)

  useEffect(() => {
    writePaletteSections(sections)
  }, [sections])

  function toggleSection(id: PaletteSectionId) {
    setSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const apps = useMemo(
    () => APP_CATALOG.filter((a) => APP_FORMATIONS.includes(a.formation)),
    [],
  )

  function AppRow({ app }: { app: AppCatalogItem }) {
    return (
      <button
        type="button"
        onClick={() => onAddApp(app)}
        title={`Add ${app.label} to canvas · ${app.spineHint}`}
        className="w-full flex items-center gap-2 text-left text-xs rounded-lg border border-gray-100 px-2 py-1.5 hover:bg-gray-50 hover:border-green-200"
      >
        <span
          className="inline-flex size-[26px] items-center justify-center rounded-xl shrink-0"
          style={{ background: colors.greenSoft }}
        >
          <AppBrandIcon slug={app.slug} label={app.label} color={app.color} size={12} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-gray-800 truncate">{app.label}</span>
        </span>
        <span className="text-[9px] text-gray-400 shrink-0">
          {readinessLabel(app.readiness).split(' ')[0]}
        </span>
      </button>
    )
  }

  return (
    <div
      className={`relative shrink-0 h-full border-r border-gray-100 bg-white transition-[width] duration-200 ease-out ${
        open ? 'w-60' : 'w-12'
      }`}
    >
      <PanelEdgeToggle side="left" expanded={open} onToggle={onToggle} label="palette" />

      {open ? (
        <aside className="h-full overflow-auto flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-100 pr-5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Palette</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Click to add nodes</p>
          </div>

          <div className="p-3 space-y-3 flex-1">
            <Section
              id="triggers"
              title="Triggers"
              titleColor="#16A34A"
              open={sections.triggers}
              onToggle={() => toggleSection('triggers')}
            >
              <div className="space-y-1">
                {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map((kind) => {
                  const Icon = triggerIcon(kind)
                  return (
                    <button
                      key={kind}
                      type="button"
                      disabled={hasTrigger}
                      title={hasTrigger ? 'Only one trigger allowed' : undefined}
                      onClick={() => onAddTrigger(kind)}
                      className="w-full flex items-center gap-2 text-left text-xs rounded-lg border border-green-100 px-2 py-1.5 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <StepBadge tone="trigger" Icon={Icon} size={26} />
                      <span className="leading-snug">{TRIGGER_LABELS[kind]}</span>
                    </button>
                  )
                })}
              </div>
            </Section>

            <Section
              id="actions"
              title="Actions"
              titleColor="#0F766E"
              open={sections.actions}
              onToggle={() => toggleSection('actions')}
            >
              <div className="space-y-1">
                {(Object.keys(ACTION_LABELS) as AutomationAction[]).map((kind) => {
                  const Icon = actionIcon(kind)
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => onAddAction(kind)}
                      className="w-full flex items-center gap-2 text-left text-xs rounded-lg border border-gray-100 px-2 py-1.5 hover:bg-gray-50"
                    >
                      <StepBadge tone="action" Icon={Icon} size={26} />
                      <span className="leading-snug">{ACTION_LABELS[kind]}</span>
                    </button>
                  )
                })}
              </div>
            </Section>

            <Section
              id="logic"
              title="Logic"
              titleColor={colors.amber}
              open={sections.logic}
              onToggle={() => toggleSection('logic')}
            >
              <button
                type="button"
                onClick={onAddCondition}
                className="w-full flex items-center gap-2 text-left text-xs rounded-lg border border-amber-100 px-2 py-1.5 hover:bg-amber-50"
              >
                <StepBadge tone="condition" Icon={IconCondition} size={26} />
                <span>Condition (if / else)</span>
              </button>
            </Section>

            <Section
              id="apps"
              title="Apps"
              open={sections.apps}
              onToggle={() => toggleSection('apps')}
              hint="Click to add"
            >
              <div className="space-y-1">
                {apps.map((app) => (
                  <AppRow key={app.id} app={app} />
                ))}
              </div>
            </Section>

            <Section
              id="templates"
              title="Templates"
              open={sections.templates}
              onToggle={() => toggleSection('templates')}
            >
              <div className="space-y-1.5">
                {AUTOMATION_TEMPLATES.map((t) => {
                  const Icon = ACCENT_ICON[t.accent]
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onApplyTemplate(t.id)}
                      className="w-full flex items-start gap-2 text-left rounded-lg border border-gray-100 px-2 py-1.5 hover:bg-gray-50"
                    >
                      <StepBadge tone={ACCENT_TONE[t.accent] || 'trigger'} Icon={Icon} size={26} />
                      <span>
                        <span className="block text-xs font-semibold text-gray-800">{t.name}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5 leading-snug">
                          {t.description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Section>
          </div>
        </aside>
      ) : (
        <div className="h-full flex flex-col items-center pt-3 gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex size-8 items-center justify-center rounded-lg text-green-700 hover:bg-green-50"
            title="Show palette"
          >
            <IconWorkflow size={18} />
          </button>
          <div className="w-6 h-px bg-gray-100" />
          <p
            className="text-[10px] font-semibold text-gray-400 tracking-widest"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Palette
          </p>
        </div>
      )}
    </div>
  )
}
