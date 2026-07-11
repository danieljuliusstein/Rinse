import type { ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { ListRow } from '@/src/components/ui/ListRow'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

interface SectionGroupProps {
  title?: string
  meta?: string
  children: ReactNode
  /** Wrap rows in a single iOS-style grouped card (default true). */
  grouped?: boolean
  /** Inner padding for form fields inside a grouped card. */
  inset?: boolean
}

function groupChildren(children: ReactNode): ReactNode {
  const items = Children.toArray(children)
  return items.map((child, index) => {
    if (!isValidElement(child)) return child
    const isLast = index === items.length - 1
    if (child.type === ListRow) {
      const row = child as ReactElement<{ grouped?: boolean; isLast?: boolean }>
      return cloneElement(row, {
        grouped: row.props.grouped ?? true,
        isLast,
      })
    }
    const typeName =
      typeof child.type === 'function'
        ? (child.type as { displayName?: string; name?: string }).displayName ??
          (child.type as { name?: string }).name
        : undefined
    if (typeName === 'PipelineLeadRow') {
      const row = child as ReactElement<{ isLast?: boolean }>
      return cloneElement(row, { isLast })
    }
    return child
  })
}

export function SectionGroup({ title, meta, children, grouped = true, inset = false }: SectionGroupProps) {
  const body = grouped ? groupChildren(children) : children

  return (
    <View style={styles.root}>
      {title ? (
        <View style={styles.titleRow}>
          <AppText variant="sectionLabel" style={styles.title}>
            {title}
          </AppText>
          {meta ? (
            <AppText variant="caption" style={styles.meta}>
              {meta}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.body, grouped ? styles.bodyCard : null, inset ? styles.bodyInset : null]}>{body}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.md,
  },
  title: {
    marginLeft: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingRight: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
  },
  body: {
    gap: 0,
  },
  bodyCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  bodyInset: {
    padding: spacing.md,
    gap: spacing.sm,
  },
})
