import { Linking, Platform } from 'react-native'

/**
 * Open an external URL. On web, RN's Linking.openURL uses window.open(), which
 * browsers block after await (lost user-gesture). For mailto/sms/tel we click a
 * temporary <a> so the OS handler opens without replacing the SPA via
 * location.assign (which unloads the app).
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    if (/^(mailto:|sms:|smsto:|tel:)/i.test(url)) {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.rel = 'noopener noreferrer'
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      return
    }
    const opened = typeof window !== 'undefined' ? window.open(url, '_blank', 'noopener') : null
    if (!opened && typeof window !== 'undefined') {
      window.location.assign(url)
    }
    return
  }
  await Linking.openURL(url)
}
