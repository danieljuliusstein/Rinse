import type { ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useNavigation } from 'expo-router'
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { useSheetDismissGesture } from '@/src/hooks/useSheetDismissGesture'
import { tabDockSafeBottom } from '@/src/hooks/useTabDockPadding'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { lightHaptic, mediumHaptic } from '@/src/lib/haptics'
import { closeSheetSpring, openSheetSpring } from '@/src/lib/sheet-motion'
import { safeGoBack } from '@/src/lib/safe-go-back'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

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
  presentation?: 'route' | 'modal'
  visible?: boolean
}

const SHEET_OFFSCREEN_FALLBACK = 640
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
  const { height: windowHeight } = useWindowDimensions()
  const sheetOffscreen = Math.max(windowHeight + 48, SHEET_OFFSCREEN_FALLBACK)

  const scrimOpacity = useSharedValue(0)
  const sheetTranslateY = useSharedValue(sheetOffscreen)

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
    closeSheetSpring(sheetTranslateY, scrimOpacity, sheetOffscreen, finishClose)
  }, [finishClose, reduceMotion, scrimOpacity, sheetOffscreen, sheetTranslateY])

  const dismissPanHandlers = useSheetDismissGesture(
    sheetTranslateY,
    scrimOpacity,
    sheetOffscreen,
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
        <Animated.View style={[styles.scrim, scrimStyle]} pointerEvents="none" />
      </Pressable>

      {/*
        Transform the whole bottom stack so KeyboardAvoidingView padding and
        translateY don't fight while dragging the handle.
      */}
      <Animated.View style={[styles.sheetLift, sheetStyle]} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { paddingBottom: safeBottom }]}>
            <View
              style={styles.handleHit}
              {...dismissPanHandlers}
              accessibilityLabel="Drag to dismiss"
            >
              <View style={styles.handle} />
            </View>

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
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
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
  sheetLift: {
    width: '100%',
    maxHeight: SHEET_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  keyboard: {
    width: '100%',
    maxHeight: '100%',
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
  handleHit: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
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
