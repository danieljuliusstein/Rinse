import { ImageIcon, Maximize2 } from 'lucide-react'

type Props = {
  url?: string
  alt: string
  size?: 'sm' | 'md'
  onClick?: (e: React.MouseEvent) => void
}

export function ReceiptThumb({ url, alt, size = 'md', onClick }: Props) {
  const dims = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'

  if (!url) {
    return (
      <div
        className={`${dims} shrink-0 rounded-lg border border-dashed border-ink-300 bg-ink-100`}
        title="No receipt photo attached"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative ${dims} shrink-0 overflow-hidden rounded-lg ring-1 ring-ink-200 transition-all duration-200 hover:-translate-y-0.5 hover:ring-brand-400 hover:shadow-md`}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover saturate-[0.9] brightness-[1.02]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-ink-900/0 opacity-0 transition-all group-hover:bg-ink-900/35 group-hover:opacity-100">
        <Maximize2 className="h-3.5 w-3.5 text-white" />
      </span>
      <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded bg-ink-900/70 px-1 py-px text-[8px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
        <ImageIcon className="h-2 w-2" />
        Receipt
      </span>
    </button>
  )
}
