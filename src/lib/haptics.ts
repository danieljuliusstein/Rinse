/** Light tap feedback on supported mobile browsers (PWA / Android). */
export function lightHaptic() {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(10)
  } catch {
    /* unsupported */
  }
}

/** Success / completion feedback (save, payment logged). */
export function successHaptic() {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate([12, 40, 12])
  } catch {
    /* unsupported */
  }
}

/** Swipe action completed. */
export function swipeHaptic() {
  lightHaptic()
}
