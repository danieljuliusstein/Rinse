import { ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Palette } from 'phosphor-react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { StripeConnectCard } from '@/src/components/settings/StripeConnectCard'
import { ListRow, SectionGroup } from '@/src/components/ui'
import { iconTonePalette, spacing } from '@/src/theme/colors'

export default function SettingsInvoicingScreen() {
  const router = useRouter()
  const tone = iconTonePalette.amber

  return (
    <SettingsScreen title="Invoicing" subtitle="Payments and invoice look">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <StripeConnectCard />

        <SectionGroup title="Appearance">
          <ListRow
            icon={<Palette size={18} color={tone.fg} weight="duotone" />}
            iconTone="amber"
            title="Preview & customize"
            subtitle="Layout, accent, logo, and terms — applies to all invoices"
            onPress={() => router.push('/settings/invoice-layout')}
          />
        </SectionGroup>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
})
