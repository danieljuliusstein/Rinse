import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { Plus, Trash } from 'phosphor-react-native'
import type { InvoiceLineTemplate } from '@rinse/core'
import { BusinessFilledField } from '@/src/components/settings/BusinessFilledField'
import { AppText } from '@/src/components/ui'
import {
  deleteInvoiceLineTemplate,
  getInvoiceLineTemplates,
  saveInvoiceLineTemplate,
} from '@/src/lib/invoice-line-templates-api'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function InvoiceLineTemplateManager() {
  const [templates, setTemplates] = useState<InvoiceLineTemplate[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setTemplates(await getInvoiceLineTemplates())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleAdd = async () => {
    const parsed = Number(amount)
    if (!description.trim() || !parsed || parsed <= 0) return
    setBusy(true)
    try {
      await saveInvoiceLineTemplate({ description: description.trim(), default_amount: parsed })
      setDescription('')
      setAmount('')
      await refresh()
    } catch (e) {
      Alert.alert('Could not save line', e instanceof Error ? e.message : 'Try again')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (template: InvoiceLineTemplate) => {
    Alert.alert('Delete line?', `Remove "${template.description}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await deleteInvoiceLineTemplate(template.id)
              await refresh()
            } catch (e) {
              Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again')
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>Line item library</AppText>
      <AppText style={styles.lead}>
        Reusable lines for multi-item invoices — add them when customizing before send.
      </AppText>

      <BusinessFilledField label="Description" value={description} onChangeText={setDescription} />
      <BusinessFilledField
        label="Default amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        prefix="$"
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => void handleAdd()}
        disabled={busy || !description.trim() || !(Number(amount) > 0)}
        style={({ pressed }) => [styles.addBtn, pressed ? styles.addBtnPressed : null]}
      >
        <Plus size={16} color={colors.textPrimary} weight="bold" />
        <AppText style={styles.addBtnLabel}>Add line</AppText>
      </Pressable>

      {templates.length > 0 ? (
        <View style={styles.list}>
          {templates.map((template) => (
            <View key={template.id} style={styles.row}>
              <View style={styles.rowCopy}>
                <AppText variant="bodySemiBold">{template.description}</AppText>
                <AppText variant="caption" style={styles.amount}>
                  ${template.default_amount}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel={`Delete ${template.description}`}
                onPress={() => handleDelete(template)}
                style={styles.deleteBtn}
              >
                <Trash size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <AppText style={styles.empty}>No saved lines yet.</AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  list: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  amount: {
    color: colors.textSecondary,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addBtnPressed: {
    opacity: 0.85,
  },
  addBtnLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
})
