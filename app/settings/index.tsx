import { useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, ListRow, PrimaryButton, SectionGroup } from '@/src/components/ui'
import { useOrgSubscription } from '@/src/hooks/useOrgSubscription'
import { useTabDockPadding } from '@/src/hooks/useTabDockPadding'
import {
  SETTINGS_MENU_GROUPS,
  SETTINGS_MENU_ITEMS,
  searchSettingsMenu,
} from '@/src/lib/settings-menu'
import { STARTER_TRIAL_DAYS } from '@/src/lib/plans'
import { billingMenuSubtitle } from '@/src/lib/subscription-types'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { SignOutBlockedError } from '@/src/lib/auth'

export default function SettingsHubScreen({ tabRoot = false }: { tabRoot?: boolean }) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { pendingCount } = useOffline()
  const { org } = useOrgSubscription()
  const dockPadding = useTabDockPadding(tabRoot)
  const [query, setQuery] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const billingSubtitle = billingMenuSubtitle(org, STARTER_TRIAL_DAYS)

  const items = useMemo(() => {
    const searched = searchSettingsMenu(query)
    return searched.map((item) =>
      item.id === 'billing' ? { ...item, subtitle: billingSubtitle } : item,
    )
  }, [query, billingSubtitle])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return SETTINGS_MENU_GROUPS.map((g) => ({ ...g, items: map.get(g.id) ?? [] })).filter(
      (g) => g.items.length > 0
    )
  }, [items])

  const handleSignOut = async () => {
    if (pendingCount > 0) {
      Alert.alert('Unsynced changes', 'Sync or discard pending changes before signing out.')
      return
    }
    setSigningOut(true)
    try {
      await signOut()
    } catch (e) {
      if (e instanceof SignOutBlockedError) Alert.alert('Cannot sign out', e.message)
    } finally {
      setSigningOut(false)
    }
  }

  const navigate = (href: string) => {
    if (href === '/inventory') {
      router.push('/(tabs)/inventory')
      return
    }
    if (href === '/invoices') {
      router.push('/(tabs)/invoices')
      return
    }
    if (href === '/tools') {
      router.push('/(tabs)/tools')
      return
    }
    router.push(href as never)
  }

  return (
    <SettingsScreen title="Settings" subtitle={String(user?.email ?? '')} hub={!tabRoot} tabRoot={tabRoot}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabRoot ? dockPadding : spacing.xl }]}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search settings"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {grouped.map((group) => (
          <SectionGroup key={group.id} title={group.label}>
            {group.items.map((item) => {
              const Icon = item.Icon
              const tone = iconTonePalette[item.tone]
              return (
                <ListRow
                  key={item.id}
                  icon={<Icon size={18} color={tone.fg} weight="duotone" />}
                  iconTone={item.tone}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => navigate(item.href)}
                />
              )
            })}
          </SectionGroup>
        ))}

        <View style={styles.signOut}>
          <PrimaryButton label="Sign out" onPress={() => void handleSignOut()} loading={signingOut} />
        </View>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {},
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  signOut: {
    marginTop: spacing.lg,
  },
})
