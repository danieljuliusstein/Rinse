import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

/** SecureStore on native; localStorage on web (expo-secure-store is native-only). */
export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}
