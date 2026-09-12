import { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { AppText } from '@/src/components/ui/AppText'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { selectionHaptic } from '@/src/lib/haptics'
import { pipelineStageEntering } from '@/src/lib/motion-presets'
import { LEAD_STAGES, PIPELINE_STAGE_ORDER } from '@/src/lib/lead-sources'
import type { LeadStage } from '@rinse/core'
import { colors, iconTonePalette, spacing, webPressableReset } from '@/src/theme/colors'
import { motion } from '@/src/theme/motion'

const NODE_SIZE = 30
/** Room for the expanding glow ring so ScrollView doesn't clip it. */
const GLOW_PAD = 10

interface PipelineStepperProps {
  stageCounts: Record<LeadStage, number>
  activeStage: LeadStage
  onStageChange: (stage: LeadStage) => void
}

/** PWA `pipeline-stepper-pulse` — expanding soft ring (not iOS shadow, which gets clipped). */
function usePipelineGlowPulse(active: boolean) {
  const reduceMotion = useReduceMotion()
  const pulse = useSharedValue(0)

  useEffect(() => {
    if (!active || reduceMotion) {
      pulse.value = 0
      return
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.attentionPulseMs / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: motion.attentionPulseMs / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [active, pulse, reduceMotion])

  return useAnimatedStyle(() => ({
    opacity: 0.4 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }))
}

function StepNode({
  index,
  isDone,
  isCurrent,
  hasLeads,
  onPress,
}: {
  index: number
  isDone: boolean
  isCurrent: boolean
  hasLeads: boolean
  onPress: () => void
}) {
  const glowStyle = usePipelineGlowPulse(isCurrent)

  const node = (
    <View
      key="node"
      style={[
        styles.node,
        isDone && styles.nodeDone,
        isCurrent && styles.nodeCurrent,
        hasLeads && styles.nodeHasLeads,
      ]}
    >
      <AppText
        variant="caption"
        style={[styles.nodeNum, (isDone || isCurrent || hasLeads) && styles.nodeNumActive]}
      >
        {`${index + 1}`}
      </AppText>
    </View>
  )

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isCurrent }}
      onPress={() => {
        selectionHaptic()
        onPress()
      }}
      style={[styles.step, webPressableReset]}
      children={
        <View
          style={styles.nodeWrap}
          children={
            isCurrent
              ? [
                  <Animated.View key="glow" pointerEvents="none" style={[styles.glow, glowStyle]} />,
                  node,
                ]
              : [node]
          }
        />
      }
    />
  )
}

export function PipelineStepper({ stageCounts, activeStage, onStageChange }: PipelineStepperProps) {
  const activeIndex = PIPELINE_STAGE_ORDER.indexOf(activeStage)
  const reduceMotion = useReduceMotion()
  const panelEntering = useMemo(() => pipelineStageEntering(reduceMotion), [reduceMotion])

  return (
    <Animated.View
      entering={panelEntering}
      style={styles.root}
      accessibilityRole="tablist"
      accessibilityLabel="Pipeline stages"
      children={PIPELINE_STAGE_ORDER.map((stage, index) => {
        const meta = LEAD_STAGES.find((s) => s.id === stage)
        const count = stageCounts[stage]
        const isCurrent = index === activeIndex
        const isDone = index < activeIndex
        const hasLeads = !isCurrent && !isDone && count > 0
        const connectorLit = index < activeIndex

        const column = (
          <View
            key="col"
            style={styles.column}
            children={[
              <StepNode
                key="step"
                index={index}
                isDone={isDone}
                isCurrent={isCurrent}
                hasLeads={hasLeads}
                onPress={() => onStageChange(stage)}
              />,
              <AppText
                key="name"
                variant="caption"
                style={[styles.name, (isCurrent || isDone) && styles.nameActive]}
              >
                {meta?.shortLabel ?? stage}
              </AppText>,
              <AppText
                key="count"
                variant="caption"
                style={[styles.count, isCurrent && styles.countActive]}
              >
                {`${count}`}
              </AppText>,
            ]}
          />
        )

        return (
          <View
            key={stage}
            style={styles.segment}
            children={
              index < PIPELINE_STAGE_ORDER.length - 1
                ? [
                    column,
                    <View key="line" style={styles.lineWrap}>
                      <View style={[styles.line, connectorLit && styles.lineLit]} />
                    </View>,
                  ]
                : [column]
            }
          />
        )
      })}
    />
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    overflow: 'visible',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 0,
    overflow: 'visible',
  },
  column: {
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
    flexShrink: 0,
    overflow: 'visible',
  },
  step: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  nodeWrap: {
    width: NODE_SIZE + GLOW_PAD * 2,
    height: NODE_SIZE + GLOW_PAD * 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeDone: {
    backgroundColor: iconTonePalette.green.bg,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  nodeCurrent: {
    backgroundColor: iconTonePalette.green.bg,
    borderColor: colors.green,
  },
  nodeHasLeads: {
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  nodeNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  nodeNumActive: {
    color: colors.greenText,
  },
  name: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  nameActive: {
    color: colors.greenText,
    fontWeight: '600',
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    lineHeight: 13,
  },
  countActive: {
    color: colors.greenText,
  },
  lineWrap: {
    width: 36,
    height: NODE_SIZE + GLOW_PAD * 2,
    justifyContent: 'center',
    flexShrink: 0,
  },
  line: {
    height: 1.5,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  lineLit: {
    backgroundColor: colors.green,
  },
})
