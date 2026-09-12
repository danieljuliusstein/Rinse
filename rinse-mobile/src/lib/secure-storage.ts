import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as SecureStore from 'expo-secure-store'

let secureStoreUsable: boolean | null = null
const memory = new Map<string, string>()

function filePath(key: string): string | null {
  const root = FileSystem.documentDirectory
  if (!root) return null
  return `${root}rinse-kv/${encodeURIComponent(key)}.txt`
}

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  if (secureStoreUsable != null) return secureStoreUsable
  try {
    const probe = '__rinse_secure_probe__'
    await SecureStore.setItemAsync(probe, '1')
    await SecureStore.deleteItemAsync(probe)
    secureStoreUsable = true
  } catch {
    secureStoreUsable = false
    console.warn('[secure-storage] SecureStore unavailable — using file/memory fallback')
  }
  return secureStoreUsable
}

async function fileGet(key: string): Promise<string | null> {
  const path = filePath(key)
  if (!path) return memory.get(key) ?? null
  try {
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) return memory.get(key) ?? null
    return await FileSystem.readAsStringAsync(path)
  } catch {
    return memory.get(key) ?? null
  }
}

async function fileSet(key: string, value: string): Promise<void> {
  memory.set(key, value)
  const path = filePath(key)
  if (!path) return
  try {
    const dir = path.slice(0, path.lastIndexOf('/'))
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
    await FileSystem.writeAsStringAsync(path, value)
  } catch {
    // memory already set
  }
}

async function fileDelete(key: string): Promise<void> {
  memory.delete(key)
  const path = filePath(key)
  if (!path) return
  try {
    await FileSystem.deleteAsync(path, { idempotent: true })
  } catch {
    // ignore
  }
}

/**
 * Prefer SecureStore on native; fall back to document file storage when keychain
 * entitlements are missing (ad-hoc / CODE_SIGNING_ALLOWED=NO builds).
 * Web uses localStorage.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    }
    if (await canUseSecureStore()) return await SecureStore.getItemAsync(key)
    return await fileGet(key)
  } catch (err) {
    console.warn('[secure-storage] get failed:', err instanceof Error ? err.message : err)
    return memory.get(key) ?? null
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
      return
    }
    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(key, value)
      return
    }
    await fileSet(key, value)
  } catch (err) {
    console.warn('[secure-storage] set failed:', err instanceof Error ? err.message : err)
    memory.set(key, value)
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
      return
    }
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(key)
      return
    }
    await fileDelete(key)
  } catch (err) {
    console.warn('[secure-storage] delete failed:', err instanceof Error ? err.message : err)
    memory.delete(key)
  }
}
