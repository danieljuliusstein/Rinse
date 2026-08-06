/** Edge chevron to collapse/expand editor side panels (Figma / n8n-style). */
export function PanelEdgeToggle({
  side,
  expanded,
  onToggle,
  label,
}: {
  side: 'left' | 'right'
  expanded: boolean
  onToggle: () => void
  label: string
}) {
  const pointingIn = expanded
  // Left panel: expanded → chevron points left (collapse); collapsed → points right (expand)
  // Right panel: expanded → chevron points right; collapsed → points left
  const rotate =
    side === 'left'
      ? pointingIn
        ? 'rotate-180'
        : 'rotate-0'
      : pointingIn
        ? 'rotate-0'
        : 'rotate-180'

  return (
    <button
      type="button"
      onClick={onToggle}
      title={expanded ? `Hide ${label}` : `Show ${label}`}
      aria-label={expanded ? `Hide ${label}` : `Show ${label}`}
      aria-expanded={expanded}
      className={`absolute top-1/2 z-20 -translate-y-1/2 flex h-9 w-5 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-green-300 hover:text-green-700 hover:shadow ${
        side === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-200 ${rotate}`}
        aria-hidden
      >
        {/* chevron-right as base */}
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
