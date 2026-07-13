import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientFormSchema, formatPhoneAsYouType, type Client, type ClientFormValues } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AppText } from '@/src/components/ui/AppText'
import { SectionGroup } from '@/src/components/ui/SectionGroup'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { listClients } from '@/src/lib/api'
import { colors, spacing, webPressableReset } from '@/src/theme/colors'

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>
  /** When editing, exclude self (and optionally block nesting under children later). */
  excludeClientId?: string
  submitLabel: string
  hint?: string
  onSubmit: (values: ClientFormValues) => Promise<void>
}

export function ClientForm({
  defaultValues,
  excludeClientId,
  submitLabel,
  hint,
  onSubmit,
}: ClientFormProps) {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [parents, setParents] = useState<Client[]>([])

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormValues>,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      parent_client_id: '',
      ...defaultValues,
    },
    mode: 'onChange',
  })

  const parentId = watch('parent_client_id') ?? ''

  useEffect(() => {
    void listClients(500)
      .then((rows) => {
        setParents(
          rows.filter((c) => {
            if (excludeClientId && c.id === excludeClientId) return false
            // Only top-level dealers/fleets as parents (one level of nesting).
            return !c.parent_client_id
          }),
        )
      })
      .catch(() => setParents([]))
  }, [excludeClientId])

  const save = handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...values,
        parent_client_id: values.parent_client_id?.trim() || undefined,
      })
      setDone(true)
      setTimeout(() => router.back(), 450)
    } catch (e) {
      Alert.alert('Could not save client', e instanceof Error ? e.message : 'Try again')
    }
  })

  return (
    <View style={styles.root}>
      <SectionGroup inset>
        <FormRow>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <FormField label="Name" value={value} onChangeText={onChange} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <FormField
                label="Phone"
                value={value ?? ''}
                onChangeText={(t) => onChange(formatPhoneAsYouType(t))}
                keyboardType="phone-pad"
                error={errors.phone?.message}
              />
            )}
          />
        </FormRow>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Email"
              value={value ?? ''}
              onChangeText={onChange}
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="address"
          render={({ field: { value, onChange } }) => (
            <FormField label="Address" value={value ?? ''} onChangeText={onChange} error={errors.address?.message} />
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

      {parents.length > 0 ? (
        <SectionGroup title="Parent / dealer (optional)" inset>
          <AppText variant="caption" style={styles.parentHint}>
            Nest this contact under a dealer or fleet account.
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setValue('parent_client_id', '', { shouldDirty: true })}
            style={[styles.parentChip, !parentId ? styles.parentChipOn : null, webPressableReset]}
          >
            <AppText style={!parentId ? styles.parentChipTextOn : styles.parentChipText}>None</AppText>
          </Pressable>
          {parents.map((p) => {
            const on = parentId === p.id
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => setValue('parent_client_id', p.id, { shouldDirty: true })}
                style={[styles.parentChip, on ? styles.parentChipOn : null, webPressableReset]}
              >
                <AppText style={on ? styles.parentChipTextOn : styles.parentChipText}>{p.name}</AppText>
              </Pressable>
            )
          })}
        </SectionGroup>
      ) : null}

      {hint ? (
        <AppText variant="caption" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}

      <SheetSubmitButton
        label={submitLabel}
        ready={isValid}
        done={done}
        loading={isSubmitting}
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
    textAlign: 'center',
    color: colors.textMuted,
  },
  parentHint: {
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  parentChip: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  parentChipOn: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  parentChipText: {
    color: colors.textPrimary,
  },
  parentChipTextOn: {
    color: colors.greenText,
    fontWeight: '600',
  },
})
