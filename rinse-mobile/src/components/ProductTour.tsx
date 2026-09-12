import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useRouter, usePathname } from 'expo-router'
import { AppText } from '@/src/components/ui/AppText'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { TourSpotlightRing } from '@/src/components/motion/TourSpotlightRing'
import { TourWelcomeModal } from '@/src/components/TourWelcomeModal'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { lightHaptic } from '@/src/lib/haptics'
import { tourCardEntering } from '@/src/lib/motion-presets'
import {
  dismissTourWelcome,
  isTourReplayRequested,
  markTourCompleted,
  shouldAutoStartTour,
  shouldShowTourWelcome,
} from '@/src/lib/product-tour'
import { consumeTourReplay, subscribeTourReplay } from '@/src/lib/product-tour-replay'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

interface TourStep {
  id: string
  title: string
  body: string
  route?: string
  showRing?: boolean
  ringBottom?: number
  ringLeft?: number
  ringCenter?: boolean
  ringSize?: number
}

/** Six-stop overview tour — matches PWA `buildRinseTourSteps()`. */
const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Rinse',
    body: 'A quick tour of Home, Jobs, Clients, money, and your lead pipeline. Tap Next to walk through each screen.',
    route: '/',
    showRing: false,
  },
  {
    id: 'home',
    title: 'Home',
    body: 'Your dashboard shows today’s work and weekly stats. The green + button adds jobs, leads, quotes, invoices, and expenses.',
    route: '/',
    showRing: true,
    ringBottom: 34,
    ringCenter: true,
    ringSize: 64,
  },
  {
    id: 'jobs',
    title: 'Jobs',
    body: 'Search and filter every job from scheduled through paid. Tap + on this screen to schedule new work.',
    route: '/jobs',
    showRing: true,
    ringBottom: 34,
    ringLeft: 72,
    ringSize: 52,
  },
  {
    id: 'clients',
    title: 'Clients',
    body: 'Your client list with follow-ups, top clients, and history. Tap + to add someone new.',
    route: '/clients',
    showRing: true,
    ringBottom: 34,
    ringLeft: 248,
    ringSize: 52,
  },
  {
    id: 'money',
    title: 'Money',
    body: 'Revenue, expenses, net profit, and exports for any period you choose.',
    route: '/reports',
    showRing: true,
    ringBottom: 34,
    ringLeft: 318,
    ringSize: 52,
  },
  {
    id: 'pipeline',
    title: 'Lead pipeline',
    body: 'Track inquiries from first contact to booked. Move leads across stages as deals progress — you’re all set.',
    route: '/pipeline',
    showRing: false,
  },
]

/** Strip Expo group segments so `/(tabs)/jobs` and `/jobs` compare equal. */
function normalizeTourPath(path: string): string {
  const stripped = path
    .replace(/\/\([^/]+\)/g, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
  return stripped || '/'
}

export function ProductTour() {
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReduceMotion()
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const lastNavTargetRef = useRef<string | null>(null)
  const cardEntering = useMemo(() => tourCardEntering(reduceMotion), [reduceMotion])

  const step = TOUR_STEPS[stepIndex]
  const isLast = stepIndex >= TOUR_STEPS.length - 1

  const finish = useCallback(async () => {
    setVisible(false)
    setWelcomeOpen(false)
    lastNavTargetRef.current = null
    await markTourCompleted()
    await consumeTourReplay()
  }, [])

  const openTour = useCallback(() => {
    setStepIndex(0)
    setVisible(true)
    lastNavTargetRef.current = null
    const current = normalizeTourPath(pathname)
    if (current !== '/') {
      router.push('/(tabs)/' as never)
    }
  }, [pathname, router])

  const startFromWelcome = useCallback(() => {
    dismissTourWelcome()
    setWelcomeOpen(false)
    openTour()
  }, [openTour])

  const skipWelcome = useCallback(() => {
    dismissTourWelcome()
    setWelcomeOpen(false)
    void finish()
  }, [finish])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!(await shouldAutoStartTour())) return
      if (cancelled) return
      if (await shouldShowTourWelcome()) {
        setWelcomeOpen(true)
        return
      }
      openTour()
    })()
    return () => {
      cancelled = true
    }
    // Intentionally once on mount — openTour identity must not re-trigger auto-start.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only auto-start
  }, [])

  useEffect(() => {
    const onReplay = () => {
      void (async () => {
        if (await isTourReplayRequested()) {
          if (await shouldShowTourWelcome()) {
            setWelcomeOpen(true)
            return
          }
          openTour()
        }
      })()
    }

    const unsubscribe = subscribeTourReplay(onReplay)

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('rinse-product-tour-replay', onReplay)
      return () => {
        unsubscribe()
        window.removeEventListener('rinse-product-tour-replay', onReplay)
      }
    }

    return unsubscribe
  }, [openTour])

  useEffect(() => {
    if (!visible || !step?.route) return

    const desired = normalizeTourPath(step.route)
    const current = normalizeTourPath(pathname)
    if (current === desired) {
      lastNavTargetRef.current = null
      return
    }

    const href = step.route === '/' ? '/(tabs)/' : `/(tabs)${step.route}`
    // Avoid push loops when Expo reports a path that never equals `href` exactly.
    if (lastNavTargetRef.current === href) return
    lastNavTargetRef.current = href
    router.push(href as never)
  }, [pathname, router, step?.route, stepIndex, visible])

  return (
    <>
      <TourWelcomeModal visible={welcomeOpen} onStart={startFromWelcome} onSkip={skipWelcome} />
      {visible && step ? (
        <Modal transparent visible animationType="none" onRequestClose={() => void finish()}>
          <View style={styles.root} accessibilityViewIsModal>
            <Pressable style={styles.scrim} onPress={() => void finish()} accessibilityLabel="Dismiss tour" />
            {step.showRing ? (
              <View
                style={[
                  styles.ringAnchor,
                  { bottom: step.ringBottom ?? 34 },
                  step.ringCenter ? styles.ringFab : step.ringLeft != null ? { left: step.ringLeft } : null,
                ]}
                pointerEvents="none"
              >
                <TourSpotlightRing size={step.ringSize ?? 52} />
              </View>
            ) : null}
            <Animated.View entering={cardEntering} style={styles.card}>
              <AppText variant="sectionLabel" style={styles.kicker}>
                App tour · {stepIndex + 1}/{TOUR_STEPS.length}
              </AppText>
              <AppText variant="h2" style={styles.title}>
                {step.title}
              </AppText>
              <AppText variant="body" style={styles.body}>
                {step.body}
              </AppText>
              <View style={styles.actions}>
                <SecondaryButton
                  label="Skip"
                  onPress={() => {
                    lightHaptic()
                    void finish()
                  }}
                />
                <PrimaryButton
                  label={isLast ? 'Done' : 'Next'}
                  onPress={() => {
                    lightHaptic()
                    if (isLast) void finish()
                    else setStepIndex((i) => i + 1)
                  }}
                  style={styles.next}
                />
              </View>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  ringAnchor: {
    position: 'absolute',
    zIndex: 2,
  },
  ringFab: {
    left: '50%',
    marginLeft: -32,
  },
  card: {
    margin: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.bg,
    borderRadius: radii.sheet,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
    zIndex: 3,
  },
  kicker: {
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
  },
  body: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  next: {
    flex: 1,
  },
})
