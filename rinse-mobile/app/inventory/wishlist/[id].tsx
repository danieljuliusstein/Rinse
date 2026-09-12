import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SubScreen } from '@/src/components/SubScreen'
import { FormField } from '@/src/components/FormField'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import {
  deleteHomeInventoryItem,
  loadHomeInventory,
  saveHomeInventory,
  upsertHomeInventoryItem,
} from '@/src/lib/home-inventory'
import { spacing } from '@/src/theme/colors'

export default function WishlistEditorScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [priceEstimate, setPriceEstimate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }
    void loadHomeInventory()
      .then((items) => {
        const item = items.find((entry) => entry.id === id)
        if (!item) throw new Error('Item not found')
        setName(item.name)
        setPriceEstimate(item.priceEstimate != null ? String(item.priceEstimate) : '')
        setNotes(item.notes ?? '')
      })
      .catch((e) => Alert.alert('Wish list', e instanceof Error ? e.message : 'Could not load'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Wish list', 'Name is required')
      return
    }
    setBusy(true)
    try {
      const items = await loadHomeInventory()
      const next = upsertHomeInventoryItem(items, {
        id: isNew ? undefined : id,
        name: name.trim(),
        category: 'wishlist',
        notes: notes.trim(),
        priceEstimate: priceEstimate ? Number(priceEstimate) : undefined,
      })
      await saveHomeInventory(next)
      router.back()
    } catch (e) {
      Alert.alert('Wish list', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Remove item?', `Remove "${name}" from your wish list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              const items = await loadHomeInventory()
              await saveHomeInventory(deleteHomeInventoryItem(items, id))
              router.back()
            } catch (e) {
              Alert.alert('Wish list', e instanceof Error ? e.message : 'Could not remove')
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  return (
    <SubScreen title={isNew ? 'Add wish list item' : 'Edit wish list item'} tabDock={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? null : (
          <>
            <FormField label="Name" value={name} onChangeText={setName} />
            <FormField label="Price estimate ($)" value={priceEstimate} onChangeText={setPriceEstimate} keyboardType="decimal-pad" />
            <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
            <PrimaryButton label={isNew ? 'Save' : 'Save changes'} loading={busy} onPress={() => void handleSave()} />
            {!isNew ? <SecondaryButton label="Remove item" onPress={handleDelete} disabled={busy} /> : null}
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
