import { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { InvoiceLayoutDocument } from '@/src/components/invoice/InvoiceLayoutDocument'
import { AppText } from '@/src/components/ui'
import { accentTint } from '@/src/lib/brand-color'
import { resolveBusinessLogoSrc } from '@/src/lib/business-logo'
import { DEFAULT_DOCUMENT_TITLE, loadInvoiceLayout, type PlacedElement } from '@/src/lib/invoice-editor'
import {
  formatInvoiceMoney,
  INVOICE_STATUS_COLORS,
  type InvoiceViewModel,
} from '@/src/lib/invoice-layout'
import { openPortalPreview } from '@/src/lib/open-portal-preview'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

/** Live invoice document — custom layout when saved; else template flow layout. */
export function InvoiceDocumentBody({ model }: { model: InvoiceViewModel }) {
  const [elements, setElements] = useState<PlacedElement[] | null>(null)
  const [documentTitle, setDocumentTitle] = useState<string | undefined>()
  const [layoutReady, setLayoutReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadInvoiceLayout().then((layout) => {
      if (cancelled) return
      setElements(layout?.elements?.length ? layout.elements : null)
      setDocumentTitle(layout?.documentTitle)
      setLayoutReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [model.accent, model.template])

  if (!layoutReady) {
    return <View style={[styles.doc, styles.docLoading]} />
  }

  if (elements) {
    return (
      <InvoiceLayoutDocument
        model={model}
        elements={elements}
        accentColor={model.accent}
        documentTitle={documentTitle}
      />
    )
  }

  return <InvoiceDocumentFlow model={model} documentTitle={documentTitle} />
}

function InvoiceDocumentFlow({
  model,
  documentTitle,
}: {
  model: InvoiceViewModel
  documentTitle?: string
}) {
  const logoSrc = resolveBusinessLogoSrc(model.logoUrl)
  const statusColor = INVOICE_STATUS_COLORS[model.statusTone] ?? INVOICE_STATUS_COLORS.draft
  const accent = model.accent
  const template = model.template
  const nameStyle =
    template === 'classic'
      ? styles.brandNameClassic
      : template === 'minimal'
        ? styles.brandNameMinimal
        : styles.brandName
  const labelStyle = template === 'minimal' ? styles.sectionLabelMinimal : styles.sectionLabel
  const labelColor = template === 'minimal' ? undefined : { color: accent }

  return (
    <View style={styles.doc}>
      <View style={styles.brandRow}>
        <View style={styles.logoWrap}>
          {logoSrc ? (
            <Image source={{ uri: logoSrc }} style={styles.logo} resizeMode="cover" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: accentTint(accent, 0.15) }]} />
          )}
        </View>
        <View style={styles.brandInfo}>
          <AppText style={nameStyle} numberOfLines={1}>
            {model.businessName}
          </AppText>
          {model.businessEmail ? (
            <AppText style={styles.brandContact} numberOfLines={1}>
              {model.businessEmail}
            </AppText>
          ) : null}
          {model.businessPhone ? (
            <AppText style={styles.brandContact} numberOfLines={1}>
              {model.businessPhone}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionBorder}>
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <AppText style={[labelStyle, labelColor]}>
              {(documentTitle?.trim() || DEFAULT_DOCUMENT_TITLE)}
            </AppText>
            <AppText style={styles.invoiceNumber}>{model.invoiceNumber}</AppText>
            <AppText style={styles.issued}>Issued {model.issuedDateLabel}</AppText>
            {model.poNumber ? <AppText style={styles.issued}>PO {model.poNumber}</AppText> : null}
          </View>
          <View style={[styles.statusPill, { backgroundColor: accentTint(statusColor, 0.12) }]}>
            <AppText style={[styles.statusText, { color: statusColor }]}>{model.statusLabel}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.sectionBorder}>
        <AppText style={[labelStyle, labelColor]}>Bill to</AppText>
        <AppText style={styles.billName}>{model.billToName}</AppText>
        {model.billToAddress ? <AppText style={styles.billMeta}>{model.billToAddress}</AppText> : null}
        {model.billToEmail ? <AppText style={styles.billMeta}>{model.billToEmail}</AppText> : null}
        {model.billToPhone ? <AppText style={styles.billMeta}>{model.billToPhone}</AppText> : null}
      </View>

      <View style={styles.sectionBorder}>
        <AppText style={[labelStyle, labelColor]}>Service</AppText>
        <AppText style={styles.serviceLine}>{model.serviceContextLine}</AppText>
      </View>

      <View style={styles.section}>
        <View style={styles.linesHead}>
          <AppText style={styles.linesHeadText}>Description</AppText>
          <AppText style={styles.linesHeadText}>Amount</AppText>
        </View>
        {model.lineItems.map((line, index) => (
          <View key={`${line.description}-${index}`} style={styles.lineRow}>
            <View style={styles.lineDesc}>
              <AppText style={styles.lineTitle}>{line.description}</AppText>
              {line.note ? <AppText style={styles.lineNote}>{line.note}</AppText> : null}
            </View>
            <AppText style={styles.lineAmount}>{formatInvoiceMoney(line.amount)}</AppText>
          </View>
        ))}

        <View style={styles.totalsDivider} />
        <View style={styles.totalRow}>
          <AppText style={styles.mutedLabel}>Subtotal</AppText>
          <AppText style={styles.mutedValue}>{formatInvoiceMoney(model.subtotal)}</AppText>
        </View>
        {model.showTip ? (
          <View style={styles.totalRow}>
            <AppText style={styles.mutedLabel}>Tip</AppText>
            <AppText style={styles.mutedValue}>{formatInvoiceMoney(model.tip)}</AppText>
          </View>
        ) : null}
        {model.showDiscount && model.discount != null ? (
          <View style={styles.totalRow}>
            <AppText style={styles.mutedLabel}>Discount</AppText>
            <AppText style={styles.mutedValue}>-{formatInvoiceMoney(model.discount)}</AppText>
          </View>
        ) : null}
        {model.showTax && model.taxAmount != null ? (
          <View style={styles.totalRow}>
            <AppText style={styles.mutedLabel}>
              Tax{model.taxRate ? ` (${model.taxRate}%)` : ''}
            </AppText>
            <AppText style={styles.mutedValue}>{formatInvoiceMoney(model.taxAmount)}</AppText>
          </View>
        ) : null}
        <View style={styles.totalRow}>
          <AppText style={styles.totalLabel}>Total</AppText>
          <AppText style={styles.totalValue}>{formatInvoiceMoney(model.total)}</AppText>
        </View>
        <View style={styles.totalRow}>
          <AppText style={[styles.totalLabel, { color: accent }]}>Balance due</AppText>
          <AppText style={[styles.totalValue, { color: accent }]}>
            {formatInvoiceMoney(model.balanceDue)}
          </AppText>
        </View>
      </View>

      {model.showPayments ? (
        <View style={styles.sectionBorder}>
          <AppText style={[labelStyle, labelColor]}>Payments</AppText>
          {model.payments.map((p, i) => (
            <View key={`${p.date}-${i}`} style={styles.paymentRow}>
              <AppText style={styles.billMeta}>
                {p.method} · {p.date}
              </AppText>
              <AppText style={styles.lineAmount}>{formatInvoiceMoney(p.amount)}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <AppText style={styles.footerText}>{model.termsFooter}</AppText>
        {model.questionsLine ? <AppText style={styles.footerText}>{model.questionsLine}</AppText> : null}
        {model.portalUrl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View invoice online"
            onPress={() => void openPortalPreview(model.portalUrl!)}
            style={[styles.viewBtn, webInlinePressableReset, { backgroundColor: accent }]}
          >
            <AppText style={styles.viewBtnText}>View invoice online</AppText>
          </Pressable>
        ) : null}
        {template !== 'minimal' ? <View style={[styles.accentBar, { backgroundColor: accent }]} /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  doc: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  docLoading: {
    minHeight: 120,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  logo: {
    width: 44,
    height: 44,
  },
  logoPlaceholder: {
    flex: 1,
    borderRadius: 10,
  },
  brandInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  brandName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  brandNameClassic: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  brandNameMinimal: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    letterSpacing: 0.3,
    color: colors.textPrimary,
  },
  brandContact: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#bbb',
    marginBottom: 4,
  },
  sectionLabelMinimal: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  metaLeft: {
    flex: 1,
    gap: 2,
  },
  invoiceNumber: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  issued: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  statusText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  billName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  billMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  serviceLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  linesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  linesHeadText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 8,
  },
  lineDesc: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  lineTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  lineNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  lineAmount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  totalsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  mutedLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  mutedValue: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  totalValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  viewBtn: {
    marginTop: spacing.xs,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#ffffff',
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    marginTop: spacing.xs,
  },
})
