import { Platform, type ViewProps } from 'react-native'

type WebSurfaceProps = Partial<ViewProps> & { dataSet?: Record<string, string> }

const HIDE_SCROLLBAR_SURFACE_CSS = `
[data-hide-scrollbar],
[data-hide-scrollbar] *,
[data-invoice-surface],
[data-invoice-surface] * {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
[data-hide-scrollbar] *::-webkit-scrollbar,
[data-invoice-surface] *::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
`

const INVOICE_SURFACE_STYLE_ID = 'rinse-invoice-surface-scrollbar'

/** Web only — inject global CSS to hide scrollbars on invoice screens. */
export function installInvoiceSurfaceScrollbarStyles(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  if (document.getElementById(INVOICE_SURFACE_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = INVOICE_SURFACE_STYLE_ID
  style.textContent = HIDE_SCROLLBAR_SURFACE_CSS
  document.head.appendChild(style)
}

/** Marks a view tree — web hides scrollbars via installInvoiceSurfaceScrollbarStyles. */
export const hideScrollbarSurfaceProps: WebSurfaceProps =
  Platform.OS === 'web' ? { dataSet: { hideScrollbar: '' } } : {}

/** @deprecated Use hideScrollbarSurfaceProps — kept for invoice screens. */
export const invoiceSurfaceProps: WebSurfaceProps =
  Platform.OS === 'web' ? { dataSet: { invoiceSurface: '' } } : {}

export const noScrollbarScrollProps = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
} as const
