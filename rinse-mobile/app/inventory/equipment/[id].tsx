import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SubScreen } from '@/src/components/SubScreen'
import { FormField } from '@/src/components/FormField'
import { PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import {
  createEquipment,
  deleteEquipment,
  getEquipmentItem,
  updateEquipment,
} from '@/src/lib/equipment-api'
import { spacing } from '@/src/theme/colors'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
] as const

export default function EquipmentEditorScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'active' | 'retired'>('active')

  useEffect(() => {
    if (isNew) return
    void getEquipmentItem(id)
      .then((item) => {
        if (!item) throw new Error('Equipment not found')
        setName(item.name)
        setPurchasePrice(item.purchase_price != null ? String(item.purchase_price) : '')
        setPurchaseDate(item.purchase_date ?? new Date().toISOString().slice(0, 10))
        setSupplier(item.supplier ?? '')
        setNotes(item.notes ?? '')
        setStatus(item.status ?? 'active')
      })
      .catch((e) => Alert.alert('Equipment', e instanceof Error ? e.message : 'Could not load'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Equipment', 'Name is required')
      return
    }
    setBusy(true)
    try {
      const input = {
        name: name.trim(),
        purchase_price: purchasePrice ? Number(purchasePrice) : undefined,
        purchase_date: purchaseDate || undefined,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      }
      if (isNew) await createEquipment(input)
      else await updateEquipment(id, input)
      router.back()
    } catch (e) {
      Alert.alert('Equipment', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete equipment?', `Delete "${name}" from equipment?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await deleteEquipment(id)
              router.back()
            } catch (e) {
              Alert.alert('Equipment', e instanceof Error ? e.message : 'Could not delete')
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  return (
    <SubScreen title={isNew ? 'Add equipment' : 'Edit equipment'} tabDock={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? null : (
          <>
            <FormField label="Name" value={name} onChangeText={setName} />
            <FormField label="Purchase price ($)" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" />
            <FormField label="Purchase date (YYYY-MM-DD)" value={purchaseDate} onChangeText={setPurchaseDate} />
            <FormField label="Supplier" value={supplier} onChangeText={setSupplier} />
            <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
            <PillGroup label="Status" options={[...STATUS_OPTIONS]} value={status} onChange={setStatus} />
            <PrimaryButton label={isNew ? 'Save' : 'Save changes'} loading={busy} onPress={() => void handleSave()} />
            {!isNew ? <SecondaryButton label="Delete equipment" onPress={handleDelete} disabled={busy} /> : null}
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
