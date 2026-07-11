import {
  Buildings,
  Calculator,
  FileText,
  Image as ImageIcon,
  ListBullets,
  Note,
  Plus,
  type Icon,
} from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { EDITOR_CHROME, PALETTE, type ElementType } from '@/src/lib/invoice-editor'
import { webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const ICONS: Record<ElementType, Icon> = {
  logo: ImageIcon,
  business: Buildings,
  meta: FileText,
  lineItems: ListBullets,
  totals: Calculator,
  notes: Note,
}

export function ElementPalette({
  placedTypes,
  selectedType,
  onPick,
}: {
  placedTypes: Set<ElementType>
  selectedType: ElementType | null
  /** Add if missing, otherwise select the existing block. */
  onPick: (type: ElementType) => void
}) {
  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>Elements</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PALETTE.map((item) => {
          const placed = placedTypes.has(item.type)
          const selected = selectedType === item.type
          const ItemIcon = ICONS[item.type]
          return (
            <Pressable
              key={item.type}
              onPress={() => onPick(item.type)}
              style={({ pressed }) => [
                styles.chip,
                placed ? styles.chipPlaced : null,
                selected ? styles.chipSelected : null,
                pressed ? styles.chipPressed : null,
                webInlinePressableReset,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={placed ? `Select ${item.label} block` : `Add ${item.label} block`}
            >
              <View style={styles.chipInner}>
                {placed ? (
                  <ItemIcon
                    size={14}
                    color={selected ? EDITOR_CHROME.green : EDITOR_CHROME.text}
                    weight="duotone"
                  />
                ) : (
                  <Plus size={14} color={EDITOR_CHROME.green} weight="bold" />
                )}
                <AppText
                  style={[
                    styles.chipText,
                    placed ? styles.chipTextPlaced : null,
                    selected ? styles.chipTextSelected : null,
                  ]}
                >{item.label}</AppText>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: EDITOR_CHROME.border,
    backgroundColor: EDITOR_CHROME.bg,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: EDITOR_CHROME.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipPlaced: {
    backgroundColor: EDITOR_CHROME.surface,
  },
  chipSelected: {
    borderColor: EDITOR_CHROME.green,
    backgroundColor: '#fff',
  },
  chipPressed: {
    opacity: 0.92,
  },
  chipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: '#111',
  },
  chipTextPlaced: {
    color: EDITOR_CHROME.text,
  },
  chipTextSelected: {
    color: EDITOR_CHROME.green,
  },
})
