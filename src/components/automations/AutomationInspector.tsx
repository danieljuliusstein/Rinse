import type { AutomationAction, AutomationNode, AutomationTrigger } from '@/lib/types'
import { ACTION_LABELS, TRIGGER_LABELS, isAutomationAction, isAutomationTrigger } from '@/lib/automation-workflow'
import {
  FORMATION_LABELS,
  FORMATION_ORDER,
  appById,
  readinessLabel,
  stampableApps,
} from './appCatalog'
import { PanelEdgeToggle } from './PanelEdgeToggle'

type Props = {
  node: AutomationNode
  onChange: (next: AutomationNode) => void
  onDelete: () => void
  onClose: () => void
}

export default function AutomationInspector({ node, onChange, onDelete, onClose }: Props) {
  function patchData(partial: Record<string, string | undefined>) {
    onChange({ ...node, data: { ...node.data, ...partial } })
  }

  const stamped = appById(node.data.appId)
  const byFormation = FORMATION_ORDER.map((f) => ({
    formation: f,
    apps: stampableApps().filter((a) => a.formation === f),
  })).filter((g) => g.apps.length > 0)

  return (
    <div className="relative shrink-0 h-full w-72 border-l border-gray-100 bg-white">
      <PanelEdgeToggle side="right" expanded onToggle={onClose} label="inspector" />

      <aside className="h-full overflow-auto flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2 pl-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Inspector</p>
            <p className="text-[10px] text-gray-400 capitalize truncate">{node.type}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="text-[11px] text-red-500 hover:text-red-700 px-1.5 py-1"
              onClick={onDelete}
            >
              Delete
            </button>
            <button
              type="button"
              className="size-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              onClick={onClose}
              title="Close inspector"
              aria-label="Close inspector"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3 text-xs">
          <label className="block text-gray-500">
            Label
            <input
              value={node.data.label || ''}
              onChange={(e) => patchData({ label: e.target.value })}
              className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
            />
          </label>

          {node.type === 'trigger' ? (
            <label className="block text-gray-500">
              Event
              <select
                value={node.data.kind || 'form_submitted'}
                onChange={(e) => {
                  const kind = e.target.value as AutomationTrigger
                  patchData({
                    kind,
                    label: isAutomationTrigger(kind) ? TRIGGER_LABELS[kind] : kind,
                  })
                }}
                className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
              >
                {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map((k) => (
                  <option key={k} value={k}>
                    {TRIGGER_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {node.type === 'action' ? (
            <>
              <label className="block text-gray-500">
                Action
                <select
                  value={node.data.kind || 'create_activity'}
                  onChange={(e) => {
                    const kind = e.target.value as AutomationAction
                    patchData({
                      kind,
                      label: isAutomationAction(kind) ? ACTION_LABELS[kind] : kind,
                    })
                  }}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                >
                  {(Object.keys(ACTION_LABELS) as AutomationAction[]).map((k) => (
                    <option key={k} value={k}>
                      {ACTION_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-gray-500">
                Destination app
                <select
                  value={node.data.appId || ''}
                  onChange={(e) =>
                    patchData({ appId: e.target.value ? e.target.value : undefined })
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                >
                  <option value="">None (CRM only)</option>
                  {byFormation.map((g) => (
                    <optgroup key={g.formation} label={FORMATION_LABELS[g.formation]}>
                      {g.apps.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              {stamped ? (
                <p className="text-[10px] text-gray-400 leading-snug">
                  {stamped.id === 'zapier' ? (
                    <>
                      Zapier is a brand stamp only — the runner skips external webhooks. CRM steps
                      still execute. {readinessLabel(stamped.readiness)}.
                    </>
                  ) : (
                    <>
                      Brands Activity subjects as {stamped.stampSubjectPrefix} … Delivery stays on
                      Desk’s spine until Connect. {readinessLabel(stamped.readiness)}.
                    </>
                  )}
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 leading-snug">
                  Optional stamp from the marquee catalog — does not send to external apps yet.
                </p>
              )}

              {node.data.kind === 'create_activity' || node.data.kind === 'notify' ? (
                <>
                  <label className="block text-gray-500">
                    Subject
                    <input
                      value={node.data.subject || ''}
                      onChange={(e) => patchData({ subject: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                    />
                  </label>
                  <label className="block text-gray-500">
                    {node.data.kind === 'notify' ? 'Note body' : 'Body'}
                    <textarea
                      value={node.data.kind === 'notify' ? node.data.message || '' : node.data.body || ''}
                      onChange={(e) =>
                        patchData(
                          node.data.kind === 'notify'
                            ? { message: e.target.value }
                            : { body: e.target.value },
                        )
                      }
                      rows={3}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                    />
                  </label>
                  {node.data.kind === 'notify' ? (
                    <p className="text-[10px] text-gray-400 leading-snug">
                      Log note writes an activity note on the contact (not email or push).
                    </p>
                  ) : null}
                </>
              ) : null}
              {node.data.kind === 'update_contact_tag' ? (
                <label className="block text-gray-500">
                  Tag
                  <input
                    value={node.data.tag || ''}
                    onChange={(e) => patchData({ tag: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                    placeholder="e.g. form-lead"
                  />
                </label>
              ) : null}
            </>
          ) : null}

          {node.type === 'condition' ? (
            <>
              <label className="block text-gray-500">
                Context field
                <input
                  value={node.data.field || ''}
                  onChange={(e) => patchData({ field: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                  placeholder="e.g. stage, form_id"
                />
              </label>
              <label className="block text-gray-500">
                Operator
                <select
                  value={node.data.op || 'equals'}
                  onChange={(e) => patchData({ op: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="exists">exists</option>
                </select>
              </label>
              {node.data.op !== 'exists' ? (
                <label className="block text-gray-500">
                  Value
                  <input
                    value={node.data.value || ''}
                    onChange={(e) => patchData({ value: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5"
                  />
                </label>
              ) : null}
              <p className="text-[10px] text-gray-400 leading-snug">
                Connect the green handle for true and the bottom handle for false.
              </p>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  )
}
