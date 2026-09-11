import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ChatCircle, Funnel, GearSix, MagnifyingGlass, MapTrifold } from 'phosphor-react-native'
import { AppText, IconHeaderButton } from '@/src/components/ui'
import { TrialPlanBadge } from '@/src/components/subscription/TrialPlanBadge'
import { colors, layout, spacing, webInlinePressableReset } from '@/src/theme/colors'

type HomeGreetingHeaderProps = {
  greeting: string
  displayName: string | null
  dateLabel: string
  avatarInitial: string
  pipelineBadge?: number
  settingsDot?: boolean
  onSearchPress?: () => void
  searchActive?: boolean
}

export function HomeGreetingHeader({
  greeting,
  displayName,
  dateLabel,
  avatarInitial,
  pipelineBadge = 0,
  settingsDot = false,
  onSearchPress,
  searchActive = false,
}: HomeGreetingHeaderProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const title = displayName ? `${greeting}, ${displayName}` : greeting

  return (
    <View style={styles.row}>
      <View style={styles.greeting}>
        <Pressable
          onPress={() => router.push('/settings/account')}
          style={({ pressed }) => [styles.avatar, webInlinePressableReset, pressed && styles.avatarPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('home.account')}
        >
          <View style={styles.avatarInner}>
            <AppText style={styles.avatarText}>{avatarInitial}</AppText>
          </View>
        </Pressable>
        <View style={styles.greetingText}>
          <AppText variant="bodySemiBold" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="caption">{dateLabel}</AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <TrialPlanBadge placement="inline" />
        <IconHeaderButton label={t('home.routes')} onPress={() => router.push('/(tabs)/routes' as never)}>
          <MapTrifold size={18} color={colors.textSecondary} weight="duotone" />
        </IconHeaderButton>
        <IconHeaderButton
          label={t('home.pipeline')}
          onPress={() => router.push('/(tabs)/pipeline')}
          badge={pipelineBadge > 0 ? pipelineBadge : undefined}
        >
          <Funnel size={18} color={colors.textSecondary} weight="duotone" />
        </IconHeaderButton>
        <IconHeaderButton label={t('home.messages')} onPress={() => router.push('/(tabs)/messages')}>
          <ChatCircle size={18} color={colors.textSecondary} weight="duotone" />
        </IconHeaderButton>
        {onSearchPress ? (
          <IconHeaderButton label={t('home.search')} onPress={onSearchPress} active={searchActive}>
            <MagnifyingGlass
              size={18}
              color={searchActive ? colors.greenText : colors.textSecondary}
              weight="duotone"
            />
          </IconHeaderButton>
        ) : null}
        <IconHeaderButton label={t('home.settings')} onPress={() => router.push('/(tabs)/settings')} dot={settingsDot}>
          <GearSix size={18} color={colors.textSecondary} weight="duotone" />
        </IconHeaderButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: layout.headerHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  greeting: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.greenSoft,
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: {
    opacity: 0.85,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.greenText,
  },
  greetingText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
})
