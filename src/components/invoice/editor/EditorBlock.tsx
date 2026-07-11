import { useMemo, useRef } from 'react'
import { Lock } from 'phosphor-react-native'
import { PanResponder, Pressable, StyleSheet, View } from 'react-native'
import { BlockContent } from '@/src/components/invoice/editor/BlockContent'
import type { EditorPreviewData, PlacedElement, SnapGuide } from '@/src/lib/invoice-editor'
import { EDITOR_CHROME } from '@/src/lib/invoice-editor'
import { webInlinePressableReset } from '@/src/theme/colors'

export function EditorBlock({
  element,
  selected,
  preview,
  accentColor,
  logoUrl,
  documentTitle,
  scale,
  onSelect,
  onMove,
  onMoveEnd,
}: {
  element: PlacedElement
  selected: boolean
  preview: EditorPreviewData
  accentColor: string
  logoUrl?: string | null
  documentTitle?: string
  scale: number
  onSelect: () => void
  onMove: (x: number, y: number) => void
  onMoveEnd: () => void
}) {
  const elementRef = useRef(element)
  elementRef.current = element
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const lockedRef = useRef(element.locked)
  lockedRef.current = element.locked
  const startRef = useRef({ x: element.x, y: element.y })
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  const onMoveEndRef = useRef(onMoveEnd)
  onMoveEndRef.current = onMoveEnd

  // Stable responder — must not recreate when x/y change mid-drag.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          !lockedRef.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
        onMoveShouldSetPanResponderCapture: (_, g) =>
          !lockedRef.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const el = elementRef.current
          startRef.current = { x: el.x, y: el.y }
          onSelectRef.current()
        },
        onPanResponderMove: (_, g) => {
          if (lockedRef.current) return
          const s = scaleRef.current || 1
          onMoveRef.current(startRef.current.x + g.dx / s, startRef.current.y + g.dy / s)
        },
        onPanResponderRelease: () => onMoveEndRef.current(),
        onPanResponderTerminate: () => onMoveEndRef.current(),
      }),
    [],
  )

  return (
    <View
      {...pan.panHandlers}
      style={[
        styles.block,
        {
          left: element.x,
          top: element.y,
          width: element.w,
          minHeight: element.h,
          // Selection chrome includes the gap after this block (does not change x/y).
          paddingBottom: selected ? Math.max(element.spacing ?? 0, 0) : 4,
        },
        selected ? styles.blockSelected : styles.blockIdle,
        element.locked ? styles.blockLocked : null,
      ]}
    >
      <View style={styles.blockInner}>
        <Pressable
          onPress={onSelect}
          style={webInlinePressableReset}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`${element.type} block`}
        >
          <BlockContent
            type={element.type}
            preview={preview}
            accentColor={element.color || accentColor}
            align={element.align}
            logoUrl={logoUrl}
            documentTitle={documentTitle}
          />
        </Pressable>
        {element.locked ? (
          <View style={styles.lockBadge} pointerEvents="none">
            <Lock size={12} color={EDITOR_CHROME.textMuted} weight="fill" />
          </View>
        ) : null}
      </View>
    </View>
  )
}

export function SnapGuideLines({ guides, scale }: { guides: SnapGuide[]; scale: number }) {
  if (guides.length === 0) return null
  return (
    <>
      {guides.map((g, i) =>
        g.axis === 'x' ? (
          <View
            key={`x-${i}-${g.position}`}
            style={[styles.guideV, { left: g.position, transform: [{ scaleX: 1 / scale }] }]}
            pointerEvents="none"
          />
        ) : (
          <View
            key={`y-${i}-${g.position}`}
            style={[styles.guideH, { top: g.position, transform: [{ scaleY: 1 / scale }] }]}
            pointerEvents="none"
          />
        ),
      )}
    </>
  )
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  blockInner: {
    position: 'relative',
  },
  blockIdle: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#c7c7cc',
  },
  blockSelected: {
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: EDITOR_CHROME.green,
  },
  blockLocked: {
    borderStyle: 'solid',
    borderColor: '#aeaeb2',
  },
  lockBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c7c7cc',
  },
  guideV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    borderStyle: 'dashed',
    borderWidth: 0,
    borderLeftWidth: 1.5,
    borderColor: EDITOR_CHROME.green,
  },
  guideH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    borderStyle: 'dashed',
    borderWidth: 0,
    borderTopWidth: 1.5,
    borderColor: EDITOR_CHROME.green,
  },
})
