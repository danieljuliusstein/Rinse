'use client'

import { useRouter } from 'next/navigation'
import { Globe } from '@phosphor-icons/react'
import WebsiteWidgetCard from '@/components/tools/WebsiteWidgetCard'
import { ListRow, SectionGroup } from '@/components/ui'
import { TOOLS_MENU_ITEMS } from '@/lib/tools-menu'

export default function ToolsScreen() {
  const router = useRouter()

  return (
    <div className="screen page-content body screen--dock-nav tools-screen">
      <header className="page-header">
        <div>
          <h1>Tools</h1>
          <p>Shortcuts for day-to-day ops</p>
        </div>
      </header>

      <WebsiteWidgetCard />

      <div data-coach="tools-list">
        <SectionGroup title="Operations">
        {TOOLS_MENU_ITEMS.map((item) => (
          <ListRow
            key={item.id}
            icon={<item.Icon size={20} weight="duotone" />}
            iconTone={
              item.tone === 'green' ? 'green' : item.tone === 'amber' ? 'amber' : item.tone === 'purple' ? 'purple' : 'blue'
            }
            title={item.title}
            subtitle={item.subtitle}
            onClick={() => router.push(item.href)}
          />
        ))}
        </SectionGroup>
      </div>

      <div className="tools-screen__footer">
        <Globe size={18} weight="duotone" aria-hidden="true" />
        <span>Add the booking widget to your website — clients schedule without leaving your brand.</span>
      </div>
    </div>
  )
}
