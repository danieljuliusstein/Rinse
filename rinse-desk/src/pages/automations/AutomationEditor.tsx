import { useMemo, useState } from 'react'
import { Header } from '../../App'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import {
  blockingWorkflowIssues,
  ensureWorkflow,
  triggerFromWorkflow,
  validateWorkflow,
  workflowSummary,
} from '@/lib/automation-workflow'
import type { AutomationWorkflow, DeskAutomation } from '@/lib/types'
import { colors } from '@/theme/colors'
import AutomationCanvas from '@/components/automations/AutomationCanvas'

type Props = {
  automation: DeskAutomation
  onBack: () => void
  onSaved: () => Promise<void>
  onDeleted: () => void
}

export default function AutomationEditor({ automation, onBack, onSaved, onDeleted }: Props) {
  const { alert, toast } = useUi()
  const [name, setName] = useState(automation.name)
  const [enabled, setEnabled] = useState(automation.enabled)
  const [workflow, setWorkflow] = useState<AutomationWorkflow>(() => ensureWorkflow(automation))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [canvasKey] = useState(automation.id)

  const issues = useMemo(() => validateWorkflow(workflow), [workflow])
  const blocking = useMemo(() => blockingWorkflowIssues(issues), [issues])
  const summary = useMemo(() => workflowSummary(workflow), [workflow])

  async function onSave() {
    if (blocking.length > 0) {
      alert(blocking.map((i) => i.message).join('\n'), 'Fix workflow')
      return
    }
    const trigger = triggerFromWorkflow(workflow)
    if (!trigger) {
      alert('Add a trigger node', 'Automations')
      return
    }
    setBusy(true)
    try {
      await platform.updateAutomation(automation.id, {
        name: name.trim() || automation.name,
        enabled,
        trigger,
        workflow,
        config: automation.config,
      })
      toast('Automation saved')
      await onSaved()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed', 'Automations')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete “${automation.name}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await platform.deleteAutomation(automation.id)
      toast('Automation deleted')
      onDeleted()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Automations')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={name.trim() || 'Untitled automation'}
        subtitle={summary}
        leading={
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            aria-label="Back to Automations"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Automations
          </button>
        }
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 px-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDelete()}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5"
            >
              Delete
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSave()}
              className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
              style={{ background: colors.green }}
            >
              Save
            </button>
          </div>
        }
      />

      <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center gap-3">
        <label className="flex-1 max-w-md text-xs text-gray-500">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
          />
        </label>
      </div>

      <AutomationCanvas
        key={canvasKey}
        initial={workflow}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onWorkflowChange={setWorkflow}
      />
    </div>
  )
}
