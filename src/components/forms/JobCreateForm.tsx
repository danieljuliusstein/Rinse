import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  fmt,
  quickJobFormSchema,
  type Client,
  type Package,
  type QuickJobFormValues,
  type VehicleType,
} from '@rinse/core'
import {
  CalendarBlank,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Plus,
} from 'phosphor-react-native'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { JobExpensesSheet, type JobExpenseDraft } from '@/src/components/jobs/JobExpensesSheet'
import { JobLocationToggle } from '@/src/components/jobs/JobLocationToggle'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { SecondaryButton } from '@/src/components/ui/Button'
import { PillGroup } from '@/src/components/ui/PillGroup'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { listClients, listPackages } from '@/src/lib/api'
import { deriveInitials } from '@/src/lib/client-relationship-logic'
import { localCalendarDate } from '@/src/lib/job-create'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { recordSuccessfulJobAndMaybePromptReview } from '@/src/lib/app-review'
import { selectionHaptic } from '@/src/lib/haptics'
import { checkPremiumGate } from '@/src/lib/subscription'
import { trackProductEvent } from '@/src/lib/telemetry'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import { colors, radii, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const RECURRENCE_OPTIONS: { value: NonNullable<QuickJobFormValues['recurrence_cadence']>; label: string }[] = [
  { value: 'none', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

function formatHeaderDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDisplayDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface JobCreateFormProps {
  initialClientId?: string
  initialDate?: string
  onSubmit: (values: QuickJobFormValues, clientName: string) => Promise<void>
}

export function JobCreateForm({ initialClientId, initialDate, onSubmit }: JobCreateFormProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [done, setDone] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [expenses, setExpenses] = useState<JobExpenseDraft>({
    travel_cost: 0,
    marketing_cost: 0,
    equipment_depreciation: 0,
  })

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<QuickJobFormValues>({
    resolver: zodResolver(quickJobFormSchema) as Resolver<QuickJobFormValues>,
    defaultValues: {
      clientId: '',
      packageId: '',
      vehicleType: 'sedan',
      locationType: 'mobile',
      revenue: 0,
      tip: 0,
      date: initialDate ?? localCalendarDate(),
      start_time: '',
      notes: '',
      travel_cost: 0,
      marketing_cost: 0,
      equipment_depreciation: 0,
      recurrence_cadence: 'none',
    },
    mode: 'onChange',
  })

  const clientId = watch('clientId')
  const packageId = watch('packageId')
  const jobDate = watch('date')
  const startTime = watch('start_time')
  const selectedClient = clients.find((c) => c.id === clientId)

  useEffect(() => {
    void Promise.all([listClients(), listPackages()])
      .then(([c, p]) => {
        setClients(c)
        setPackages(p)
        if (p[0]) {
          setValue('packageId', p[0].id, { shouldValidate: true })
          setValue('revenue', p[0].base_price, { shouldValidate: true })
        }
      })
      .finally(() => setLoadingMeta(false))
  }, [setValue])

  useEffect(() => {
    if (!initialClientId) return
    setValue('clientId', initialClientId, { shouldValidate: true })
  }, [initialClientId, setValue])

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return clients.slice(0, 8)
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone?.includes(clientSearch.trim()) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 8)
  }, [clients, clientSearch])

  const selectPackage = (pkg: Package) => {
    selectionHaptic()
    setValue('packageId', pkg.id, { shouldValidate: true })
    setValue('revenue', pkg.base_price, { shouldValidate: true })
  }

  const selectClient = (client: Client) => {
    selectionHaptic()
    setValue('clientId', client.id, { shouldValidate: true })
    setClientSearch('')
    setShowClientList(false)
  }

  const clearClient = () => {
    setValue('clientId', '', { shouldValidate: true })
    setShowClientList(true)
  }

  const save = handleSubmit(async (values) => {
    try {
      const gate = await checkPremiumGate('create_job')
      if (!gate.allowed) return

      const cadence = values.recurrence_cadence === 'none' ? undefined : values.recurrence_cadence
      await onSubmit(
        {
          ...values,
          travel_cost: expenses.travel_cost,
          marketing_cost: expenses.marketing_cost,
          equipment_depreciation: expenses.equipment_depreciation,
          recurrence_cadence: cadence,
          start_time: values.start_time?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
        },
        selectedClient?.name ?? 'Client',
      )
      setDone(true)
      trackProductEvent('job_created', {
        package_id: values.packageId,
        vehicle_type: values.vehicleType,
        location_type: values.locationType,
        revenue: values.revenue,
        has_recurrence: values.recurrence_cadence !== 'none' && values.recurrence_cadence !== undefined,
      })
      void recordSuccessfulJobAndMaybePromptReview()
      setTimeout(() => router.back(), 450)
    } catch (e) {
      Alert.alert('Could not save job', e instanceof Error ? e.message : 'Try again')
    }
  })

  const expenseCount =
    (expenses.travel_cost > 0 ? 1 : 0) +
    (expenses.marketing_cost > 0 ? 1 : 0) +
    (expenses.equipment_depreciation > 0 ? 1 : 0)

  const footer = (
    <View style={styles.actions}>
      <SecondaryButton
        label={expenseCount > 0 ? `+ Expenses (${expenseCount})` : '+ Expenses'}
        onPress={() => setExpenseSheetOpen(true)}
        style={styles.actionBtn}
      />
      <SheetSubmitButton
        label="Save job"
        ready={isValid && clients.length > 0}
        done={done}
        loading={isSubmitting}
        disabled={clients.length === 0}
        onPress={() => void save()}
        style={styles.actionBtn}
      />
    </View>
  )

  return (
    <AppSheet title="New job" subtitle={formatHeaderDate()} footer={loadingMeta ? undefined : footer}>
      {loadingMeta ? (
        <ScreenLoading label="Loading form…" />
      ) : (
        <View style={styles.root}>
          {/* Client */}
          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Client
            </AppText>
            {selectedClient ? (
              <Pressable
                onPress={clearClient}
                style={({ pressed }) => [styles.clientSelected, webPressableReset, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${selectedClient.name}. Tap to change.`}
              >
                <View style={styles.clientSelectedInner}>
                  <View style={styles.avatarOn}>
                    <AppText style={styles.avatarText}>{deriveInitials(selectedClient.name)}</AppText>
                  </View>
                  <View style={styles.clientText}>
                    <AppText style={styles.clientName}>{selectedClient.name}</AppText>
                    {selectedClient.phone ? (
                      <AppText variant="caption" style={styles.clientMeta}>
                        {selectedClient.phone}
                      </AppText>
                    ) : null}
                  </View>
                  <CheckCircle size={18} weight="fill" color={colors.greenText} />
                </View>
              </Pressable>
            ) : (
              <View style={styles.searchWrap}>
                <View style={styles.searchIcon}>
                  <MagnifyingGlass size={16} color={colors.textMuted} />
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search clients..."
                  placeholderTextColor={colors.textDim}
                  value={clientSearch}
                  onChangeText={(t) => {
                    setClientSearch(t)
                    setShowClientList(true)
                  }}
                  onFocus={() => setShowClientList(true)}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {showClientList && filteredClients.length > 0 ? (
                  <View style={styles.dropdown}>
                    {filteredClients.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => selectClient(c)}
                        style={({ pressed }) => [styles.dropdownRow, webPressableReset, pressed && styles.pressed]}
                      >
                        <View style={styles.dropdownRowInner}>
                          <View style={styles.avatar}>
                            <AppText style={styles.avatarTextMuted}>{deriveInitials(c.name)}</AppText>
                          </View>
                          <View style={styles.clientText}>
                            <AppText style={styles.clientName}>{c.name}</AppText>
                            {c.phone ? (
                              <AppText variant="caption" style={styles.clientMeta}>
                                {c.phone}
                              </AppText>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {clients.length === 0 ? (
                  <AppText variant="caption" style={styles.hint}>
                    Add a client first, then create a job.
                  </AppText>
                ) : null}
                {errors.clientId?.message ? (
                  <AppText variant="caption" style={styles.error}>
                    {errors.clientId.message}
                  </AppText>
                ) : null}
              </View>
            )}
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Date & Time
            </AppText>
            <View style={styles.datetimeRow}>
              <View style={styles.datetimeBox}>
                <CalendarBlank size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.datetimeInput}
                  value={jobDate}
                  onChangeText={(t) => setValue('date', t, { shouldValidate: true })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel={`Date ${formatDisplayDate(jobDate)}`}
                />
              </View>
              <View style={styles.datetimeBox}>
                <Clock size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.datetimeInput}
                  value={startTime ?? ''}
                  onChangeText={(t) => setValue('start_time', t, { shouldValidate: true })}
                  placeholder="Time"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel="Start time"
                />
              </View>
            </View>
            {errors.date?.message ? (
              <AppText variant="caption" style={styles.error}>
                {errors.date.message}
              </AppText>
            ) : null}
          </View>

          {/* Package */}
          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Package
            </AppText>
            {packages.length === 0 ? (
              <AppText variant="caption" style={styles.hint}>
                No packages yet. Add one in Settings.
              </AppText>
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const selected = packageId === pkg.id
                  return (
                    <Pressable
                      key={pkg.id}
                      onPress={() => selectPackage(pkg)}
                      style={({ pressed }) => [
                        styles.packageCard,
                        webPressableReset,
                        selected && styles.packageCardOn,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <View style={styles.packageCardInner}>
                        <View style={styles.packageLeft}>
                          <AppText style={styles.packageName}>{pkg.name}</AppText>
                          {pkg.description ? (
                            <AppText variant="caption" style={styles.packageDesc} numberOfLines={2}>
                              {pkg.description}
                            </AppText>
                          ) : null}
                        </View>
                        <View style={styles.packageRight}>
                          <AppText style={styles.packagePrice}>{fmt(pkg.base_price)}</AppText>
                          {selected ? (
                            <CheckCircle size={18} weight="fill" color={colors.greenText} />
                          ) : (
                            <View style={styles.packageRing} />
                          )}
                        </View>
                      </View>
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={() => router.push('/settings/packages' as never)}
                  style={({ pressed }) => [styles.addPackage, webPressableReset, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Add new package"
                >
                  <View style={styles.addPackageInner}>
                    <Plus size={14} color={colors.greenText} weight="bold" />
                    <AppText style={styles.addPackageLabel}>Add new package</AppText>
                  </View>
                </Pressable>
              </View>
            )}
            {errors.packageId?.message ? (
              <AppText variant="caption" style={styles.error}>
                {errors.packageId.message}
              </AppText>
            ) : null}
          </View>

          <Controller
            control={control}
            name="vehicleType"
            render={({ field: { value, onChange } }) => (
              <VehicleTypePicker
                value={value as VehicleType}
                onChange={onChange}
                variant="soft"
                error={errors.vehicleType?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="locationType"
            render={({ field: { value, onChange } }) => (
              <JobLocationToggle value={value} onChange={onChange} />
            )}
          />

          <FormRow>
            <Controller
              control={control}
              name="revenue"
              render={({ field: { value, onChange } }) => (
                <AffixField
                  label="Revenue"
                  value={formatMoneyInput(value)}
                  onChangeText={(t) => onChange(parseMoneyInput(t))}
                  error={errors.revenue?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="tip"
              render={({ field: { value, onChange } }) => (
                <AffixField
                  label="Tip"
                  value={formatMoneyInput(value)}
                  onChangeText={(t) => onChange(parseMoneyInput(t))}
                  error={errors.tip?.message}
                />
              )}
            />
          </FormRow>

          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange } }) => (
              <FormField
                label="Notes (optional)"
                value={value ?? ''}
                onChangeText={onChange}
                multiline
                error={errors.notes?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="recurrence_cadence"
            render={({ field: { value, onChange } }) => (
              <PillGroup
                label="Repeat"
                options={RECURRENCE_OPTIONS}
                value={(value ?? 'none') as (typeof RECURRENCE_OPTIONS)[number]['value']}
                onChange={onChange}
              />
            )}
          />

          <JobExpensesSheet
            visible={expenseSheetOpen}
            value={expenses}
            onSave={setExpenses}
            onClose={() => setExpenseSheetOpen(false)}
          />
        </View>
      )}
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    marginBottom: 0,
  },
  hint: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.88,
  },
  clientSelected: {
    backgroundColor: colors.greenSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.green,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  clientSelectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchWrap: {
    position: 'relative',
    gap: spacing.sm,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071407',
  },
  avatarTextMuted: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  clientText: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clientMeta: {
    color: colors.textMuted,
  },
  datetimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  datetimeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datetimeInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    padding: 0,
  },
  packageList: {
    gap: spacing.sm,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  packageCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  packageCardOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  packageLeft: {
    flex: 1,
    gap: 2,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  packageDesc: {
    color: colors.textMuted,
  },
  packageRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.greenText,
  },
  packageRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textDim,
  },
  addPackage: {
    paddingVertical: 8,
  },
  addPackageInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addPackageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.greenText,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  actionBtn: {
    flex: 1,
    minWidth: 0,
  },
})
