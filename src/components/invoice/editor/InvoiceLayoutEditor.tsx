import { useCallback, useMemo, useRef, useState } from 'react'
import type { ImagePickerAsset } from 'expo-image-picker'
import * as ImagePicker from 'expo-image-picker'
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EditorPaper } from '@/src/components/invoice/editor/EditorPaper'
import { EditorToolbar } from '@/src/components/invoice/editor/EditorToolbar'
import { ElementPalette } from '@/src/components/invoice/editor/ElementPalette'
import { PropertiesPanel } from '@/src/components/invoice/editor/PropertiesPanel'
import { TemplatePickerSheet } from '@/src/components/invoice/editor/TemplatePickerSheet'
import { validateLogoAsset } from '@/src/lib/logo-upload'
import {
  applyAlignX,
  applyElementSpacing,
  createDefaultElement,
  createEditorPreviewData,
  createLayoutFromTemplate,
  DEFAULT_DOCUMENT_TITLE,
  EDITOR_CHROME,
  PAPER_WIDTH,
  resolveElementOverlaps,
  snapDragPosition,
  useEditorHistory,
  type ElementAlign,
  type ElementType,
  type InvoiceEditorLayout,
  type InvoiceEditorTemplateId,
  type SnapGuide,
} from '@/src/lib/invoice-editor'

export function InvoiceLayoutEditor({
  initialLayout,
  businessName,
  businessEmail,
  businessAddress,
  businessPhone,
  logoUrl,
  logoPreviewUri,
  termsFooter,
  onTermsChange,
  saving,
  onSave,
  logoUploading,
  onLogoUpload,
  onLogoRemove,
}: {
  initialLayout: InvoiceEditorLayout
  businessName: string
  businessEmail: string
  businessAddress?: string
  businessPhone?: string
  logoUrl?: string | null
  logoPreviewUri?: string | null
  termsFooter: string
  onTermsChange: (next: string) => void
  saving?: boolean
  onSave: (layout: InvoiceEditorLayout) => void
  logoUploading?: boolean
  onLogoUpload: (asset: ImagePickerAsset) => Promise<void>
  onLogoRemove: () => Promise<void>
}) {
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()
  const { layout, layoutRef, setLayout, setLayoutLive, commitFrom, undo, redo, resetHistory, canUndo, canRedo } =
    useEditorHistory(initialLayout)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [guides, setGuides] = useState<SnapGuide[]>([])
  const [templateOpen, setTemplateOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragBeforeRef = useRef<InvoiceEditorLayout | null>(null)

  const scale = Math.min(1, (windowWidth - 24) / PAPER_WIDTH)
  const selected = layout.elements.find((e) => e.id === selectedId) ?? null
  const placedTypes = useMemo(
    () => new Set(layout.elements.map((e) => e.type)),
    [layout.elements],
  )

  const preview = useMemo(
    () =>
      createEditorPreviewData({
        businessName: businessName.trim() || 'Your business',
        businessEmail: businessEmail.trim() || 'hello@detail.co',
        businessAddress: businessAddress?.trim() || '',
        businessPhone: businessPhone?.trim() || '',
        logoUrl: logoPreviewUri ?? logoUrl,
        termsFooter,
      }),
    [
      businessAddress,
      businessEmail,
      businessName,
      businessPhone,
      logoPreviewUri,
      logoUrl,
      termsFooter,
    ],
  )

  const patchElement = useCallback(
    (id: string, patch: Partial<(typeof layout.elements)[number]>) => {
      setLayout((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
      }))
    },
    [setLayout],
  )

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      const current = layoutRef.current
      const el = current.elements.find((e) => e.id === id)
      if (!el || el.locked) return

      if (!dragBeforeRef.current) {
        dragBeforeRef.current = current
        setDragging(true)
      }

      const snapped = snapDragPosition({
        x,
        y,
        width: el.w,
        height: el.h,
        elements: current.elements,
        draggingId: id,
        enabled: current.snapEnabled,
      })
      setGuides(snapped.guides)
      setLayoutLive({
        ...current,
        elements: current.elements.map((item) =>
          item.id === id ? { ...item, x: snapped.x, y: snapped.y } : item,
        ),
      })
    },
    [layoutRef, setLayoutLive],
  )

  const handleMoveEnd = useCallback(() => {
    setGuides([])
    setDragging(false)
    const before = dragBeforeRef.current
    dragBeforeRef.current = null
    if (!before) return
    const packed = {
      ...layoutRef.current,
      elements: resolveElementOverlaps(layoutRef.current.elements),
    }
    layoutRef.current = packed
    commitFrom(before, packed)
  }, [commitFrom, layoutRef])

  const handlePickElement = useCallback(
    (type: ElementType) => {
      const existing = layout.elements.find((e) => e.type === type)
      if (existing) {
        setSelectedId(existing.id)
        return
      }
      const next = createDefaultElement(type, layout.accentColor, layout.elements)
      setLayout((prev) => ({
        ...prev,
        elements: resolveElementOverlaps([...prev.elements, next]),
      }))
      setSelectedId(next.id)
    },
    [layout.accentColor, layout.elements, setLayout],
  )

  const handleAlign = useCallback(
    (align: ElementAlign) => {
      if (!selected) return
      setLayout((prev) => {
        const moved = prev.elements.map((el) =>
          el.id === selected.id
            ? { ...el, align, x: applyAlignX(align, el.w) }
            : el,
        )
        return { ...prev, elements: resolveElementOverlaps(moved) }
      })
    },
    [selected, setLayout],
  )

  const handleTemplate = useCallback(
    (id: InvoiceEditorTemplateId) => {
      const next = createLayoutFromTemplate(id, layout.accentColor, layout.snapEnabled)
      resetHistory(next)
      setSelectedId(null)
    },
    [layout.accentColor, layout.snapEnabled, resetHistory],
  )

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Photos access needed', 'Allow photo library access to upload your logo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    const validationError = validateLogoAsset(asset)
    if (validationError) {
      Alert.alert('Invalid logo', validationError)
      return
    }
    await onLogoUpload(asset)
  }

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <EditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        snapEnabled={layout.snapEnabled}
        saving={saving}
        onTemplate={() => setTemplateOpen(true)}
        onUndo={undo}
        onRedo={redo}
        onSnapChange={(snapEnabled) => setLayout((prev) => ({ ...prev, snapEnabled }))}
        onSave={() => onSave(layout)}
      />

      <View style={styles.canvas}>
        <EditorPaper
          elements={layout.elements}
          selectedId={selectedId}
          preview={preview}
          accentColor={layout.accentColor}
          logoUrl={logoPreviewUri ?? logoUrl}
          documentTitle={layout.documentTitle ?? DEFAULT_DOCUMENT_TITLE}
          scale={scale}
          guides={guides}
          dragging={dragging}
          onSelect={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          onMove={handleMove}
          onMoveEnd={handleMoveEnd}
        />
      </View>

      <View style={styles.dock}>
        <ElementPalette
          placedTypes={placedTypes}
          selectedType={selected?.type ?? null}
          onPick={handlePickElement}
        />

        <PropertiesPanel
          block={selected}
          accentColor={layout.accentColor}
          termsFooter={termsFooter}
          documentTitle={layout.documentTitle ?? DEFAULT_DOCUMENT_TITLE}
          onAlignChange={handleAlign}
          onAccentChange={(color) =>
            setLayout((prev) => ({
              ...prev,
              accentColor: color,
              elements: prev.elements.map((el) => ({ ...el, color })),
            }))
          }
          onBlockColorChange={(color) => {
            if (!selected) return
            patchElement(selected.id, { color })
          }}
          onSpacingChange={(nextSpacing) => {
            if (!selected) return
            setLayout((prev) => ({
              ...prev,
              elements: applyElementSpacing(prev.elements, selected.id, nextSpacing),
            }))
          }}
          onLockChange={(locked) => {
            if (!selected) return
            patchElement(selected.id, { locked })
          }}
          onDelete={() => {
            if (!selected) return
            setLayout((prev) => ({
              ...prev,
              elements: prev.elements.filter((el) => el.id !== selected.id),
            }))
            setSelectedId(null)
          }}
          onTermsChange={onTermsChange}
          onDocumentTitleChange={(next) =>
            setLayout((prev) => ({
              ...prev,
              documentTitle: next,
            }))
          }
          onChangeLogo={() => void pickLogo()}
          onRemoveLogo={() => void onLogoRemove()}
          logoBusy={logoUploading}
        />
      </View>

      <TemplatePickerSheet
        open={templateOpen}
        current={layout.templateId}
        onClose={() => setTemplateOpen(false)}
        onPick={handleTemplate}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    backgroundColor: EDITOR_CHROME.bg,
  },
  canvas: {
    flex: 1,
    minHeight: 0,
  },
  dock: {
    flexShrink: 0,
    backgroundColor: EDITOR_CHROME.bg,
  },
})
