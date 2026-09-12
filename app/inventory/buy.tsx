import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Supply, SupplyKind, SupplyPurchaseInput } from '@rinse/core'
import {
  Calendar,
  Check,
  CheckCircle,
  CurrencyDollar,
  Flask,
  Hash,
  MagnifyingGlass,
  Package,
  Plus,
  Sparkle,
  WarningCircle,
  Wrench,
  X,
} from '@/src/icons'
import { AppText, PillGroup, SecondaryButton } from '@/src/components/ui'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { DatePickerSheet } from '@/src/components/ui/DatePickerSheet'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { todayIso } from '@/src/lib/expense-format'
import { selectionHaptic } from '@/src/lib/haptics'
import { listSupplies } from '@/src/lib/supplies-api'
import { createSupplyPurchase } from '@/src/lib/supply-purchases-api'
import { SupplyPurchaseError } from '@/src/lib/supply-purchase-logic'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, radii, shadows, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const NEW_SUPPLY = '__new__'

const KIND_PILLS: { value: SupplyKind; label: string }[] = [
  { value: 'chemical', label: 'Chemical' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'other', label: 'Other' },
]

const UNIT_PILLS: { value: string; label: string }[] = [
  { value: 'oz', label: 'oz' },
  { value: 'ml', label: 'ml' },
  { value: 'each', label: 'each' },
  { value: 'gal', label: 'gal' },
  { value: 'L', label: 'L' },
]

const KIND_META: Record<
  SupplyKind,
  { label: string; bg: string; text: string; ring: string; Icon: typeof Flask }
> = {
  chemical: {
    label: 'Chemical',
    bg: '#ecfdf5',
    text: '#047857',
    ring: '#a7f3d0',
    Icon: Flask,
  },
  consumable: {
    label: 'Consumable',
    bg: '#f0f9ff',
    text: '#0369a1',
    ring: '#bae6fd',
    Icon: Package,
  },
  other: {
    label: 'Other',
    bg: '#fffbeb',
    text: '#b45309',
    ring: '#fde68a',
    Icon: Wrench,
  },
}

function formatCardDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function resolveKind(kind?: SupplyKind): SupplyKind {
  if (kind === 'consumable' || kind === 'other') return kind
  return 'chemical'
}

export default function BuySuppliesScreen() {
  const router = useRouter()
  const { bump } = useDataRefresh()
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [date, setDate] = useState(todayIso())
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [supplyKey, setSupplyKey] = useState('')
  const [addNewExpanded, setAddNewExpanded] = useState(false)
  const [newSupplyName, setNewSupplyName] = useState('')
  const [newSupplyUnit, setNewSupplyUnit] = useState('oz')
  const [newSupplyKind, setNewSupplyKind] = useState<SupplyKind>('chemical')
  const [search, setSearch] = useState('')

  useEffect(() => {
    void listSupplies()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false))
  }, [])

  const isEmptyCatalog = !loadingCatalog && catalog.length === 0
  const isNew = addNewExpanded || supplyKey === NEW_SUPPLY
  const selected = useMemo(
    () => (!isNew ? catalog.find((s) => s.id === supplyKey) : undefined),
    [catalog, isNew, supplyKey],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return catalog
    const q = search.trim().toLowerCase()
    return catalog.filter((s) => s.name.toLowerCase().includes(q))
  }, [catalog, search])

  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const parsedAmount = Number(amount) || 0
  const parsedQty = Number(quantity) || 0
  const canSave =
    !saved &&
    name.trim().length > 0 &&
    parsedAmount > 0 &&
    parsedQty > 0 &&
    dateValid &&
    (isNew ? newSupplyName.trim().length > 0 : Boolean(supplyKey))

  const readinessHint = (() => {
    if (saved || canSave) return null
    if (isEmptyCatalog && !isNew) return 'Add a supply and fill in purchase details to save'
    if (!isNew && !supplyKey) return 'Select a supply to complete the purchase'
    if (isNew && !newSupplyName.trim()) return 'Name the new supply to finish'
    return 'Fill in all purchase details to save'
  })()

  const handleSelectSupply = (id: string) => {
    selectionHaptic()
    setAddNewExpanded(false)
    setSupplyKey(id)
    const supply = catalog.find((s) => s.id === id)
    if (supply && !name.trim()) setName(supply.name)
  }

  const handleToggleAddNew = () => {
    selectionHaptic()
    setAddNewExpanded((open) => {
      const next = !open
      if (next) setSupplyKey(NEW_SUPPLY)
      else if (supplyKey === NEW_SUPPLY) setSupplyKey('')
      return next
    })
  }

  const handleSave = async () => {
    if (!canSave || saving || saved) return
    setSaving(true)
    try {
      const input: SupplyPurchaseInput = {
        date,
        name: name.trim(),
        amount: parsedAmount,
        quantity: parsedQty,
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
      setSaved(true)
      setTimeout(() => router.back(), 700)
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
          {readinessHint ? (
            <View style={styles.hintRow}>
              <WarningCircle size={14} color={colors.amber} weight="fill" />
              <AppText style={styles.hintText}>{readinessHint}</AppText>
            </View>
          ) : null}
          <View style={styles.footerRow}>
            <SecondaryButton label="Cancel" onPress={() => router.back()} style={styles.cancelBtn} />
            <SheetSubmitButton
              label="Save purchase"
              doneLabel="Purchase saved"
              ready={canSave || saved}
              done={saved}
              loading={saving}
              onPress={() => void handleSave()}
              style={styles.saveBtn}
            />
          </View>
        </View>
      }
    >
      <View style={styles.body}>
        <AppText variant="sectionLabel">Purchase details</AppText>
        <View style={styles.card}>
          <FieldRow
            icon={
              <Calendar size={18} color={dateValid ? colors.green : colors.textMuted} weight="duotone" />
            }
            label="Date"
          >
            <Pressable
              onPress={() => {
                selectionHaptic()
                setDatePickerOpen(true)
              }}
              style={({ pressed }) => [styles.dateValueRow, webPressableReset, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Date ${formatCardDate(date)}. Tap to change.`}
            >
              <AppText style={styles.fieldValue}>{formatCardDate(date)}</AppText>
              {dateValid ? (
                <View style={styles.dateCheck}>
                  <Check size={12} color="#ffffff" weight="bold" />
                </View>
              ) : null}
            </Pressable>
          </FieldRow>
          <View style={styles.divider} />
          <FieldRow icon={<Sparkle size={18} color={colors.textMuted} weight="duotone" />} label="Purchase name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="AutoZone haul"
              placeholderTextColor={colors.textDim}
              style={styles.fieldInput}
            />
          </FieldRow>
          <View style={styles.divider} />
          <FieldRow
            icon={<CurrencyDollar size={18} color={colors.textMuted} weight="duotone" />}
            label="Total paid"
          >
            <View style={styles.moneyRow}>
              <AppText style={[styles.moneyPrefix, !amount && styles.moneyPrefixEmpty]}>$</AppText>
              <TextInput
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
                style={styles.fieldInput}
              />
            </View>
          </FieldRow>
          <View style={styles.divider} />
          <FieldRow icon={<Hash size={18} color={colors.textMuted} weight="duotone" />} label="Quantity">
            <View style={styles.qtyRow}>
              <TextInput
                value={quantity}
                onChangeText={(t) => setQuantity(t.replace(/[^0-9.]/g, ''))}
                placeholder="1"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
                style={[styles.fieldInput, styles.qtyInput]}
              />
              <AppText style={styles.qtyUnit}>units</AppText>
            </View>
          </FieldRow>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="sectionLabel">
            {isEmptyCatalog ? 'Your supply catalog' : 'Pick a supply'}
          </AppText>
          {!isEmptyCatalog && selected ? (
            <AppText style={styles.selectedLabel}>Selected</AppText>
          ) : null}
        </View>

        {isEmptyCatalog && !isNew ? (
          <View style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyIcon}>
              <Package size={26} color={colors.textMuted} weight="duotone" />
            </View>
            <AppText style={styles.emptyTitle}>No supplies in your catalog yet</AppText>
            <AppText style={styles.emptyBody}>
              Add your first supply to start tracking stock and logging purchases.
            </AppText>
            <Pressable
              onPress={handleToggleAddNew}
              style={({ pressed }) => [styles.emptyCta, webPressableReset, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Add your first supply"
            >
              <Plus size={17} color="#ffffff" weight="bold" />
              <AppText style={styles.emptyCtaLabel}>Add your first supply</AppText>
            </Pressable>
            <AppText style={styles.emptyFoot}>Or manage your full catalog in Inventory</AppText>
          </View>
        ) : (
          <View style={styles.card}>
            {!isEmptyCatalog ? (
              <>
                <View style={styles.searchRow}>
                  <MagnifyingGlass size={16} color={colors.textMuted} weight="bold" />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search supplies"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                  />
                </View>
                <View style={styles.cardRule} />
              </>
            ) : null}

            <Pressable
              onPress={handleToggleAddNew}
              style={({ pressed }) => [
                styles.addNewRow,
                isNew && styles.addNewRowOn,
                webPressableReset,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isNew ? 'Cancel new supply' : 'Add new supply'}
            >
              <View style={[styles.addNewIcon, isNew && styles.addNewIconOn]}>
                {isNew ? (
                  <X size={17} color="#ffffff" weight="bold" />
                ) : (
                  <Plus size={17} color={colors.greenText} weight="bold" />
                )}
              </View>
              <AppText style={[styles.addNewLabel, isNew && styles.addNewLabelOn]}>
                {isNew ? 'Cancel new supply' : 'Add new supply'}
              </AppText>
            </Pressable>

            {isNew ? (
              <View style={styles.newSupplyPanel}>
                <TextInput
                  value={newSupplyName}
                  onChangeText={setNewSupplyName}
                  placeholder="Supply name (e.g. Meguiars M26 Wax)"
                  placeholderTextColor={colors.textMuted}
                  style={styles.newSupplyName}
                />
                <AppText variant="sectionLabel" style={styles.inlineLabel}>
                  Unit
                </AppText>
                <PillGroup options={UNIT_PILLS} value={newSupplyUnit} onChange={setNewSupplyUnit} />
                <AppText variant="sectionLabel" style={styles.inlineLabel}>
                  Kind
                </AppText>
                <PillGroup options={KIND_PILLS} value={newSupplyKind} onChange={setNewSupplyKind} />
                <AppText style={styles.newSupplyHint}>
                  New supplies start at 0 on hand. Stock updates when you save this purchase.
                </AppText>
              </View>
            ) : null}

            {!isEmptyCatalog ? (
              <>
                <View style={styles.cardRule} />
                <View style={styles.supplyList}>
                  {filtered.map((supply) => {
                    const kind = resolveKind(supply.kind)
                    const meta = KIND_META[kind]
                    const Icon = meta.Icon
                    const on = supply.id === supplyKey && !isNew
                    return (
                      <Pressable
                        key={supply.id}
                        onPress={() => handleSelectSupply(supply.id)}
                        style={({ pressed }) => [
                          styles.supplyRow,
                          on && styles.supplyRowOn,
                          webPressableReset,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <View style={[styles.radio, on && styles.radioOn]}>
                          {on ? <Check size={13} color="#ffffff" weight="bold" /> : null}
                        </View>
                        <View
                          style={[
                            styles.kindIcon,
                            { backgroundColor: meta.bg, borderColor: meta.ring },
                          ]}
                        >
                          <Icon size={17} color={meta.text} weight="duotone" />
                        </View>
                        <View style={styles.supplyText}>
                          <AppText
                            numberOfLines={1}
                            style={[styles.supplyName, on && styles.supplyNameOn]}
                          >
                            {supply.name}
                          </AppText>
                          <AppText style={styles.supplyMeta}>
                            {supply.quantity_on_hand} {supply.unit} on hand
                          </AppText>
                        </View>
                        <View style={[styles.kindBadge, { backgroundColor: meta.bg }]}>
                          <AppText style={[styles.kindBadgeLabel, { color: meta.text }]}>
                            {meta.label}
                          </AppText>
                        </View>
                      </Pressable>
                    )
                  })}
                  {filtered.length === 0 && search.trim() ? (
                    <AppText style={styles.noMatch}>No supplies match “{search.trim()}”</AppText>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>
        )}
      </View>

      <DatePickerSheet
        visible={datePickerOpen}
        title="Purchase date"
        value={date}
        minDate="2000-01-01"
        onClose={() => setDatePickerOpen(false)}
        onSelect={(iso) => {
          setDate(iso)
          setDatePickerOpen(false)
        }}
      />
    </AppSheet>
  )
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldContent}>
        <AppText style={styles.fieldLabel}>{label}</AppText>
        <View style={styles.fieldValueWrap}>{children}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
    ...shadows.card,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldValueWrap: {
    flex: 1,
    paddingLeft: 12,
    alignItems: 'flex-end',
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  fieldInput: {
    width: '100%',
    textAlign: 'right',
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    padding: 0,
  },
  divider: {
    marginLeft: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
  },
  moneyPrefix: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  moneyPrefixEmpty: {
    color: colors.textDim,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyInput: {
    width: 64,
  },
  qtyUnit: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  sectionHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyCtaLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  emptyFoot: {
    marginTop: spacing.md,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    padding: 0,
  },
  cardRule: {
    marginHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addNewRowOn: {
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  addNewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewIconOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  addNewLabel: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
  },
  addNewLabelOn: {
    color: '#15803d',
  },
  newSupplyPanel: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
  },
  newSupplyName: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  inlineLabel: {
    marginTop: 4,
  },
  newSupplyHint: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    lineHeight: 15,
  },
  supplyList: {
    paddingVertical: 4,
  },
  supplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  supplyRowOn: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  kindIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplyText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  supplyName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  supplyNameOn: {
    color: '#14532d',
  },
  supplyMeta: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  kindBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kindBadgeLabel: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  noMatch: {
    paddingHorizontal: spacing.md,
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
  pressed: {
    opacity: 0.85,
  },
})
