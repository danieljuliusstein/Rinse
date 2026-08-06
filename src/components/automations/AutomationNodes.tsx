import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  Handle,
  Position,
  useNodeId,
  useStore,
  type NodeProps,
} from '@xyflow/react'
import {
  ACTION_LABELS,
  TRIGGER_LABELS,
  isAutomationAction,
  isAutomationTrigger,
} from '@/lib/automation-workflow'
import type { AutomationAction, AutomationNodeData } from '@/lib/types'
import { appById } from './appCatalog'
import AppBrandIcon from './AppBrandIcon'
import {
  IconCondition,
  IconDotsVertical,
  IconPlus,
  StepBadge,
  TONE_STYLES,
  actionIcon,
  triggerIcon,
  type StepTone,
} from './AutomationIcons'
import { useCanvasNodeActions } from './canvasNodeActions'

function nodeTitle(data: AutomationNodeData, fallback: string): string {
  if (data.label) return data.label
  if (data.kind && isAutomationTrigger(data.kind)) return TRIGGER_LABELS[data.kind]
  if (data.kind && isAutomationAction(data.kind)) return ACTION_LABELS[data.kind]
  return fallback
}

const HANDLE_BASE =
  '!w-[11px] !h-[11px] !min-w-[11px] !min-h-[11px] !bg-white !rounded-full !border-[2.5px] !border-solid'

function Port({
  type,
  position,
  id,
  color,
  style,
}: {
  type: 'source' | 'target'
  position: Position
  id?: string
  color: string
  style?: CSSProperties
}) {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={{ borderColor: color, ...style }}
      className={HANDLE_BASE}
    />
  )
}

function NodeMenu({ nodeId }: { nodeId: string }) {
  const actions = useCanvasNodeActions()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0 nodrag nopan">
      <button
        type="button"
        aria-label="Node actions"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex size-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      >
        <IconDotsVertical size={14} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-gray-100 bg-white py-1 shadow-md"
        >
          {(
            [
              ['Edit', () => actions.onEdit(nodeId)],
              ['Duplicate', () => actions.onDuplicate(nodeId)],
              ['Delete', () => actions.onDelete(nodeId)],
            ] as const
          ).map(([label, fn]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                label === 'Delete' ? 'text-red-600' : 'text-gray-700'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                fn()
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function AddAfterGhost({ nodeId }: { nodeId: string }) {
  const actions = useCanvasNodeActions()
  const hasOutgoing = useStore(
    useCallback((s) => s.edges.some((e) => e.source === nodeId), [nodeId]),
  )
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (hasOutgoing) return null

  return (
    <div
      ref={rootRef}
      className="absolute left-full top-1/2 z-10 flex -translate-y-1/2 items-center nodrag nopan"
      style={{ marginLeft: 2 }}
    >
      <div
        aria-hidden
        className="h-0 w-6 border-t-2 border-dashed"
        style={{ borderColor: '#C7CDC5' }}
      />
      <div className="relative">
        <button
          type="button"
          aria-label="Add next node"
          title="Add next node"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className="flex size-[34px] items-center justify-center rounded-full border-[1.5px] border-dashed bg-white text-gray-400 hover:border-gray-400 hover:text-gray-600"
          style={{ borderColor: '#C7CDC5' }}
        >
          <IconPlus size={15} />
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-30 mt-2 w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
            <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
              Actions
            </p>
            <div className="space-y-0.5">
              {(Object.keys(ACTION_LABELS) as AutomationAction[]).map((kind) => {
                const Icon = actionIcon(kind)
                return (
                  <button
                    key={kind}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpen(false)
                      actions.onAddAfter(nodeId, 'action', {
                        kind,
                        label: ACTION_LABELS[kind],
                      })
                    }}
                  >
                    <StepBadge tone="action" Icon={Icon} size={22} />
                    <span className="leading-snug">{ACTION_LABELS[kind]}</span>
                  </button>
                )
              })}
            </div>
            <p
              className="mt-2 px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: TONE_STYLES.condition.fg }}
            >
              Logic
            </p>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                actions.onAddAfter(nodeId, 'condition', {
                  label: 'If field equals…',
                  field: 'stage',
                  op: 'equals',
                  value: '',
                })
              }}
            >
              <StepBadge tone="condition" Icon={IconCondition} size={22} />
              <span>Condition (if / else)</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function NodeCardShell({
  tone,
  typeLabel,
  title,
  selected,
  icon,
  children,
  showGhost,
}: {
  tone: StepTone
  typeLabel: string
  title: string
  selected: boolean
  icon: ReactNode
  children?: ReactNode
  showGhost?: boolean
}) {
  const nodeId = useNodeId()
  const s = TONE_STYLES[tone]
  return (
    <div
      className="relative min-w-[210px] rounded-[14px] bg-white px-3.5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
      style={{
        border: `2px solid ${selected ? s.fg : s.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <span
            className="text-[10px] font-medium uppercase tracking-[0.05em]"
            style={{ color: s.fg }}
          >
            {typeLabel}
          </span>
        </div>
        {nodeId ? <NodeMenu nodeId={nodeId} /> : null}
      </div>
      <p className="mt-2 text-[13px] font-medium leading-snug text-gray-900">{title}</p>
      {children}
      {showGhost && nodeId ? <AddAfterGhost nodeId={nodeId} /> : null}
    </div>
  )
}

function KindIcon({
  tone,
  Icon,
  brand,
}: {
  tone: StepTone
  Icon: (props: { size?: number }) => ReactNode
  brand?: { slug: string; label: string; color: string }
}) {
  const s = TONE_STYLES[tone]
  return (
    <span
      className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-lg"
      style={{ background: s.bg, color: s.fg }}
    >
      {brand ? (
        <AppBrandIcon slug={brand.slug} label={brand.label} color={brand.color} size={15} />
      ) : (
        <Icon size={15} />
      )}
    </span>
  )
}

export function TriggerFlowNode({ data, selected }: NodeProps) {
  const d = data as AutomationNodeData
  const kind = d.kind || ''
  const Icon = triggerIcon(kind)
  return (
    <NodeCardShell
      tone="trigger"
      typeLabel="Trigger"
      title={nodeTitle(d, 'Trigger')}
      selected={!!selected}
      showGhost
      icon={<KindIcon tone="trigger" Icon={Icon} />}
    >
      <Port type="source" position={Position.Right} color="#9CA3AF" />
    </NodeCardShell>
  )
}

export function ActionFlowNode({ data, selected }: NodeProps) {
  const d = data as AutomationNodeData
  const stamp = appById(d.appId)
  const kind = d.kind || ''
  const Icon = actionIcon(kind)
  const tagChip = d.kind === 'update_contact_tag' && d.tag ? `tag: ${d.tag}` : null

  return (
    <NodeCardShell
      tone="action"
      typeLabel={stamp ? 'Destination' : 'Action'}
      title={nodeTitle(d, 'Action')}
      selected={!!selected}
      showGhost
      icon={
        <KindIcon
          tone="action"
          Icon={Icon}
          brand={stamp ? { slug: stamp.slug, label: stamp.label, color: stamp.color } : undefined}
        />
      }
    >
      <Port type="target" position={Position.Left} color="#9CA3AF" />
      {tagChip ? (
        <span
          className="mt-2 inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{ background: '#EAF9EF', color: '#16A34A' }}
          title={tagChip}
        >
          {tagChip}
        </span>
      ) : null}
      {stamp && !tagChip ? (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-gray-400">{stamp.spineHint}</p>
      ) : null}
      <Port type="source" position={Position.Right} color="#9CA3AF" />
    </NodeCardShell>
  )
}

export function ConditionFlowNode({ data, selected }: NodeProps) {
  const d = data as AutomationNodeData
  return (
    <NodeCardShell
      tone="condition"
      typeLabel="Condition"
      title={d.label || `${d.field || 'field'} ${d.op || 'equals'}`}
      selected={!!selected}
      showGhost
      icon={<KindIcon tone="condition" Icon={IconCondition} />}
    >
      <Port type="target" position={Position.Left} color="#9CA3AF" />
      <div className="mt-2.5 flex gap-1.5">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{ background: '#FEE2E2', color: '#991B1B' }}
        >
          false
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{ background: '#EAF9EF', color: '#16A34A' }}
        >
          true
        </span>
      </div>
      <Port
        type="source"
        position={Position.Right}
        id="true"
        color="#22C55E"
        style={{ top: '38%' }}
      />
      <Port
        type="source"
        position={Position.Right}
        id="false"
        color="#F87171"
        style={{ top: '72%' }}
      />
    </NodeCardShell>
  )
}

export const automationNodeTypes = {
  trigger: TriggerFlowNode,
  action: ActionFlowNode,
  condition: ConditionFlowNode,
}
