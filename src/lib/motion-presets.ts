import { Easing, FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { motion } from '@/src/theme/motion'

type EnteringAnimation = typeof FadeIn | ReturnType<typeof FadeIn.duration>
type ExitingAnimation = typeof FadeOut | ReturnType<typeof FadeOut.duration>

function springEnter(durationMs: number): ReturnType<typeof FadeInDown.duration> {
  return FadeInDown.duration(durationMs).springify().damping(motion.spring.damping).stiffness(motion.spring.stiffness)
}

function springExit(durationMs: number): ReturnType<typeof FadeOutDown.duration> {
  return FadeOutDown.duration(durationMs).springify().damping(motion.spring.damping).stiffness(motion.spring.stiffness)
}

export function sheetScrimEntering(reduceMotion: boolean): EnteringAnimation {
  if (reduceMotion) return FadeIn.duration(0)
  return FadeIn.duration(motion.fadeMs)
}

export function sheetPanelEntering(reduceMotion: boolean): EnteringAnimation {
  if (reduceMotion) return FadeIn.duration(0)
  return springEnter(motion.sheetMs)
}

export function sheetScrimExiting(reduceMotion: boolean): ExitingAnimation {
  if (reduceMotion) return FadeOut.duration(0)
  return FadeOut.duration(motion.fastMs)
}

export function sheetPanelExiting(reduceMotion: boolean): ExitingAnimation {
  if (reduceMotion) return FadeOut.duration(0)
  return springExit(motion.fastMs)
}

/** PWA quick-action-row-in — soft fade/slide, no spring bounce. */
export function quickActionRowEntering(index: number, reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  return FadeInDown.duration(motion.listStaggerMs)
    .easing(Easing.out(Easing.cubic))
    .delay(index * motion.staggerStepMs)
}

export function listStaggerEntering(index: number, reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  const capped = Math.min(index, motion.listStaggerCap)
  return springEnter(motion.listStaggerMs).delay(capped * motion.staggerStepMs)
}

export function emptyStateEntering(reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  return springEnter(motion.emptyEnterMs)
}

export function blockStaggerEntering(index: number, reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  return springEnter(motion.listStaggerMs).delay(index * motion.staggerStepMs)
}

const easeStep = Easing.bezier(0.22, 1, 0.36, 1)

/** setup-step-in — onboarding wizard panels. */
export function setupStepEntering(reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  return FadeInDown.duration(motion.sheetMs).easing(easeStep)
}

/** pipeline-stage-in — lead list when stage chip changes. */
export function pipelineStageEntering(reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  return FadeInDown.duration(motion.sheetMs).easing(Easing.out(Easing.cubic))
}

/** Product tour tooltip card enter. */
export function tourCardEntering(reduceMotion: boolean): EnteringAnimation | undefined {
  if (reduceMotion) return FadeIn.duration(0)
  return FadeInDown.duration(motion.emptyEnterMs).springify().damping(motion.spring.damping).stiffness(motion.spring.stiffness)
}
