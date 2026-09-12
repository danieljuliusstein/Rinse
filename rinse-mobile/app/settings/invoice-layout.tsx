import { useCallback, useEffect, useState } from 'react'
import type { ImagePickerAsset } from 'expo-image-picker'
import { Alert, BackHandler, StyleSheet, View } from 'react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { InvoiceLayoutEditor } from '@/src/components/invoice/editor/InvoiceLayoutEditor'
import { logoMetaFromUri } from '@/src/components/settings/BusinessLogoSection'
import { ScreenLoading } from '@/src/components/ui'
import { hasCustomBusinessLogo, resolveBusinessLogoSrc } from '@/src/lib/business-logo'
import {
  createLayoutFromTemplate,
  loadInvoiceLayout,
  saveInvoiceLayout,
  type InvoiceEditorLayout,
} from '@/src/lib/invoice-editor'
import { normalizeAccentColor } from '@/src/lib/brand-color'
import {
  DEFAULT_INVOICE_TERMS,
  clearBusinessLogo,
  loadSettings,
  saveSettings,
  uploadBusinessLogo,
} from '@/src/lib/settings-store'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { spacing } from '@/src/theme/colors'

export default function SettingsInvoicingScreen() {
  const goBack = useSafeBack('/settings/invoicing')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [layout, setLayout] = useState<InvoiceEditorLayout | null>(null)
  const [footer, setFooter] = useState(DEFAULT_INVOICE_TERMS)
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const refresh = useCallback(async () => {
    const settings = await loadSettings()
    const accent = normalizeAccentColor(settings.accent_color)
    const template = settings.invoice_template ?? 'rinse'
    const saved = await loadInvoiceLayout()
    setLayout(
      saved ??
        createLayoutFromTemplate(template, accent, true),
    )
    setFooter(settings.invoice_terms_footer || DEFAULT_INVOICE_TERMS)
    setBusinessName(settings.business_name)
    setBusinessEmail(settings.business_email)
    setBusinessPhone(settings.business_phone)
    setBusinessAddress(settings.business_address)
    setLogoUrl(settings.logo_url ?? null)
    setLogoPreviewUri(null)
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => sub.remove()
  }, [goBack])

  const handleSave = async (next: InvoiceEditorLayout) => {
    setSaving(true)
    try {
      await saveInvoiceLayout(next)
      await saveSettings({
        invoice_terms_footer: footer,
        invoice_template: next.templateId,
        accent_color: next.accentColor,
      })
      setLayout(next)
      Alert.alert('Saved', 'Applied to all invoices.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (asset: ImagePickerAsset) => {
    setLogoPreviewUri(asset.uri)
    setLogoUploading(true)
    try {
      const saved = await uploadBusinessLogo({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      })
      if (!hasCustomBusinessLogo(saved.logo_url)) {
        throw new Error('Logo was not saved')
      }
      setLogoUrl(saved.logo_url ?? null)
      setLogoPreviewUri(null)
      const src = resolveBusinessLogoSrc(saved.logo_url)
      if (src) void logoMetaFromUri(src)
    } catch (e) {
      setLogoPreviewUri(null)
      Alert.alert('Logo failed', e instanceof Error ? e.message : 'Could not save logo')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      const saved = await clearBusinessLogo()
      setLogoUrl(saved.logo_url ?? null)
      setLogoPreviewUri(null)
    } catch (e) {
      Alert.alert('Remove failed', e instanceof Error ? e.message : 'Try again')
    }
  }

  if (loading || !layout) {
    return (
      <SettingsScreen
        title="Preview & Customize"
        bottomPadding={0}
        fallbackHref="/settings/invoicing"
        invoiceSurface
      >
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Preview & Customize" bottomPadding={0} fallbackHref="/settings/invoicing">
      <View style={styles.fill}>
        <InvoiceLayoutEditor
          initialLayout={layout}
          onDone={goBack}
          businessName={businessName}
          businessEmail={businessEmail}
          businessAddress={businessAddress}
          businessPhone={businessPhone}
          logoUrl={logoUrl}
          logoPreviewUri={logoPreviewUri}
          termsFooter={footer}
          onTermsChange={setFooter}
          saving={saving}
          onSave={(next) => void handleSave(next)}
          logoUploading={logoUploading}
          onLogoUpload={handleLogoUpload}
          onLogoRemove={handleRemoveLogo}
        />
      </View>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: -spacing.md,
  },
})
