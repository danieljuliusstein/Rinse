import { ActionSheetIOS, Alert, Platform } from 'react-native'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
}

/**
 * Confirm dialog that works on iOS / Android / web.
 * Note: react-native-web's `Alert.alert` is a no-op — never use it for confirms on web.
 * Prefer a custom AppSheet for new product flows; this is for rare system-style confirms.
 */
export function confirmNativeAction({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmOptions): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    const body = message ? `${title}\n\n${message}` : title
    if (window.confirm(body)) onConfirm()
    return
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [confirmLabel, cancelLabel],
        cancelButtonIndex: 1,
        destructiveButtonIndex: destructive ? 0 : undefined,
      },
      (index) => {
        if (index === 0) onConfirm()
      },
    )
    return
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ])
}
