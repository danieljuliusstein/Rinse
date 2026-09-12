import { useCallback, useState } from 'react'
import type { ImagePickerAsset } from 'expo-image-picker'
import { StyleSheet, View } from 'react-native'
import {
  formatPhoneAsYouType,
  normalizeUSPhone,
  onboardingBusinessSchema,
  type OnboardingBusinessFormValues,
} from '@rinse/core'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { BusinessFilledField } from '@/src/components/settings/BusinessFilledField'
import { BusinessLogoSection } from '@/src/components/settings/BusinessLogoSection'
import { OnboardingShell } from '@/src/components/onboarding/OnboardingShell'
import { AppText, SectionGroup } from '@/src/components/ui'
import { hasCustomBusinessLogo } from '@/src/lib/business-logo'
import {
  nextStepSlug,
  prevStepSlug,
  saveOnboardingStep,
  stepNumberFromSlug,
  type OnboardingStepSlug,
} from '@/src/lib/onboarding'
import type { AppSettings } from '@/src/lib/settings-store'
import { uploadBusinessLogo } from '@/src/lib/settings-store'
import { colors, radii, spacing } from '@/src/theme/colors'

export function OnboardingBusinessStep({
  step,
  settings,
  onSaved,
}: {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
}) {
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { control, handleSubmit, watch } = useForm<OnboardingBusinessFormValues>({
    resolver: zodResolver(onboardingBusinessSchema) as Resolver<OnboardingBusinessFormValues>,
    defaultValues: {
      business_name: settings.business_name ?? '',
      business_phone: settings.business_phone ?? '',
      business_email: settings.business_email ?? '',
      business_address: settings.business_address ?? '',
    },
  })

  const businessName = watch('business_name')
  const phone = watch('business_phone')
  const canContinue = businessName.trim().length > 0 && phone.trim().length > 0

  const handleLogoUpload = async (asset: ImagePickerAsset) => {
    setLogoError(null)
    setLogoPreviewUri(asset.uri)
    setLogoUploading(true)
    try {
      const saved = await uploadBusinessLogo({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      })
      if (!hasCustomBusinessLogo(saved.logo_url)) throw new Error('Logo was not saved')
      setLogoUrl(saved.logo_url ?? null)
      setLogoPreviewUri(null)
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : 'Could not upload logo')
      setLogoPreviewUri(null)
    } finally {
      setLogoUploading(false)
    }
  }

  const onContinue = handleSubmit(async (values) => {
    setSaving(true)
    setError('')
    try {
      const business_phone = normalizeUSPhone(values.business_phone)
      const next = nextStepSlug(step)
      if (!next) throw new Error('Invalid step')
      const withStep = await saveOnboardingStep(stepNumberFromSlug(next), {
        business_name: values.business_name.trim(),
        business_phone,
        business_email: (values.business_email ?? '').trim(),
        business_address: (values.business_address ?? '').trim(),
        logo_url: logoUrl ?? settings.logo_url,
      })
      onSaved(withStep, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  })

  const noopRemove = useCallback(async () => {}, [])

  return (
    <OnboardingShell
      step={step}
      title="Your business"
      intro="Quick setup — then you'll see your first invoice."
      footnote="Shown on invoices and your booking page."
      continueDisabled={!canContinue}
      continueHint={!canContinue ? 'Add business name and phone to continue' : undefined}
      saving={saving}
      showBack={Boolean(prevStepSlug(step))}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void onContinue()}
    >
      <View style={styles.sections}>
        <SectionGroup title="Logo" grouped={false}>
          <BusinessLogoSection
            logoUrl={logoUrl}
            previewUri={logoPreviewUri}
            businessName={businessName.trim() || 'Your business'}
            uploading={logoUploading}
            error={logoError}
            onUpload={handleLogoUpload}
            onRemove={noopRemove}
          />
        </SectionGroup>

        <SectionGroup title="Business details" grouped={false}>
          <View style={styles.panel}>
            <Controller
              control={control}
              name="business_name"
              render={({ field }) => (
                <BusinessFilledField
                  label="Business name"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="business_phone"
              render={({ field }) => (
                <BusinessFilledField
                  label="Business phone"
                  value={formatPhoneAsYouType(field.value ?? '')}
                  onChangeText={(t) => field.onChange(formatPhoneAsYouType(t))}
                  keyboardType="phone-pad"
                />
              )}
            />
            <Controller
              control={control}
              name="business_email"
              render={({ field }) => (
                <BusinessFilledField
                  label="Business email"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  keyboardType="email-address"
                  optional
                />
              )}
            />
            <Controller
              control={control}
              name="business_address"
              render={({ field }) => (
                <BusinessFilledField
                  label="Business address"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  optional
                />
              )}
            />
          </View>
        </SectionGroup>
      </View>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </OnboardingShell>
  )
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.lg,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
})
