const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null
  )
}

/** Trap Tab focus inside a modal container. Returns cleanup. */
export function trapFocus(container: HTMLElement, initialFocusSelector?: string): () => void {
  const focusInitial = () => {
    const preferred = initialFocusSelector
      ? container.querySelector<HTMLElement>(initialFocusSelector)
      : null
    const focusable = getFocusableElements(container)
    const target = preferred ?? focusable[0]
    target?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const elements = getFocusableElements(container)
    if (elements.length === 0) return

    const first = elements[0]
    const last = elements[elements.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  window.requestAnimationFrame(focusInitial)

  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}
