import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Palette } from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { InvoiceLineTemplateManager } from '@/src/components/invoice/InvoiceLineTemplateManager'
import { StripeConnectCard } from '@/src/components/settings/StripeConnectCard'
import { ListRow, SectionGroup } from '@/src/components/ui'
import { iconTonePalette, spacing } from '@/src/theme/colors'

export default function SettingsInvoicingScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const tone = iconTonePalette.amber

  return (
    <SettingsScreen title={t('invoicing.title')} subtitle={t('invoicing.subtitle')}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <StripeConnectCard />

        <SectionGroup title={t('invoicing.appearance')}>
          <ListRow
            icon={<Palette size={18} color={tone.fg} weight="duotone" />}
            iconTone="amber"
            title={t('invoicing.previewCustomize')}
            subtitle={t('invoicing.previewSubtitle')}
            onPress={() => router.push('/settings/invoice-layout')}
          />
        </SectionGroup>

        <View style={styles.library}>
          <InvoiceLineTemplateManager />
        </View>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  library: {
    marginTop: spacing.sm,
  },
})
