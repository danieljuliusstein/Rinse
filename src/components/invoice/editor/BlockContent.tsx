import { Image, StyleSheet, View } from 'react-native'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { resolveBusinessLogoSrc } from '@/src/lib/business-logo'
import type { EditorPreviewData, ElementAlign, ElementType } from '@/src/lib/invoice-editor'
import { DEFAULT_DOCUMENT_TITLE } from '@/src/lib/invoice-editor'
import { fonts } from '@/src/theme/typography'

export function BlockContent({
  type,
  preview,
  accentColor,
  align,
  logoUrl,
  documentTitle = DEFAULT_DOCUMENT_TITLE,
}: {
  type: ElementType
  preview: EditorPreviewData
  accentColor: string
  align: ElementAlign
  logoUrl?: string | null
  documentTitle?: string
}) {
  const textAlign = align
  const logoSrc = resolveBusinessLogoSrc(logoUrl ?? preview.logoUrl)
  const title = documentTitle.trim() || DEFAULT_DOCUMENT_TITLE

  switch (type) {
    case 'logo':
      return (
        <View style={styles.logoWrap}>
          {logoSrc ? (
            <Image source={{ uri: logoSrc }} style={styles.logo} resizeMode="cover" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <AppText style={styles.logoLabel}>LOGO</AppText>
            </View>
          )}
        </View>
      )

    case 'business':
      return (
        <View style={styles.block}>
          <AppText style={[styles.title, { textAlign }]} numberOfLines={1}>
            {preview.businessName}
          </AppText>
          {preview.businessEmail ? (
            <AppText style={[styles.muted, { textAlign }]} numberOfLines={1}>
              {preview.businessEmail}
            </AppText>
          ) : null}
          {preview.businessAddress ? (
            <AppText style={[styles.muted, { textAlign }]} numberOfLines={1}>
              {preview.businessAddress}
            </AppText>
          ) : null}
        </View>
      )

    case 'meta':
      return (
        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <AppText style={[styles.label, { color: accentColor, textAlign }]}>{title}</AppText>
            <AppText style={[styles.number, { textAlign }]}>{preview.invoiceNumber}</AppText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${accentColor}1A` }]}>
            <AppText style={[styles.statusText, { color: accentColor }]}>{preview.statusLabel}</AppText>
          </View>
        </View>
      )

    case 'lineItems':
      return (
        <View style={styles.block}>
          <View style={styles.linesHead}>
            <AppText style={styles.linesHeadText}>Service</AppText>
            <AppText style={styles.linesHeadText}>Amount</AppText>
          </View>
          {preview.lineItems.map((item, i) => (
            <View key={`${item.description}-${i}`} style={styles.lineRow}>
              <AppText style={styles.lineDesc} numberOfLines={1}>
                {item.description}
              </AppText>
              <AppText style={styles.lineAmt}>{fmt(item.amount)}</AppText>
            </View>
          ))}
        </View>
      )

    case 'totals':
      return (
        <View style={styles.block}>
          <View style={styles.totalRow}>
            <AppText style={[styles.muted, { textAlign: 'left' }]}>Subtotal</AppText>
            <AppText style={styles.lineAmt}>{fmt(preview.subtotal)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText style={[styles.totalLabel, { textAlign: 'left' }]}>Total</AppText>
            <AppText style={styles.totalValue}>{fmt(preview.total)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText style={[styles.muted, { textAlign: 'left' }]}>Balance due</AppText>
            <AppText style={styles.lineAmt}>{fmt(preview.balanceDue)}</AppText>
          </View>
        </View>
      )

    case 'notes':
      return (
        <AppText style={[styles.muted, { textAlign }]}>
          {preview.termsFooter || 'Thanks for choosing us.'}
        </AppText>
      )

    default:
      return null
  }
}

const styles = StyleSheet.create({
  block: {
    gap: 2,
  },
  logoWrap: {
    width: 56,
    height: 56,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c7c7cc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f7',
  },
  logoLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#8e8e93',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#111',
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  number: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#111',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
  },
  linesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  linesHeadText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  lineDesc: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#111',
  },
  lineAmt: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#111',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 3,
  },
  totalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#111',
  },
  totalValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#111',
  },
})
