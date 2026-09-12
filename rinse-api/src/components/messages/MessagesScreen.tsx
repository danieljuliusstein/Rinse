'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BackButton from '@/components/BackButton'
import AllMessagesTab from '@/components/messages/AllMessagesTab'
import AutoMessagesTab from '@/components/messages/AutoMessagesTab'
import AutoMessageEditSheet from '@/components/messages/AutoMessageEditSheet'
import MessageDetailView from '@/components/messages/MessageDetailView'
import { ScreenLoading } from '@/components/ui'
import type { AutoMessageTemplate, SentMessage } from '@/lib/messages'
import {
  DEFAULT_AUTO_TEMPLATES,
  loadAutoMessageTemplatesAsync,
  loadSentMessagesAsync,
  saveAutoMessageTemplatesAsync,
} from '@/lib/messages'

type Tab = 'all' | 'auto'

export default function MessagesScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'auto' ? 'auto' : 'all'

  const [tab, setTab] = useState<Tab>(initialTab)
  const [templates, setTemplates] = useState<AutoMessageTemplate[]>(DEFAULT_AUTO_TEMPLATES)
  const [expandedId, setExpandedId] = useState('appointment_reminder')
  const [selected, setSelected] = useState<SentMessage | null>(null)
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])
  const [loadingSent, setLoadingSent] = useState(true)
  const [editTemplate, setEditTemplate] = useState<AutoMessageTemplate | null>(null)

  useEffect(() => {
    setTab(searchParams.get('tab') === 'auto' ? 'auto' : 'all')
  }, [searchParams])

  useEffect(() => {
    loadAutoMessageTemplatesAsync().then(setTemplates)
    loadSentMessagesAsync()
      .then(setSentMessages)
      .finally(() => setLoadingSent(false))
  }, [])

  const persistTemplates = useCallback((next: AutoMessageTemplate[]) => {
    setTemplates(next)
    void saveAutoMessageTemplatesAsync(next)
  }, [])

  const handleTemplateUpdate = useCallback(
    (id: string, patch: Partial<Pick<AutoMessageTemplate, 'enabled' | 'emailBody'>>) => {
      persistTemplates(
        templates.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
    },
    [templates, persistTemplates]
  )

  const setTabAndUrl = useCallback(
    (next: Tab) => {
      setTab(next)
      router.replace(next === 'auto' ? '/messages?tab=auto' : '/messages', { scroll: false })
    },
    [router]
  )

  if (selected) {
    return <MessageDetailView message={selected} onBack={() => setSelected(null)} />
  }

  const enabledCount = templates.filter((t) => t.enabled).length

  return (
    <div className="screen page-content body messages-screen">
      <header className="page-header page-header--compact">
        <BackButton onClick={() => router.push('/')} />
        <div className="page-header__title-block">
          <div>
            <h1>Messages</h1>
            <p>
              {tab === 'all'
                ? loadingSent
                  ? 'Loading sent messages…'
                  : `${sentMessages.length} sent`
                : `${enabledCount} of ${templates.length} enabled`}
            </p>
          </div>
        </div>
      </header>

      <div className="chips" role="tablist" aria-label="Messages views">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`chip${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTabAndUrl('all')}
        >
          All messages
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'auto'}
          className={`chip${tab === 'auto' ? ' active' : ''}`}
          onClick={() => setTabAndUrl('auto')}
        >
          Auto messages
        </button>
      </div>

      {tab === 'all' ? (
        loadingSent ? (
          <ScreenLoading inline />
        ) : (
          <div key="all" className="messages-tab-panel">
            <AllMessagesTab messages={sentMessages} onSelect={setSelected} />
          </div>
        )
      ) : (
        <div key="auto" className="messages-tab-panel">
          <AutoMessagesTab
            templates={templates}
            expandedId={expandedId}
            onExpandedChange={setExpandedId}
            onUpdate={handleTemplateUpdate}
            onEdit={setEditTemplate}
          />
        </div>
      )}

      {editTemplate ? (
        <AutoMessageEditSheet
          open
          onOpenChange={(open) => {
            if (!open) setEditTemplate(null)
          }}
          template={editTemplate}
          onSave={(emailBody) => handleTemplateUpdate(editTemplate.id, { emailBody })}
        />
      ) : null}
    </div>
  )
}
