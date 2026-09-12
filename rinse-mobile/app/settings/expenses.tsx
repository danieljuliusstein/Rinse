import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { CurrencyDollar, Wallet } from '@/src/icons'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { ListRow, SectionGroup } from '@/src/components/ui'
import { SignOutBlockedError } from '@/src/lib/auth'
import { useAuth } from '@/src/providers/AuthProvider'
import { useOffline } from '@/src/providers/OfflineProvider'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const EXPENSE_ITEMS = [
  {
    id: 'overhead',
    title: 'Overhead expenses',
    subtitle: 'Rent, insurance, subscriptions',
    href: '/settings/overhead',
    Icon: Wallet,
    tone: 'purple' as const,
  },
  {
    id: 'business',
    title: 'Business expenses',
    subtitle: 'One-off costs and purchases',
    href: '/settings/business-expenses',
    Icon: CurrencyDollar,
    tone: 'green' as const,
  },
]

export default function SettingsExpensesScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { pendingCount } = useOffline()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = () => {
    if (pendingCount > 0) {
      Alert.alert('Unsynced changes', 'Sync or discard pending changes before signing out.')
      return
    }
    Alert.alert(
      'Log out?',
      'Log out on this device? You can keep browsing, but your data will not load until you sign in again.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSigningOut(true)
              try {
                await signOut()
              } catch (e) {
                if (e instanceof SignOutBlockedError) Alert.alert('Cannot sign out', e.message)
              } finally {
                setSigningOut(false)
              }
            })()
          },
        },
      ],
    )
  }

  return (
    <SettingsScreen title="Expenses">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionGroup title="Expense types">
          {EXPENSE_ITEMS.map((item) => {
            const Icon = item.Icon
            const tone = iconTonePalette[item.tone]
            return (
              <ListRow
                key={item.id}
                icon={<Icon size={20} color={tone.fg} weight="duotone" />}
                iconTone={item.tone}
                title={item.title}
                subtitle={item.subtitle}
                onPress={() => router.push(item.href as never)}
              />
            )
          })}
        </SectionGroup>

        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.logoutBtn, pressed && !signingOut ? styles.logoutPressed : null]}
        >
          <Text style={styles.logoutLabel}>{signingOut ? 'Signing out…' : 'Log out'}</Text>
        </Pressable>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248, 113, 113, 0.18)',
  },
  logoutPressed: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
  },
  logoutLabel: {
    color: colors.danger,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
})
