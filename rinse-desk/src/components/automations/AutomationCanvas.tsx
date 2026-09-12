import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { newId } from '@/lib/orgStore'
import {
  ACTION_LABELS,
  TRIGGER_LABELS,
  validateWorkflow,
} from '@/lib/automation-workflow'
import type {
  AutomationAction,
  AutomationEdge,
  AutomationNode,
  AutomationNodeData,
  AutomationWorkflow,
} from '@/lib/types'
import { automationNodeTypes } from './AutomationNodes'
import AutomationPalette from './AutomationPalette'
import AutomationInspector from './AutomationInspector'
import { AUTOMATION_TEMPLATES } from './templates'
import type { AppCatalogItem } from './appCatalog'
import { CanvasNodeActionsProvider } from './canvasNodeActions'
import { TONE_STYLES } from './AutomationIcons'
import { readPaletteOpen, writePaletteOpen } from './palettePrefs'

const EDGE_DEFAULT = '#9CA3AF'
const EDGE_TRUE = '#22C55E'
const EDGE_FALSE = '#F87171'

function edgeVisual(sourceHandle?: string | null): Pick<Edge, 'style' | 'markerEnd' | 'animated'> {
  const isTrue = sourceHandle === 'true'
  const isFalse = sourceHandle === 'false'
  const stroke = isTrue ? EDGE_TRUE : isFalse ? EDGE_FALSE : EDGE_DEFAULT
  return {
    animated: false,
    style: {
      stroke,
      strokeWidth: 2.5,
      ...(isFalse ? { strokeDasharray: '6 4' } : {}),
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: stroke,
    },
  }
}

function toFlowNodes(nodes: AutomationNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data },
  }))
}

function toFlowEdges(edges: AutomationEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    ...edgeVisual(e.sourceHandle),
  }))
}

function decorateEdges(edges: Edge[]): Edge[] {
  return edges.map((e) => ({
    ...e,
    ...edgeVisual(e.sourceHandle),
  }))
}

export function workflowFromFlow(nodes: Node[], edges: Edge[]): AutomationWorkflow {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.type as AutomationNode['type']) || 'action',
      position: n.position,
      data: { ...(n.data as AutomationNodeData) },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
    })),
  }
}

type Props = {
  initial: AutomationWorkflow
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onWorkflowChange: (workflow: AutomationWorkflow) => void
}

export default function AutomationCanvas({
  initial,
  selectedNodeId,
  onSelectNode,
  onWorkflowChange,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(initial.nodes))
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(initial.edges))
  const [paletteOpen, setPaletteOpen] = useState(readPaletteOpen)

  useEffect(() => {
    writePaletteOpen(paletteOpen)
  }, [paletteOpen])

  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const selectedRef = useRef(selectedNodeId)
  selectedRef.current = selectedNodeId

  const displayEdges = useMemo(() => decorateEdges(edges), [edges])

  const push = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      onWorkflowChange(workflowFromFlow(nextNodes, nextEdges))
    },
    [onWorkflowChange],
  )

  useEffect(() => {
    push(nodes, edges)
  }, [nodes, edges, push])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: newId(),
            ...edgeVisual(connection.sourceHandle),
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const onSelectionChange = useCallback(
    ({ nodes: selected }: OnSelectionChangeParams) => {
      onSelectNode(selected[0]?.id ?? null)
    },
    [onSelectNode],
  )

  const onPaneClick = useCallback(() => {
    onSelectNode(null)
    setNodes((ns) => ns.map((n) => ({ ...n, selected: false })))
  }, [onSelectNode, setNodes])

  const hasTrigger = nodes.some((n) => n.type === 'trigger')

  function addNode(type: AutomationNode['type'], data: AutomationNodeData) {
    if (type === 'trigger' && hasTrigger) return
    const id = newId()
    setNodes((ns) => [
      ...ns,
      {
        id,
        type,
        position: { x: 120 + ns.length * 24, y: 100 + ns.length * 36 },
        data,
      },
    ])
    onSelectNode(id)
  }

  function onApplyTemplate(templateId: string) {
    const t = AUTOMATION_TEMPLATES.find((x) => x.id === templateId)
    if (!t) return
    const wf = t.workflow()
    setNodes(toFlowNodes(wf.nodes))
    setEdges(toFlowEdges(wf.edges))
    onSelectNode(null)
  }

  const selectedDomain = useMemo(() => {
    const n = nodes.find((x) => x.id === selectedNodeId)
    if (!n) return null
    return {
      id: n.id,
      type: (n.type as AutomationNode['type']) || 'action',
      position: n.position,
      data: { ...(n.data as AutomationNodeData) },
    } satisfies AutomationNode
  }, [nodes, selectedNodeId])

  function onInspectorChange(next: AutomationNode) {
    setNodes((ns) =>
      ns.map((n) => (n.id === next.id ? { ...n, data: { ...next.data }, type: next.type } : n)),
    )
  }

  function onDeleteSelected() {
    if (!selectedNodeId) return
    onDeleteNode(selectedNodeId)
  }

  const onEditNode = useCallback(
    (nodeId: string) => {
      onSelectNode(nodeId)
      setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === nodeId })))
    },
    [onSelectNode, setNodes],
  )

  const onDuplicateNode = useCallback(
    (nodeId: string) => {
      const src = nodesRef.current.find((n) => n.id === nodeId)
      if (!src || src.type === 'trigger') return
      const id = newId()
      setNodes((ns) => [
        ...ns.map((n) => ({ ...n, selected: false })),
        {
          ...src,
          id,
          selected: true,
          position: { x: src.position.x + 40, y: src.position.y + 40 },
          data: { ...(src.data as AutomationNodeData) },
        },
      ])
      onSelectNode(id)
    },
    [onSelectNode, setNodes],
  )

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== nodeId))
      setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedRef.current === nodeId) onSelectNode(null)
    },
    [onSelectNode, setNodes, setEdges],
  )

  const onAddAfter = useCallback(
    (sourceId: string, type: AutomationNode['type'], data: AutomationNodeData) => {
      const src = nodesRef.current.find((n) => n.id === sourceId)
      if (!src) return
      const id = newId()
      const sourceHandle = src.type === 'condition' ? 'true' : undefined
      setNodes((ns) => [
        ...ns.map((n) => ({ ...n, selected: false })),
        {
          id,
          type,
          position: { x: src.position.x + 280, y: src.position.y },
          data,
          selected: true,
        },
      ])
      setEdges((es) => [
        ...es,
        {
          id: newId(),
          source: sourceId,
          target: id,
          sourceHandle,
          ...edgeVisual(sourceHandle),
        },
      ])
      onSelectNode(id)
    },
    [onSelectNode, setNodes, setEdges],
  )

  const nodeActions = useMemo(
    () => ({
      onEdit: onEditNode,
      onDuplicate: onDuplicateNode,
      onDelete: onDeleteNode,
      onAddAfter,
    }),
    [onEditNode, onDuplicateNode, onDeleteNode, onAddAfter],
  )

  const issues = validateWorkflow(workflowFromFlow(nodes, edges))
  const hardIssues = issues.filter((i) => i.severity !== 'soft')
  const softIssues = issues.filter((i) => i.severity === 'soft')
  const bannerIssue = hardIssues[0] ?? softIssues[0]

  function closeInspector() {
    onSelectNode(null)
    setNodes((ns) => ns.map((n) => ({ ...n, selected: false })))
  }

  function minimapNodeColor(n: Node) {
    if (n.type === 'trigger') return TONE_STYLES.trigger.border
    if (n.type === 'condition') return TONE_STYLES.condition.border
    return TONE_STYLES.action.border
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <AutomationPalette
        open={paletteOpen}
        onToggle={() => setPaletteOpen((v) => !v)}
        hasTrigger={hasTrigger}
        onAddTrigger={(kind) => addNode('trigger', { kind, label: TRIGGER_LABELS[kind] })}
        onAddAction={(kind: AutomationAction) =>
          addNode('action', { kind, label: ACTION_LABELS[kind] })
        }
        onAddCondition={() =>
          addNode('condition', {
            label: 'If field equals…',
            field: 'stage',
            op: 'equals',
            value: '',
          })
        }
        onAddApp={(app: AppCatalogItem) => {
          const kind = app.formation === 'notify' ? 'notify' : 'create_activity'
          addNode('action', {
            kind,
            appId: app.id,
            label: app.label,
            subject: app.spineHint,
            ...(kind === 'notify'
              ? { message: app.liaisonBody }
              : { body: app.liaisonBody }),
          })
        }}
        onApplyTemplate={onApplyTemplate}
      />

      <div className="flex-1 min-w-0 relative bg-[#FAFAF8]">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center max-w-sm px-4 pointer-events-auto bg-white/90 border border-gray-100 rounded-xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">Build a workflow</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Pick a template from the left, or add a trigger and connect actions. One trigger per
                automation. Click apps in the palette to drop destination nodes on the board.
              </p>
            </div>
          </div>
        ) : null}
        <CanvasNodeActionsProvider value={nodeActions}>
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onPaneClick={onPaneClick}
            nodeTypes={automationNodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="automation-flow-canvas"
            defaultEdgeOptions={{
              ...edgeVisual(undefined),
            }}
          >
            <Background
              id="dots"
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#D8DAD3"
              bgColor="#FAFAF8"
            />
            <Controls />
            <MiniMap
              nodeColor={minimapNodeColor}
              maskColor="rgba(250, 250, 248, 0.75)"
              bgColor="#ffffff"
              pannable
              zoomable
              className="!border !border-gray-200 !rounded-[10px] !shadow-sm"
            />
          </ReactFlow>
        </CanvasNodeActionsProvider>
        {bannerIssue ? (
          <div
            className={`absolute bottom-3 left-3 right-3 max-w-md rounded-lg px-3 py-2 text-[11px] ${
              bannerIssue.severity === 'soft'
                ? 'bg-sky-50 border border-sky-100 text-sky-900'
                : 'bg-amber-50 border border-amber-100 text-amber-900'
            }`}
          >
            {bannerIssue.message}
            {issues.length > 1 ? ` (+${issues.length - 1} more)` : ''}
          </div>
        ) : null}
      </div>

      {selectedDomain ? (
        <AutomationInspector
          node={selectedDomain}
          onChange={onInspectorChange}
          onDelete={onDeleteSelected}
          onClose={closeInspector}
        />
      ) : null}
    </div>
  )
}
