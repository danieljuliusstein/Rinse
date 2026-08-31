import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { SupplyKind } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { AppSheet } from '@/src/components/ui/AppSheet'
import {
  AppText,
  Button,
  PillGroup,
  PrimaryButton,
  ScreenLoading,
  SecondaryButton,
  SheetSubmitButton,
} from '@/src/components/ui'
import {
  createSupply,
  deleteSupply,
  getSupply,
  restockSupply,
  updateSupply,
} from '@/src/lib/supplies-api'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, radii, spacing } from '@/src/theme/colors'

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

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

type Feedback = { tone: 'success' | 'error'; message: string } | null

export default function SupplyEditorScreen() {
  const router = useRouter()
  const { bump } = useDataRefresh()
  const params = useLocalSearchParams<{ id: string; kind?: string }>()
  const id = paramString(params.id)
  const kindParam = paramString(params.kind)
  const isNew = id === 'new'
  const kind: SupplyKind = kindParam === 'consumable' ? 'consumable' : 'chemical'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [restocking, setRestocking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restockDone, setRestockDone] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState(kind === 'consumable' ? 'each' : 'oz')
  const [qty, setQty] = useState('0')
  const [threshold, setThreshold] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')

  const restockReady = Number(restockQty) > 0 && Number.isFinite(Number(restockQty))
  const busy = saving || restocking || deleting

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
      .catch((e) =>
        setFeedback({
          tone: 'error',
          message: e instanceof Error ? e.message : 'Could not load',
        }),
      )
      .finally(() => setLoading(false))
  }, [id, isNew])

  useEffect(() => {
    if (!restockDone) return
    const t = setTimeout(() => setRestockDone(false), 1800)
    return () => clearTimeout(t)
  }, [restockDone])

  const handleSave = async () => {
    if (!name.trim()) {
      setFeedback({ tone: 'error', message: 'Name is required' })
      return
    }
    setSaving(true)
    setFeedback(null)
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
      bump()
      router.back()
    } catch (e) {
      setFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Could not save',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRestock = async () => {
    const quantity = Number(restockQty)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFeedback({ tone: 'error', message: 'Enter a quantity to add' })
      return
    }
    const costRaw = restockCost.trim()
    const totalCost = costRaw ? Number(costRaw) : undefined
    if (totalCost != null && !Number.isFinite(totalCost)) {
      setFeedback({ tone: 'error', message: 'Enter a valid restock cost' })
      return
    }
    setRestocking(true)
    setFeedback(null)
    try {
      const updated = await restockSupply(id, {
        quantity,
        total_cost: totalCost,
      })
      setQty(String(updated.quantity_on_hand))
      setRestockQty('')
      setRestockCost('')
      setRestockDone(true)
      setFeedback({
        tone: 'success',
        message: `Added ${quantity} ${unit} · ${updated.quantity_on_hand} ${unit} on hand`,
      })
      bump()
    } catch (e) {
      setFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Could not restock',
      })
    } finally {
      setRestocking(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setFeedback(null)
    try {
      await deleteSupply(id)
      bump()
      setDeleteOpen(false)
      router.back()
    } catch (e) {
      setDeleteOpen(false)
      setFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Could not delete',
      })
      setDeleting(false)
    }
  }

  const title = isNew ? `Add ${kind === 'consumable' ? 'supply' : 'chemical'}` : 'Edit supply'

  if (loading) {
    return (
      <AppSheet title={title}>
        <ScreenLoading label="Loading supply…" />
      </AppSheet>
    )
  }

  return (
    <>
      <AppSheet
        title={title}
        footer={
          <View style={styles.footer}>
            <PrimaryButton
              label={isNew ? 'Save' : 'Save changes'}
              loading={saving}
              onPress={() => void handleSave()}
              disabled={busy}
            />
            {!isNew ? (
              <>
                <SheetSubmitButton
                  label="Restock"
                  doneLabel="Restocked"
                  ready={restockReady}
                  done={restockDone}
                  loading={restocking}
                  disabled={busy && !restocking}
                  onPress={() => void handleRestock()}
                />
                <SecondaryButton
                  label="Delete supply"
                  onPress={() => setDeleteOpen(true)}
                  disabled={busy}
                />
              </>
            ) : null}
            <SecondaryButton label="Cancel" onPress={() => router.back()} disabled={busy} />
          </View>
        }
      >
        {feedback ? (
          <View
            style={[styles.banner, feedback.tone === 'success' ? styles.bannerOk : styles.bannerErr]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <AppText
              variant="bodyMedium"
              style={feedback.tone === 'success' ? styles.bannerOkText : styles.bannerErrText}
            >
              {feedback.message}
            </AppText>
          </View>
        ) : null}

        <FormField label="Name" value={name} onChangeText={setName} />
        <PillGroup
          label="Unit"
          options={kind === 'consumable' ? CONSUMABLE_UNITS : CHEMICAL_UNITS}
          value={unit}
          onChange={setUnit}
        />
        <FormField
          label="Quantity on hand"
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Reorder at"
          value={threshold}
          onChangeText={setThreshold}
          keyboardType="decimal-pad"
        />
        <FormField label="Supplier" value={supplier} onChangeText={setSupplier} />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
        {!isNew ? (
          <View style={styles.restockBlock}>
            <AppText variant="sectionLabel" style={styles.restockLabel}>
              Restock
            </AppText>
            <FormField
              label="Quantity to add"
              value={restockQty}
              onChangeText={(v) => {
                setRestockQty(v)
                if (restockDone) setRestockDone(false)
                if (feedback?.tone === 'success') setFeedback(null)
              }}
              keyboardType="decimal-pad"
            />
            <FormField
              label="Cost ($)"
              value={restockCost}
              onChangeText={setRestockCost}
              keyboardType="decimal-pad"
            />
          </View>
        ) : null}
      </AppSheet>

      <AppSheet
        presentation="modal"
        visible={deleteOpen}
        title="Delete supply?"
        subtitle={`Remove "${name}" from inventory. This can’t be undone.`}
        onClose={() => {
          if (!deleting) setDeleteOpen(false)
        }}
        footer={
          <View style={styles.footer}>
            <Button
              variant="danger"
              label="Delete supply"
              loading={deleting}
              onPress={() => void handleDelete()}
            />
            <SecondaryButton
              label="Keep supply"
              onPress={() => setDeleteOpen(false)}
              disabled={deleting}
            />
          </View>
        }
      >
        <View style={styles.deleteCard}>
          <AppText variant="body" style={styles.deleteCopy}>
            Stock history for this item will no longer appear in inventory lists.
          </AppText>
        </View>
      </AppSheet>
    </>
  )
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
  restockBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
    width: '100%',
    alignSelf: 'stretch',
    zIndex: 0,
  },
  restockLabel: {
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  banner: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  bannerOk: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  bannerErr: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  bannerOkText: {
    color: colors.greenText,
  },
  bannerErrText: {
    color: '#b91c1c',
  },
  deleteCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteCopy: {
    color: colors.textSecondary,
  },
})
