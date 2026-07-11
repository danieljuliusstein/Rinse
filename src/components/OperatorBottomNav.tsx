import { useEffect, useRef } from 'react'
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChartBar, Plus, SquaresFour, Briefcase, Users } from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import { AppText } from '@/src/components/ui/AppText'
import { useQuickAction } from '@/src/providers/QuickActionProvider'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { lightHaptic, mediumHaptic, selectionHaptic } from '@/src/lib/haptics'
import { colors, layout, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'
import { motion } from '@/src/theme/motion'
import { tabDockSafeBottom } from '@/src/hooks/useTabDockPadding'

type TabKey = 'index' | 'jobs' | 'clients' | 'reports'

interface NavTab {
  key: TabKey
  routeName: string
  label: string
  Icon: typeof SquaresFour
}

interface TabRoute {
  key: string
  name: string
}

interface TabNavState {
  index: number
  routes: TabRoute[]
}

type OperatorBottomNavProps = {
  state: TabNavState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any
}

const LEFT_TABS: NavTab[] = [
  { key: 'index', routeName: 'index', label: 'Home', Icon: SquaresFour },
  { key: 'jobs', routeName: 'jobs', label: 'Jobs', Icon: Briefcase },
]

const RIGHT_TABS: NavTab[] = [
  { key: 'clients', routeName: 'clients', label: 'Clients', Icon: Users },
  { key: 'reports', routeName: 'reports', label: 'Business', Icon: ChartBar },
]

const FAB_COLUMN_WIDTH = 72
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function isTabActive(routeName: string, state: TabNavState): boolean {
  const route = state.routes[state.index]
  if (!route) return false
  if (route.name === routeName) return true
  if (routeName === 'index') return route.name === 'index'
  return route.name === routeName || route.name.startsWith(`${routeName}/`)
}

function NavTabButton({
  tab,
  active,
  onPress,
}: {
  tab: NavTab
  active: boolean
  onPress: () => void
}) {
  const reduceMotion = useReduceMotion()
  const { Icon } = tab
  const tint = active ? colors.green : colors.textDim
  const scale = useSharedValue(1)
  const underline = useSharedValue(active ? 1 : 0)

  useEffect(() => {
    if (reduceMotion) {
      scale.value = active ? 1.08 : 1
      underline.value = active ? 1 : 0
      return
    }
    scale.value = withSpring(active ? 1.08 : 1, motion.snappy)
    underline.value = withSpring(active ? 1 : 0, motion.snappy)
  }, [active, reduceMotion, scale, underline])

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const underlineStyle = useAnimatedStyle(() => ({
    opacity: underline.value,
    transform: [{ scaleX: underline.value }],
  }))

  return (
    <Pressable
      onPress={() => {
        selectionHaptic()
        onPress()
      }}
      style={({ pressed }) => [styles.tab, webInlinePressableReset, pressed && styles.tabPressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.tabIcon, iconStyle]}>
        <Icon size={22} color={tint} weight={active ? 'fill' : 'regular'} />
      </Animated.View>
      <AppText
        variant="caption"
        style={[styles.tabLabel, { color: tint, fontFamily: active ? fonts.bodySemiBold : fonts.body }]}
      >
        {tab.label}
      </AppText>
      <Animated.View style={[styles.tabUnderline, underlineStyle]} />
    </Pressable>
  )
}

export function OperatorBottomNav({ state, navigation }: OperatorBottomNavProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const reduceMotion = useReduceMotion()
  const { menuOpen, toggleMenu, closeMenu } = useQuickAction()
  const safeBottom = tabDockSafeBottom(insets.bottom)
  const fabRotation = useSharedValue(0)
  const fabScale = useSharedValue(1)
  const longPressFired = useRef(false)

  useEffect(() => {
    if (reduceMotion) {
      fabRotation.value = menuOpen ? 45 : 0
      return
    }
    fabRotation.value = withSpring(menuOpen ? 45 : 0, { ...motion.snappy, overshootClamping: true })
  }, [fabRotation, menuOpen, reduceMotion])

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }, { scale: fabScale.value }],
  }))

  const goTo = (routeName: string) => {
    const target = state.routes.find((r) => r.name === routeName)?.key ?? ''
    const event = navigation.emit({
      type: 'tabPress',
      target,
      canPreventDefault: true,
    })
    if (!event.defaultPrevented) {
      navigation.navigate(routeName)
    }
  }

  const setFabPressed = (pressed: boolean) => {
    const next = pressed ? 0.96 : 1
    if (reduceMotion) {
      fabScale.value = next
      return
    }
    fabScale.value = withTiming(next, {
      duration: motion.pressMs,
      easing: Easing.out(Easing.cubic),
    })
  }

  return (
    <View style={[styles.wrap, Platform.OS === 'web' ? styles.wrapWeb : null]}>
      <View style={[styles.dock, { paddingBottom: safeBottom }]}>
        <View style={styles.bar}>
          {LEFT_TABS.map((tab) => (
            <NavTabButton
              key={tab.key}
              tab={tab}
              active={isTabActive(tab.routeName, state)}
              onPress={() => goTo(tab.routeName)}
            />
          ))}

          <View style={styles.fabSlot}>
            <AnimatedPressable
              onPress={() => {
                if (longPressFired.current) {
                  longPressFired.current = false
                  return
                }
                lightHaptic()
                toggleMenu()
              }}
              onLongPress={() => {
                longPressFired.current = true
                mediumHaptic()
                closeMenu()
                router.push('/jobs/new')
              }}
              delayLongPress={380}
              onPressIn={() => setFabPressed(true)}
              onPressOut={() => setFabPressed(false)}
              style={[styles.fab, webInlinePressableReset, fabAnimStyle]}
              accessibilityRole="button"
              accessibilityLabel={menuOpen ? 'Close quick actions' : 'Quick actions. Hold for new job'}
              accessibilityHint="Double tap for quick actions. Long press to create a new job."
              accessibilityState={{ expanded: menuOpen }}
            >
              <Plus size={24} color="#071407" weight="bold" />
            </AnimatedPressable>
          </View>

          {RIGHT_TABS.map((tab) => (
            <NavTabButton
              key={tab.key}
              tab={tab}
              active={isTabActive(tab.routeName, state)}
              onPress={() => goTo(tab.routeName)}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

const fabShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 4px 14px rgba(34, 197, 94, 0.28)' } as const)
    : {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 7,
        elevation: 6,
      }

const styles = StyleSheet.create({
  // Custom tab bars do not inherit screenOptions.tabBarStyle — pin to the
  // screen bottom so content can scroll underneath. Scroll views clear the
  // dock via useTabDockPadding() on contentContainerStyle.
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  wrapWeb: {
    backdropFilter: 'blur(16px)',
    ...({ WebkitBackdropFilter: 'blur(16px)' } as ViewStyle),
  },
  dock: {
    width: '100%',
    maxWidth: layout.phoneColumnWidth,
    backgroundColor: Platform.OS === 'web' ? colors.navBg : colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 2,
    paddingHorizontal: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 48,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingVertical: 2,
    minHeight: layout.minTapTarget,
  },
  tabPressed: {
    opacity: 0.92,
  },
  tabIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9,
    lineHeight: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabUnderline: {
    marginTop: 1,
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.green,
  },
  fabSlot: {
    width: FAB_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    paddingBottom: 2,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: -18,
    marginBottom: 2,
    ...fabShadow,
  },
})
