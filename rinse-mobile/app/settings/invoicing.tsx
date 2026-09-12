import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  CurrencyDollar,
  Palette,
  PlusCircle,
  SlidersHorizontal,
  UsersThree,
} from '@/src/icons'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { InvoiceLineTemplateManager } from '@/src/components/invoice/InvoiceLineTemplateManager'
import { StripeConnectCard } from '@/src/components/settings/StripeConnectCard'
import { ListRow, SectionGroup } from '@/src/components/ui'
import { noScrollbarScrollProps } from '@/src/theme/invoice-surface'
import { iconTonePalette, spacing } from '@/src/theme/colors'

export default function SettingsInvoicingScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const purple = iconTonePalette.purple
  const green = iconTonePalette.green
  const blue = iconTonePalette.blue
  const amber = iconTonePalette.amber

  return (
    <SettingsScreen title={t('invoicing.title')} subtitle={t('invoicing.subtitle')} invoiceSurface>
      <ScrollView
        {...noScrollbarScrollProps}
        contentContainerStyle={styles.scroll}
      >
        <StripeConnectCard />

        <SectionGroup title={t('invoicing.appearance')}>
          <ListRow
            icon={<Palette size={18} color={purple.fg} weight="duotone" />}
            iconTone="purple"
            title={t('invoicing.previewCustomize')}
            subtitle={t('invoicing.previewSubtitle')}
            onPress={() => router.push('/settings/invoice-layout')}
          />
          <ListRow
            icon={<CurrencyDollar size={18} color={green.fg} weight="duotone" />}
            iconTone="green"
            title="Policies"
            subtitle="Deposits, cancel window, tip suggestions"
            onPress={() => router.push('/settings/policies')}
          />
          <ListRow
            icon={<UsersThree size={18} color={blue.fg} weight="duotone" />}
            iconTone="blue"
            title="Team"
            subtitle="Tech roster for day assignments"
            onPress={() => router.push('/settings/team')}
          />
          <ListRow
            icon={<PlusCircle size={18} color={amber.fg} weight="duotone" />}
            iconTone="amber"
            title="Add-ons"
            subtitle="Catalog extras for quotes and jobs"
            onPress={() => router.push('/settings/addons')}
          />
          <ListRow
            icon={<SlidersHorizontal size={18} color={purple.fg} weight="duotone" />}
            iconTone="purple"
            title="CRM extras"
            subtitle="Portal, tax, SOP, reviews"
            onPress={() => router.push('/settings/crm-extras')}
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
