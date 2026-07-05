import { useDebounce } from 'use-debounce'

const SEARCH_DEBOUNCE_MS = 300

/** Debounce live search / typeahead input before filtering or API calls. */
export function useDebouncedSearch<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced] = useDebounce(value, delayMs)
  return debounced
}

export { SEARCH_DEBOUNCE_MS }
