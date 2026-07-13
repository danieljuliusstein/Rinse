import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { X } from 'phosphor-react-native'
import type { DetailOverlayTarget } from '@/src/providers/detail-overlay-context'
import { ClientDetailBody } from '@/src/components/detail/ClientDetailBody'
import { JobDetailBody } from '@/src/components/detail/JobDetailBody'
import { QuoteDetailBody } from '@/src/components/detail/QuoteDetailBody'
import { colors, radii, spacing } from '@/src/theme/colors'

interface DetailOverlayPanelProps {
  target: DetailOverlayTarget
  onClose: () => void
}

export function DetailOverlayPanel({ target, onClose }: DetailOverlayPanelProps) {
  const { height, width } = useWindowDimensions()
  const panelMaxWidth = Math.min(width, 420)
  const panelHeight = Math.min(height * 0.92, height - 24)

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.panel, { maxWidth: panelMaxWidth, height: panelHeight }]}>
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.textMuted} weight="bold" />
            </Pressable>
          </View>
          <View style={styles.body}>
            {target.kind === 'job' ? (
              <JobDetailBody jobId={target.id} onClose={onClose} variant="overlay" />
            ) : target.kind === 'quote' ? (
              <QuoteDetailBody
                quoteId={target.id}
                onClose={onClose}
                variant="overlay"
                onRefresh={target.onRefresh}
              />
            ) : (
              <ClientDetailBody clientId={target.id} onClose={onClose} variant="overlay" />
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  panel: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radii.sheet,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  body: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
})
