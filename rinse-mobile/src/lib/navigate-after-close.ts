/**
 * Close an overlay/modal, then navigate on the next frame so RN Modal
 * teardown does not drop the push in the same tick.
 */
export function navigateAfterClose(close: (() => void) | undefined, navigate: () => void): void {
  close?.()
  requestAnimationFrame(() => {
    navigate()
  })
}
