import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { SupplyKind } from '@rinse/core'
import { SubScreen } from '@/src/components/SubScreen'
import { FormField } from '@/src/components/FormField'
import { PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import {
  createSupply,
  deleteSupply,
  getSupply,
  restockSupply,
  updateSupply,
} from '@/src/lib/supplies-api'
import { spacing } from '@/src/theme/colors'

const CHEMICAL_UNITS = [
  { value: 'oz', label: 'oz' },
  { value: 'gal', label: 'gal' },
  { value: 'ml', label: 'ml' },
  { value: 'L', label: 'L' },
]

const CONSUMABLE_UNITS = [
  { value: 'each', label: 'each' },
  { value: 'box', label: 'box' },
  { value: 'pack', label: 'pack' },
]

export default function SupplyEditorScreen() {
  const router = useRouter()
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: string }>()
  const isNew = id === 'new'
  const kind: SupplyKind = kindParam === 'consumable' ? 'consumable' : 'chemical'

  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState(kind === 'consumable' ? 'each' : 'oz')
  const [qty, setQty] = useState('0')
  const [threshold, setThreshold] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')

  useEffect(() => {
    if (isNew) return
    void getSupply(id)
      .then((supply) => {
        if (!supply) throw new Error('Supply not found')
        setName(supply.name)
        setUnit(supply.unit)
        setQty(String(supply.quantity_on_hand))
        setThreshold(supply.reorder_threshold != null ? String(supply.reorder_threshold) : '')
        setSupplier(supply.supplier ?? '')
        setNotes(supply.notes ?? '')
      })
      .catch((e) => Alert.alert('Supply', e instanceof Error ? e.message : 'Could not load'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Supply', 'Name is required')
      return
    }
    setBusy(true)
    try {
      if (isNew) {
        await createSupply({
          name: name.trim(),
          unit: unit.trim() || 'unit',
          quantity_on_hand: Number(qty) || 0,
          reorder_threshold: threshold ? Number(threshold) : undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
          kind,
        })
      } else {
        await updateSupply(id, {
          name: name.trim(),
          unit: unit.trim() || 'unit',
          quantity_on_hand: Number(qty) || 0,
          reorder_threshold: threshold ? Number(threshold) : undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
          kind,
        })
      }
      router.back()
    } catch (e) {
      Alert.alert('Supply', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const handleRestock = async () => {
    const quantity = Number(restockQty) || 0
    if (quantity <= 0) {
      Alert.alert('Restock', 'Enter a quantity to add')
      return
    }
    setBusy(true)
    try {
      await restockSupply(id, {
        quantity,
        total_cost: restockCost ? Number(restockCost) : undefined,
      })
      const updated = await getSupply(id)
      if (updated) setQty(String(updated.quantity_on_hand))
      setRestockQty('')
      setRestockCost('')
      Alert.alert('Restocked', `Added ${quantity} ${unit}`)
    } catch (e) {
      Alert.alert('Restock', e instanceof Error ? e.message : 'Could not restock')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete supply?', `Delete "${name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await deleteSupply(id)
              router.back()
            } catch (e) {
              Alert.alert('Supply', e instanceof Error ? e.message : 'Could not delete')
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  const title = isNew ? `Add ${kind === 'consumable' ? 'supply' : 'chemical'}` : 'Edit supply'

  return (
    <SubScreen title={title} tabDock={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? null : (
          <>
            <FormField label="Name" value={name} onChangeText={setName} />
            <PillGroup
              label="Unit"
              options={kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS}
              value={unit}
              onChange={setUnit}
            />
            <FormField label="Quantity on hand" value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
            <FormField label="Reorder at" value={threshold} onChangeText={setThreshold} keyboardType="decimal-pad" />
            <FormField label="Supplier" value={supplier} onChangeText={setSupplier} />
            <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
            <PrimaryButton label={isNew ? 'Save' : 'Save changes'} loading={busy} onPress={() => void handleSave()} />

            {!isNew ? (
              <>
                <FormField label="Restock quantity" value={restockQty} onChangeText={setRestockQty} keyboardType="decimal-pad" />
                <FormField label="Restock cost ($)" value={restockCost} onChangeText={setRestockCost} keyboardType="decimal-pad" />
                <SecondaryButton label="Restock" onPress={() => void handleRestock()} disabled={busy} />
                <SecondaryButton label="Delete supply" onPress={handleDelete} disabled={busy} />
              </>
            ) : null}

            <SecondaryButton label="Cancel" onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
})
