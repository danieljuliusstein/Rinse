let lockCount = 0
let scrollY = 0

/** Prevent background page scroll while a modal/sheet is open (incl. iOS). */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    scrollY = window.scrollY
    const { style } = document.body
    document.documentElement.style.overflow = 'hidden'
    style.overflow = 'hidden'
    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.left = '0'
    style.right = '0'
    style.width = '100%'
  }
  lockCount += 1
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return
  if (lockCount <= 0) return
  lockCount -= 1
  if (lockCount === 0) {
    const { style } = document.body
    document.documentElement.style.overflow = ''
    style.overflow = ''
    style.position = ''
    style.top = ''
    style.left = ''
    style.right = ''
    style.width = ''
    window.scrollTo(0, scrollY)
  }
}
