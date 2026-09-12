/** Toggle `.hv` for pre-filled or select fields (not needed for user-typed text). */
export function toggleFloatingLabel(
  el: HTMLElement | null | undefined,
  hasValue: boolean,
): void {
  if (!el) return
  el.classList.toggle('hv', hasValue)
}

export function syncSelectFloatingLabel(el: HTMLSelectElement | null | undefined): void {
  if (!el) return
  toggleFloatingLabel(el, el.value.trim().length > 0)
}

export function syncPrefilledFloatingLabels(
  container: HTMLElement | null | undefined,
): void {
  if (!container) return
  container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.f-input, .f-textarea').forEach((el) => {
    toggleFloatingLabel(el, el.value.trim().length > 0)
  })
  container.querySelectorAll<HTMLSelectElement>('.f-select').forEach(syncSelectFloatingLabel)
}
