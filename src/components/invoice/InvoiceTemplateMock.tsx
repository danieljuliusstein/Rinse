import { Image, StyleSheet, View } from 'react-native'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { accentTint } from '@/src/lib/brand-color'
import { resolveBusinessLogoSrc } from '@/src/lib/business-logo'
import type { InvoiceTemplateId } from '@/src/lib/invoice-templates'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function InvoiceTemplateMock({
  template,
  accent,
  businessName,
  logoUrl,
  businessEmail = 'hello@detail.co',
  scale = 'full',
  termsFooter = 'Due on receipt. Thank you for your business.',
  clientName = 'Alex Rivera',
  serviceName = 'Full detail',
  serviceNote = 'Sedan · mobile',
  amount = 185,
}: {
  template: InvoiceTemplateId
  accent: string
  businessName: string
  logoUrl?: string | null
  businessEmail?: string
  scale?: 'thumbnail' | 'full'
  termsFooter?: string
  clientName?: string
  serviceName?: string
  serviceNote?: string
  amount?: number
}) {
  const compact = scale === 'thumbnail'
  const logoSrc = resolveBusinessLogoSrc(logoUrl)
  const amountLabel = fmt(amount)
  const nameStyle =
    template === 'classic'
      ? styles.brandNameClassic
      : template === 'minimal'
        ? styles.brandNameMinimal
        : styles.brandName
  const labelStyle = template === 'minimal' ? styles.sectionLabelMinimal : styles.sectionLabel

  const doc = (
    <View style={[styles.doc, compact ? styles.docThumb : null]}>
      <View style={styles.brandRow}>
        <View style={styles.logoWrap}>
          {logoSrc ? (
            <Image source={{ uri: logoSrc }} style={styles.logo} resizeMode="cover" />
          ) : (
            <View style={styles.logoPlaceholder} />
          )}
        </View>
        <View style={styles.brandInfo}>
          <AppText style={nameStyle} numberOfLines={1}>
            {businessName.trim() || 'Your business'}
          </AppText>
          <AppText style={styles.brandContact} numberOfLines={1}>
            {businessEmail}
          </AppText>
        </View>
      </View>

      <View style={styles.sectionBorder}>
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <AppText style={[labelStyle, template !== 'minimal' ? { color: accent } : null]}>Invoice</AppText>
            <AppText style={styles.invoiceNumber}>DET-2026-03-001</AppText>
            <AppText style={styles.issued}>Issued March 1, 2026</AppText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: accentTint(accent, 0.12) }]}>
            <AppText style={[styles.statusText, { color: accent }]}>SENT</AppText>
          </View>
        </View>
      </View>

      <View style={styles.sectionBorder}>
        <AppText style={labelStyle}>Bill to</AppText>
        <AppText style={styles.billName}>{clientName}</AppText>
      </View>

      <View style={styles.section}>
        <View style={styles.linesHead}>
          <AppText style={styles.linesHeadText}>Description</AppText>
          <AppText style={styles.linesHeadText}>Amount</AppText>
        </View>
        <View style={styles.lineRow}>
          <View style={styles.lineDesc}>
            <AppText style={styles.lineTitle}>{serviceName}</AppText>
            <AppText style={styles.lineNote}>{serviceNote}</AppText>
          </View>
          <AppText style={styles.lineAmount}>{amountLabel}</AppText>
        </View>
        <View style={styles.totalsDivider} />
        <View style={styles.totalRow}>
          <AppText style={styles.totalLabel}>Total</AppText>
          <AppText style={styles.totalValue}>{amountLabel}</AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText style={styles.footerText}>{termsFooter}</AppText>
        <View style={[styles.viewBtn, { backgroundColor: accent }]}>
          <AppText style={styles.viewBtnText}>View invoice online</AppText>
        </View>
      </View>
    </View>
  )

  if (compact) {
    const nameThumbStyle =
      template === 'classic'
        ? styles.thumbNameClassic
        : template === 'minimal'
          ? styles.thumbNameMinimal
          : styles.thumbName

    return (
      <View style={styles.thumbWrap}>
        <View style={styles.thumbDoc}>
          <View style={styles.thumbBrandRow}>
            <View style={styles.thumbLogo}>
              {logoSrc ? (
                <Image source={{ uri: logoSrc }} style={styles.thumbLogoImg} resizeMode="cover" />
              ) : (
                <AppText style={styles.thumbLogoLabel}>Logo</AppText>
              )}
            </View>
            <View style={styles.thumbBrandInfo}>
              <AppText style={nameThumbStyle} numberOfLines={1}>
                {businessName.trim() || 'Your business'}
              </AppText>
              <AppText style={styles.thumbContact} numberOfLines={1}>
                {businessEmail}
              </AppText>
            </View>
          </View>

          <View style={styles.thumbDivider} />

          <View style={styles.thumbMetaRow}>
            <View style={styles.thumbMetaLeft}>
              <AppText
                style={[
                  styles.thumbSectionLabel,
                  template === 'minimal' ? styles.thumbSectionLabelMinimal : null,
                  template !== 'minimal' ? { color: accent } : null,
                ]}
              >
                Invoice
              </AppText>
              <AppText style={styles.thumbInvoiceNo}>DET-2026-03-001</AppText>
            </View>
            <View style={[styles.thumbStatus, { backgroundColor: accentTint(accent, 0.12) }]}>
              <AppText style={[styles.thumbStatusText, { color: accent }]}>SENT</AppText>
            </View>
          </View>

          <View style={styles.thumbDivider} />

          <View style={styles.thumbLineRow}>
            <View style={styles.thumbLineCopy}>
              <AppText style={styles.thumbLineTitle} numberOfLines={1}>
                {serviceName}
              </AppText>
              <AppText style={styles.thumbLineNote} numberOfLines={1}>
                {clientName} · {serviceNote}
              </AppText>
            </View>
            <AppText style={styles.thumbAmount}>{amountLabel}</AppText>
          </View>

          <View style={styles.thumbTotalRow}>
            <AppText style={styles.thumbTotalLabel}>Total</AppText>
            <AppText style={[styles.thumbTotalValue, { color: accent }]}>{amountLabel}</AppText>
          </View>

          <View style={[styles.thumbAccentBar, { backgroundColor: accent }]} />
        </View>
      </View>
    )
  }

  return doc
}

const styles = StyleSheet.create({
  thumbWrap: {
    height: 128,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  thumbDoc: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 6,
  },
  thumbBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbLogo: {
    width: 28,
    height: 28,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLogoImg: {
    width: '100%',
    height: '100%',
  },
  thumbLogoLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: '#bbb',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  thumbBrandInfo: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  thumbName: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  thumbNameClassic: {
    fontSize: 10,
    fontFamily: fonts.displaySemiBold,
    color: '#111',
  },
  thumbNameMinimal: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: '#111',
  },
  thumbContact: {
    fontSize: 8,
    color: '#888',
  },
  thumbDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f0f0f0',
  },
  thumbMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  thumbMetaLeft: {
    flex: 1,
    gap: 1,
  },
  thumbSectionLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#bbb',
  },
  thumbSectionLabelMinimal: {
    letterSpacing: 1.1,
    color: '#999',
  },
  thumbInvoiceNo: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  thumbStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  thumbStatusText: {
    fontSize: 7,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.3,
  },
  thumbLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  thumbLineCopy: {
    flex: 1,
    gap: 1,
  },
  thumbLineTitle: {
    fontSize: 8,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  thumbLineNote: {
    fontSize: 7,
    color: '#888',
  },
  thumbAmount: {
    fontSize: 8,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  thumbTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thumbTotalLabel: {
    fontSize: 8,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  thumbTotalValue: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
  },
  thumbAccentBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 'auto',
  },
  doc: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  docThumb: {
    borderRadius: radii.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    backgroundColor: '#fafafa',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  brandInfo: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  brandNameClassic: {
    fontSize: 17,
    fontFamily: fonts.displaySemiBold,
    color: '#111',
  },
  brandNameMinimal: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.3,
    color: '#111',
  },
  brandContact: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  sectionBorder: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#bbb',
    marginBottom: 6,
  },
  sectionLabelMinimal: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaLeft: {
    flex: 1,
    gap: 2,
  },
  invoiceNumber: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  issued: {
    fontSize: 12,
    color: '#888',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
  },
  billName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  linesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  linesHeadText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#aaa',
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  lineDesc: {
    flex: 1,
    gap: 2,
  },
  lineTitle: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  lineNote: {
    fontSize: 12,
    color: '#888',
  },
  lineAmount: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  totalsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  totalValue: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: '#111',
  },
  footer: {
    padding: 16,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 17,
  },
  viewBtn: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#fff',
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
})
