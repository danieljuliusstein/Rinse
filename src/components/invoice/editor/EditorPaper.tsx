import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { DropGhostBox, EditorBlock, SnapGuideLines } from '@/src/components/invoice/editor/EditorBlock'
import {
  EDITOR_CHROME,
  PAPER_HEIGHT,
  PAPER_WIDTH,
  type DropGhost,
  type EditorPreviewData,
  type PlacedElement,
  type SnapGuide,
} from '@/src/lib/invoice-editor'

export function EditorPaper({
  elements,
  selectedId,
  preview,
  accentColor,
  logoUrl,
  documentTitle,
  scale,
  guides,
  dropGhost,
  dragging,
  onSelect,
  onDeselect,
  onMove,
  onMoveEnd,
}: {
  elements: PlacedElement[]
  selectedId: string | null
  preview: EditorPreviewData
  accentColor: string
  logoUrl?: string | null
  documentTitle?: string
  scale: number
  guides: SnapGuide[]
  dropGhost?: DropGhost | null
  dragging?: boolean
  onSelect: (id: string) => void
  onDeselect: () => void
  onMove: (id: string, x: number, y: number) => void
  onMoveEnd: () => void
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!dragging}
    >
      <View
        style={[
          styles.paperShell,
          {
            width: PAPER_WIDTH * scale,
            height: PAPER_HEIGHT * scale,
          },
        ]}
      >
        <View
          style={[
            styles.paper,
            {
              width: PAPER_WIDTH,
              height: PAPER_HEIGHT,
              // Scale from top-left so the shell (width/height * scale) crops correctly
              // on web + native. Center-origin + negative offsets clips content left.
              left: 0,
              top: 0,
              transform: [{ scale }],
              transformOrigin: 'top left',
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDeselect}
            accessibilityLabel="Deselect block"
          />
          {dropGhost ? <DropGhostBox ghost={dropGhost} /> : null}
          {guides.length > 0 ? <SnapGuideLines guides={guides} scale={scale} /> : null}
          {elements.map((el) => (
            <EditorBlock
              key={el.id}
              element={el}
              selected={el.id === selectedId}
              preview={preview}
              accentColor={accentColor}
              logoUrl={logoUrl}
              documentTitle={documentTitle}
              scale={scale}
              onSelect={() => onSelect(el.id)}
              onMove={(x, y) => onMove(el.id, x, y)}
              onMoveEnd={onMoveEnd}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  paperShell: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: EDITOR_CHROME.paper,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  paper: {
    position: 'absolute',
    backgroundColor: EDITOR_CHROME.paper,
  },
})
