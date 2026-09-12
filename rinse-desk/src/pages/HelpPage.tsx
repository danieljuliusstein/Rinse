import { CircleHelp } from 'lucide-react'
import { Header } from '../App'
import { HelpCenter } from '@/components/help/HelpCenter'

export default function HelpPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Help"
        subtitle="Search guides and jump into the product"
        actions={
          <div className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[11px] text-ink-400">
            <span className="size-1.5 rounded-full bg-brand-500" />
            <CircleHelp className="size-3 text-brand-600" strokeWidth={2} />
            Help center
          </div>
        }
      />
      <HelpCenter />
    </div>
  )
}
