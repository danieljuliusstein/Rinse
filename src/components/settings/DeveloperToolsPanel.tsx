import { useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { CaretDown } from 'phosphor-react-native'
import { AppText, Badge, SecondaryButton } from '@/src/components/ui'
import { clearQueue } from '@/src/lib/offline/queue'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

interface DeveloperToolsPanelProps {
  pendingCount: number
  syncing: boolean
  lastError: string | null
  syncErrors: string[]
  onSyncNow: () => Promise<void>
  onRefresh: () => Promise<void>
}

export function DeveloperToolsPanel({
  pendingCount,
  syncing,
  lastError,
  syncErrors,
  onSyncNow,
  onRefresh,
}: DeveloperToolsPanelProps) {
  const [open, setOpen] = useState(false)

  const handleClearQueue = () => {
    Alert.alert(
      'Clear offline queue?',
      'Clear all pending offline writes? Unsynced changes will be lost.',
      [
        { text: 'Keep pending', style: 'cancel' },
        {
          text: 'Clear queue',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearQueue()
              await onRefresh()
            })()
          },
        },
      ],
    )
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.summary, pressed ? styles.summaryPressed : null]}
      >
        <AppText style={styles.summaryLabel}>Developer tools</AppText>
        <CaretDown
          size={16}
          color={colors.textMuted}
          weight="bold"
          style={open ? styles.caretOpen : undefined}
        />
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <View style={styles.statusRow}>
            <AppText style={styles.statusLine}>Data backend:</AppText>
            <Badge tone="green" label="PocketBase" />
          </View>

          {pendingCount > 0 ? (
            <AppText style={styles.warn}>
              {pendingCount} pending write{pendingCount === 1 ? '' : 's'} in offline queue
            </AppText>
          ) : null}

          {syncErrors.length > 0 ? (
            <View style={styles.errorBox}>
              {syncErrors.map((entry, index) => (
                <AppText key={`${index}-${entry}`} style={styles.errorText}>
                  {entry}
                </AppText>
              ))}
            </View>
          ) : null}

          {lastError && syncErrors.length === 0 ? (
            <AppText style={styles.errorText}>{lastError}</AppText>
          ) : null}

          <SecondaryButton
            label={syncing ? 'Syncing…' : 'Sync pending changes'}
            loading={syncing}
            disabled={syncing || pendingCount === 0}
            onPress={() => void onSyncNow()}
          />

          {pendingCount > 0 ? (
            <SecondaryButton label="Clear sync queue" onPress={handleClearQueue} />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryPressed: {
    opacity: 0.7,
  },
  summaryLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  caretOpen: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statusLine: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  warn: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.amber,
  },
  errorBox: {
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.danger,
  },
})
