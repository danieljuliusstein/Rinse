import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Supply, SupplyKind, SupplyPurchaseInput } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { AffixField, AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { todayIso } from '@/src/lib/expense-format'
import { listSupplies } from '@/src/lib/supplies-api'
import { createSupplyPurchase } from '@/src/lib/supply-purchases-api'
import { SupplyPurchaseError } from '@/src/lib/supply-purchase-logic'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, radii, spacing } from '@/src/theme/colors'

const NEW_SUPPLY = '__new__'
const KIND_PILLS: { value: SupplyKind; label: string }[] = [
  { value: 'chemical', label: 'Chemical' },
  { value: 'consumable', label: 'Consumable' },
]

export default function BuySuppliesScreen() {
  const router = useRouter()
  const { bump } = useDataRefresh()
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')
  const [supplyKey, setSupplyKey] = useState('')
  const [newSupplyName, setNewSupplyName] = useState('')
  const [newSupplyUnit, setNewSupplyUnit] = useState('oz')
  const [newSupplyKind, setNewSupplyKind] = useState<SupplyKind>('chemical')

  useEffect(() => {
    void listSupplies()
      .then(setCatalog)
      .catch(() => setCatalog([]))
  }, [])

  const selected = useMemo(() => catalog.find((s) => s.id === supplyKey), [catalog, supplyKey])
  const isNew = supplyKey === NEW_SUPPLY
  const parsedAmount = Number(amount) || 0
  const parsedQty = Number(quantity) || 0
  const canSave =
    name.trim().length > 0 &&
    parsedAmount > 0 &&
    parsedQty > 0 &&
    date.length > 0 &&
    (isNew ? newSupplyName.trim().length > 0 : Boolean(supplyKey))

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const input: SupplyPurchaseInput = {
        date,
        name: name.trim(),
        amount: parsedAmount,
        quantity: parsedQty,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(isNew
          ? {
              new_supply: {
                name: newSupplyName.trim(),
                unit: newSupplyUnit.trim() || 'unit',
                quantity_on_hand: parsedQty,
                kind: newSupplyKind,
              },
            }
          : { supply_id: supplyKey }),
      }
      await createSupplyPurchase(input)
      bump()
      router.back()
    } catch (e) {
      const message =
        e instanceof SupplyPurchaseError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not save purchase'
      Alert.alert('Buy supplies', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppSheet
      title="Buy supplies"
      subtitle="Adds stock and logs a supplies expense"
      footer={
        <View style={styles.footer}>
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
          <PrimaryButton
            label={saving ? 'Saving…' : 'Save purchase'}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={!canSave}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <FormField label="Purchase name" value={name} onChangeText={setName} placeholder="Ceramic spray refill" />
        <AffixField
          label="Total paid"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <FormField
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <AppText variant="sectionLabel" style={styles.section}>
          Supply
        </AppText>
        <View style={styles.supplyList}>
          <Pressable
            style={[styles.supplyRow, isNew && styles.supplyRowOn]}
            onPress={() => setSupplyKey(NEW_SUPPLY)}
          >
            <AppText variant="bodySemiBold">+ Add new supply</AppText>
          </Pressable>
          {catalog.map((supply) => {
            const on = supply.id === supplyKey
            return (
              <Pressable
                key={supply.id}
                style={[styles.supplyRow, on && styles.supplyRowOn]}
                onPress={() => {
                  setSupplyKey(supply.id)
                  if (!name.trim()) setName(supply.name)
                }}
              >
                <AppText variant="bodySemiBold">{supply.name}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  {supply.quantity_on_hand} {supply.unit} on hand
                </AppText>
              </Pressable>
            )
          })}
        </View>

        {isNew ? (
          <View style={styles.newSupply}>
            <FormField
              label="New supply name"
              value={newSupplyName}
              onChangeText={setNewSupplyName}
              placeholder="Product name"
            />
            <FormField label="Unit" value={newSupplyUnit} onChangeText={setNewSupplyUnit} placeholder="oz" />
            <PillGroup label="Kind" options={KIND_PILLS} value={newSupplyKind} onChange={setNewSupplyKind} />
          </View>
        ) : selected ? (
          <AppText variant="caption" style={styles.muted}>
            Adding to {selected.name} ({selected.quantity_on_hand} {selected.unit} on hand)
          </AppText>
        ) : null}

        <FormField
          label="Vendor (optional)"
          value={vendor}
          onChangeText={setVendor}
          placeholder="Supplier"
        />
        <FormField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Order #…"
          multiline
        />
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  section: {
    marginTop: spacing.xs,
  },
  supplyList: {
    gap: spacing.xs,
  },
  supplyRow: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  supplyRowOn: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  newSupply: {
    gap: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.sm,
  },
})
