import { useCallback, useRef, useState } from 'react'
import type { TextInput } from 'react-native'

/**
 * Header search toggle for module list screens.
 * Field stays visible while open or while a query is present.
 */
export function useModuleSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<TextInput>(null)

  const active = open || query.trim().length > 0
  const visible = active

  const toggle = useCallback(() => {
    if (open || query.trim().length > 0) {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
      return
    }
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open, query])

  return { query, setQuery, visible, active, toggle, inputRef }
}
