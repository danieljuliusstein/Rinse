import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  fmt,
  quoteFormSchema,
  type Client,
  type Package,
  type QuoteFormValues,
  type VehicleType,
} from '@rinse/core'
import { CalendarBlank, CheckCircle, MagnifyingGlass, Plus } from 'phosphor-react-native'
import { FormField } from '@/src/components/FormField'
import { JobLocationToggle } from '@/src/components/jobs/JobLocationToggle'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { listClients, listPackages } from '@/src/lib/api'
import { deriveInitials } from '@/src/lib/client-relationship-logic'
import { localCalendarDate } from '@/src/lib/job-create'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { createQuote } from '@/src/lib/quotes-api'
import { selectionHaptic } from '@/src/lib/haptics'
import { checkPremiumGate } from '@/src/lib/subscription'
import { trackProductEvent } from '@/src/lib/telemetry'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import { colors, radii, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function defaultValidUntil(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 14)
  return localCalendarDate(d)
}

function formatHeaderDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface QuoteCreateFormProps {
  initialClientId?: string
  initialPackageId?: string
  initialVehicleType?: QuoteFormValues['vehicle_type']
  initialLocationType?: QuoteFormValues['location_type']
}

export function QuoteCreateForm({
  initialClientId,
  initialPackageId,
  initialVehicleType,
  initialLocationType,
}: QuoteCreateFormProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [done, setDone] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as Resolver<QuoteFormValues>,
    defaultValues: {
      client_id: '',
      package_id: '',
      date: localCalendarDate(),
      vehicle_type: initialVehicleType ?? 'sedan',
      location_type: initialLocationType ?? 'mobile',
      subtotal: 0,
      notes: '',
      valid_until: defaultValidUntil(),
    },
    mode: 'onChange',
  })

  const clientId = watch('client_id')
  const packageId = watch('package_id')
  const quoteDate = watch('date')
  const validUntil = watch('valid_until')
  const selectedClient = clients.find((c) => c.id === clientId)

  useEffect(() => {
    void Promise.all([listClients(), listPackages()])
      .then(([c, p]) => {
        const active = p.filter((pkg) => pkg.active !== false)
        setClients(c)
        setPackages(active)

        const preferredPkg =
          (initialPackageId && active.find((pkg) => pkg.id === initialPackageId)) || active[0]
        if (preferredPkg) {
          setValue('package_id', preferredPkg.id, { shouldValidate: true })
          setValue('subtotal', preferredPkg.base_price, { shouldValidate: true })
        }
      })
      .finally(() => setLoadingMeta(false))
  }, [initialPackageId, setValue])

  useEffect(() => {
    if (!initialClientId) return
    setValue('client_id', initialClientId, { shouldValidate: true })
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
    setValue('package_id', pkg.id, { shouldValidate: true })
    setValue('subtotal', pkg.base_price, { shouldValidate: true })
  }

  const selectClient = (client: Client) => {
    selectionHaptic()
    setValue('client_id', client.id, { shouldValidate: true })
    setClientSearch('')
    setShowClientList(false)
  }

  const clearClient = () => {
    setValue('client_id', '', { shouldValidate: true })
    setShowClientList(true)
  }

  const save = handleSubmit(async (values) => {
    try {
      const gate = await checkPremiumGate('create_quote')
      if (!gate.allowed) return

      const quote = await createQuote({
        client_id: values.client_id,
        package_id: values.package_id,
        vehicle_type: values.vehicle_type,
        location_type: values.location_type,
        date: values.date,
        subtotal: values.subtotal,
        notes: values.notes?.trim() || undefined,
        valid_until: values.valid_until,
      })
      setDone(true)
      trackProductEvent('quote_created', {
        vehicle_type: values.vehicle_type,
        location_type: values.location_type,
        subtotal: values.subtotal,
      })
      setTimeout(() => router.replace(`/quotes/${quote.id}`), 450)
    } catch (e) {
      Alert.alert('Could not create quote', e instanceof Error ? e.message : 'Try again')
    }
  })

  const footer = (
    <SheetSubmitButton
      label="Create quote"
      ready={isValid && clients.length > 0 && packages.length > 0}
      done={done}
      loading={isSubmitting}
      disabled={clients.length === 0 || packages.length === 0}
      onPress={() => void save()}
    />
  )

  return (
    <AppSheet title="New quote" subtitle={formatHeaderDate()} footer={loadingMeta ? undefined : footer}>
      {loadingMeta ? (
        <ScreenLoading label="Loading form…" />
      ) : (
        <View style={styles.root}>
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
                    Add a client first, then create a quote.
                  </AppText>
                ) : null}
                {errors.client_id?.message ? (
                  <AppText variant="caption" style={styles.error}>
                    {errors.client_id.message}
                  </AppText>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Dates
            </AppText>
            <View style={styles.datetimeRow}>
              <View style={styles.datetimeBox}>
                <CalendarBlank size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.datetimeInput}
                  value={quoteDate}
                  onChangeText={(t) => setValue('date', t, { shouldValidate: true })}
                  placeholder="Proposed"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel="Proposed date"
                />
              </View>
              <View style={styles.datetimeBox}>
                <CalendarBlank size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.datetimeInput}
                  value={validUntil}
                  onChangeText={(t) => setValue('valid_until', t, { shouldValidate: true })}
                  placeholder="Valid until"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel="Valid until"
                />
              </View>
            </View>
            {errors.date?.message || errors.valid_until?.message ? (
              <AppText variant="caption" style={styles.error}>
                {errors.date?.message ?? errors.valid_until?.message}
              </AppText>
            ) : null}
          </View>

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
            {errors.package_id?.message ? (
              <AppText variant="caption" style={styles.error}>
                {errors.package_id.message}
              </AppText>
            ) : null}
          </View>

          <Controller
            control={control}
            name="vehicle_type"
            render={({ field: { value, onChange } }) => (
              <VehicleTypePicker
                value={value as VehicleType}
                onChange={onChange}
                variant="soft"
                error={errors.vehicle_type?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="location_type"
            render={({ field: { value, onChange } }) => (
              <JobLocationToggle value={value} onChange={onChange} />
            )}
          />

          <Controller
            control={control}
            name="subtotal"
            render={({ field: { value, onChange } }) => (
              <AffixField
                label="Amount"
                value={formatMoneyInput(value)}
                onChangeText={(t) => onChange(parseMoneyInput(t))}
                error={errors.subtotal?.message}
              />
            )}
          />

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
})
