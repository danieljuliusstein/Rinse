import * as WebBrowser from 'expo-web-browser'
import { Alert } from 'react-native'
import { embedCalendarPageUrl } from '@/src/lib/booking-embed'
import { appOrigin } from '@/src/lib/org-slug'

/** Open the public booking calendar embed (what clients see) in an in-app browser. */
export async function openBookingCalendarPreview(slug: string): Promise<void> {
  const trimmed = slug.trim()
  if (!trimmed) {
    Alert.alert('Preview unavailable', 'Your booking link is not set up yet.')
    return
  }

  const url = embedCalendarPageUrl(appOrigin(), trimmed)
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      enableBarCollapsing: true,
    })
  } catch (e) {
    Alert.alert(
      'Could not open preview',
      e instanceof Error ? e.message : 'Check your connection and try again.',
    )
  }
}
