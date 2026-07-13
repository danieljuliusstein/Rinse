import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  fmt,
  generatePocketBaseId,
  normalizeBillingLine,
  normalizeBillingLines,
  quoteFormSchema,
  sumLineAmounts,
  type Client,
  type InvoiceLineTemplate,
  type Package,
  type QuoteFormValues,
  type Vehicle,
} from '@rinse/core'
import { CheckCircle, MagnifyingGlass, Plus } from 'phosphor-react-native'
import { FormField } from '@/src/components/FormField'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { DraftResumeBanner } from '@/src/components/ui/DraftResumeBanner'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { HybridLineEditor } from '@/src/components/invoice/HybridLineEditor'
import { useAutoSaveDraft } from '@/src/hooks/useAutoSaveDraft'
import { listClients, listPackages } from '@/src/lib/api'
import { listVehiclesForClient, vehicleDisplayName } from '@/src/lib/damage-api'
import { deriveInitials } from '@/src/lib/client-relationship-logic'
import { localCalendarDate } from '@/src/lib/job-create'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { getInvoiceLineTemplates } from '@/src/lib/invoice-line-templates-api'
import { createQuote } from '@/src/lib/quotes-api'
import { selectionHaptic } from '@/src/lib/haptics'
import { checkPremiumGate } from '@/src/lib/subscription'
import { trackProductEvent } from '@/src/lib/telemetry'
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
  const [library, setLibrary] = useState<InvoiceLineTemplate[]>([])
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [done, setDone] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
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
      extra_line_items: [],
      notes: '',
      valid_until: defaultValidUntil(),
    },
    mode: 'onChange',
  })

  const draftKey = initialClientId ? `new:${initialClientId}` : 'new'
  const formSnapshot = watch()
  const appliedRestoreRef = useRef(false)
  const { restored, restoredAt, hydrated, clearDraft } = useAutoSaveDraft<QuoteFormValues>({
    entity: 'quote',
    entityId: draftKey,
    value: formSnapshot,
    enabled: !loadingMeta && !done,
    isEmpty: (v) =>
      !v.client_id &&
      !v.notes?.trim() &&
      !v.package_id &&
      !(v.extra_line_items?.length) &&
      (v.subtotal == null || v.subtotal === 0),
  })
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  const clientId = watch('client_id')
  const packageId = watch('package_id')
  const extras = watch('extra_line_items') ?? []
  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedPackage = packages.find((p) => p.id === packageId)
  const packagePrice = selectedPackage?.base_price ?? 0

  const recomputeSubtotal = (
    nextExtras: InvoiceLineTemplate[],
    pkgPrice = packagePrice,
  ) => {
    setValue('subtotal', pkgPrice + sumLineAmounts(nextExtras), { shouldValidate: true })
  }

  const setExtras = (next: InvoiceLineTemplate[]) => {
    const normalized = normalizeBillingLines(next)
    setValue('extra_line_items', normalized as QuoteFormValues['extra_line_items'], {
      shouldValidate: true,
    })
    recomputeSubtotal(normalized)
  }

  useEffect(() => {
    void Promise.all([listClients(), listPackages(), getInvoiceLineTemplates()])
      .then(([c, p, templates]) => {
        setClients(c)
        setPackages(p.filter((pkg) => pkg.active !== false))
        setLibrary(templates)
      })
      .finally(() => setLoadingMeta(false))
  }, [])

  useEffect(() => {
    if (loadingMeta || !hydrated || appliedRestoreRef.current) return

    if (restored) {
      appliedRestoreRef.current = true
      reset({
        ...getValues(),
        ...restored,
        vehicle_type: restored.vehicle_type || initialVehicleType || getValues('vehicle_type'),
        location_type: restored.location_type || initialLocationType || getValues('location_type'),
      })
      setShowResumeBanner(true)
      return
    }

    appliedRestoreRef.current = true
    setShowResumeBanner(false)
    const preferredPkg =
      (initialPackageId && packages.find((pkg) => pkg.id === initialPackageId)) || packages[0]
    if (preferredPkg) {
      setValue('package_id', preferredPkg.id, { shouldValidate: true })
      const restoredExtras = normalizeBillingLines(getValues('extra_line_items'))
      setValue('extra_line_items', restoredExtras as QuoteFormValues['extra_line_items'])
      setValue('subtotal', preferredPkg.base_price + sumLineAmounts(restoredExtras), {
        shouldValidate: true,
      })
    }
    if (initialClientId) {
      setValue('client_id', initialClientId, { shouldValidate: true })
    }
  }, [
    loadingMeta,
    hydrated,
    restored,
    packages,
    reset,
    getValues,
    setValue,
    initialPackageId,
    initialClientId,
    initialVehicleType,
    initialLocationType,
  ])

  useEffect(() => {
    if (!clientId) {
      setClientVehicles([])
      return
    }
    let cancelled = false
    void listVehiclesForClient(clientId)
      .then((rows) => {
        if (!cancelled) setClientVehicles(rows)
      })
      .catch(() => {
        if (!cancelled) setClientVehicles([])
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

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
    if (selectedVehicleIds.length > 0) {
      syncVehicleLines(selectedVehicleIds, pkg.base_price)
    } else {
      recomputeSubtotal(normalizeBillingLines(getValues('extra_line_items')), pkg.base_price)
    }
  }

  const selectClient = (client: Client) => {
    selectionHaptic()
    setValue('client_id', client.id, { shouldValidate: true })
    setClientSearch('')
    setShowClientList(false)
    setSelectedVehicleIds([])
    void listVehiclesForClient(client.id)
      .then(setClientVehicles)
      .catch(() => setClientVehicles([]))
  }

  const clearClient = () => {
    setValue('client_id', '', { shouldValidate: true })
    setShowClientList(true)
    setClientVehicles([])
    setSelectedVehicleIds([])
  }

  const syncVehicleLines = (ids: string[], pkgPrice: number) => {
    const existing = normalizeBillingLines(getValues('extra_line_items')).filter(
      (line) => !String(line.id ?? '').startsWith('veh:'),
    )
    const vehicleLines = ids
      .map((id) => clientVehicles.find((v) => v.id === id))
      .filter((v): v is Vehicle => Boolean(v))
      .map((v) =>
        normalizeBillingLine({
          id: `veh:${v.id}`,
          description: vehicleDisplayName(v),
          quantity: 1,
          unit_price: pkgPrice,
          unit: 'each',
        }),
      )
    const next = [...vehicleLines, ...existing]
    setValue('extra_line_items', next, { shouldValidate: true })
    recomputeSubtotal(next, pkgPrice)
    if (vehicleLines[0]) {
      const first = clientVehicles.find((v) => v.id === ids[0])
      if (first?.type) setValue('vehicle_type', first.type, { shouldValidate: true })
    }
  }

  const toggleVehicle = (vehicleId: string) => {
    selectionHaptic()
    const next = selectedVehicleIds.includes(vehicleId)
      ? selectedVehicleIds.filter((id) => id !== vehicleId)
      : [...selectedVehicleIds, vehicleId]
    setSelectedVehicleIds(next)
    syncVehicleLines(next, selectedPackage?.base_price ?? packagePrice)
  }

  const discardDraft = () => {
    void clearDraft().then(() => {
      appliedRestoreRef.current = true
      setShowResumeBanner(false)
      setSelectedVehicleIds([])
      setClientVehicles([])
      const preferredPkg =
        (initialPackageId && packages.find((pkg) => pkg.id === initialPackageId)) || packages[0]
      reset({
        client_id: initialClientId ?? '',
        package_id: preferredPkg?.id ?? '',
        date: localCalendarDate(),
        vehicle_type: initialVehicleType ?? 'sedan',
        location_type: initialLocationType ?? 'mobile',
        subtotal: preferredPkg?.base_price ?? 0,
        extra_line_items: [],
        notes: '',
        valid_until: defaultValidUntil(),
      })
    })
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
        extra_line_items: normalizeBillingLines(values.extra_line_items),
        notes: values.notes?.trim() || undefined,
        valid_until: values.valid_until,
      })
      await clearDraft()
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
          {showResumeBanner ? (
            <DraftResumeBanner restoredAt={restoredAt} onDiscard={discardDraft} />
          ) : null}
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

          {selectedClient && clientVehicles.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="sectionLabel" style={styles.sectionLabel}>
                Vehicles on this quote
              </AppText>
              <AppText variant="caption" style={styles.hint}>
                Select one or more — each becomes a line at package price.
              </AppText>
              <View style={styles.packageList}>
                {clientVehicles.map((vehicle) => {
                  const selected = selectedVehicleIds.includes(vehicle.id)
                  return (
                    <Pressable
                      key={vehicle.id}
                      onPress={() => toggleVehicle(vehicle.id)}
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
                          <AppText style={styles.packageName}>{vehicleDisplayName(vehicle)}</AppText>
                          <AppText variant="caption" style={styles.clientMeta}>
                            {vehicle.type}
                          </AppText>
                        </View>
                        {selected ? (
                          <CheckCircle size={18} weight="fill" color={colors.greenText} />
                        ) : null}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}

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

          <View style={styles.section}>
            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Extra lines
            </AppText>
            {extras.length === 0 ? (
              <AppText variant="caption" style={styles.hint}>
                Optional qty × rate add-ons (labor, ceramic, etc.).
              </AppText>
            ) : (
              extras.map((line, index) => (
                <HybridLineEditor
                  key={`${line.id}-${index}`}
                  line={line}
                  onChange={(next) =>
                    setExtras(extras.map((row, i) => (i === index ? next : row)))
                  }
                  onRemove={() => setExtras(extras.filter((_, i) => i !== index))}
                />
              ))
            )}
            <Pressable
              onPress={() =>
                setExtras([
                  ...extras,
                  normalizeBillingLine({
                    id: generatePocketBaseId(),
                    description: 'Custom line',
                    quantity: 1,
                    unit_price: 0,
                    unit: 'each',
                  }),
                ])
              }
              style={({ pressed }) => [styles.addPackage, webPressableReset, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={styles.addPackageInner}>
                <Plus size={14} color={colors.greenText} weight="bold" />
                <AppText style={styles.addPackageLabel}>Add custom line</AppText>
              </View>
            </Pressable>
            {library
              .filter((t) => !extras.some((e) => e.id === t.id))
              .slice(0, 6)
              .map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => setExtras([...extras, normalizeBillingLine(template)])}
                  style={({ pressed }) => [styles.libraryRow, webPressableReset, pressed && styles.pressed]}
                >
                  <AppText variant="bodySemiBold">{template.description}</AppText>
                  <AppText variant="caption" style={styles.hint}>
                    {fmt(template.default_amount)}
                  </AppText>
                </Pressable>
              ))}
          </View>

          <View style={styles.totalRow}>
            <View>
              <AppText variant="caption" style={styles.hint}>
                Package {fmt(packagePrice)}
                {extras.length > 0 ? ` + extras ${fmt(sumLineAmounts(extras))}` : ''}
              </AppText>
              <AppText variant="sectionLabel">Quote total</AppText>
            </View>
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
          </View>

          <Controller
            control={control}
            name="valid_until"
            render={({ field: { value, onChange } }) => (
              <FormField
                label="Valid until"
                value={value}
                onChangeText={onChange}
                error={errors.valid_until?.message}
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
  libraryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  totalRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
})
