import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { generatePocketBaseId, type InvoiceLineTemplate } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { FormField } from '@/src/components/FormField'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PrimaryButton, ScreenLoading, SecondaryButton } from '@/src/components/ui'
import {
  deleteInvoiceLineTemplate,
  getInvoiceLineTemplates,
  saveInvoiceLineTemplate,
} from '@/src/lib/invoice-line-templates-api'
import { colors, spacing } from '@/src/theme/colors'

const SEEDS = [
  { description: 'Pet hair', default_amount: 50 },
  { description: 'Ozone treatment', default_amount: 75 },
  { description: 'Ceramic boost', default_amount: 100 },
  { description: 'Engine bay', default_amount: 60 },
]

export default function SettingsAddonsScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addons, setAddons] = useState<InvoiceLineTemplate[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('50')

  const refresh = useCallback(async () => {
    const all = await getInvoiceLineTemplates()
    setAddons(all.filter((t) => t.category === 'addon'))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const seed = async () => {
    setSaving(true)
    try {
      for (const seedItem of SEEDS) {
        await saveInvoiceLineTemplate({
          ...seedItem,
          category: 'addon',
          active: true,
          quantity: 1,
          unit_price: seedItem.default_amount,
          unit: 'each',
        })
      }
      await refresh()
      Alert.alert('Seeded', 'Example add-ons added.')
    } catch (e) {
      Alert.alert('Seed failed', e instanceof Error ? e.message : 'Could not seed')
    } finally {
      setSaving(false)
    }
  }

  const add = async () => {
    const description = name.trim()
    const amount = Number(price.replace(/[^0-9.]/g, '')) || 0
    if (!description || amount <= 0) return
    setSaving(true)
    try {
      await saveInvoiceLineTemplate({
        id: generatePocketBaseId(),
        description,
        default_amount: amount,
        quantity: 1,
        unit_price: amount,
        unit: 'each',
        category: 'addon',
        active: true,
      })
      setName('')
      setPrice('50')
      await refresh()
    } catch (e) {
      Alert.alert('Add failed', e instanceof Error ? e.message : 'Could not add')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title="Add-ons">
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Add-ons" subtitle="Catalog extras for quotes and jobs">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {addons.length === 0 ? (
          <>
            <AppText variant="caption" style={styles.muted}>
              No add-ons yet. Seed examples or create your own.
            </AppText>
            <SecondaryButton label="Seed examples" loading={saving} onPress={() => void seed()} />
          </>
        ) : (
          addons.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.copy}>
                <AppText variant="bodySemiBold">{item.description}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  ${Number(item.default_amount).toFixed(2)}
                  {item.active === false ? ' · inactive' : ''}
                </AppText>
              </View>
              <SecondaryButton
                label="Delete"
                onPress={() => {
                  void deleteInvoiceLineTemplate(item.id).then(() => void refresh())
                }}
              />
            </View>
          ))
        )}
        <FormField label="Name" value={name} onChangeText={setName} placeholder="Pet hair" />
        <AffixField label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <PrimaryButton label="Add add-on" loading={saving} onPress={() => void add()} />
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingBottom: spacing.xl },
  muted: { color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  copy: { flex: 1, gap: 2 },
})
