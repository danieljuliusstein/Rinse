import { Pressable, StyleSheet, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { InvoiceTemplateMock } from '@/src/components/invoice/InvoiceTemplateMock'
import { INVOICE_TEMPLATES, type InvoiceTemplateId } from '@/src/lib/invoice-templates'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function InvoiceTemplateGallery({
  value,
  onChange,
  accent,
  businessName,
  logoUrl,
  termsFooter,
  businessEmail,
}: {
  value: InvoiceTemplateId
  onChange: (template: InvoiceTemplateId) => void
  accent: string
  businessName: string
  logoUrl?: string | null
  termsFooter?: string
  businessEmail?: string
}) {
  return (
    <View style={styles.gallery} accessibilityRole="radiogroup" accessibilityLabel="Invoice template">
      {INVOICE_TEMPLATES.map((tpl) => {
        const selected = value === tpl.id
        return (
          <Pressable
            key={tpl.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(tpl.id)}
            style={({ pressed }) => [
              styles.card,
              selected ? styles.cardOn : null,
              pressed ? styles.cardPressed : null,
              webInlinePressableReset,
            ]}
          >
            <InvoiceTemplateMock
              template={tpl.id}
              accent={accent}
              businessName={businessName}
              logoUrl={logoUrl}
              businessEmail={businessEmail}
              termsFooter={termsFooter}
              scale="thumbnail"
            />
            <View style={styles.meta}>
              <AppText style={styles.label}>{tpl.label}</AppText>
              {selected ? <Check size={14} color={colors.greenText} weight="bold" /> : null}
            </View>
            <AppText style={styles.desc} numberOfLines={2}>
              {tpl.description}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  gallery: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardOn: {
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.92,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  desc: {
    fontSize: 10,
    lineHeight: 13,
    color: colors.textMuted,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
})
