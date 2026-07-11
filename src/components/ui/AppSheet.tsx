import type { ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useNavigation } from 'expo-router'
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { useSheetDismissPanHandlers } from '@/src/hooks/useSheetDismissGesture'
import { tabDockSafeBottom } from '@/src/hooks/useTabDockPadding'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { lightHaptic, mediumHaptic } from '@/src/lib/haptics'
import { closeSheetSpring, openSheetSpring } from '@/src/lib/sheet-motion'
import { safeGoBack } from '@/src/lib/safe-go-back'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

/**
 * Screen `safeAreaInsets: { bottom: 0 }` lets the sheet bleed to the physical
 * bottom (avoids the tab-dock gap). Context insets may then read 0 — fall back
 * to window metrics, then tighten like the tab dock so the footer isn't floating.
 */
function useSheetSafeBottom(): number {
  const insets = useSafeAreaInsets()
  const windowBottom = initialWindowMetrics?.insets.bottom ?? 0
  return tabDockSafeBottom(Math.max(insets.bottom, windowBottom))
}

interface AppSheetProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  onClose?: () => void
  /**
   * `route` — full-screen stack route (jobs/new, clients/edit, …).
   * `modal` — overlay opened from within a screen (invoice actions, …).
   */
  presentation?: 'route' | 'modal'
  /** Required when `presentation="modal"`. Ignored for route sheets. */
  visible?: boolean
}

const SHEET_OFFSCREEN = 420
const SHEET_MAX_HEIGHT = Platform.OS === 'web' ? ('92%' as unknown as number) : '92%'

export function AppSheet({
  title,
  subtitle,
  children,
  footer,
  onClose,
  presentation = 'route',
  visible = true,
}: AppSheetProps) {
  const navigation = useNavigation()
  const reduceMotion = useReduceMotion()
  const safeBottom = useSheetSafeBottom()
  const isModal = presentation === 'modal'

  const scrimOpacity = useSharedValue(0)
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN)

  const finishClose = useCallback(() => {
    if (onClose) onClose()
    else if (!isModal) safeGoBack(navigation, '/(tabs)')
  }, [isModal, navigation, onClose])

  useEffect(() => {
    if (isModal && !visible) return
    if (reduceMotion) {
      scrimOpacity.value = 1
      sheetTranslateY.value = 0
      return
    }
    mediumHaptic()
    openSheetSpring(sheetTranslateY, scrimOpacity)
  }, [isModal, reduceMotion, scrimOpacity, sheetTranslateY, visible])

  const requestClose = useCallback(() => {
    lightHaptic()
    if (reduceMotion) {
      finishClose()
      return
    }
    closeSheetSpring(sheetTranslateY, scrimOpacity, SHEET_OFFSCREEN, finishClose)
  }, [finishClose, reduceMotion, scrimOpacity, sheetTranslateY])

  const dismissPanHandlers = useSheetDismissPanHandlers(
    sheetTranslateY,
    scrimOpacity,
    SHEET_OFFSCREEN,
    finishClose,
    !reduceMotion,
  )

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }))

  const body = (
    <View style={styles.root}>
      <Pressable style={styles.scrimPress} onPress={requestClose} accessibilityLabel="Close sheet">
        <Animated.View style={[styles.scrim, scrimStyle]} />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: safeBottom }]}>
          <View style={styles.dragRegion} {...dismissPanHandlers}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <AppText variant="h2">{title}</AppText>
                {subtitle ? (
                  <AppText variant="caption" style={styles.subtitle}>
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
              <Pressable onPress={requestClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Close">
                <View>
                  <X size={20} color={colors.textMuted} weight="bold" />
                </View>
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )

  if (isModal) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={requestClose}>
        {body}
      </Modal>
    )
  }

  return body
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  scrimPress: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  keyboard: {
    width: '100%',
    maxHeight: SHEET_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: '100%',
    width: '100%',
    overflow: 'hidden',
    ...shadows.card,
  },
  dragRegion: {
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 4,
    marginTop: 2,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
})
