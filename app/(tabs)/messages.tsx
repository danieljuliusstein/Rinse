import { useCallback, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
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
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type MessagesTab = 'all' | 'auto'

export default function MessagesScreen() {
  const goBack = useSafeBack()
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
    setEditBody(tpl.emailBody)
  }

  const saveEditor = async () => {
    if (!editing) return
    setSavingTemplate(true)
    try {
      await persistTemplates(
        templates.map((t) => (t.id === editing.id ? { ...t, emailBody: editBody } : t)),
      )
      setEditing(null)
    } finally {
      setSavingTemplate(false)
    }
  }

  return (
    <OperatorScreen customHeader={<SettingsHeader title="Messages" onBack={goBack} />}>
      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <PillGroup
            options={[
              { value: 'all', label: 'All messages' },
              { value: 'auto', label: 'Auto messages' },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === 'all' ? (
            sent.length === 0 ? (
              <EmptyState
                illustration="messages"
                title="No messages sent yet"
                description="Turn on auto messages for email, or text clients from their profile or a job."
                actionLabel="Set up auto messages"
                onAction={() => setTab('auto')}
              />
            ) : (
              <SectionGroup title="Sent">
                {sent.map((msg) => (
                  <ListRow
                    key={msg.id}
                    title={msg.client_name}
                    subtitle={msg.preview || msg.body.slice(0, 80)}
                    meta={formatSentAt(msg.sent_at)}
                    badges={
                      <View style={styles.badgeRow}>
                        <Badge tone={msg.channel === 'sms' ? 'blue' : 'green'} label={msg.channel} />
                        <Badge tone={msg.status === 'failed' ? 'red' : 'green'} label={msg.status} />
                      </View>
                    }
                    onPress={() => setSelectedSent(msg)}
                  />
                ))}
              </SectionGroup>
            )
          ) : (
            <SectionGroup title="Templates">
              <View style={styles.templateList}>
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
              </View>
            </SectionGroup>
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
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.handle} />
            <AppText variant="h2">{editing?.name}</AppText>
            <AppText variant="caption" style={styles.muted}>
              Use {'{{name}}'}, {'{{package}}'}, {'{{date}}'}, {'{{time}}'}
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
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.handle} />
            <AppText variant="h2">{selectedSent?.client_name}</AppText>
            <View style={styles.badgeRow}>
              {selectedSent ? (
                <>
                  <Badge
                    tone={selectedSent.channel === 'sms' ? 'blue' : 'green'}
                    label={selectedSent.channel}
                  />
                  <Badge
                    tone={selectedSent.status === 'failed' ? 'red' : 'green'}
                    label={selectedSent.status}
                  />
                </>
              ) : null}
            </View>
            <AppText variant="caption" style={styles.muted}>
              {selectedSent ? formatSentAt(selectedSent.sent_at) : ''}
            </AppText>
            <ScrollView style={styles.sentBodyScroll} showsVerticalScrollIndicator={false}>
              <AppText variant="body">{selectedSent?.body || selectedSent?.preview}</AppText>
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
      </Modal>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  templateList: {
    marginHorizontal: -spacing.md,
  },
  muted: {
    color: colors.textSecondary,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
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
})
