import { Pressable, StyleSheet, Switch, View } from 'react-native'
import { CaretDown, PencilSimple } from '@/src/icons'
import { AppText, Badge } from '@/src/components/ui'
import type { AutoMessageTemplate } from '@/src/lib/messages-api'
import { mergeTemplateBodyForContext } from '@/src/lib/message-templates'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, spacing, webInlinePressableReset, webPressableReset } from '@/src/theme/colors'

const PREVIEW_CTX = {
  name: 'Alex Rivera',
  packageName: 'Full Detail',
  time: '10:00 AM',
  date: 'Sat, Jul 12',
}

type AutoMessageCardProps = {
  template: AutoMessageTemplate
  expanded: boolean
  onToggleExpand: () => void
  onEnabledChange: (enabled: boolean) => void
  onEdit: () => void
  isLast?: boolean
}

export function AutoMessageCard({
  template,
  expanded,
  onToggleExpand,
  onEnabledChange,
  onEdit,
  isLast = false,
}: AutoMessageCardProps) {
  const previewBody = mergeTemplateBodyForContext(
    template.smsBody?.trim() || template.emailBody,
    PREVIEW_CTX,
  )

  return (
    <View style={[styles.wrap, isLast ? styles.wrapLast : null]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            selectionHaptic()
            onToggleExpand()
          }}
          style={({ pressed }) => [styles.mainPress, webPressableReset, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${template.name}. ${expanded ? 'Hide' : 'Show'} preview.`}
        >
          <View style={styles.copy}>
            <AppText variant="bodySemiBold" numberOfLines={1}>
              {template.name}
            </AppText>
            <AppText variant="caption" style={styles.trigger} numberOfLines={1}>
              {template.trigger}
            </AppText>
          </View>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              selectionHaptic()
              onEdit()
            }}
            style={({ pressed }) => [styles.iconBtn, webInlinePressableReset, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${template.name}`}
            hitSlop={8}
          >
            <View style={styles.iconBtnInner}>
              <PencilSimple size={16} color={colors.textSecondary} weight="bold" />
            </View>
          </Pressable>
          <Switch
            accessibilityLabel={`${template.enabled ? 'Disable' : 'Enable'} ${template.name}`}
            value={template.enabled}
            onValueChange={onEnabledChange}
            trackColor={{ true: colors.green, false: colors.border }}
            thumbColor="#ffffff"
          />
          <Pressable
            onPress={() => {
              selectionHaptic()
              onToggleExpand()
            }}
            style={({ pressed }) => [styles.iconBtn, webInlinePressableReset, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Hide preview' : 'Show preview'}
            hitSlop={8}
          >
            <View style={[styles.iconBtnInner, expanded && styles.chevronOpen]}>
              <CaretDown size={16} color={colors.textMuted} weight="bold" />
            </View>
          </Pressable>
        </View>
      </View>

      {expanded ? (
        <View style={styles.expand}>
          <View style={styles.preview}>
            <View style={styles.badgeRow}>
              <Badge tone="green" label="Email auto" />
              {template.preferSms ? (
                <Badge tone="blue" label="SMS preferred" />
              ) : (
                <Badge tone="blue" label="SMS optional" />
              )}
            </View>
            <AppText variant="body" style={styles.previewBody}>
              {previewBody}
            </AppText>
            <AppText variant="caption" style={styles.previewMeta}>
              Preview · {PREVIEW_CTX.name} · {PREVIEW_CTX.packageName} · {PREVIEW_CTX.time} · {PREVIEW_CTX.date}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  wrapLast: {
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  mainPress: {
    flex: 1,
    minWidth: 0,
  },
  copy: {
    gap: 2,
  },
  trigger: {
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  pressed: {
    opacity: 0.85,
  },
  expand: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  preview: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  previewMeta: {
    color: colors.textMuted,
  },
})
