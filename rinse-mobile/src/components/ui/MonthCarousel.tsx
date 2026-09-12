import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import type { MonthCarouselItem } from '@/src/lib/invoice-month-revenue'
import { colors, spacing } from '@/src/theme/colors'

interface MonthCarouselProps {
  items: MonthCarouselItem[]
  onSelect?: (id: string) => void
}

export function MonthCarousel({ items, onSelect }: MonthCarouselProps) {
  if (items.length === 0) return null

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onSelect?.(item.id)}
          style={[styles.card, item.active && styles.cardActive]}
        >
          <AppText variant="caption" style={styles.label}>
            {item.label}
          </AppText>
          <AppText variant="bodySemiBold" style={styles.value}>
            {item.value}
          </AppText>
          {item.delta ? (
            <AppText
              variant="caption"
              style={[
                styles.delta,
                item.deltaDirection === 'up' && styles.deltaUp,
                item.deltaDirection === 'down' && styles.deltaDown,
              ]}
            >
              {item.delta}
            </AppText>
          ) : (
            <View style={styles.deltaSpacer} />
          )}
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  card: {
    minWidth: 108,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  cardActive: {
    borderColor: colors.green,
    backgroundColor: '#f0fdf4',
  },
  label: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 18,
    lineHeight: 22,
  },
  delta: {
    color: colors.textMuted,
    fontSize: 11,
  },
  deltaUp: {
    color: colors.greenText,
  },
  deltaDown: {
    color: colors.danger,
  },
  deltaSpacer: {
    height: 14,
  },
})
