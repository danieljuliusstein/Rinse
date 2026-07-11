import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { AppText } from '@/src/components/ui/AppText'
import { useSuccessPopScale } from '@/src/hooks/useMotionArchetypes'
import { badgePalette, type BadgeTone } from '@/src/theme/tokens'
import { typography } from '@/src/theme/typography'

export function statusToBadgeTone(status: string): BadgeTone {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'accepted':
      return 'green'
    case 'sent':
    case 'invoiced':
    case 'in_progress':
    case 'partial':
      return 'amber'
    case 'overdue':
      return 'red'
    case 'scheduled':
      return 'blue'
    case 'draft':
      return 'draft'
    default:
      return 'gray'
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

interface BadgeProps {
  tone?: BadgeTone
  status?: string
  label?: string
  /** success-pop when label first mounts or changes (e.g. status update). */
  popOnChange?: boolean
}

export function Badge({ tone, status, label, popOnChange = false }: BadgeProps) {
  const resolvedTone = tone ?? (status ? statusToBadgeTone(status) : 'gray')
  const text = label ?? (status ? formatStatusLabel(status) : '')
  const palette = badgePalette[resolvedTone]
  const [popKey, setPopKey] = useState(text)
  const [popActive, setPopActive] = useState(false)
  const popStyle = useSuccessPopScale(popActive)

  useEffect(() => {
    if (!popOnChange || !text) return
    if (text !== popKey) {
      setPopKey(text)
      setPopActive(true)
      const timer = setTimeout(() => setPopActive(false), 320)
      return () => clearTimeout(timer)
    }
  }, [popKey, popOnChange, text])

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: palette.bg },
        palette.border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border } : null,
        popOnChange ? popStyle : null,
      ]}
    >
      <AppText style={[styles.label, { color: palette.text }]} numberOfLines={1}>
        {text}
      </AppText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    maxWidth: 140,
  },
  label: {
    ...typography.sectionLabel,
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
})
