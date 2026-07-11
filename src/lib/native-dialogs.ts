import { ActionSheetIOS, Alert, Platform } from 'react-native'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
}

/** iOS ActionSheet / Android Alert — use for subscribe, destructive, and branch choices. */
export function confirmNativeAction({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmOptions): void {
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
