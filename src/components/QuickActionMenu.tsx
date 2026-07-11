import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Briefcase, FileText, Flask, Funnel, Receipt, Wallet, type Icon } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { useSheetDismissPanHandlers } from '@/src/hooks/useSheetDismissGesture'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { lightHaptic, mediumHaptic } from '@/src/lib/haptics'
import { closeSheetSpring, openSheetSpring } from '@/src/lib/sheet-motion'
import { quickActionRowEntering } from '@/src/lib/motion-presets'
import { useQuickAction } from '@/src/providers/QuickActionProvider'
import { colors, layout, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

interface ActionItem {
  id: string
  label: string
  subtitle: string
  Icon: Icon
  onSelect: () => void
}

const SHEET_OFFSCREEN = 480

export function QuickActionMenu() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()
  const reduceMotion = useReduceMotion()
  const { menuOpen, closeMenu } = useQuickAction()
  const [mounted, setMounted] = useState(menuOpen)
  /** Pan dismiss already sprang the panel away — skip a second close animation. */
  const skipCloseAnimation = useRef(false)

  const sheetWidth =
    Platform.OS === 'web' ? Math.min(windowWidth, layout.phoneColumnWidth) : windowWidth

  const scrimOpacity = useSharedValue(0)
  const sheetTranslateY = useSharedValue(SHEET_OFFSCREEN)

  const finishUnmount = useCallback(() => {
    setMounted(false)
  }, [])

  const finishPanDismiss = useCallback(() => {
    skipCloseAnimation.current = true
    closeMenu()
    finishUnmount()
  }, [closeMenu, finishUnmount])

  const animateOpen = useCallback(() => {
    openSheetSpring(sheetTranslateY, scrimOpacity)
  }, [scrimOpacity, sheetTranslateY])

  const animateClose = useCallback(() => {
    if (reduceMotion) {
      scrimOpacity.value = 0
      sheetTranslateY.value = SHEET_OFFSCREEN
      finishUnmount()
      return
    }
    closeSheetSpring(sheetTranslateY, scrimOpacity, SHEET_OFFSCREEN, finishUnmount)
  }, [finishUnmount, reduceMotion, scrimOpacity, sheetTranslateY])

  const requestClose = useCallback(() => {
    lightHaptic()
    closeMenu()
  }, [closeMenu])

  const dismissPanHandlers = useSheetDismissPanHandlers(
    sheetTranslateY,
    scrimOpacity,
    SHEET_OFFSCREEN,
    finishPanDismiss,
    !reduceMotion,
  )

  useEffect(() => {
    if (menuOpen) {
      setMounted(true)
      mediumHaptic()
      if (reduceMotion) {
        scrimOpacity.value = 1
        sheetTranslateY.value = 0
      } else {
        scrimOpacity.value = 0
        sheetTranslateY.value = SHEET_OFFSCREEN
        requestAnimationFrame(() => animateOpen())
      }
      return
    }
    if (mounted) {
      if (skipCloseAnimation.current) {
        skipCloseAnimation.current = false
        return
      }
      animateClose()
    }
  }, [animateClose, animateOpen, menuOpen, mounted, reduceMotion, scrimOpacity, sheetTranslateY])

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }))

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        id: 'new-lead',
        label: 'New lead',
        subtitle: 'Capture an inquiry',
        Icon: Funnel,
        onSelect: () => {
          closeMenu()
          router.push('/leads/new')
        },
      },
      {
        id: 'new-job',
        label: 'New job',
        subtitle: 'Schedule or log work',
        Icon: Briefcase,
        onSelect: () => {
          closeMenu()
          router.push('/jobs/new')
        },
      },
      {
        id: 'new-invoice',
        label: 'Create invoice',
        subtitle: 'Pick a job and send',
        Icon: Receipt,
        onSelect: () => {
          closeMenu()
          router.push('/invoices/new')
        },
      },
      {
        id: 'log-expense',
        label: 'Log expense',
        subtitle: 'One-time business cost',
        Icon: Wallet,
        onSelect: () => {
          closeMenu()
          router.push('/expenses/new' as never)
        },
      },
      {
        id: 'buy-supplies',
        label: 'Buy supplies',
        subtitle: 'Stock + expense together',
        Icon: Flask,
        onSelect: () => {
          closeMenu()
          router.push('/inventory/buy' as never)
        },
      },
      {
        id: 'new-quote',
        label: 'New quote',
        subtitle: 'Send a price estimate',
        Icon: FileText,
        onSelect: () => {
          closeMenu()
          router.push('/quotes/new')
        },
      },
    ],
    [closeMenu, router],
  )

  if (!mounted) return null

  const sheetBottomPad = Math.max(insets.bottom, 0) + 24

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={[styles.root, Platform.OS === 'web' && styles.rootWeb]} accessibilityViewIsModal>
        <View style={[styles.column, { width: sheetWidth }]}>
          <Pressable style={styles.backdropPress} onPress={requestClose} accessibilityLabel="Close quick actions">
            <Animated.View style={[styles.backdrop, scrimStyle]} />
          </Pressable>

          <Animated.View
            style={[styles.sheet, sheetStyle, { width: sheetWidth, paddingBottom: sheetBottomPad }]}
            accessibilityRole="menu"
            accessibilityLabel="Quick actions"
          >
            <View style={styles.dragRegion} {...dismissPanHandlers}>
              <View style={styles.handle} />
              <AppText style={styles.title}>Quick actions</AppText>
            </View>
            <View style={styles.list}>
              {actions.map((action, index) => {
                const { Icon } = action
                const entering = quickActionRowEntering(index, reduceMotion)
                return (
                  <Animated.View key={action.id} entering={entering}>
                    <Pressable
                      onPress={() => {
                        lightHaptic()
                        action.onSelect()
                      }}
                      style={({ pressed }) => [
                        styles.rowPressable,
                        webPressableReset,
                        pressed && styles.rowPressed,
                      ]}
                      accessibilityRole="menuitem"
                      accessibilityLabel={`${action.label}. ${action.subtitle}`}
                    >
                      <View style={[styles.row, Platform.OS === 'web' && styles.rowWeb]}>
                        <View style={styles.rowIcon}>
                          <Icon size={22} color={colors.green} weight="duotone" />
                        </View>
                        <View style={styles.rowText}>
                          <AppText variant="bodySemiBold" style={styles.rowLabel}>
                            {action.label}
                          </AppText>
                          <AppText variant="caption" style={styles.subtitle} numberOfLines={2}>
                            {action.subtitle}
                          </AppText>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                )
              })}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  rootWeb: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10000,
  },
  column: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
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
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: spacing.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  list: {
    width: '100%',
  },
  rowPressable: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: spacing.xs,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  /** RN Web maps Pressable → <button>; flex display keeps the label column from collapsing. */
  rowWeb: {
    display: 'flex',
  },
  rowPressed: {
    backgroundColor: colors.surfaceActive,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
    marginRight: 14,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  rowLabel: {
    color: '#000000',
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
  },
})
