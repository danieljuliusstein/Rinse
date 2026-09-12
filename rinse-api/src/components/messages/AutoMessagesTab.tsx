'use client'

import type { AutoMessageTemplate } from '@/lib/messages'
import AutoMessageCard from '@/components/messages/AutoMessageCard'
import { SectionGroup } from '@/components/ui'

interface Props {
  templates: AutoMessageTemplate[]
  expandedId: string
  onExpandedChange: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<AutoMessageTemplate, 'enabled' | 'emailBody'>>) => void
  onEdit: (template: AutoMessageTemplate) => void
}

export default function AutoMessagesTab({
  templates,
  expandedId,
  onExpandedChange,
  onUpdate,
  onEdit,
}: Props) {
  const enabledCount = templates.filter((t) => t.enabled).length

  return (
    <SectionGroup title="Templates" meta={`${enabledCount} enabled · Email only`}>
      {templates.map((template) => (
        <AutoMessageCard
          key={template.id}
          template={template}
          expanded={expandedId === template.id}
          onToggleExpand={() =>
            onExpandedChange(expandedId === template.id ? '' : template.id)
          }
          onEnabledChange={(enabled) => onUpdate(template.id, { enabled })}
          onEdit={() => onEdit(template)}
        />
      ))}
    </SectionGroup>
  )
}
