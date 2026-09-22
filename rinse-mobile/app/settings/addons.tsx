import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      Alert.alert(t('addons.seeded'), t('addons.seededBody'))
    } catch (e) {
      Alert.alert(t('addons.seedFailed'), e instanceof Error ? e.message : t('common.error'))
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
      Alert.alert(t('addons.addFailed'), e instanceof Error ? e.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title={t('addons.title')}>
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title={t('addons.title')} subtitle={t('addons.subtitle')}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {addons.length === 0 ? (
          <>
            <AppText variant="caption" style={styles.muted}>
              {t('addons.noAddons')}
            </AppText>
            <SecondaryButton label={t('addons.seedExamples')} loading={saving} onPress={() => void seed()} />
          </>
        ) : (
          addons.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.copy}>
                <AppText variant="bodySemiBold">{item.description}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  ${Number(item.default_amount).toFixed(2)}
                  {item.active === false ? ` · ${t('addons.inactive')}` : ''}
                </AppText>
              </View>
              <SecondaryButton
                label={t('common.delete')}
                onPress={() => {
                  void deleteInvoiceLineTemplate(item.id).then(() => void refresh())
                }}
              />
            </View>
          ))
        )}
        <FormField label={t('addons.name')} value={name} onChangeText={setName} placeholder={t('addons.namePlaceholder')} />
        <AffixField label={t('addons.price')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <PrimaryButton label={t('addons.addAddon')} loading={saving} onPress={() => void add()} />
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
