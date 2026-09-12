import { Pressable, StyleSheet, View } from 'react-native'
import type { ReactNode } from 'react'
import { AppText } from '@/src/components/ui/AppText'
import { colors, webInlinePressableReset } from '@/src/theme/colors'
import { lightHaptic } from '@/src/lib/haptics'

/** Shared header circle size — matches Home settings / pipeline icons. */
export const HEADER_ICON_SIZE = 34

export function IconHeaderButton({
  label,
  onPress,
  children,
  badge,
  dot,
  active,
}: {
  label: string
  onPress: () => void
  children: ReactNode
  badge?: string | number
  dot?: boolean
  /** Highlight when a toggle (e.g. search) is open. */
  active?: boolean
}) {
  const badgeLabel =
    badge == null ? null : typeof badge === 'number' ? (badge > 9 ? '9+' : String(badge)) : badge

  return (
    <Pressable
      onPress={() => {
        lightHaptic()
        onPress()
      }}
      style={({ pressed }) => [
        styles.btn,
        webInlinePressableReset,
        active && styles.btnActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active ? { selected: true } : undefined}
      children={
        <View style={styles.btnInner}>
          {children}
          {badgeLabel ? (
            <View style={styles.badge}>
              <AppText variant="caption" style={styles.badgeText}>
                {badgeLabel}
              </AppText>
            </View>
          ) : null}
          {dot && !badgeLabel ? <View style={styles.dot} /> : null}
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  btn: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: HEADER_ICON_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: 'relative',
  },
  btnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  pressed: {
    opacity: 0.85,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.green,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
})
