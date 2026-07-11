import { FlashList, type FlashListProps } from '@shopify/flash-list'

/** FlashList v2 wrapper — auto item sizing; use on tab list screens. */
export function AppFlashList<T>(props: FlashListProps<T>) {
  return <FlashList {...props} />
}
