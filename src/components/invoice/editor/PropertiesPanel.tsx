import { Minus, Plus, TextAlignCenter, TextAlignLeft, TextAlignRight } from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import {
  ACCENT_SWATCHES,
  DOCUMENT_TITLE_OPTIONS,
  EDITOR_CHROME,
  SPACING_SCALE,
  type ElementAlign,
  type PlacedElement,
} from '@/src/lib/invoice-editor'
import { spacingIndex } from '@/src/lib/invoice-editor/snap'
import { webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function PropertiesPanel({
  block,
  accentColor,
  termsFooter,
  documentTitle,
  onAlignChange,
  onAccentChange,
  onBlockColorChange,
  onSpacingChange,
  onLockChange,
  onDelete,
  onTermsChange,
  onDocumentTitleChange,
  onBodyTextChange,
  onServiceChange,
  onChangeLogo,
  onRemoveLogo,
  logoBusy,
}: {
  block: PlacedElement | null
  accentColor: string
  termsFooter: string
  documentTitle: string
  onAlignChange: (align: ElementAlign) => void
  onAccentChange: (color: string) => void
  onBlockColorChange: (color: string) => void
  onSpacingChange: (spacing: number) => void
  onLockChange: (locked: boolean) => void
  onDelete: () => void
  onTermsChange: (next: string) => void
  onDocumentTitleChange: (next: string) => void
  onBodyTextChange?: (text: string) => void
  onServiceChange?: (patch: { serviceDescription?: string; serviceAmount?: number }) => void
  onChangeLogo?: () => void
  onRemoveLogo?: () => void
  logoBusy?: boolean
}) {
  if (!block) {
    return (
      <View style={[styles.wrap, styles.wrapContent]}>
        <AppText style={styles.label}>Properties</AppText>
        <AppText style={styles.empty}>Select a block on the canvas</AppText>
      </View>
    )
  }

  const spacingIdx = spacingIndex(block.spacing ?? 12)
  const blockLabel =
    block.type === 'lineItems'
      ? 'line items'
      : block.type === 'bodyText'
        ? 'body text'
        : block.type
  const blockColor = block.color || accentColor

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.wrapContent}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <AppText style={styles.selected}>Selected: {blockLabel}</AppText>

      {block.type === 'meta' ? (
        <View style={styles.textSection}>
          <AppText style={styles.heading}>Document label</AppText>
          <TextInput
            style={styles.titleInput}
            value={documentTitle}
            onChangeText={onDocumentTitleChange}
            placeholder="Invoice"
            placeholderTextColor={EDITOR_CHROME.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.titleChips}
            keyboardShouldPersistTaps="handled"
          >
            {DOCUMENT_TITLE_OPTIONS.map((option) => {
              const on = documentTitle.trim().toLowerCase() === option.toLowerCase()
              return (
                <Pressable
                  key={option}
                  onPress={() => onDocumentTitleChange(option)}
                  style={[styles.titleChip, on ? styles.titleChipOn : null, webInlinePressableReset]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={option}
                >
                  <AppText style={[styles.titleChipText, on ? styles.titleChipTextOn : null]}>
                    {option}
                  </AppText>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      ) : null}

      <AppText style={styles.heading}>Align</AppText>
      <View style={styles.alignRow}>
        {(
          [
            ['left', TextAlignLeft],
            ['center', TextAlignCenter],
            ['right', TextAlignRight],
          ] as const
        ).map(([align, Icon]) => {
          const on = block.align === align
          return (
            <Pressable
              key={align}
              onPress={() => onAlignChange(align)}
              style={[styles.alignBtn, on ? styles.alignBtnOn : null, webInlinePressableReset]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Align ${align}`}
            >
              <Icon size={16} color={on ? '#052e16' : EDITOR_CHROME.text} weight="bold" />
            </Pressable>
          )
        })}
      </View>

      <AppText style={styles.heading}>Accent color</AppText>
      <View style={styles.swatchRow}>
        {ACCENT_SWATCHES.map((color) => {
          const on = blockColor.toLowerCase() === color.toLowerCase()
          return (
            <Pressable
              key={color}
              onPress={() => {
                onBlockColorChange(color)
                onAccentChange(color)
              }}
              style={[
                styles.swatch,
                { backgroundColor: color },
                on ? styles.swatchOn : null,
                webInlinePressableReset,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Accent ${color}`}
            />
          )
        })}
      </View>

      <AppText style={styles.heading}>Spacing</AppText>
      <View style={styles.spacingRow}>
        <Pressable
          onPress={() => {
            const next = SPACING_SCALE[Math.max(0, spacingIdx - 1)]
            if (next != null) onSpacingChange(next)
          }}
          disabled={spacingIdx <= 0}
          style={[
            styles.spacingStep,
            spacingIdx <= 0 ? styles.spacingStepDisabled : null,
            webInlinePressableReset,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Decrease spacing"
        >
          <Minus size={14} color={EDITOR_CHROME.text} weight="bold" />
        </Pressable>
        <AppText style={styles.spacingValue}>{`${SPACING_SCALE[spacingIdx] ?? 12}px`}</AppText>
        <Pressable
          onPress={() => {
            const next = SPACING_SCALE[Math.min(SPACING_SCALE.length - 1, spacingIdx + 1)]
            if (next != null) onSpacingChange(next)
          }}
          disabled={spacingIdx >= SPACING_SCALE.length - 1}
          style={[
            styles.spacingStep,
            spacingIdx >= SPACING_SCALE.length - 1 ? styles.spacingStepDisabled : null,
            webInlinePressableReset,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Increase spacing"
        >
          <Plus size={14} color={EDITOR_CHROME.text} weight="bold" />
        </Pressable>
      </View>

      {block.type === 'bodyText' && onBodyTextChange ? (
        <View>
          <AppText style={styles.heading}>Body text</AppText>
          <TextInput
            style={styles.terms}
            value={block.text ?? ''}
            onChangeText={onBodyTextChange}
            multiline
            placeholder="Write a paragraph for this invoice…"
            placeholderTextColor={EDITOR_CHROME.textMuted}
          />
        </View>
      ) : null}

      {block.type === 'service' && onServiceChange ? (
        <View style={styles.textSection}>
          <AppText style={styles.heading}>Service</AppText>
          <TextInput
            style={styles.titleInput}
            value={block.serviceDescription ?? ''}
            onChangeText={(serviceDescription) => onServiceChange({ serviceDescription })}
            placeholder="Service name"
            placeholderTextColor={EDITOR_CHROME.textMuted}
          />
          <AppText style={styles.heading}>Amount</AppText>
          <TextInput
            style={styles.titleInput}
            value={
              block.serviceAmount == null || Number.isNaN(block.serviceAmount)
                ? ''
                : String(block.serviceAmount)
            }
            onChangeText={(raw) => {
              const cleaned = raw.replace(/[^0-9.]/g, '')
              const n = cleaned === '' ? 0 : Number(cleaned)
              onServiceChange({ serviceAmount: Number.isFinite(n) ? n : 0 })
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={EDITOR_CHROME.textMuted}
          />
        </View>
      ) : null}

      {block.type === 'notes' ? (
        <View>
          <AppText style={styles.heading}>Terms footer</AppText>
          <TextInput
            style={styles.terms}
            value={termsFooter}
            onChangeText={onTermsChange}
            multiline
            placeholder="Thanks for your business."
            placeholderTextColor={EDITOR_CHROME.textMuted}
          />
        </View>
      ) : null}

      {block.type === 'logo' && onChangeLogo ? (
        <View style={styles.logoActions}>
          <Pressable
            onPress={onChangeLogo}
            disabled={logoBusy}
            style={[styles.secondaryBtn, webInlinePressableReset]}
            accessibilityRole="button"
          >
            <AppText style={styles.secondaryBtnText}>{logoBusy ? 'Uploading…' : 'Change logo'}</AppText>
          </Pressable>
          {onRemoveLogo ? (
            <Pressable
              onPress={onRemoveLogo}
              disabled={logoBusy}
              style={[styles.secondaryBtn, webInlinePressableReset]}
              accessibilityRole="button"
            >
              <AppText style={styles.secondaryBtnText}>Remove</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onLockChange(!block.locked)}
          style={[styles.lockBtn, webInlinePressableReset]}
          accessibilityRole="button"
        >
          <AppText style={styles.lockText}>{block.locked ? 'Unlock' : 'Lock'}</AppText>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[styles.deleteBtn, webInlinePressableReset]}
          accessibilityRole="button"
        >
          <AppText style={styles.deleteText}>Delete</AppText>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    maxHeight: 280,
    backgroundColor: EDITOR_CHROME.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: EDITOR_CHROME.border,
  },
  wrapContent: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: EDITOR_CHROME.textMuted,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: EDITOR_CHROME.textMuted,
    paddingVertical: 8,
  },
  selected: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: EDITOR_CHROME.textMuted,
  },
  heading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: EDITOR_CHROME.textMuted,
    marginTop: 2,
  },
  textSection: {
    gap: 8,
  },
  titleInput: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: EDITOR_CHROME.border,
    backgroundColor: EDITOR_CHROME.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: EDITOR_CHROME.text,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  titleChips: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  titleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: EDITOR_CHROME.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  titleChipOn: {
    borderColor: EDITOR_CHROME.green,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  titleChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: EDITOR_CHROME.text,
  },
  titleChipTextOn: {
    color: EDITOR_CHROME.green,
  },
  alignRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alignBtn: {
    width: 36,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EDITOR_CHROME.surface,
  },
  alignBtnOn: {
    backgroundColor: EDITOR_CHROME.green,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  swatchOn: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacingStep: {
    width: 36,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EDITOR_CHROME.surface,
  },
  spacingStepDisabled: {
    opacity: 0.35,
  },
  spacingValue: {
    minWidth: 44,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: EDITOR_CHROME.text,
  },
  terms: {
    minHeight: 56,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: EDITOR_CHROME.border,
    backgroundColor: EDITOR_CHROME.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: EDITOR_CHROME.text,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  logoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: EDITOR_CHROME.border,
  },
  secondaryBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: EDITOR_CHROME.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  lockBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: EDITOR_CHROME.border,
  },
  lockText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: EDITOR_CHROME.text,
  },
  deleteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: EDITOR_CHROME.danger,
  },
  deleteText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: EDITOR_CHROME.danger,
  },
})
