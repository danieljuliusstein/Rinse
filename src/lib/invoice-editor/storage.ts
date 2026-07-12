import { DEFAULT_DOCUMENT_TITLE } from './constants'
import { getOrganizationId } from '@/src/lib/org'
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/src/lib/secure-storage'
import type { ElementAlign, ElementType, InvoiceEditorLayout, InvoiceEditorTemplateId, PlacedElement } from './types'

const STORAGE_PREFIX = 'rinse.invoice-layout.'

function storageKey(orgId: string): string {
  return `${STORAGE_PREFIX}${orgId}`
}

function isElementType(v: unknown): v is ElementType {
  return (
    v === 'logo' ||
    v === 'business' ||
    v === 'meta' ||
    v === 'lineItems' ||
    v === 'totals' ||
    v === 'notes' ||
    v === 'bodyText' ||
    v === 'service'
  )
}

function parseElement(raw: unknown): PlacedElement | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string' || !isElementType(o.type)) return null
  const align: ElementAlign =
    o.align === 'center' || o.align === 'right' ? o.align : 'left'
  return {
    id: o.id,
    type: o.type,
    x: Number(o.x) || 0,
    y: Number(o.y) || 0,
    w: Number(o.w) || 48,
    h: Number(o.h) || 48,
    align,
    color: typeof o.color === 'string' ? o.color : '#22c55e',
    locked: o.locked === true,
    spacing: typeof o.spacing === 'number' ? o.spacing : 12,
    text: typeof o.text === 'string' ? o.text : undefined,
    serviceDescription: typeof o.serviceDescription === 'string' ? o.serviceDescription : undefined,
    serviceAmount: typeof o.serviceAmount === 'number' ? o.serviceAmount : undefined,
  }
}

function parseLayout(raw: string): InvoiceEditorLayout | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(data.elements)) return null
    const elements = data.elements.map(parseElement).filter((e): e is PlacedElement => e != null)
    if (elements.length === 0) return null
    const templateId: InvoiceEditorTemplateId =
      data.templateId === 'classic' || data.templateId === 'minimal' ? data.templateId : 'rinse'
    return {
      elements,
      accentColor: typeof data.accentColor === 'string' ? data.accentColor : '#22c55e',
      snapEnabled: data.snapEnabled !== false,
      templateId,
      documentTitle:
        typeof data.documentTitle === 'string' && data.documentTitle.trim()
          ? data.documentTitle.trim()
          : DEFAULT_DOCUMENT_TITLE,
    }
  } catch {
    return null
  }
}

export async function loadInvoiceLayout(orgId?: string | null): Promise<InvoiceEditorLayout | null> {
  const id = orgId ?? getOrganizationId()
  if (!id) return null
  const raw = await getSecureItem(storageKey(id))
  if (!raw) return null
  return parseLayout(raw)
}

export async function saveInvoiceLayout(
  layout: InvoiceEditorLayout,
  orgId?: string | null,
): Promise<void> {
  const id = orgId ?? getOrganizationId()
  if (!id) throw new Error('Sign in to save invoice layout')
  await setSecureItem(storageKey(id), JSON.stringify(layout))
}

export async function clearInvoiceLayout(orgId?: string | null): Promise<void> {
  const id = orgId ?? getOrganizationId()
  if (!id) return
  await deleteSecureItem(storageKey(id))
}
