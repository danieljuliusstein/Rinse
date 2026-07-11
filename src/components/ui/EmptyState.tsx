import type { ComponentType } from 'react'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { CalendarBlank, Car, ChatCircle, Users } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { Button } from '@/src/components/ui/Button'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { emptyStateEntering } from '@/src/lib/motion-presets'
import { colors, radii, spacing } from '@/src/theme/colors'

export type EmptyIllustrationKind = 'jobs' | 'clients' | 'messages'

const ILLUSTRATIONS: Record<EmptyIllustrationKind, ComponentType<{ size?: number; color?: string; weight?: 'duotone' | 'regular' }>> = {
  jobs: Car,
  clients: Users,
  messages: ChatCircle,
}

interface EmptyStateProps {
  illustration?: EmptyIllustrationKind
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ illustration, title, description, actionLabel, onAction }: EmptyStateProps) {
  const Icon = illustration ? ILLUSTRATIONS[illustration] : CalendarBlank
  const reduceMotion = useReduceMotion()
  const entering = useMemo(() => emptyStateEntering(reduceMotion), [reduceMotion])

  return (
    <Animated.View entering={entering} style={styles.root}>
      <View style={styles.art} accessibilityElementsHidden>
        <Icon size={40} color={colors.green} weight="duotone" />
      </View>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="caption" style={styles.description}>
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  art: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
})
