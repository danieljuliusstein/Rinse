import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quoteFormSchema, type Client, type Package, type QuoteFormValues } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { PillGroup } from '@/src/components/ui/PillGroup'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { SectionGroup } from '@/src/components/ui/SectionGroup'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { listClients, listPackages } from '@/src/lib/api'
import { localCalendarDate } from '@/src/lib/job-create'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { createQuote } from '@/src/lib/quotes-api'
import { checkPremiumGate } from '@/src/lib/subscription'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import { colors, spacing } from '@/src/theme/colors'

function defaultValidUntil(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 14)
  return localCalendarDate(d)
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

        const preferredClient =
          (initialClientId && c.find((client) => client.id === initialClientId)) || c[0]
        if (preferredClient) {
          setValue('client_id', preferredClient.id, { shouldValidate: true })
        }
      })
      .finally(() => setLoadingMeta(false))
  }, [initialClientId, initialPackageId, setValue])

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
        notes: values.notes,
        valid_until: values.valid_until,
      })
      setDone(true)
      setTimeout(() => router.replace(`/quotes/${quote.id}`), 450)
    } catch (e) {
      Alert.alert('Could not create quote', e instanceof Error ? e.message : 'Try again')
    }
  })

  if (loadingMeta) return <ScreenLoading label="Loading form…" />

  return (
    <View style={styles.root}>
      <SectionGroup inset>
        <PillGroup
          label="Client"
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          value={clientId}
          onChange={(id) => setValue('client_id', id, { shouldValidate: true })}
          error={errors.client_id?.message}
        />
        {clients.length === 0 ? (
          <AppText variant="caption" style={styles.hint}>
            Add a client first, then create a quote.
          </AppText>
        ) : null}

        <PillGroup
          label="Service package"
          options={packages.map((p) => ({ value: p.id, label: `${p.name} · $${p.base_price}` }))}
          value={packageId}
          onChange={(id) => {
            const pkg = packages.find((p) => p.id === id)
            setValue('package_id', id, { shouldValidate: true })
            if (pkg) setValue('subtotal', pkg.base_price, { shouldValidate: true })
          }}
          error={errors.package_id?.message}
        />

        <Controller
          control={control}
          name="vehicle_type"
          render={({ field: { value, onChange } }) => (
            <VehicleTypePicker
              value={value}
              onChange={onChange}
              error={errors.vehicle_type?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="location_type"
          render={({ field: { value, onChange } }) => (
            <PillGroup
              label="Location"
              options={[
                { value: 'mobile', label: 'Mobile' },
                { value: 'fixed', label: 'Fixed' },
              ]}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <FormRow>
          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <FormField label="Proposed date" value={value} onChangeText={onChange} error={errors.date?.message} />
            )}
          />
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
        </FormRow>

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
              label="Notes"
              value={value ?? ''}
              onChangeText={onChange}
              multiline
              error={errors.notes?.message}
            />
          )}
        />
      </SectionGroup>

      <SheetSubmitButton
        label="Create quote"
        ready={isValid && clients.length > 0 && packages.length > 0}
        done={done}
        loading={isSubmitting}
        disabled={clients.length === 0 || packages.length === 0}
        onPress={() => void save()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
})
