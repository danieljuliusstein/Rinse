import { useMemo } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { BlockContent } from '@/src/components/invoice/editor/BlockContent'
import {
  PAPER_HEIGHT,
  PAPER_WIDTH,
  type EditorPreviewData,
  type PlacedElement,
} from '@/src/lib/invoice-editor'
import type { InvoiceViewModel } from '@/src/lib/invoice-layout'
import { colors, radii } from '@/src/theme/colors'

function modelToPreview(model: InvoiceViewModel): EditorPreviewData {
  return {
    businessName: model.businessName,
    businessEmail: model.businessEmail ?? '',
    businessAddress: model.businessAddress ?? '',
    businessPhone: model.businessPhone ?? '',
    logoUrl: model.logoUrl,
    invoiceNumber: model.invoiceNumber,
    statusLabel: model.statusLabel,
    lineItems: model.lineItems.map((l) => ({ description: l.description, amount: l.amount })),
    subtotal: model.subtotal,
    total: model.total,
    balanceDue: model.balanceDue,
    termsFooter: model.termsFooter,
  }
}

/** Freeform layout document — positions from Settings → Invoicing editor. */
export function InvoiceLayoutDocument({
  model,
  elements,
  accentColor,
  documentTitle,
}: {
  model: InvoiceViewModel
  elements: PlacedElement[]
  accentColor: string
  documentTitle?: string
}) {
  const { width: windowWidth } = useWindowDimensions()
  const scale = Math.min(1, (Math.min(windowWidth - 32, 428) ) / PAPER_WIDTH)
  const preview = useMemo(() => modelToPreview(model), [model])

  return (
    <View
      style={[
        styles.shell,
        {
          width: PAPER_WIDTH * scale,
          height: PAPER_HEIGHT * scale,
          alignSelf: 'center',
        },
      ]}
    >
      <View
        style={[
          styles.paper,
          {
            width: PAPER_WIDTH,
            height: PAPER_HEIGHT,
            left: 0,
            top: 0,
            transform: [{ scale }],
            transformOrigin: 'top left',
          },
        ]}
      >
        {elements.map((el) => (
          <View
            key={el.id}
            style={[
              styles.block,
              el.type === 'logo' ? styles.blockLogo : null,
              {
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.type === 'logo' ? el.h : undefined,
                minHeight: el.h,
              },
            ]}
          >
            <BlockContent
              type={el.type}
              preview={preview}
              accentColor={el.color || accentColor}
              align={el.align}
              logoUrl={model.logoUrl}
              documentTitle={documentTitle}
              element={el}
              logoSize={el.type === 'logo' ? el.w : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  paper: {
    position: 'absolute',
    backgroundColor: colors.surface,
  },
  block: {
    position: 'absolute',
    padding: 2,
  },
  blockLogo: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 8,
  },
})
