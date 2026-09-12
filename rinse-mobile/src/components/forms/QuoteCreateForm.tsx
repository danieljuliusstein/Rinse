import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
import {
  Calendar,
  Car,
  CaretRight,
  Check,
  MagnifyingGlass,
  Phone,
  Plus,
} from '@/src/icons'
import { AppText } from '@/src/components/ui/AppText'
import { DraftResumeBanner } from '@/src/components/ui/DraftResumeBanner'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { DatePickerSheet } from '@/src/components/ui/DatePickerSheet'
import { QuoteExtraLineEditor } from '@/src/components/forms/QuoteExtraLineEditor'
import { useAutoSaveDraft } from '@/src/hooks/useAutoSaveDraft'
import { listClients, listPackages } from '@/src/lib/api'
import { listVehiclesForClient, vehicleDisplayName } from '@/src/lib/damage-api'
import { deriveInitials } from '@/src/lib/client-relationship-logic'
import { localCalendarDate } from '@/src/lib/job-create'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { getInvoiceLineTemplates } from '@/src/lib/invoice-line-templates-api'
import { createQuote } from '@/src/lib/quotes-api'
import { lightHaptic, selectionHaptic, successHaptic } from '@/src/lib/haptics'
import { checkPremiumGate } from '@/src/lib/subscription'
import { trackProductEvent } from '@/src/lib/telemetry'
import {
  colors,
  radii,
  shadows,
  spacing,
  webInlinePressableReset,
  webPressableReset,
} from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const AVATAR_COLORS = ['#0D9488', '#2563EB', '#D97706', '#DB2777', '#7C3AED', '#059669'] as const
const INK = '#14140F'
const GREEN_SOFT = '#EAFBEF'

function money(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * 17) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0]
}

function defaultValidUntil(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 14)
  return localCalendarDate(d)
}

function formatHeaderDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatValidUntilLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
  const [showClientList, setShowClientList] = useState(!initialClientId)
  const [validUntilOpen, setValidUntilOpen] = useState(false)

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
  const subtotal = watch('subtotal') ?? 0
  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedPackage = packages.find((p) => p.id === packageId)
  const packagePrice = selectedPackage?.base_price ?? 0
  const clientReady = Boolean(selectedClient)
  const offerReady = clientReady && Boolean(packageId)

  const vehicleLines = useMemo(
    () => normalizeBillingLines(extras).filter((line) => String(line.id ?? '').startsWith('veh:')),
    [extras],
  )
  const otherExtras = useMemo(
    () => normalizeBillingLines(extras).filter((line) => !String(line.id ?? '').startsWith('veh:')),
    [extras],
  )
  const otherExtrasTotal = sumLineAmounts(otherExtras)
  const vehicleCount = selectedVehicleIds.length || 1
  const packageLineTotal =
    selectedVehicleIds.length > 0 ? packagePrice * selectedVehicleIds.length : packagePrice

  /** Bolt: package × vehicles (+ other extras). Vehicle lines carry package price — no triple-charge. */
  const recomputeSubtotal = (
    nextExtras: InvoiceLineTemplate[],
    pkgPrice = packagePrice,
    vehicleCountForTotal = selectedVehicleIds.length,
  ) => {
    const packagePortion = vehicleCountForTotal > 0 ? 0 : pkgPrice
    setValue('subtotal', packagePortion + sumLineAmounts(nextExtras), { shouldValidate: true })
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
      if (restored.client_id) setShowClientList(false)
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
      setShowClientList(false)
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

  useEffect(() => {
    if (done) successHaptic()
  }, [done])

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

  const availableTemplates = useMemo(
    () => library.filter((t) => !extras.some((e) => e.id === t.id)).slice(0, 6),
    [library, extras],
  )

  const selectPackage = (pkg: Package) => {
    selectionHaptic()
    setValue('package_id', pkg.id, { shouldValidate: true })
    if (selectedVehicleIds.length > 0) {
      syncVehicleLines(selectedVehicleIds, pkg.base_price)
    } else {
      recomputeSubtotal(normalizeBillingLines(getValues('extra_line_items')), pkg.base_price, 0)
    }
  }

  const selectClient = (client: Client) => {
    selectionHaptic()
    setValue('client_id', client.id, { shouldValidate: true })
    setClientSearch('')
    setShowClientList(false)
    setSelectedVehicleIds([])
    const currentExtras = normalizeBillingLines(getValues('extra_line_items')).filter(
      (line) => !String(line.id ?? '').startsWith('veh:'),
    )
    setValue('extra_line_items', currentExtras as QuoteFormValues['extra_line_items'], {
      shouldValidate: true,
    })
    recomputeSubtotal(currentExtras, packagePrice, 0)
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
    const nextVehicleLines = ids
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
    const next = [...nextVehicleLines, ...existing]
    setValue('extra_line_items', next as QuoteFormValues['extra_line_items'], {
      shouldValidate: true,
    })
    recomputeSubtotal(next, pkgPrice, ids.length)
    if (nextVehicleLines[0]) {
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
      setShowClientList(!initialClientId)
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

  const createReady = isValid && clients.length > 0 && packages.length > 0 && !done

  const footer = loadingMeta ? undefined : (
    <View style={styles.footerWrap}>
      {done ? (
        <View style={styles.ctaSuccess}>
          <Check size={20} color="#ffffff" weight="bold" />
          <AppText style={styles.ctaSuccessLabel}>Quote created</AppText>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            if (!createReady || isSubmitting) return
            lightHaptic()
            void save()
          }}
          disabled={!createReady || isSubmitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: !createReady || isSubmitting }}
          style={[webPressableReset, !createReady && styles.ctaDisabledWrap]}
        >
          <View style={[styles.cta, createReady ? styles.ctaReady : styles.ctaDisabled]}>
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <AppText style={[styles.ctaLabel, createReady && styles.ctaLabelReady]}>
                  Create quote
                </AppText>
                {createReady ? (
                  <View style={styles.ctaTotal}>
                    <AppText style={styles.ctaTotalText}>{`$${money(subtotal)}`}</AppText>
                    <CaretRight size={18} color="#ffffff" weight="bold" />
                  </View>
                ) : null}
              </>
            )}
          </View>
        </Pressable>
      )}
    </View>
  )

  return (
    <AppSheet title="New quote" subtitle={formatHeaderDate()} footer={footer}>
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
                  <View style={[styles.avatarLg, { backgroundColor: avatarColor(selectedClient.id) }]}>
                    <AppText style={styles.avatarTextOn}>
                      {deriveInitials(selectedClient.name)}
                    </AppText>
                  </View>
                  <View style={styles.clientText}>
                    <View style={styles.clientNameRow}>
                      <AppText style={styles.clientName} numberOfLines={1}>
                        {selectedClient.name}
                      </AppText>
                      <View style={styles.checkBadge}>
                        <Check size={11} color="#ffffff" weight="bold" />
                      </View>
                    </View>
                    {selectedClient.phone ? (
                      <View style={styles.metaRow}>
                        <Phone size={11} color={colors.textMuted} />
                        <AppText style={styles.clientMeta}>{selectedClient.phone}</AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText style={styles.changeLabel}>Change</AppText>
                </View>
              </Pressable>
            ) : (
              <View style={styles.searchWrap}>
                <View style={styles.searchField}>
                  <View style={styles.searchIcon}>
                    <MagnifyingGlass size={18} color={colors.textMuted} />
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, phone, email"
                    placeholderTextColor={colors.textDim}
                    value={clientSearch}
                    onChangeText={(t) => {
                      setClientSearch(t)
                      setShowClientList(true)
                    }}
                    onFocus={() => setShowClientList(true)}
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoFocus={!initialClientId && clients.length > 0}
                  />
                </View>

                {clients.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIcon}>
                      <Plus size={22} color={colors.greenText} weight="bold" />
                    </View>
                    <AppText style={styles.emptyTitle}>No clients yet</AppText>
                    <AppText style={styles.emptyBody}>
                      Add a client first to start building a quote for them.
                    </AppText>
                  </View>
                ) : showClientList ? (
                  <View style={styles.clientResults}>
                    {filteredClients.length === 0 ? (
                      <AppText style={styles.noMatch}>
                        No matches{clientSearch.trim() ? ` for “${clientSearch.trim()}”` : ''}
                      </AppText>
                    ) : (
                      filteredClients.map((c) => (
                        <Pressable
                          key={c.id}
                          onPress={() => selectClient(c)}
                          style={({ pressed }) => [
                            styles.clientResultRow,
                            webPressableReset,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={styles.dropdownRowInner}>
                            <View style={[styles.avatar, { backgroundColor: avatarColor(c.id) }]}>
                              <AppText style={styles.avatarTextOn}>{deriveInitials(c.name)}</AppText>
                            </View>
                            <View style={styles.clientText}>
                              <AppText style={styles.clientResultName}>{c.name}</AppText>
                              <View style={styles.metaRow}>
                                {c.phone ? (
                                  <>
                                    <Phone size={10} color={colors.textDim} />
                                    <AppText style={styles.clientMeta}>{c.phone}</AppText>
                                  </>
                                ) : null}
                              </View>
                            </View>
                            <View style={styles.addRing}>
                              <Plus size={14} color={colors.textDim} weight="bold" />
                            </View>
                          </View>
                        </Pressable>
                      ))
                    )}
                  </View>
                ) : null}

                {errors.client_id?.message ? (
                  <AppText style={styles.error}>{errors.client_id.message}</AppText>
                ) : null}
              </View>
            )}
          </View>

          {clientReady ? (
            <View style={styles.section}>
              <AppText variant="sectionLabel" style={styles.sectionLabel}>
                Vehicles on this quote
              </AppText>
              {clientVehicles.length > 0 ? (
                <>
                  <AppText style={styles.hint}>
                    Each selected vehicle is a line at the package price.
                  </AppText>
                  <View style={styles.vehicleList}>
                    {clientVehicles.map((vehicle) => {
                      const selected = selectedVehicleIds.includes(vehicle.id)
                      return (
                        <Pressable
                          key={vehicle.id}
                          onPress={() => toggleVehicle(vehicle.id)}
                          style={({ pressed }) => [
                            styles.vehicleRow,
                            webPressableReset,
                            selected && styles.vehicleRowOn,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <View style={styles.vehicleRowInner}>
                            <View style={[styles.vehicleIcon, selected && styles.vehicleIconOn]}>
                              <Car
                                size={16}
                                color={selected ? colors.greenText : colors.textMuted}
                                weight="duotone"
                              />
                            </View>
                            <View style={styles.flexText}>
                              <AppText style={styles.vehicleName} numberOfLines={1}>
                                {vehicleDisplayName(vehicle)}
                              </AppText>
                              <AppText style={styles.clientMeta}>{vehicle.type}</AppText>
                            </View>
                            <View style={[styles.selectDot, selected && styles.selectDotOn]}>
                              {selected ? <Check size={12} color="#ffffff" weight="bold" /> : null}
                            </View>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                </>
              ) : (
                <View style={styles.noVehicles}>
                  <View style={styles.vehicleIcon}>
                    <Car size={16} color={colors.textDim} weight="duotone" />
                  </View>
                  <AppText style={[styles.hint, styles.flexText]}>
                    No saved vehicles for this client. The package price covers one vehicle by default.
                  </AppText>
                </View>
              )}
            </View>
          ) : null}

          {clientReady ? (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <AppText variant="sectionLabel" style={styles.sectionLabel}>
                  Package
                </AppText>
                {packages.length > 0 ? (
                  <AppText style={styles.sectionHint}>from Settings</AppText>
                ) : null}
              </View>
              {packages.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Plus size={22} color={colors.greenText} weight="bold" />
                  </View>
                  <AppText style={styles.emptyTitle}>No packages yet</AppText>
                  <AppText style={styles.emptyBody}>
                    Set up service packages in Settings to use them in quotes.
                  </AppText>
                  <Pressable
                    onPress={() => router.push('/settings/packages' as never)}
                    style={({ pressed }) => [
                      styles.emptyAction,
                      webInlinePressableReset,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Plus size={14} color={colors.greenText} weight="bold" />
                    <AppText style={styles.emptyActionLabel}>Open packages</AppText>
                  </Pressable>
                </View>
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
                          <View style={styles.flexText}>
                            <AppText style={styles.packageName}>{pkg.name}</AppText>
                            {pkg.description ? (
                              <AppText style={styles.packageDesc} numberOfLines={2}>
                                {pkg.description}
                              </AppText>
                            ) : null}
                            <View style={styles.priceHero}>
                              <AppText style={[styles.priceCurrency, selected && styles.priceOn]}>
                                $
                              </AppText>
                              <AppText style={[styles.priceAmount, selected && styles.priceOn]}>
                                {money(pkg.base_price)}
                              </AppText>
                            </View>
                          </View>
                          <View style={[styles.selectDotLg, selected && styles.selectDotOn]}>
                            {selected ? <Check size={14} color="#ffffff" weight="bold" /> : null}
                          </View>
                        </View>
                      </Pressable>
                    )
                  })}
                  <Pressable
                    onPress={() => router.push('/settings/packages' as never)}
                    style={({ pressed }) => [styles.dashedAction, webPressableReset, pressed && styles.pressed]}
                  >
                    <Plus size={14} color={colors.textMuted} weight="bold" />
                    <AppText style={styles.dashedActionLabel}>Add new package</AppText>
                  </Pressable>
                </View>
              )}
              {errors.package_id?.message ? (
                <AppText style={styles.error}>{errors.package_id.message}</AppText>
              ) : null}
            </View>
          ) : null}

          {offerReady ? (
            <View style={styles.section}>
              <AppText variant="sectionLabel" style={styles.sectionLabel}>
                Extra lines
              </AppText>
              {extras.length === 0 || (vehicleLines.length > 0 && otherExtras.length === 0) ? (
                <>
                  {otherExtras.length === 0 ? (
                    <AppText style={styles.hint}>Add optional extras or tap a saved line.</AppText>
                  ) : null}
                  {availableTemplates.length > 0 && otherExtras.length === 0 ? (
                    <View style={styles.templateChips}>
                      {availableTemplates.map((template) => (
                        <Pressable
                          key={template.id}
                          onPress={() => {
                            selectionHaptic()
                            setExtras([...extras, normalizeBillingLine(template)])
                          }}
                          style={({ pressed }) => [
                            styles.templateChip,
                            webInlinePressableReset,
                            pressed && styles.pressed,
                          ]}
                        >
                          <AppText style={styles.templateChipLabel}>{template.description}</AppText>
                          <AppText style={styles.templateChipPrice}>
                            {`+$${money(template.default_amount)}`}
                          </AppText>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}

              {otherExtras.map((line) => {
                const index = extras.findIndex((row) => row.id === line.id)
                return (
                  <QuoteExtraLineEditor
                    key={String(line.id)}
                    line={line}
                    onChange={(next) =>
                      setExtras(extras.map((row, i) => (i === index ? next : row)))
                    }
                    onRemove={() => setExtras(extras.filter((_, i) => i !== index))}
                  />
                )
              })}

              <Pressable
                onPress={() =>
                  setExtras([
                    ...extras,
                    normalizeBillingLine({
                      id: generatePocketBaseId(),
                      description: '',
                      quantity: 1,
                      unit_price: 0,
                      unit: 'each',
                    }),
                  ])
                }
                style={({ pressed }) => [styles.dashedAction, webPressableReset, pressed && styles.pressed]}
              >
                <Plus size={14} color={colors.textMuted} weight="bold" />
                <AppText style={styles.dashedActionLabel}>Add custom line</AppText>
              </Pressable>
            </View>
          ) : null}

          {offerReady ? (
            <View style={styles.section}>
              <AppText variant="sectionLabel" style={styles.sectionLabel}>
                Total
              </AppText>
              <View style={styles.totalCard}>
                <View style={styles.totalBody}>
                  <View style={styles.totalLine}>
                    <AppText style={styles.totalMuted}>
                      {`Package × ${vehicleCount} vehicle${vehicleCount === 1 ? '' : 's'}`}
                    </AppText>
                    <AppText style={styles.totalLineValue}>{`$${money(packageLineTotal)}`}</AppText>
                  </View>
                  {otherExtrasTotal > 0 ? (
                    <View style={styles.totalLine}>
                      <AppText style={styles.totalMuted}>Extras</AppText>
                      <AppText style={styles.totalLineValue}>{`$${money(otherExtrasTotal)}`}</AppText>
                    </View>
                  ) : null}
                  <View style={styles.totalDivider} />
                  <View style={styles.totalEditRow}>
                    <AppText style={styles.totalLabel}>Quote total</AppText>
                    <Controller
                      control={control}
                      name="subtotal"
                      render={({ field: { value, onChange } }) => (
                        <View style={styles.totalAmount}>
                          <AppText style={styles.totalDollar}>$</AppText>
                          <TextInput
                            style={styles.totalInput}
                            value={formatMoneyInput(value)}
                            onChangeText={(t) => onChange(parseMoneyInput(t))}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                          />
                        </View>
                      )}
                    />
                  </View>
                  {errors.subtotal?.message ? (
                    <AppText style={styles.error}>{errors.subtotal.message}</AppText>
                  ) : null}
                </View>
                <View style={styles.totalFooter}>
                  <AppText style={styles.totalFooterText}>
                    Editable — adjust from the calculated total if needed
                  </AppText>
                </View>
              </View>
            </View>
          ) : null}

          {offerReady ? (
            <>
              <View style={styles.section}>
                <AppText variant="sectionLabel" style={styles.sectionLabel}>
                  Valid until
                </AppText>
                <Controller
                  control={control}
                  name="valid_until"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Pressable
                        onPress={() => {
                          selectionHaptic()
                          setValidUntilOpen(true)
                        }}
                        style={({ pressed }) => [
                          styles.metaCard,
                          webPressableReset,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Valid until ${formatValidUntilLabel(value)}. Tap to change.`}
                      >
                        <View style={styles.metaIcon}>
                          <Calendar size={16} color={colors.textMuted} weight="duotone" />
                        </View>
                        <View style={styles.flexText}>
                          <AppText style={styles.metaEyebrow}>Valid until</AppText>
                          <AppText style={styles.metaValue}>{formatValidUntilLabel(value)}</AppText>
                        </View>
                        <CaretRight size={18} color={colors.textDim} />
                      </Pressable>
                      <DatePickerSheet
                        visible={validUntilOpen}
                        title="Valid until"
                        value={value}
                        onClose={() => setValidUntilOpen(false)}
                        onSelect={(iso) => {
                          onChange(iso)
                          setValidUntilOpen(false)
                        }}
                      />
                    </>
                  )}
                />
                {errors.valid_until?.message ? (
                  <AppText style={styles.error}>{errors.valid_until.message}</AppText>
                ) : null}
              </View>

              <View style={styles.section}>
                <AppText variant="sectionLabel" style={styles.sectionLabel}>
                  Notes
                </AppText>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      style={styles.notesInput}
                      value={value ?? ''}
                      onChangeText={onChange}
                      placeholder="Add a note for the client (optional)…"
                      placeholderTextColor={colors.textDim}
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.notes?.message ? (
                  <AppText style={styles.error}>{errors.notes.message}</AppText>
                ) : null}
              </View>
            </>
          ) : null}
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
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionHint: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    fontFamily: fonts.body,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.9,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
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
  changeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.greenText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: fonts.body,
  },
  searchWrap: {
    gap: 10,
  },
  searchField: {
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  searchInput: {
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  clientResults: {
    gap: 6,
    maxHeight: 180,
  },
  clientResultRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  dropdownRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  noMatch: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  clientResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  clientMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textDim,
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
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: GREEN_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.greenText,
  },
  vehicleList: {
    gap: 6,
  },
  vehicleRow: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    ...shadows.card,
  },
  vehicleRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleRowOn: {
    backgroundColor: GREEN_SOFT,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  noVehicles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: 12,
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
  packageCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  packageCardOn: {
    backgroundColor: GREEN_SOFT,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  packageDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  priceHero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    marginTop: 6,
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: INK,
    lineHeight: 22,
  },
  priceOn: {
    color: colors.greenText,
  },
  selectDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(174, 174, 178, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDotLg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(174, 174, 178, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  selectDotOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  quietAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  quietActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  dashedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dashedActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  templateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 12,
    ...shadows.card,
  },
  templateChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  templateChipPrice: {
    fontSize: 11,
    color: colors.textMuted,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  totalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  totalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalMuted: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  totalLineValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  totalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  totalLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 1,
    flexShrink: 0,
  },
  totalDollar: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  totalInput: {
    minWidth: 40,
    maxWidth: 120,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    textAlign: 'left',
    padding: 0,
    ...(Platform.OS === 'web'
      ? ({ width: 'auto' as unknown as number, outlineStyle: 'none' } as object)
      : null),
  },
  totalFooter: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  totalFooterText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    ...shadows.card,
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    color: colors.textPrimary,
    marginTop: 1,
  },
  notesInput: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  footerWrap: {
    paddingTop: 4,
  },
  cta: {
    borderRadius: radii.sheet,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaReady: {
    backgroundColor: INK,
  },
  ctaDisabled: {
    backgroundColor: colors.border,
  },
  ctaDisabledWrap: {
    opacity: 1,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDim,
  },
  ctaLabelReady: {
    color: '#ffffff',
  },
  ctaTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaTotalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  ctaSuccess: {
    borderRadius: radii.sheet,
    paddingVertical: 14,
    minHeight: 52,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaSuccessLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
})
