import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CheckCircle } from '@/src/icons'
import { AppText, PrimaryButton } from '@/src/components/ui'
import { InvoiceTemplateMock } from '@/src/components/invoice/InvoiceTemplateMock'
import type { InvoiceTemplateId } from '@/src/lib/invoice-templates'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function AccountReadyCelebration({
  businessName,
  logoUrl,
  template = 'rinse',
  accent = '#22c55e',
  amount = 185,
  onContinue,
}: {
  businessName: string
  logoUrl?: string | null
  template?: InvoiceTemplateId
  accent?: string
  amount?: number
  onContinue: () => void
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.previewWrap}>
        <InvoiceTemplateMock
          template={template}
          accent={accent}
          businessName={businessName}
          logoUrl={logoUrl}
          scale="full"
          clientName="Sample Client"
          serviceName="Full detail"
          serviceNote="Sedan · mobile"
          amount={amount}
        />
      </View>
      <View style={styles.stage}>
        <CheckCircle size={48} color={colors.green} weight="fill" />
        <AppText variant="h1" style={styles.title}>
          You&apos;re ready!
        </AppText>
        <AppText style={styles.lead}>Your first invoice is set up — customize it next.</AppText>
        <PrimaryButton label="See my invoice" onPress={onContinue} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  previewWrap: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  stage: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    textAlign: 'center',
  },
  lead: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
})
