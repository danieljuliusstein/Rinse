import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { tourCardEntering } from '@/src/lib/motion-presets'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'
import { useMemo } from 'react'

interface TourWelcomeModalProps {
  visible: boolean
  onStart: () => void
  onSkip: () => void
}

export function TourWelcomeModal({ visible, onStart, onSkip }: TourWelcomeModalProps) {
  const reduceMotion = useReduceMotion()
  const cardEntering = useMemo(() => tourCardEntering(reduceMotion), [reduceMotion])

  if (!visible) return null

  return (
    <Modal transparent visible animationType="none" onRequestClose={onSkip}>
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable style={styles.scrim} onPress={onSkip} accessibilityLabel="Skip tour" />
        <Animated.View
          entering={cardEntering}
          style={styles.card}
          accessibilityRole="alert"
          accessibilityLabel="Take a quick tour?"
        >
          <AppText variant="sectionLabel" style={styles.eyebrow}>
            Welcome
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Take a quick tour?
          </AppText>
          <AppText variant="body" style={styles.lead}>
            Six quick stops — Home, Jobs, Clients, money, and your pipeline. Use Next to move through; you can skip or
            end anytime.
          </AppText>
          <View style={styles.actions}>
            <SecondaryButton label="Skip for now" onPress={onSkip} />
            <PrimaryButton label="Start tour" onPress={onStart} style={styles.primary} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
    zIndex: 2,
  },
  eyebrow: {
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  primary: {
    flex: 1,
  },
})
