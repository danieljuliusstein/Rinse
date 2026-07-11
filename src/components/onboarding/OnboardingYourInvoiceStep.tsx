import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import type { Package } from '@rinse/core'
import { fmt } from '@rinse/core'
import { AccountReadyCelebration } from '@/src/components/onboarding/AccountReadyCelebration'
import { OnboardingShell } from '@/src/components/onboarding/OnboardingShell'
import { InvoiceTemplateMock } from '@/src/components/invoice/InvoiceTemplateMock'
import { AppText, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { normalizeAccentColor } from '@/src/lib/brand-color'
import {
  markFirstInvoiceCreated,
  nextStepSlug,
  prevStepSlug,
  saveOnboardingStep,
  stepNumberFromSlug,
  loadOnboardingProgress,
  type OnboardingStepSlug,
} from '@/src/lib/onboarding'
import { listAllPackages } from '@/src/lib/packages-api'
import type { AppSettings } from '@/src/lib/settings-store'
import type { InvoiceTemplateId } from '@/src/lib/invoice-templates'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const DEFAULT_TEMPLATE: InvoiceTemplateId = 'rinse'
const DEFAULT_ACCENT = '#22c55e'

export function OnboardingYourInvoiceStep({
  step,
  settings,
  onSaved,
}: {
  step: OnboardingStepSlug
  settings: AppSettings
  onSaved: (settings: AppSettings, next: OnboardingStepSlug) => void
}) {
  const [phase, setPhase] = useState<'celebration' | 'picker'>('celebration')
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const template = (settings.invoice_template ?? DEFAULT_TEMPLATE) as InvoiceTemplateId
  const accent = normalizeAccentColor(settings.accent_color ?? DEFAULT_ACCENT)
  const businessName = settings.business_name.trim() || 'Your business'
  const selectedPkg = packages.find((p) => p.id === selectedPkgId)

  useEffect(() => {
    void listAllPackages()
      .then((pkgs) => {
        const active = pkgs.filter((p) => p.active)
        setPackages(active)
        if (active[0]) setSelectedPkgId(active[0].id)
      })
      .catch(() => setLoadError('Could not load services. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const handleContinue = async () => {
    if (!selectedPkgId) return
    setSaving(true)
    setError('')
    try {
      const next = nextStepSlug(step)
      if (!next) throw new Error('Invalid step')
      await saveOnboardingStep(stepNumberFromSlug(next), {
        invoice_template: template,
        accent_color: accent,
      })
      await markFirstInvoiceCreated()
      const refreshed = await loadOnboardingProgress()
      onSaved(refreshed, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <ScreenLoading variant="list" />

  if (phase === 'celebration') {
    return (
      <AccountReadyCelebration
        businessName={businessName}
        logoUrl={settings.logo_url}
        template={template}
        accent={accent}
        amount={selectedPkg?.base_price ?? packages[0]?.base_price ?? 185}
        onContinue={() => setPhase('picker')}
      />
    )
  }

  return (
    <OnboardingShell
      step={step}
      title="Your invoice"
      footnote="Edit services anytime in Settings → Packages. Customize design in Settings → Invoicing."
      continueDisabled={!selectedPkgId}
      saving={saving}
      onBack={() => {
        const prev = prevStepSlug(step)
        if (prev) onSaved(settings, prev)
      }}
      onContinue={() => void handleContinue()}
    >
      <View style={styles.banner}>
        <AppText variant="caption" style={styles.bannerText}>
          Preview only — nothing is sent.
        </AppText>
      </View>

      {loadError ? (
        <AppText variant="caption" style={styles.error}>
          {loadError}
        </AppText>
      ) : null}

      <SectionGroup title="Your menu" grouped={false}>
        {packages.length ? (
          <View style={styles.pickList}>
            {packages.map((pkg) => {
              const selected = selectedPkgId === pkg.id
              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => setSelectedPkgId(pkg.id)}
                  style={[styles.pickCard, selected ? styles.pickCardOn : null]}
                >
                  <View style={styles.pickMain}>
                    <AppText style={styles.pickName}>{pkg.name}</AppText>
                    {pkg.description ? (
                      <AppText variant="caption" style={styles.pickSub}>
                        {pkg.description}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={styles.pickRight}>
                    <AppText style={styles.pickPrice}>{fmt(pkg.base_price)}</AppText>
                    {selected ? (
                      <View style={styles.check}>
                        <Check size={12} color={colors.greenText} weight="bold" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <AppText style={styles.empty}>No services yet — default packages will appear after sync.</AppText>
        )}
      </SectionGroup>

      <SectionGroup title="Preview" grouped={false}>
        <InvoiceTemplateMock
          template={template}
          accent={accent}
          businessName={businessName}
          logoUrl={settings.logo_url}
          scale="full"
          clientName="Sample Client"
          serviceName={selectedPkg?.name ?? 'Detailing service'}
          serviceNote="Sedan · mobile"
          amount={selectedPkg?.base_price ?? 0}
        />
      </SectionGroup>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </OnboardingShell>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.greenSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.greenBorder,
  },
  bannerText: {
    color: colors.greenText,
    textAlign: 'center',
  },
  pickList: {
    gap: spacing.sm,
  },
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickCardOn: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  pickMain: {
    flex: 1,
    gap: 2,
  },
  pickName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  pickSub: {
    color: colors.textMuted,
  },
  pickRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pickPrice: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.danger,
  },
})
