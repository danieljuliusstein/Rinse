import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Barcode, MagnifyingGlass, Receipt } from 'phosphor-react-native'
import type { Client } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText, ListRow, ScreenLoading, SectionGroup, SecondaryButton } from '@/src/components/ui'
import { VehiclePhotoScanner } from '@/src/components/vehicles/VehiclePhotoScanner'
import { VinBarcodeScanner } from '@/src/components/vehicles/VinBarcodeScanner'
import { usePremiumGate } from '@/src/hooks/usePremiumGate'
import { listClients } from '@/src/lib/api'
import { deriveInitials } from '@/src/lib/client-relationship-logic'
import { decodeVin } from '@/src/lib/vin-decode'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type Step = 'choice' | 'assign'

type DecodedVehicle = {
  vin: string
  make: string | null
  model: string | null
  year: number | null
}

export default function ScanHubScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mode?: string }>()
  const { runGated } = usePremiumGate('receipt_ocr')

  const [step, setStep] = useState<Step>('choice')
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [decoding, setDecoding] = useState(false)
  const [decoded, setDecoded] = useState<DecodedVehicle | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')

  const openReceipt = () => {
    runGated(() => router.push('/expenses/receipt-review'))
  }

  const startVinScan = useCallback(() => {
    setBarcodeOpen(true)
  }, [])

  useEffect(() => {
    if (params.mode === 'vin') startVinScan()
    if (params.mode === 'receipt') {
      // Clear mode so backing out of review doesn't re-open the sheet.
      router.replace('/scan')
      runGated(() => router.push('/expenses/receipt-review'))
    }
    // Deep-link once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyVin = async (rawVin: string) => {
    setDecoding(true)
    try {
      try {
        const result = await decodeVin(rawVin)
        setDecoded(result)
      } catch {
        // NHTSA can fail offline — still let them assign the raw VIN.
        setDecoded({ vin: rawVin.toUpperCase(), make: null, model: null, year: null })
      }
      setStep('assign')
      setClientsLoading(true)
      const rows = await listClients(500)
      setClients(rows)
    } catch (e) {
      Alert.alert('VIN', e instanceof Error ? e.message : 'Could not use VIN')
    } finally {
      setDecoding(false)
      setClientsLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return clients.slice(0, 12)
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q),
      )
      .slice(0, 12)
  }, [clients, clientSearch])

  const assignToClient = (client: Client) => {
    if (!decoded) return
    const qs = new URLSearchParams({ vin: decoded.vin })
    if (decoded.make) qs.set('make', decoded.make)
    if (decoded.model) qs.set('model', decoded.model)
    if (decoded.year != null) qs.set('year', String(decoded.year))
    router.push(`/clients/${client.id}/vehicles/new?${qs.toString()}`)
  }

  const resetToChoice = () => {
    setStep('choice')
    setDecoded(null)
    setClientSearch('')
  }

  return (
    <>
      <AppSheet
        title="Scan"
        subtitle={step === 'assign' ? 'Assign VIN to a client' : 'Receipt or VIN'}
      >
        {step === 'choice' ? (
          <View style={styles.body}>
            <SectionGroup title="What are you scanning?" inset>
              <ListRow
                title="Receipt"
                subtitle="Log a business expense from a photo"
                icon={<Receipt size={20} color={colors.greenText} weight="duotone" />}
                iconTone="green"
                grouped
                onPress={openReceipt}
              />
              <ListRow
                title="VIN"
                subtitle="Scan a barcode or photo, then add a vehicle"
                icon={<Barcode size={20} color={colors.blue} weight="duotone" />}
                iconTone="blue"
                grouped
                isLast
                onPress={startVinScan}
              />
            </SectionGroup>
            {decoding ? (
              <AppText variant="caption" style={styles.decoding}>
                Decoding VIN…
              </AppText>
            ) : null}
          </View>
        ) : (
          <View style={styles.body}>
            {decoded ? (
              <View style={styles.vinCard}>
                <AppText variant="sectionLabel">Scanned VIN</AppText>
                <AppText style={styles.vinValue}>{decoded.vin}</AppText>
                <AppText variant="caption" style={styles.vinMeta}>
                  {[decoded.year, decoded.make, decoded.model].filter(Boolean).join(' ') || 'Make/model unknown'}
                </AppText>
                <SecondaryButton label="Scan again" onPress={() => { resetToChoice(); startVinScan() }} />
              </View>
            ) : null}

            <AppText variant="sectionLabel" style={styles.sectionLabel}>
              Assign to client
            </AppText>

            <View style={styles.searchWrap}>
              <View style={styles.searchIcon}>
                <MagnifyingGlass size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients…"
                placeholderTextColor={colors.textDim}
                value={clientSearch}
                onChangeText={setClientSearch}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
              />
            </View>

            {clientsLoading ? (
              <ScreenLoading label="Loading clients…" />
            ) : clients.length === 0 ? (
              <View style={styles.empty}>
                <AppText variant="body" style={styles.emptyText}>
                  Add a client first, then assign this VIN.
                </AppText>
                <SecondaryButton label="New client" onPress={() => router.push('/clients/new')} />
              </View>
            ) : (
              <SectionGroup inset>
                {filteredClients.map((c, index) => (
                  <ListRow
                    key={c.id}
                    title={c.name}
                    subtitle={c.phone || c.email || undefined}
                    icon={
                      <AppText style={styles.avatarText}>{deriveInitials(c.name)}</AppText>
                    }
                    iconTone="purple"
                    grouped
                    isLast={index === filteredClients.length - 1}
                    onPress={() => assignToClient(c)}
                  />
                ))}
              </SectionGroup>
            )}
          </View>
        )}
      </AppSheet>

      <VinBarcodeScanner
        visible={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        onVin={(vin) => void applyVin(vin)}
        onRequestPhotoScan={() => setPhotoOpen(true)}
      />
      <VehiclePhotoScanner
        visible={photoOpen}
        title="Scan VIN photo"
        hint="Fill the frame with the VIN sticker, then capture"
        target="vin"
        onClose={() => setPhotoOpen(false)}
        onResult={(result) => {
          if (result.vin) void applyVin(result.vin)
          else Alert.alert('VIN', 'Could not read a VIN from that photo')
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  decoding: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  vinCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  vinValue: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  vinMeta: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    marginBottom: -spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchIcon: {
    paddingRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  empty: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
})
