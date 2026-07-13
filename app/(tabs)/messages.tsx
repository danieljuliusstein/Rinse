import { useCallback, useState } from 'react'
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AutoMessageCard } from '@/src/components/messages/AutoMessageCard'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppText,
  Badge,
  EmptyState,
  ListRow,
  PillGroup,
  PrimaryButton,
  ScreenLoading,
  SecondaryButton,
  SectionGroup,
} from '@/src/components/ui'
import { SettingsHeader } from '@/src/components/ui/BackHeaderButton'
import {
  DEFAULT_AUTO_TEMPLATES,
  loadAutoMessageTemplates,
  listSentMessages,
  saveAutoMessageTemplates,
  type AutoMessageTemplate,
  type SentMessage,
} from '@/src/lib/messages-api'
import { formatSentAt } from '@/src/lib/format-dates'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { colors, layout, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type MessagesTab = 'all' | 'auto'

function titleCase(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function MessagesScreen() {
  const goBack = useSafeBack()
  const router = useRouter()
  const dockPadding = useTabDockPadding()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<MessagesTab>('all')
  const [templates, setTemplates] = useState<AutoMessageTemplate[]>(DEFAULT_AUTO_TEMPLATES)
  const [sent, setSent] = useState<SentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState('appointment_reminder')
  const [editing, setEditing] = useState<AutoMessageTemplate | null>(null)
  const [editBody, setEditBody] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [selectedSent, setSelectedSent] = useState<SentMessage | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [tpl, history] = await Promise.all([loadAutoMessageTemplates(), listSentMessages(50)])
      setTemplates(tpl)
      setSent(history)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const persistTemplates = async (next: AutoMessageTemplate[]) => {
    setTemplates(next)
    const ok = await saveAutoMessageTemplates(next)
    if (!ok) Alert.alert('Offline', 'Template saved on this device; sync when online.')
  }

  const toggleTemplate = (id: string, enabled: boolean) => {
    void persistTemplates(templates.map((t) => (t.id === id ? { ...t, enabled } : t)))
  }

  const openEditor = (tpl: AutoMessageTemplate) => {
    setEditing(tpl)
    setEditBody((tpl.preferSms ? tpl.smsBody : undefined)?.trim() || tpl.emailBody)
  }

  const saveEditor = async () => {
    if (!editing) return
    setSavingTemplate(true)
    try {
      await persistTemplates(
        templates.map((t) => {
          if (t.id !== editing.id) return t
          if (t.preferSms) {
            return { ...t, smsBody: editBody, emailBody: t.emailBody || editBody }
          }
          return { ...t, emailBody: editBody }
        }),
      )
      setEditing(null)
    } finally {
      setSavingTemplate(false)
    }
  }

  const sheetPad = Math.max(insets.bottom, spacing.md) + spacing.sm

  return (
    <OperatorScreen
      customHeader={
        <SettingsHeader
          title="Messages"
          subtitle="Auto emails, SMS, and sent history"
          onBack={goBack}
        />
      }
    >
      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pills}>
            <PillGroup
              options={[
                { value: 'all', label: 'All messages' },
                { value: 'auto', label: 'Auto messages' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>

          {tab === 'all' ? (
            sent.length === 0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  illustration="messages"
                  title="No messages sent yet"
                  description="Turn on auto messages for email/SMS, or text clients from a job."
                  actionLabel="Set up auto messages"
                  onAction={() => setTab('auto')}
                />
              </View>
            ) : (
              <SectionGroup title="Sent" meta={`${sent.length}`}>
                {sent.map((msg, index) => (
                  <ListRow
                    key={msg.id}
                    title={msg.client_name}
                    subtitle={msg.preview || msg.body.slice(0, 80)}
                    meta={formatSentAt(msg.sent_at)}
                    grouped
                    isLast={index === sent.length - 1}
                    badges={
                      <View style={styles.badgeRow}>
                        <Badge tone={msg.channel === 'sms' ? 'blue' : 'green'} label={titleCase(msg.channel)} />
                        <Badge
                          tone={
                            msg.status === 'failed' ? 'red' : msg.status === 'queued' ? 'blue' : 'green'
                          }
                          label={titleCase(msg.status)}
                        />
                      </View>
                    }
                    onPress={() => setSelectedSent(msg)}
                  />
                ))}
              </SectionGroup>
            )
          ) : (
            <>
              <SectionGroup title="Delivery">
                <ListRow
                  title="Quiet hours"
                  subtitle="Pause auto emails overnight in your timezone"
                  onPress={() => router.push('/settings/quiet-hours')}
                />
              </SectionGroup>
              <SectionGroup title="Templates" meta={`${templates.filter((t) => t.enabled).length} on`}>
                {templates.map((tpl, index) => (
                  <AutoMessageCard
                    key={tpl.id}
                    template={tpl}
                    expanded={expandedId === tpl.id}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === tpl.id ? '' : tpl.id))
                    }
                    onEnabledChange={(enabled) => toggleTemplate(tpl.id, enabled)}
                    onEdit={() => openEditor(tpl)}
                    isLast={index === templates.length - 1}
                  />
                ))}
              </SectionGroup>
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={editing != null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={() => setEditing(null)} accessibilityLabel="Close" />
          <View style={[styles.modalColumn, Platform.OS === 'web' && styles.modalColumnWeb]}>
            <View style={[styles.modalSheet, { paddingBottom: sheetPad }]}>
              <View style={styles.handle} />
              <AppText variant="h2">{editing?.name}</AppText>
              <AppText variant="caption" style={styles.muted}>
                {editing?.preferSms ? 'SMS template' : 'Email template'}
              </AppText>
              <TextInput
                value={editBody}
                onChangeText={setEditBody}
                multiline
                style={styles.editor}
                textAlignVertical="top"
                placeholder="Message body"
                placeholderTextColor={colors.textDim}
              />
              <View style={styles.modalActions}>
                <PrimaryButton label="Save template" onPress={() => void saveEditor()} loading={savingTemplate} />
                <SecondaryButton label="Cancel" onPress={() => setEditing(null)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedSent != null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSent(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.scrim}
            onPress={() => setSelectedSent(null)}
            accessibilityLabel="Close"
          />
          <View style={[styles.modalColumn, Platform.OS === 'web' && styles.modalColumnWeb]}>
            <View style={[styles.modalSheet, { paddingBottom: sheetPad }]}>
              <View style={styles.handle} />
              <AppText variant="h2">{selectedSent?.client_name}</AppText>
              <View style={styles.badgeRow}>
                {selectedSent ? (
                  <>
                    <Badge
                      tone={selectedSent.channel === 'sms' ? 'blue' : 'green'}
                      label={titleCase(selectedSent.channel)}
                    />
                    <Badge
                      tone={
                        selectedSent.status === 'failed'
                          ? 'red'
                          : selectedSent.status === 'queued'
                            ? 'blue'
                            : 'green'
                      }
                      label={titleCase(selectedSent.status)}
                    />
                  </>
                ) : null}
              </View>
              <AppText variant="caption" style={styles.muted}>
                {selectedSent ? formatSentAt(selectedSent.sent_at) : ''}
              </AppText>
              <ScrollView style={styles.sentBodyScroll} showsVerticalScrollIndicator={false}>
                <AppText variant="body" style={styles.sentBody}>
                  {selectedSent?.body || selectedSent?.preview}
                </AppText>
              </ScrollView>
              <View style={styles.modalActions}>
                <PrimaryButton
                  label="Share message"
                  onPress={() => {
                    if (!selectedSent?.body) return
                    void Share.share({ message: selectedSent.body })
                  }}
                />
                <SecondaryButton label="Close" onPress={() => setSelectedSent(null)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  pills: {
    marginBottom: spacing.xs,
  },
  emptyWrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muted: {
    color: colors.textSecondary,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  modalColumn: {
    width: '100%',
  },
  modalColumnWeb: {
    maxWidth: layout.phoneColumnWidth,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    maxHeight: '85%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  editor: {
    minHeight: 160,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sentBodyScroll: {
    maxHeight: 280,
  },
  sentBody: {
    lineHeight: 22,
  },
})
