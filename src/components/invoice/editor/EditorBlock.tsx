import { useMemo, useRef } from 'react'
import { Lock } from '@/src/icons'
import { PanResponder, Pressable, StyleSheet, View } from 'react-native'
import { BlockContent } from '@/src/components/invoice/editor/BlockContent'
import type { DropGhost, EditorPreviewData, PlacedElement, SnapGuide } from '@/src/lib/invoice-editor'
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

  const isLogo = element.type === 'logo'
  const hasLogoImage = Boolean(logoUrl)

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
        isLogo ? styles.blockLogo : null,
        {
          left: element.x,
          top: element.y,
          width: element.w,
          height: isLogo ? element.h : undefined,
          minHeight: element.h,
          // Logo chrome hugs the image; other blocks show spacing in selection.
          padding: isLogo ? 0 : 4,
          paddingBottom: isLogo ? 0 : selected ? Math.max(element.spacing ?? 0, 0) : 4,
        },
        selected ? styles.blockSelected : isLogo && hasLogoImage ? styles.blockLogoIdle : styles.blockIdle,
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
            element={element}
            logoSize={isLogo ? element.w : undefined}
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

export function DropGhostBox({ ghost }: { ghost: DropGhost }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ghost,
        {
          left: ghost.x,
          top: ghost.y,
          width: ghost.w,
          height: ghost.h,
        },
      ]}
    />
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
  blockLogo: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  blockInner: {
    position: 'relative',
  },
  blockIdle: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#c7c7cc',
  },
  /** Logo with image: no idle dashed chrome — selection still shows solid green. */
  blockLogoIdle: {
    borderWidth: 0,
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
  ghost: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: EDITOR_CHROME.green,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
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
