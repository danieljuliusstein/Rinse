import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

async function run(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return
  try {
    await fn()
  } catch {
    /* unsupported simulator / user setting */
  }
}

/** Light tap — row press, primary button. */
export function lightHaptic(): void {
  void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
}

/** FAB open, tab switch, picker tick. */
export function selectionHaptic(): void {
  void run(() => Haptics.selectionAsync())
}

/** Sheet presented, meaningful toggle. */
export function mediumHaptic(): void {
  void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))
}

/** Save / payment logged / sync complete. */
export function successHaptic(): void {
  void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
}

/** Destructive confirm, validation error. */
export function warningHaptic(): void {
  void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
}

/** Swipe action completed. */
export function swipeHaptic(): void {
  lightHaptic()
}
