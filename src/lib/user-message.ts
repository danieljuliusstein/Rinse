import { Alert, Platform } from 'react-native'

/** User-visible feedback — Alert on native; window.alert on web (RN Alert is easy to miss). */
export function showUserMessage(title: string, message?: string): void {
  const body = message ? `${title}\n\n${message}` : title
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(body)
    return
  }
  if (message) {
    Alert.alert(title, message)
  } else {
    Alert.alert(title)
  }
}

export function showError(title: string, message: string): void {
  showUserMessage(title, message)
}
