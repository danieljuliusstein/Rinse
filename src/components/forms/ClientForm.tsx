import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientFormSchema, formatPhoneAsYouType, type ClientFormValues } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AppText } from '@/src/components/ui/AppText'
import { SectionGroup } from '@/src/components/ui/SectionGroup'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { colors, spacing } from '@/src/theme/colors'

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>
  submitLabel: string
  hint?: string
  onSubmit: (values: ClientFormValues) => Promise<void>
}

export function ClientForm({ defaultValues, submitLabel, hint, onSubmit }: ClientFormProps) {
  const router = useRouter()
  const [done, setDone] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormValues>,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      ...defaultValues,
    },
    mode: 'onChange',
  })

  const save = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
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
})
