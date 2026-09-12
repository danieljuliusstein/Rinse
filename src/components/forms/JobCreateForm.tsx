import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Alert,
  Platform,
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
  CaretRight,
  Check,
  Clock,
  MagnifyingGlass,
  MapPin,
  Phone,
  Plus,
  Receipt,
  X,
} from '@/src/icons'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { JobExpensesSheet, type JobExpenseDraft } from '@/src/components/jobs/JobExpensesSheet'
import { JobLocationToggle } from '@/src/components/jobs/JobLocationToggle'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { DatePickerSheet } from '@/src/components/ui/DatePickerSheet'
import { PillGroup } from '@/src/components/ui/PillGroup'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { listClients, listPackages } from '@/src/lib/api'
import { deriveInitials } from '@/src/lib/client-relationship-logic'
import { formatStartTimeLabel } from '@/src/lib/home-dashboard'
import { localCalendarDate } from '@/src/lib/job-create'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { recordSuccessfulJobAndMaybePromptReview } from '@/src/lib/app-review'
import { confirmUnblockDayIfNeeded } from '@/src/lib/confirm-unblock-day'
import { selectionHaptic } from '@/src/lib/haptics'
import { checkPremiumGate } from '@/src/lib/subscription'
import { trackProductEvent } from '@/src/lib/telemetry'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import {
  colors,
  radii,
  shadows,
  spacing,
  webInlinePressableReset,
  webPressableReset,
} from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const AVATAR_COLORS = ['#22c55e', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'] as const
const GREEN_SOFT = '#E8F8EE'

const RECURRENCE_OPTIONS: {
  value: NonNullable<QuickJobFormValues['recurrence_cadence']>
  label: string
}[] = [
  { value: 'none', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

function formatHeaderDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatCardDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * 17) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0]
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes < 1) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return h === 1 ? '1 hr' : `${h} hr`
  return `${h} hr ${m} min`
}

function WebTimeInput({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  if (Platform.OS !== 'web') return null
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      style={
        {
          position: 'absolute',
          inset: 0,
          opacity: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          border: 'none',
        } satisfies CSSProperties
      }
    />
  )
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
  const [datePickerOpen, setDatePickerOpen] = useState(false)
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
  const selectedPackage = packages.find((p) => p.id === packageId)

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

      const unblocked = await confirmUnblockDayIfNeeded(values.date)
      if (!unblocked) return

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

  const expenseTotal =
    expenses.travel_cost + expenses.marketing_cost + expenses.equipment_depreciation
  const hasExpenses = expenseTotal > 0
  const timeLabel = formatStartTimeLabel(startTime) ?? (startTime?.trim() ? startTime : '')

  const footer = (
    <View style={styles.actions}>
      <Pressable
        onPress={() => setExpenseSheetOpen(true)}
        style={({ pressed }) => [styles.expensesBtn, webInlinePressableReset, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={hasExpenses ? `Expenses, ${fmt(expenseTotal)}` : 'Expenses'}
      >
        <Receipt size={18} color={colors.textMuted} weight="duotone" />
        <AppText style={styles.expensesLabel}>Expenses</AppText>
      </Pressable>
      <SheetSubmitButton
        label="Save job"
        doneLabel="Job scheduled"
        ready={isValid && clients.length > 0}
        done={done}
        loading={isSubmitting}
        disabled={clients.length === 0}
        onPress={() => void save()}
        style={styles.saveBtn}
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
                  <View style={[styles.avatarLg, { backgroundColor: avatarColor(selectedClient.id) }]}>
                    <AppText style={styles.avatarTextOn}>{deriveInitials(selectedClient.name)}</AppText>
                  </View>
                  <View style={styles.clientText}>
                    <AppText style={styles.clientName} numberOfLines={1}>
                      {selectedClient.name}
                    </AppText>
                    {selectedClient.address || selectedClient.phone ? (
                      <View style={styles.metaRow}>
                        {selectedClient.address ? (
                          <>
                            <MapPin size={12} color={colors.textMuted} weight="fill" />
                            <AppText style={styles.clientMeta} numberOfLines={1}>
                              {selectedClient.address}
                            </AppText>
                          </>
                        ) : (
                          <>
                            <Phone size={12} color={colors.textMuted} />
                            <AppText style={styles.clientMeta} numberOfLines={1}>
                              {selectedClient.phone}
                            </AppText>
                          </>
                        )}
                      </View>
                    ) : null}
                  </View>
                  <CaretRight size={16} color={colors.textMuted} weight="bold" />
                </View>
              </Pressable>
            ) : clients.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconMuted}>
                  <MagnifyingGlass size={20} color={colors.textMuted} />
                </View>
                <AppText style={styles.emptyTitle}>No clients yet</AppText>
                <AppText style={styles.emptyBody}>
                  Add your first client from the Clients tab — then come back to schedule their job.
                </AppText>
              </View>
            ) : (
              <View style={styles.searchCard}>
                <View style={styles.searchRow}>
                  <MagnifyingGlass size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, phone, or email"
                    placeholderTextColor={colors.textDim}
                    value={clientSearch}
                    onChangeText={(t) => {
                      setClientSearch(t)
                      setShowClientList(true)
                    }}
                    onFocus={() => setShowClientList(true)}
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoFocus={!initialClientId}
                  />
                  {clientSearch ? (
                    <Pressable
                      onPress={() => setClientSearch('')}
                      style={[styles.clearSearch, webInlinePressableReset]}
                      accessibilityLabel="Clear search"
                    >
                      <X size={14} color={colors.textMuted} weight="bold" />
                    </Pressable>
                  ) : null}
                </View>
                {showClientList ? (
                  <View style={styles.dropdown}>
                    {filteredClients.length === 0 ? (
                      <AppText style={styles.noMatch}>
                        No match for “{clientSearch.trim() || '…'}”. Try a different name or number.
                      </AppText>
                    ) : (
                      filteredClients.map((c, i) => (
                        <Pressable
                          key={c.id}
                          onPress={() => selectClient(c)}
                          style={({ pressed }) => [
                            styles.dropdownRow,
                            i < filteredClients.length - 1 && styles.dropdownRowBorder,
                            webPressableReset,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={styles.dropdownRowInner}>
                            <View style={[styles.avatar, { backgroundColor: avatarColor(c.id) }]}>
                              <AppText style={styles.avatarTextOn}>{deriveInitials(c.name)}</AppText>
                            </View>
                            <View style={styles.clientText}>
                              <AppText style={styles.clientResultName} numberOfLines={1}>
                                {c.name}
                              </AppText>
                              {c.phone ? (
                                <View style={styles.metaRow}>
                                  <Phone size={11} color={colors.textMuted} />
                                  <AppText style={styles.clientMeta}>{c.phone}</AppText>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </Pressable>
                      ))
                    )}
                  </View>
                ) : null}
              </View>
            )}
            {errors.clientId?.message ? (
              <AppText style={styles.error}>{errors.clientId.message}</AppText>
            ) : null}
          </View>

          {/* When */}
          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              When
            </AppText>
            <View style={styles.datetimeRow}>
              <Pressable
                onPress={() => {
                  selectionHaptic()
                  setDatePickerOpen(true)
                }}
                style={({ pressed }) => [styles.metaCard, webPressableReset, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Date ${formatCardDate(jobDate)}. Tap to change.`}
              >
                <View style={styles.metaIconOn}>
                  <CalendarBlank size={18} color={colors.greenText} weight="duotone" />
                </View>
                <View style={styles.metaText}>
                  <AppText style={styles.metaEyebrow}>Date</AppText>
                  <AppText style={styles.metaValue}>{formatCardDate(jobDate)}</AppText>
                </View>
              </Pressable>

              <View
                style={[
                  styles.metaCard,
                  !(startTime?.trim()) && styles.metaCardDashed,
                ]}
              >
                <View style={[styles.metaIconOn, !(startTime?.trim()) && styles.metaIconOff]}>
                  <Clock
                    size={18}
                    color={startTime?.trim() ? colors.greenText : colors.textMuted}
                    weight="duotone"
                  />
                </View>
                <View style={styles.metaText}>
                  <AppText style={styles.metaEyebrow}>Time</AppText>
                  {Platform.OS === 'web' ? (
                    <AppText style={[styles.metaValue, !timeLabel && styles.metaValueMuted]}>
                      {timeLabel || 'Add time'}
                    </AppText>
                  ) : (
                    <TextInput
                      style={[styles.metaValueInput, !timeLabel && styles.metaValueMuted]}
                      value={startTime ?? ''}
                      onChangeText={(t) => setValue('start_time', t, { shouldValidate: true })}
                      placeholder="Add time"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Start time"
                    />
                  )}
                </View>
                {Platform.OS === 'web' ? (
                  <WebTimeInput
                    value={startTime ?? ''}
                    onChange={(t) => setValue('start_time', t, { shouldValidate: true })}
                  />
                ) : null}
              </View>
            </View>
            {Platform.OS !== 'web' && timeLabel && startTime?.includes(':') ? (
              <AppText style={styles.timeHint}>{timeLabel}</AppText>
            ) : null}
            {errors.date?.message ? (
              <AppText style={styles.error}>{errors.date.message}</AppText>
            ) : null}
            <DatePickerSheet
              visible={datePickerOpen}
              title="Job date"
              value={jobDate}
              minDate="2000-01-01"
              onClose={() => setDatePickerOpen(false)}
              onSelect={(iso) => {
                setValue('date', iso, { shouldValidate: true })
                setDatePickerOpen(false)
              }}
            />
          </View>

          {/* Package */}
          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Package
            </AppText>
            {packages.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Plus size={20} color={colors.greenText} weight="bold" />
                </View>
                <AppText style={styles.emptyTitle}>No packages set up</AppText>
                <AppText style={styles.emptyBody}>
                  Build reusable packages in Settings — name, price, what's included — then pick one
                  here in seconds.
                </AppText>
                <Pressable
                  onPress={() => router.push('/settings/packages' as never)}
                  style={({ pressed }) => [
                    styles.emptyAction,
                    webInlinePressableReset,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.emptyActionLabel}>Go to Settings</AppText>
                  <Plus size={14} color={colors.greenText} weight="bold" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const selected = packageId === pkg.id
                  const duration = formatDuration(pkg.duration_minutes)
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
                          <AppText style={[styles.packageName, selected && styles.packageNameOn]}>
                            {pkg.name}
                          </AppText>
                          {pkg.description ? (
                            <AppText style={styles.packageDesc} numberOfLines={2}>
                              {pkg.description}
                            </AppText>
                          ) : null}
                          {duration ? (
                            <View style={styles.durationRow}>
                              <Clock size={12} color={colors.textMuted} />
                              <AppText style={styles.durationText}>{duration}</AppText>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.packageRight}>
                          <AppText style={[styles.packagePrice, selected && styles.packagePriceOn]}>
                            {fmt(pkg.base_price)}
                          </AppText>
                          <View style={[styles.checkRing, selected && styles.checkRingOn]}>
                            {selected ? <Check size={12} color="#ffffff" weight="bold" /> : null}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={() => router.push('/settings/packages' as never)}
                  style={({ pressed }) => [styles.addPackage, webInlinePressableReset, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Add new package"
                >
                  <Plus size={14} color={colors.textMuted} weight="bold" />
                  <AppText style={styles.addPackageLabel}>Add new package</AppText>
                </Pressable>
                {selectedPackage ? (
                  <View style={styles.packageConfirm}>
                    <Check size={12} color={colors.greenText} weight="bold" />
                    <AppText style={styles.packageConfirmText}>
                      {selectedPackage.name} — {fmt(selectedPackage.base_price)}
                    </AppText>
                  </View>
                ) : null}
              </View>
            )}
            {errors.packageId?.message ? (
              <AppText style={styles.error}>{errors.packageId.message}</AppText>
            ) : null}
          </View>

          <Controller
            control={control}
            name="vehicleType"
            render={({ field: { value, onChange } }) => (
              <VehicleTypePicker
                value={value as VehicleType}
                onChange={onChange}
                label="Vehicle"
                variant="solid"
                error={errors.vehicleType?.message}
              />
            )}
          />

          {hasExpenses ? (
            <View style={styles.expenseBanner}>
              <Receipt size={16} color={colors.amber} weight="duotone" />
              <AppText style={styles.expenseBannerText}>
                Expenses added — {fmt(expenseTotal)}
              </AppText>
              <AppText style={styles.expenseBannerHint}>Editable in job detail</AppText>
            </View>
          ) : null}

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
    gap: 20,
    paddingBottom: spacing.sm,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    marginBottom: 0,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.9,
  },
  clientSelected: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.sheet,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  clientSelectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    padding: 0,
  },
  clearSearch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    maxHeight: 180,
  },
  dropdownRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(229, 229, 234, 0.7)',
  },
  dropdownRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noMatch: {
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextOn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  clientText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clientResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clientMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyIconMuted: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  emptyActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.greenText,
  },
  datetimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    minHeight: 64,
    overflow: 'hidden',
    ...shadows.card,
  },
  metaCardDashed: {
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  metaIconOn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaIconOff: {
    backgroundColor: colors.bg,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  metaValueInput: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
    padding: 0,
    minWidth: 0,
  },
  metaValueMuted: {
    color: colors.textMuted,
  },
  timeHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body,
    marginTop: -4,
  },
  packageList: {
    gap: 8,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.sheet,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  packageCardOn: {
    backgroundColor: GREEN_SOFT,
    borderColor: colors.green,
    borderWidth: 2,
  },
  packageCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  packageLeft: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  packageName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packageNameOn: {
    color: colors.greenText,
  },
  packageDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  packageRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  packagePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packagePriceOn: {
    color: colors.greenText,
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRingOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  addPackage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  addPackageLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  packageConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageConfirmText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.greenText,
  },
  expenseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  expenseBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expenseBannerHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  expensesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  expensesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveBtn: {
    flex: 1,
    minWidth: 0,
  },
})
