'use client'

import { useState } from 'react'
import { CaretDown, ChatCircle, PencilSimple } from '@phosphor-icons/react'
import SettingsToggle from '@/components/settings/SettingsToggle'
import { Badge, ListRow } from '@/components/ui'
import type { AutoMessageTemplate } from '@/lib/messages'
import { AUTO_MESSAGE_HINT, PREVIEW_CLIENT, mergeTemplateBody } from '@/lib/messages'
import { buildSmsComposeUrl } from '@/lib/sms-compose'

interface Props {
  template: AutoMessageTemplate
  expanded: boolean
  onToggleExpand: () => void
  onEnabledChange: (enabled: boolean) => void
  onEdit: () => void
}

export default function AutoMessageCard({
  template,
  expanded,
  onToggleExpand,
  onEnabledChange,
  onEdit,
}: Props) {
  const previewBody = mergeTemplateBody(template.emailBody)
  const previewSmsUrl = buildSmsComposeUrl(PREVIEW_CLIENT.phone, previewBody)

  return (
    <div className="auto-message-item">
      <ListRow
        title={template.name}
        subtitle={template.trigger}
        trailing={
          <div className="auto-message-row__actions">
            <button
              type="button"
              className="auto-message-edit-btn"
              onClick={onEdit}
              aria-label={`Edit ${template.name}`}
            >
              <PencilSimple size={16} weight="bold" aria-hidden="true" />
            </button>
            <SettingsToggle
              on={template.enabled}
              onChange={onEnabledChange}
              label={`${template.enabled ? 'Disable' : 'Enable'} ${template.name}`}
            />
            <button
              type="button"
              className={`auto-message-chevron${expanded ? ' auto-message-chevron--open' : ''}`}
              onClick={onToggleExpand}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'Show'} preview for ${template.name}`}
            >
              <CaretDown size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        }
      />

      {expanded ? (
        <div className="auto-message-expand">
          <p className="auto-message-hint">{AUTO_MESSAGE_HINT}</p>

          <div className="auto-message-preview">
            <Badge tone="green">Email auto</Badge>
            <Badge tone="blue">SMS via Messages</Badge>
            <p className="auto-message-preview__body">{previewBody}</p>
            <p className="auto-message-preview__meta">
              Preview · {PREVIEW_CLIENT.name} · {PREVIEW_CLIENT.package} · {PREVIEW_CLIENT.time} ·{' '}
              {PREVIEW_CLIENT.date}
            </p>
            {previewSmsUrl ? (
              <a href={previewSmsUrl} className="auto-message-sms-btn">
                <ChatCircle size={16} weight="duotone" aria-hidden="true" />
                Open in Messages
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
