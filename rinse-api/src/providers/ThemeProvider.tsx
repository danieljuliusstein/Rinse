'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { applyThemeToDocument, getStoredTheme, setStoredTheme, type ThemeMode } from '@/lib/theme'
import { loadSettings, saveSettings } from '@/lib/settings'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = getStoredTheme()
    const settings = loadSettings()
    const mode = settings.appearance === 'dark' ? 'dark' : stored
    setThemeState(mode)
    applyThemeToDocument(mode)
  }, [])

  const setTheme = useCallback((mode: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    const next = typeof mode === 'function' ? mode(theme) : mode
    setThemeState(next)
    setStoredTheme(next)
    applyThemeToDocument(next)
    const settings = loadSettings()
    saveSettings({ ...settings, appearance: next })
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
