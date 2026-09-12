import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { Clock, X } from '@/src/icons'
import type { ClientWithStats } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { timeAgo } from '@/src/lib/client-relationship-logic'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

function followUpMeta(client: ClientWithStats): string {
  if (client.lastJobDate) return `Last job ${timeAgo(client.lastJobDate)}`
  return 'No jobs yet'
}

function daysSinceLast(client: ClientWithStats): number {
  if (!client.lastJobDate) return 999
  const d = new Date(client.lastJobDate.slice(0, 10) + 'T12:00:00')
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}

function followUpAction(client: ClientWithStats): { label: string; action: 'rebook' | 'open' } {
  if (client.lastJobDate && daysSinceLast(client) >= 42) {
    return { label: 'Rebook', action: 'rebook' }
  }
  return { label: 'Chase', action: 'open' }
}

type FollowUpClientCardProps = {
  client: ClientWithStats
  onClearPress: (client: ClientWithStats) => void
}

export function FollowUpClientCard({ client, onClearPress }: FollowUpClientCardProps) {
  const router = useRouter()
  const { openClient } = useDetailNavigation()
  const action = followUpAction(client)

  return (
    <View style={styles.card}>
      <Clock size={20} color={iconTonePalette.amber.fg} weight="duotone" />
      <View style={styles.body}>
        <AppText variant="bodySemiBold">{client.name}</AppText>
        <AppText variant="caption" style={styles.meta}>
          {followUpMeta(client)}
        </AppText>
      </View>
      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        onPress={() => {
          if (action.action === 'rebook') {
            router.push(`/jobs/new?clientId=${client.id}` as never)
          } else {
            openClient(client.id)
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <View>
          <AppText variant="bodySemiBold" style={styles.actionLabel}>
            {action.label}
          </AppText>
        </View>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
        onPress={() => onClearPress(client)}
        accessibilityRole="button"
        accessibilityLabel="Clear follow-up"
        hitSlop={8}
      >
        <X size={16} color={colors.textMuted} weight="bold" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: iconTonePalette.amber.bg,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  meta: {
    color: colors.textMuted,
  },
  action: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionLabel: {
    color: colors.greenText,
    fontSize: 14,
  },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
})
