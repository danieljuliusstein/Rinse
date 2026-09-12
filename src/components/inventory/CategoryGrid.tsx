import { Pressable, StyleSheet, View } from 'react-native'
import { CaretRight, Flask, Package, Star, Wrench, type IconProps } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import type { CategoryMeta, SectionKey } from '@/src/lib/inventory-utils'
import { SECTION_CONFIG } from '@/src/lib/inventory-utils'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const CATEGORY_ICONS: Record<SectionKey, React.ComponentType<IconProps>> = {
  chemicals: Flask,
  equipment: Wrench,
  supplies: Package,
  wishlist: Star,
}

interface CategoryGridProps {
  metaByKey: Record<SectionKey, CategoryMeta>
  lowCount: number
  onOpenCategory: (key: SectionKey) => void
}

export function CategoryGrid({ metaByKey, lowCount, onOpenCategory }: CategoryGridProps) {
  return (
    <View style={styles.grid}>
      {SECTION_CONFIG.map((section) => {
        const Icon = CATEGORY_ICONS[section.key]
        const meta = metaByKey[section.key]
        const showLowBadge = section.key === 'supplies' && lowCount > 0

        return (
          <Pressable
            key={section.key}
            accessibilityRole="button"
            onPress={() => onOpenCategory(section.key)}
            style={({ pressed }) => [styles.cell, pressed ? styles.cellPressed : null]}
          >
            <View style={styles.top}>
              <Icon size={20} color={colors.textMuted} weight="duotone" />
              {showLowBadge ? (
                <AppText style={styles.badge}>{lowCount} low</AppText>
              ) : (
                <CaretRight size={14} color={colors.textDim} weight="bold" />
              )}
            </View>
            <AppText style={styles.name}>{section.title}</AppText>
            <AppText
              style={[
                styles.meta,
                meta.metaTone === 'warning' ? styles.metaWarning : null,
                meta.metaTone === 'danger' ? styles.metaDanger : null,
              ]}
            >
              {meta.subtitle}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  cellPressed: {
    opacity: 0.92,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: '#d97706',
    fontFamily: fonts.bodySemiBold,
  },
  name: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metaWarning: {
    color: '#d97706',
  },
  metaDanger: {
    color: colors.danger,
  },
})
