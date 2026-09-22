import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Alert, Platform, Share } from 'react-native'
import type { Invoice } from '@rinse/core'
import { appApiFetch, appApiJson } from './app-api'
import { checkPremiumGate } from './subscription'

export type PortalScope = 'job' | 'photos' | 'invoice' | 'quote' | 'full'

export interface PortalLinkResult {
  url: string
  token: string
  expiresAt: string
}

export async function createPortalLink(input: {
  clientId: string
  scope: PortalScope
  jobId?: string
  quoteId?: string
}): Promise<PortalLinkResult> {
  const gate = await checkPremiumGate(input.scope === 'invoice' ? 'invoice_payment' : 'share_portal')
  if (!gate.allowed) {
    throw new Error('Active subscription required')
  }

  return appApiJson<PortalLinkResult>('/api/portal/create', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function copyTextToClipboard(text: string, successMessage = 'Copied to clipboard.'): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      Alert.alert('Copied', successMessage)
      return
    }
    throw new Error('Clipboard is not available in this browser.')
  }

  await Share.share({ message: text })
}

async function shareTextWithFallback(text: string, url?: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url })
        return
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url ?? text)
      Alert.alert('Copied', 'Link copied to clipboard.')
      return
    }
    throw new Error('Sharing is not available in this browser.')
  }

  await Share.share({ message: text, url })
}

export async function sharePortalUrl(url: string, message?: string): Promise<void> {
  const text = message ? `${message}\n${url}` : url
  await shareTextWithFallback(text, url)
}

export async function shareInvoicePdf(jobId: string, invoice: Invoice, portalUrl?: string): Promise<void> {
  const gate = await checkPremiumGate('invoice_pdf')
  if (!gate.allowed) {
    throw new Error('Active subscription required')
  }

  const res = await appApiFetch('/api/pdf/invoice', {
    method: 'POST',
    body: JSON.stringify({ jobId, invoiceId: invoice.id, portalUrl }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'PDF export failed')
  }

  const arrayBuffer = await res.arrayBuffer()
  await sharePdfBuffer(arrayBuffer, `${invoice.invoice_number}.pdf`)
}

export async function shareInspectionPdf(jobId: string): Promise<void> {
  const gate = await checkPremiumGate('export_pdf')
  if (!gate.allowed) {
    throw new Error('Active subscription required')
  }

  const res = await appApiFetch('/api/pdf/inspection', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Inspection PDF export failed')
  }

  const arrayBuffer = await res.arrayBuffer()
  await sharePdfBuffer(arrayBuffer, `inspection-${jobId.slice(0, 8)}.pdf`)
}

export async function shareTransformationPdf(jobId: string): Promise<void> {
  const gate = await checkPremiumGate('export_pdf')
  if (!gate.allowed) {
    throw new Error('Active subscription required')
  }

  const res = await appApiFetch('/api/pdf/transformation', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Transformation PDF export failed')
  }

  const arrayBuffer = await res.arrayBuffer()
  await sharePdfBuffer(arrayBuffer, `transform-${jobId.slice(0, 8)}.pdf`)
}

async function sharePdfBuffer(arrayBuffer: ArrayBuffer, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
    return
  }

  const base64 = arrayBufferToBase64(arrayBuffer)
  const path = `${FileSystem.cacheDirectory}${filename}`
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/pdf', dialogTitle: filename })
  } else {
    await Share.share({ url: path })
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary)
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    result += alphabet[a >> 2]
    result += alphabet[((a & 3) << 4) | (b >> 4)]
    result += i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '='
    result += i + 2 < bytes.length ? alphabet[c & 63] : '='
  }
  return result
}

export async function deleteAccount(businessName: string): Promise<void> {
  await appApiJson('/api/account/delete', {
    method: 'POST',
    body: JSON.stringify({ businessName, confirmed: true }),
  })
}

export const LEGAL_URLS = {
  privacy: 'https://rinsehq.com/privacy',
  terms: 'https://rinsehq.com/terms',
  customerTerms: 'https://rinsehq.com/terms/customers',
} as const
