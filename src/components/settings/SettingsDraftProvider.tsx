'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { loadSettingsAsync, saveSettingsAsync, type AppSettings } from '@/lib/settings'

type SaveGuard = () => boolean | Promise<boolean>

interface SettingsDraftContextValue {
  settings: AppSettings | null
  ready: boolean
  dirty: boolean
  savedFlash: boolean
  logoFile: File | null
  setLogoFile: (file: File | null) => void
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  registerSaveGuard: (guard: SaveGuard | null) => void
  save: () => Promise<boolean>
  reload: () => Promise<void>
}

const SettingsDraftContext = createContext<SettingsDraftContextValue | null>(null)

export function SettingsDraftProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [ready, setReady] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [logoFile, setLogoFileState] = useState<File | null>(null)
  const saveGuardRef = useRef<SaveGuard | null>(null)

  const registerSaveGuard = useCallback((guard: SaveGuard | null) => {
    saveGuardRef.current = guard
  }, [])

  const reload = useCallback(async () => {
    const loaded = await loadSettingsAsync()
    setSettings(loaded)
    setReady(true)
    setDirty(false)
    setLogoFileState(null)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const setLogoFile = useCallback((file: File | null) => {
    setLogoFileState(file)
    setDirty(true)
  }, [])

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current))
    setDirty(true)
  }, [])

  const save = useCallback(async () => {
    if (!settings) return false
    const guard = saveGuardRef.current
    if (guard) {
      const ok = await guard()
      if (!ok) return false
    }
    try {
      const savedSettings = await saveSettingsAsync(settings, logoFile)
      setSettings(savedSettings)
      setLogoFileState(null)
      setDirty(false)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2000)
      return true
    } catch (error) {
      throw error
    }
  }, [settings, logoFile])

  const value = useMemo(
    () => ({
      settings,
      ready,
      dirty,
      savedFlash,
      logoFile,
      setLogoFile,
      update,
      registerSaveGuard,
      save,
      reload,
    }),
    [settings, ready, dirty, savedFlash, logoFile, setLogoFile, update, registerSaveGuard, save, reload]
  )

  return <SettingsDraftContext.Provider value={value}>{children}</SettingsDraftContext.Provider>
}

export function useSettingsDraft() {
  const ctx = useContext(SettingsDraftContext)
  if (!ctx) throw new Error('useSettingsDraft must be used within SettingsDraftProvider')
  return ctx
}
