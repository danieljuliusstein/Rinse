import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from '../App'
import { ThreadList } from '@/components/chat/ThreadList'
import { MessageThread } from '@/components/chat/MessageThread'
import { ContactPanel } from '@/components/chat/ContactPanel'
import { SimulateVisitorModal } from '@/components/chat/SimulateVisitorModal'
import { InboxFolderNav } from '@/components/chat/InboxFolderNav'
import { ActivityList } from '@/components/chat/ActivityList'
import { ActivityDetail } from '@/components/chat/ActivityDetail'
import { LabelsManager } from '@/components/chat/LabelsManager'
import { MixedInboxList } from '@/components/chat/MixedInboxList'
import {
  countForFolder,
  filterActivitiesForFolder,
  filterThreadsForFolder,
  isChatFolder,
  type InboxFolderId,
} from '@/components/chat/inboxFolders'
import { useData } from '@/providers/DataProvider'
import { useUi } from '@/providers/UiProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import * as platform from '@/lib/platform-api'
import { subscribeChatRealtime } from '@/lib/chat-realtime'
import { getCurrentUser, getInitials } from '@/lib/auth'
import { listInboxLabels } from '@/lib/inbox-labels'
import { patchActivityMeta } from '@/lib/activity-meta'
import type { DeskActivity, DeskChatMessage, DeskChatThread } from '@/lib/types'
import { colors } from '@/theme/colors'

const FOLDER_TITLES: Record<string, string> = {
  assigned: 'Assigned to me',
  unassigned: 'Unassigned',
  all_open: 'All open',
  chat: 'Chat',
  all_closed: 'All Closed',
  draft: 'Draft',
  spam: 'Spam',
  trash: 'Trash',
  email: 'Email',
  calls: 'Calls',
  sent: 'Sent',
  schedule: 'Schedule',
}

export default function ChatPage() {
  const { clients } = useData()
  const { alert, toast, promptForm } = useUi()
  const { openContact, openCalendarDraft } = useDeskNav()
  const { createDeal } = useCreateActions()
  const user = getCurrentUser()
  const userId = user?.id ?? null
  const userInitials = getInitials()

  const [folder, setFolder] = useState<InboxFolderId>('chat')
  const [othersOpen, setOthersOpen] = useState(true)
  const [teamsOpen, setTeamsOpen] = useState(true)
  const [labels, setLabels] = useState(() => listInboxLabels())

  const [threads, setThreads] = useState<DeskChatThread[]>([])
  const [activities, setActivities] = useState<DeskActivity[]>([])
  const [allMessages, setAllMessages] = useState<DeskChatMessage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DeskChatMessage[]>([])
  const [reply, setReply] = useState('')
  const [search, setSearch] = useState('')
  const [simulateOpen, setSimulateOpen] = useState(false)
  const [live, setLive] = useState(false)
  const [metaTick, setMetaTick] = useState(0)
  const draftTimer = useRef<number | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  const refreshThreads = useCallback(async () => {
    try {
      setThreads(await platform.listChatThreads())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not load chats', 'Chat')
    }
  }, [alert])

  const refreshActivities = useCallback(async () => {
    try {
      setActivities(await platform.listActivities())
    } catch {
      /* ignore */
    }
  }, [])

  const refreshAllMessages = useCallback(async () => {
    try {
      setAllMessages(await platform.listAllChatMessages())
    } catch {
      /* ignore */
    }
  }, [])

  const refreshMessages = useCallback(async (threadId?: string | null) => {
    const id = threadId === undefined ? selectedIdRef.current : threadId
    if (!id) {
      setMessages([])
      return
    }
    setMessages(await platform.listChatMessages(id))
  }, [])

  useEffect(() => {
    void refreshThreads()
    void refreshAllMessages()
    void refreshActivities()
  }, [refreshThreads, refreshAllMessages, refreshActivities])

  useEffect(() => {
    setSelectedId(null)
    setSelectedActivityId(null)
    setSearch('')
  }, [folder])

  useEffect(() => {
    void refreshMessages(selectedId)
    if (selectedId) {
      void platform.markThreadRead(selectedId).then(() => void refreshThreads())
    }
  }, [selectedId, refreshMessages, refreshThreads])

  useEffect(() => {
    if (!selectedId) {
      setReply('')
      return
    }
    const t = threads.find((x) => x.id === selectedId)
    setReply(t?.draft_body ?? '')
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let unsub: (() => void) | null = null
    let poll: number | null = null
    let cancelled = false

    void (async () => {
      const stop = await subscribeChatRealtime({
        onThreadsChanged: () => {
          void refreshThreads()
          void refreshAllMessages()
        },
        onMessagesChanged: (threadId) => {
          void refreshAllMessages()
          if (!threadId || threadId === selectedIdRef.current) void refreshMessages(selectedIdRef.current)
        },
      })
      if (cancelled) {
        stop?.()
        return
      }
      if (stop) {
        unsub = stop
        setLive(true)
      } else {
        setLive(false)
        poll = window.setInterval(() => {
          void refreshThreads()
          void refreshAllMessages()
          void refreshActivities()
          void refreshMessages(selectedIdRef.current)
        }, 3000)
      }
    })()

    return () => {
      cancelled = true
      unsub?.()
      if (poll) window.clearInterval(poll)
    }
  }, [refreshThreads, refreshAllMessages, refreshMessages, refreshActivities])

  const chatMode = isChatFolder(folder) || folder.startsWith('label:')
  const activityMode = folder === 'email' || folder === 'calls' || folder === 'sent' || folder === 'schedule'
  const mixedMode = folder === 'trash' || folder === 'spam'

  const folderThreads = useMemo(
    () => filterThreadsForFolder(threads, folder, userId, allMessages),
    [threads, folder, userId, allMessages],
  )

  const folderActivities = useMemo(
    () => filterActivitiesForFolder(activities, folder),
    // metaTick forces re-filter after local spam/trash patches
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activities, folder, metaTick],
  )

  const counts = useMemo(() => {
    const base: Record<string, number> = {}
    const ids: InboxFolderId[] = [
      'assigned',
      'unassigned',
      'all_open',
      'email',
      'chat',
      'calls',
      'sent',
      'all_closed',
      'schedule',
      'draft',
      'spam',
      'trash',
    ]
    for (const id of ids) {
      base[id] = countForFolder(id, threads, activities, allMessages, userId)
    }
    for (const l of labels) {
      const id = `label:${l.id}` as InboxFolderId
      base[id] = countForFolder(id, threads, activities, allMessages, userId)
    }
    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, activities, allMessages, userId, labels, metaTick])

  const selected = threads.find((t) => t.id === selectedId) ?? null
  const selectedActivity = activities.find((a) => a.id === selectedActivityId) ?? null
  const contact = useMemo(() => {
    if (selectedActivity) return clients.find((c) => c.id === selectedActivity.contact_id) ?? null
    if (selected?.contact_id) return clients.find((c) => c.id === selected.contact_id) ?? null
    return null
  }, [clients, selected, selectedActivity])

  const contactPanelThread = useMemo(() => {
    if (selected) return selected
    if (selectedActivity) {
      return {
        id: selectedActivity.id,
        visitor_name: contact?.name ?? 'Contact',
        visitor_email: contact?.email,
        contact_id: selectedActivity.contact_id,
        status: 'open' as const,
        last_message_at: selectedActivity.occurred_at,
      }
    }
    return null
  }, [selected, selectedActivity, contact])

  function scheduleDraftSave(threadId: string, body: string) {
    if (draftTimer.current) window.clearTimeout(draftTimer.current)
    draftTimer.current = window.setTimeout(() => {
      void platform.updateChatThread(threadId, { draft_body: body }).then(() => void refreshThreads())
    }, 500)
  }

  function onReplyChange(v: string) {
    setReply(v)
    if (selectedId) scheduleDraftSave(selectedId, v)
  }

  async function onSend() {
    if (!selectedId || !reply.trim()) return
    try {
      if (draftTimer.current) window.clearTimeout(draftTimer.current)
      await platform.postChatMessage({ thread_id: selectedId, sender: 'agent', body: reply.trim() })
      setReply('')
      await refreshMessages(selectedId)
      await refreshThreads()
      await refreshAllMessages()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Send failed', 'Chat')
    }
  }

  async function onSparkle() {
    if (!selectedId) return
    const tips = platform.buildAiSuggestions({
      contactName: contact?.name ?? selected?.visitor_name,
      openChats: threads.filter((t) => t.status === 'open' && !t.archived && !t.trashed).length,
    })
    const suggestion =
      tips[0] ??
      `Hi ${selected?.visitor_name.split(' ')[0] ?? 'there'}, thanks for reaching out — how can I help you today?`
    onReplyChange(suggestion)
    toast('Draft tip inserted (rule-based, not a live model)')
  }

  async function logActivity(type: 'call' | 'email' | 'meeting') {
    const values = await promptForm({
      title: type === 'call' ? 'Log call' : type === 'email' ? 'Log email' : 'Log meeting note',
      fields: [
        {
          name: 'contact_id',
          label: 'Contact',
          type: 'select',
          required: true,
          options: clients.map((c) => ({ value: c.id, label: c.name })),
        },
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'body', label: 'Notes', type: 'text' },
      ],
      submitLabel: 'Save',
    })
    if (!values?.contact_id || !values.subject?.trim()) return
    try {
      const row = await platform.createActivity({
        contact_id: values.contact_id,
        type,
        subject: values.subject.trim(),
        body: values.body?.trim() || undefined,
      })
      toast(`${type === 'call' ? 'Call' : type === 'email' ? 'Email' : 'Meeting note'} logged`)
      await refreshActivities()
      setSelectedActivityId(row.id)
      if (type === 'call') setFolder('calls')
      if (type === 'email') setFolder('sent')
      if (type === 'meeting') setFolder('schedule')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save', 'Inbox')
    }
  }

  const listTitle =
    FOLDER_TITLES[folder] ??
    (folder.startsWith('label:')
      ? labels.find((l) => l.id === folder.slice(6))?.name ?? 'Team inbox'
      : 'Inbox')

  function openMeetForContact(c: typeof contact) {
    if (!c) {
      toast('Link a contact first', 'err')
      return
    }
    openCalendarDraft({
      clientId: c.id,
      title: `Meeting with ${c.name}`,
    })
  }

  function createDealForContact(c: typeof contact) {
    if (!c) {
      toast('Link a contact first', 'err')
      return
    }
    void createDeal({
      defaultName: c.name,
      clientId: c.id,
      phone: c.phone,
      email: c.email,
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Inbox"
        subtitle={live ? 'Live · folders + chat realtime' : 'Folders · polling every 3s'}
      />
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[200px_260px_1fr_260px] min-h-0">
        <InboxFolderNav
          active={folder}
          counts={counts}
          labels={labels}
          userInitials={userInitials}
          othersOpen={othersOpen}
          teamsOpen={teamsOpen}
          onToggleOthers={() => setOthersOpen((v) => !v)}
          onToggleTeams={() => setTeamsOpen((v) => !v)}
          onSelect={setFolder}
        />

        {folder === 'manage_labels' ? (
          <>
            <div className="border-r border-gray-100 bg-white" />
            <LabelsManager
              labels={labels}
              onChange={() => setLabels(listInboxLabels())}
            />
            <div className="border-l border-gray-100 bg-white" />
          </>
        ) : mixedMode ? (
          <>
            <MixedInboxList
              title={listTitle}
              threads={folderThreads}
              activities={folderActivities}
              messages={allMessages}
              clients={clients}
              selectedThreadId={selectedId}
              selectedActivityId={selectedActivityId}
              onSelectThread={(id) => {
                setSelectedActivityId(null)
                setSelectedId(id)
              }}
              onSelectActivity={(id) => {
                setSelectedId(null)
                setSelectedActivityId(id)
              }}
            />
            <div className="min-h-0 min-w-0">
              {selectedActivity ? (
                <ActivityDetail
                  activity={selectedActivity}
                  contact={contact}
                  onCall={() => {
                    if (contact?.phone) window.location.href = `tel:${contact.phone}`
                    else toast('No phone on contact', 'err')
                  }}
                  onEmail={() => {
                    if (contact?.email) window.location.href = `mailto:${contact.email}`
                    else toast('No email on contact', 'err')
                  }}
                  onSpam={() => {
                    patchActivityMeta(selectedActivity.id, { spam: true, trashed: false })
                    toast('Marked spam')
                    setSelectedActivityId(null)
                    setMetaTick((n) => n + 1)
                  }}
                  onTrash={() => {
                    patchActivityMeta(selectedActivity.id, { trashed: true })
                    toast('Moved to trash')
                    setSelectedActivityId(null)
                    setMetaTick((n) => n + 1)
                  }}
                  onOpenCalendar={() => openMeetForContact(contact)}
                />
              ) : selected ? (
                <MessageThread
                  thread={selected}
                  messages={messages}
                  reply={reply}
                  onReplyChange={onReplyChange}
                  onSend={() => void onSend()}
                  onSparkle={() => void onSparkle()}
                  onArchive={() => {
                    void platform.setThreadArchived(selected.id, !selected.archived).then(() => {
                      toast(selected.archived ? 'Unarchived' : 'Archived')
                      void refreshThreads()
                    })
                  }}
                  onAssignToMe={() => {
                    if (!userId) {
                      toast('Sign in required', 'err')
                      return
                    }
                    void platform.updateChatThread(selected.id, { assignee_id: userId }).then(() => {
                      toast('Assigned to you')
                      void refreshThreads()
                    })
                  }}
                  onUnassign={() => {
                    void platform.updateChatThread(selected.id, { assignee_id: '' }).then(() => {
                      toast('Unassigned')
                      void refreshThreads()
                    })
                  }}
                  onMarkSpam={() => {
                    void platform.updateChatThread(selected.id, { spam: true }).then(() => {
                      toast('Marked spam')
                      setSelectedId(null)
                      void refreshThreads()
                    })
                  }}
                  onMoveTrash={() => {
                    void platform.updateChatThread(selected.id, { trashed: true }).then(() => {
                      toast('Moved to trash')
                      setSelectedId(null)
                      void refreshThreads()
                    })
                  }}
                  onCloseThread={() => {
                    void platform.updateChatThread(selected.id, { status: 'closed' }).then(() => {
                      toast('Closed')
                      void refreshThreads()
                    })
                  }}
                  onReopenThread={() => {
                    void platform
                      .updateChatThread(selected.id, {
                        status: 'open',
                        archived: false,
                        spam: false,
                        trashed: false,
                      })
                      .then(() => {
                        toast('Reopened')
                        void refreshThreads()
                      })
                  }}
                  labels={labels}
                  onToggleLabel={(labelId) => {
                    const current = selected.label_ids ?? []
                    const next = current.includes(labelId)
                      ? current.filter((x) => x !== labelId)
                      : [...current, labelId]
                    void platform.updateChatThread(selected.id, { label_ids: next }).then(() => {
                      toast(current.includes(labelId) ? 'Label removed' : 'Label added')
                      void refreshThreads()
                    })
                  }}
                  contactPhone={contact?.phone}
                />
              ) : (
                <div className="h-full flex items-center justify-center" style={{ background: colors.bg }}>
                  <p className="text-xs text-gray-400">Select an item</p>
                </div>
              )}
            </div>
            <ContactPanel
              thread={contactPanelThread}
              contact={contact}
              clients={clients}
              onLinkContact={(contactId) => {
                if (!selected) return
                void platform.updateChatThread(selected.id, { contact_id: contactId }).then(() => {
                  toast('Contact linked')
                  void refreshThreads()
                })
              }}
              onAddNote={() => toast('Open a chat or activity with a contact', 'err')}
              onCreateTask={() => toast('Open a chat or activity with a contact', 'err')}
              onOpenCalendar={() => openMeetForContact(contact)}
              onOpenContact={() => {
                if (contact) openContact(contact.id)
                else toast('No contact', 'err')
              }}
              onCreateDeal={() => createDealForContact(contact)}
            />
          </>
        ) : activityMode ? (
          <>
            <ActivityList
              title={listTitle}
              activities={folderActivities}
              clients={clients}
              selectedId={selectedActivityId}
              onSelect={setSelectedActivityId}
              onCreate={() => {
                if (folder === 'calls') void logActivity('call')
                else if (folder === 'schedule') void logActivity('meeting')
                else void logActivity('email')
              }}
              createLabel={
                folder === 'calls'
                  ? 'Log call'
                  : folder === 'schedule'
                    ? 'Log meeting note'
                    : 'Log email'
              }
            />
            <div className="min-h-0 min-w-0">
              {!selectedActivity ? (
                <div className="h-full flex items-center justify-center" style={{ background: colors.bg }}>
                  <p className="text-xs text-gray-400">Select an item</p>
                </div>
              ) : (
                <ActivityDetail
                  activity={selectedActivity}
                  contact={contact}
                  onCall={() => {
                    if (contact?.phone) window.location.href = `tel:${contact.phone}`
                    else toast('No phone on contact', 'err')
                  }}
                  onEmail={() => {
                    if (contact?.email) window.location.href = `mailto:${contact.email}`
                    else toast('No email on contact', 'err')
                  }}
                  onSpam={() => {
                    patchActivityMeta(selectedActivity.id, { spam: true })
                    toast('Marked spam')
                    setSelectedActivityId(null)
                    setMetaTick((n) => n + 1)
                  }}
                  onTrash={() => {
                    patchActivityMeta(selectedActivity.id, { trashed: true })
                    toast('Moved to trash')
                    setSelectedActivityId(null)
                    setMetaTick((n) => n + 1)
                  }}
                  onOpenCalendar={() => openMeetForContact(contact)}
                />
              )}
            </div>
            <ContactPanel
              thread={contactPanelThread}
              contact={contact}
              clients={clients}
              onLinkContact={() => toast('Link from a chat thread', 'err')}
              onAddNote={() => {
                if (!contact) {
                  toast('No contact', 'err')
                  return
                }
                void promptForm({
                  title: 'Add note',
                  fields: [{ name: 'body', label: 'Note', type: 'text' }],
                  submitLabel: 'Save',
                }).then((values) => {
                  if (!values?.body?.trim()) return
                  void platform
                    .createActivity({
                      contact_id: contact.id,
                      type: 'note',
                      subject: 'Inbox note',
                      body: values.body.trim(),
                    })
                    .then(() => {
                      toast('Note added')
                      void refreshActivities()
                    })
                })
              }}
              onCreateTask={() => {
                if (!contact) {
                  toast('No contact', 'err')
                  return
                }
                void promptForm({
                  title: 'Create task',
                  fields: [
                    { name: 'subject', label: 'Task', type: 'text' },
                    { name: 'body', label: 'Details', type: 'text' },
                  ],
                  submitLabel: 'Create',
                }).then((values) => {
                  if (!values?.subject?.trim()) return
                  void platform
                    .createActivity({
                      contact_id: contact.id,
                      type: 'note',
                      subject: values.subject.trim(),
                      body: values.body?.trim(),
                    })
                    .then(() => toast('Task created'))
                })
              }}
              onOpenCalendar={() => openMeetForContact(contact)}
              onOpenContact={() => {
                if (contact) openContact(contact.id)
                else toast('No contact', 'err')
              }}
              onCreateDeal={() => createDealForContact(contact)}
            />
          </>
        ) : chatMode ? (
          <>
            <ThreadList
              title={listTitle}
              threads={folderThreads}
              messages={allMessages}
              selectedId={selectedId}
              search={search}
              onSearchChange={setSearch}
              onSelect={setSelectedId}
              onTogglePin={(id, pinned) => {
                void platform.setThreadPinned(id, pinned).then(() => void refreshThreads())
              }}
              onSimulateVisitor={() => setSimulateOpen(true)}
            />

            <div className="min-h-0 min-w-0">
              {!selected ? (
                <div className="h-full flex items-center justify-center" style={{ background: colors.bg }}>
                  <p className="text-xs text-gray-400">Select a conversation</p>
                </div>
              ) : (
                <MessageThread
                  thread={selected}
                  messages={messages}
                  reply={reply}
                  onReplyChange={onReplyChange}
                  onSend={() => void onSend()}
                  onSparkle={() => void onSparkle()}
                  onArchive={() => {
                    void platform.setThreadArchived(selected.id, !selected.archived).then(() => {
                      toast(selected.archived ? 'Unarchived' : 'Archived')
                      void refreshThreads()
                    })
                  }}
                  onAssignToMe={() => {
                    if (!userId) {
                      toast('Sign in required', 'err')
                      return
                    }
                    void platform.updateChatThread(selected.id, { assignee_id: userId }).then(() => {
                      toast('Assigned to you')
                      void refreshThreads()
                    })
                  }}
                  onUnassign={() => {
                    void platform.updateChatThread(selected.id, { assignee_id: '' }).then(() => {
                      toast('Unassigned')
                      void refreshThreads()
                    })
                  }}
                  onMarkSpam={() => {
                    void platform.updateChatThread(selected.id, { spam: true }).then(() => {
                      toast('Marked spam')
                      setSelectedId(null)
                      void refreshThreads()
                    })
                  }}
                  onMoveTrash={() => {
                    void platform.updateChatThread(selected.id, { trashed: true }).then(() => {
                      toast('Moved to trash')
                      setSelectedId(null)
                      void refreshThreads()
                    })
                  }}
                  onCloseThread={() => {
                    void platform.updateChatThread(selected.id, { status: 'closed' }).then(() => {
                      toast('Closed')
                      void refreshThreads()
                    })
                  }}
                  onReopenThread={() => {
                    void platform
                      .updateChatThread(selected.id, { status: 'open', archived: false, spam: false, trashed: false })
                      .then(() => {
                        toast('Reopened')
                        void refreshThreads()
                      })
                  }}
                  labels={labels}
                  onToggleLabel={(labelId) => {
                    const current = selected.label_ids ?? []
                    const next = current.includes(labelId)
                      ? current.filter((x) => x !== labelId)
                      : [...current, labelId]
                    void platform.updateChatThread(selected.id, { label_ids: next }).then(() => {
                      toast(current.includes(labelId) ? 'Label removed' : 'Label added')
                      void refreshThreads()
                    })
                  }}
                  contactPhone={contact?.phone}
                />
              )}
            </div>

            <ContactPanel
              thread={selected}
              contact={contact}
              clients={clients}
              onLinkContact={(contactId) => {
                if (!selected) return
                void platform.updateChatThread(selected.id, { contact_id: contactId }).then(() => {
                  toast('Contact linked')
                  void refreshThreads()
                })
              }}
              onAddNote={() => {
                if (!contact) {
                  toast('Link a contact first', 'err')
                  return
                }
                void promptForm({
                  title: 'Add note',
                  fields: [{ name: 'body', label: 'Note', type: 'text' }],
                  submitLabel: 'Save',
                }).then((values) => {
                  if (!values?.body?.trim()) return
                  void platform
                    .createActivity({
                      contact_id: contact.id,
                      type: 'note',
                      subject: 'Chat note',
                      body: values.body.trim(),
                    })
                    .then(() => {
                      toast('Note added')
                      void refreshActivities()
                    })
                    .catch((err) => alert(err instanceof Error ? err.message : 'Failed', 'Note'))
                })
              }}
              onCreateTask={() => {
                if (!contact) {
                  toast('Link a contact first', 'err')
                  return
                }
                void promptForm({
                  title: 'Create task',
                  fields: [
                    { name: 'subject', label: 'Task', type: 'text' },
                    { name: 'body', label: 'Details', type: 'text' },
                  ],
                  submitLabel: 'Create',
                }).then((values) => {
                  if (!values?.subject?.trim()) return
                  void platform
                    .createActivity({
                      contact_id: contact.id,
                      type: 'note',
                      subject: values.subject.trim(),
                      body: values.body?.trim(),
                    })
                    .then(() => toast('Task created'))
                    .catch((err) => alert(err instanceof Error ? err.message : 'Failed', 'Task'))
                })
              }}
              onOpenCalendar={() => openMeetForContact(contact)}
              onOpenContact={() => {
                if (contact) openContact(contact.id)
                else toast('Link a contact first', 'err')
              }}
              onCreateDeal={() => createDealForContact(contact)}
            />
          </>
        ) : null}
      </div>

      <SimulateVisitorModal
        open={simulateOpen}
        clients={clients}
        onClose={() => setSimulateOpen(false)}
        onSubmit={async (input) => {
          const { thread } = await platform.createChatThread(input)
          setFolder('unassigned')
          setSelectedId(thread.id)
          toast('Visitor thread opened')
          await refreshThreads()
          await refreshAllMessages()
          await refreshMessages(thread.id)
        }}
      />
    </div>
  )
}
