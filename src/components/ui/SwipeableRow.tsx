import { useEffect, useRef } from 'react'
import { Animated, PanResponder, Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { PencilSimple, Trash } from 'phosphor-react-native'
import { AppText } from './AppText'
import { colors, spacing } from '@/src/theme/colors'
import { motion } from '@/src/theme/motion'
import { swipeHaptic } from '@/src/lib/haptics'

const ACTION_WIDTH = 72
const OPEN_OFFSET = -ACTION_WIDTH * 2
const SWIPE_THRESHOLD = 40

const SPRING = {
  useNativeDriver: true,
  damping: motion.spring.damping,
  stiffness: motion.spring.stiffness,
  mass: 1,
} as const

interface SwipeableRowProps {
  rowId: string
  openRowId: string | null
  onOpenChange: (id: string | null) => void
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  style?: ViewStyle
}

export function SwipeableRow({
  rowId,
  openRowId,
  onOpenChange,
  children,
  onEdit,
  onDelete,
  style,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current
  const isOpen = openRowId === rowId
  const dragStart = useRef(0)

  const snapTo = (open: boolean, velocity = 0) => {
    Animated.spring(translateX, {
      ...SPRING,
      toValue: open ? OPEN_OFFSET : 0,
      velocity,
    }).start()
  }

  useEffect(() => {
    snapTo(isOpen)
  }, [isOpen])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          dragStart.current = value
        })
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(OPEN_OFFSET, g.dx + dragStart.current))
        translateX.setValue(next)
      },
      onPanResponderRelease: (_, g) => {
        const projected = dragStart.current + g.dx
        const shouldOpen =
          g.vx < -0.35 || projected < OPEN_OFFSET / 2 || (isOpen && g.dx > -SWIPE_THRESHOLD && projected < 0)
        if (shouldOpen) {
          swipeHaptic()
          onOpenChange(rowId)
          snapTo(true, g.vx)
        } else {
          onOpenChange(null)
          snapTo(false, g.vx)
        }
      },
    }),
  ).current

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => {
            onOpenChange(null)
            onEdit()
          }}
        >
          <PencilSimple size={18} color="#fff" weight="bold" />
          <AppText variant="caption" style={styles.actionLabel}>
            Edit
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => {
            onOpenChange(null)
            onDelete()
          }}
        >
          <Trash size={18} color="#fff" weight="bold" />
          <AppText variant="caption" style={styles.actionLabel}>
            Cancel
          </AppText>
        </Pressable>
      </View>
      <Animated.View style={[styles.content, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: ACTION_WIDTH * 2,
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  editBtn: {
    backgroundColor: colors.textSecondary,
  },
  deleteBtn: {
    backgroundColor: colors.danger,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    backgroundColor: colors.surface,
  },
})
