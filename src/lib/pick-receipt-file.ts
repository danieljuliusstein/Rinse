/** Open a native file picker for a receipt image/PDF. Resolves null if cancelled. */
export function pickReceiptFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf,application/pdf'
    input.style.display = 'none'

    let settled = false
    const cleanup = () => {
      input.remove()
    }
    const finish = (file: File | null) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(file)
    }

    input.addEventListener('change', () => {
      finish(input.files?.[0] ?? null)
    })
    // Dialog close often fires window focus before `change` — wait, then read files.
    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => {
          if (settled) return
          finish(input.files?.[0] ?? null)
        }, 500)
      },
      { once: true },
    )
    document.body.appendChild(input)
    input.click()
  })
}
