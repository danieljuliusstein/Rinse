import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useRef } from 'react'
import { MapPin } from 'phosphor-react-native'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import type { ClientWithStats } from '@rinse/core'
import { openMaps } from '@/src/lib/api'
import type { ClientDerived } from '@/src/lib/client-relationship-logic'
import { timeAgo } from '@/src/lib/client-relationship-logic'
import { ClientCardMenu, type ClientCardMenuHandle } from '@/src/components/clients/ClientCardMenu'
import { AppText, Badge, CurrencyAmount } from '@/src/components/ui'
import { mediumHaptic } from '@/src/lib/haptics'
import { colors, iconTonePalette, spacing, webInlinePressableReset } from '@/src/theme/colors'
import type { ListRowIconTone } from '@/src/theme/colors'

const TAG_LABELS = {
  followup: 'Follow up',
  new: 'New',
} as const

function avatarTone(derived: ClientDerived): ListRowIconTone {
  if (derived.tag === 'followup') return 'amber'
  if (derived.tag === 'new') return 'blue'
  if (derived.isVip) return 'green'
  return 'purple'
}

function lastServiceLine(client: ClientWithStats): string {
  if (client.lastJobDate && client.lastServiceName) {
    return `${client.lastServiceName} · ${timeAgo(client.lastJobDate)}`
  }
  if (client.lastJobDate) return timeAgo(client.lastJobDate)
  return 'No jobs yet'
}

export function ClientCard({
  client,
  derived,
  onRemoved,
}: {
  client: ClientWithStats
  derived: ClientDerived
  onRemoved?: (id: string) => void
}) {
  const { openClient } = useDetailNavigation()
  const menuRef = useRef<ClientCardMenuHandle>(null)
  const tone = avatarTone(derived)
  const palette = iconTonePalette[tone]

  return (
    <View style={[styles.card, derived.isVip && styles.vipCard]}>
      <Pressable
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        onPress={() => openClient(client.id)}
        onLongPress={() => {
          mediumHaptic()
          menuRef.current?.open()
        }}
        delayLongPress={350}
        accessibilityHint="Long press for call, text, book, or remove"
      >
        <View style={styles.mainInner}>
          <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
            <AppText variant="bodySemiBold" style={{ color: palette.fg, fontSize: 13 }}>
              {derived.initials}
            </AppText>
          </View>
          <View style={styles.body}>
            <AppText variant="bodySemiBold" numberOfLines={1}>
              {client.name}
            </AppText>
            <AppText variant="caption" style={styles.meta} numberOfLines={1}>
              {lastServiceLine(client)}
            </AppText>
            {derived.isVip || derived.tag ? (
              <View style={styles.tags}>
                {derived.isVip ? <Badge tone="green" label="VIP" /> : null}
                {derived.tag ? (
                  <Badge tone={derived.tag === 'followup' ? 'amber' : 'blue'} label={TAG_LABELS[derived.tag]} />
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.right}>
            <CurrencyAmount value={client.totalRevenue} variant="revenue" size="default" style={styles.amount} />
            <AppText variant="caption" style={styles.jobs}>
              {`${client.jobCount} job${client.jobCount !== 1 ? 's' : ''}`}
            </AppText>
          </View>
        </View>
      </Pressable>
      {client.address?.trim() ? (
        <Pressable
          style={({ pressed }) => [styles.mapBtn, webInlinePressableReset, pressed && styles.mapBtnPressed]}
          onPress={() => void Linking.openURL(openMaps(client.address!))}
          accessibilityLabel={`Navigate to ${client.name}`}
          accessibilityRole="button"
        >
          <View>
            <MapPin size={16} color={colors.greenText} weight="bold" />
          </View>
        </Pressable>
      ) : null}
      <ClientCardMenu ref={menuRef} client={client} onClientRemoved={onRemoved} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    overflow: 'visible',
    minHeight: 64,
  },
  vipCard: {
    borderColor: '#bbf7d0',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  mainInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  meta: {
    color: colors.textMuted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 64,
    flexShrink: 0,
  },
  amount: {
    color: colors.greenText,
  },
  jobs: {
    color: colors.textMuted,
  },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceActive,
  },
  mapBtnPressed: {
    opacity: 0.9,
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
})
