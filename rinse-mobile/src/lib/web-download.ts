/** Browser file download — matches PWA `triggerDownload` (works after async fetch on most browsers). */
export function triggerWebDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') {
    throw new Error('Downloads are not available in this environment.')
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadTextOnWeb(filename: string, content: string, mimeType: string): void {
  triggerWebDownload(new Blob([content], { type: mimeType }), filename)
}

export function downloadPdfOnWeb(filename: string, arrayBuffer: ArrayBuffer): void {
  triggerWebDownload(new Blob([arrayBuffer], { type: 'application/pdf' }), filename)
}
