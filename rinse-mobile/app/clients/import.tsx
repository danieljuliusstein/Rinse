import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SubScreen } from '@/src/components/SubScreen'
import { FormField } from '@/src/components/FormField'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { createClient } from '@/src/lib/api'
import {
  CLIENT_CSV_FIELD_OPTIONS,
  clientInputFromMapped,
  detectCsvHeaders,
  mapCsvRows,
  vehicleInputFromMapped,
  type ClientCsvField,
} from '@/src/lib/client-csv-import'
import { createVehicle } from '@/src/lib/damage-api'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, spacing, webPressableReset } from '@/src/theme/colors'

type Step = 'paste' | 'map' | 'preview'

export default function ImportClientsScreen() {
  const router = useRouter()
  const { bump } = useDataRefresh()
  const [csv, setCsv] = useState('name,phone,email,address,notes\n')
  const [step, setStep] = useState<Step>('paste')
  const [headers, setHeaders] = useState<string[]>([])
  const [dataLines, setDataLines] = useState<string[]>([])
  const [mapping, setMapping] = useState<ClientCsvField[]>([])
  const [busy, setBusy] = useState(false)

  const preview = useMemo(() => mapCsvRows(dataLines, mapping), [dataLines, mapping])

  const cycleField = (index: number) => {
    const options = CLIENT_CSV_FIELD_OPTIONS.map((o) => o.value)
    const current = mapping[index] ?? 'skip'
    const next = options[(options.indexOf(current) + 1) % options.length] ?? 'skip'
    setMapping((prev) => {
      const copy = [...prev]
      // Unique non-skip fields
      if (next !== 'skip') {
        for (let i = 0; i < copy.length; i++) {
          if (i !== index && copy[i] === next) copy[i] = 'skip'
        }
      }
      copy[index] = next
      return copy
    })
  }

  const handleContinue = () => {
    const detected = detectCsvHeaders(csv)
    if (detected.headers.length === 0) {
      Alert.alert('Empty CSV', 'Paste at least one row of data.')
      return
    }
    setHeaders(detected.headers)
    setDataLines(detected.dataLines)
    setMapping(detected.mapping)
    setStep('map')
  }

  const handlePreview = () => {
    if (!mapping.includes('name')) {
      Alert.alert('Name required', 'Map at least one column to Name.')
      return
    }
    setStep('preview')
  }

  const handleImport = async () => {
    const { rows, errors } = mapCsvRows(dataLines, mapping)
    if (rows.length === 0) {
      Alert.alert('Nothing to import', errors[0] ?? 'No valid rows')
      return
    }
    setBusy(true)
    try {
      let count = 0
      let vehicles = 0
      for (const row of rows) {
        const client = await createClient(clientInputFromMapped(row))
        count++
        const vehicleInput = vehicleInputFromMapped(row, client.id)
        if (vehicleInput) {
          await createVehicle(vehicleInput)
          vehicles++
        }
      }
      bump()
      const extra = errors.length > 0 ? ` (${errors.length} row${errors.length === 1 ? '' : 's'} skipped)` : ''
      Alert.alert(
        'Import complete',
        `${count} client${count === 1 ? '' : 's'}${vehicles > 0 ? `, ${vehicles} vehicle${vehicles === 1 ? '' : 's'}` : ''}${extra}.`,
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Could not import')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SubScreen
      title="Import clients"
      subtitle={step === 'paste' ? 'Paste CSV' : step === 'map' ? 'Map columns' : 'Preview'}
      tabDock={false}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 'paste' ? (
          <>
            <AppText variant="caption" style={styles.hint}>
              Paste a CSV from another CRM. Next you’ll map columns — we guess common headers (name,
              phone, email…).
            </AppText>
            <FormField label="CSV data" value={csv} onChangeText={setCsv} multiline />
            <PrimaryButton label="Continue" onPress={handleContinue} />
            <SecondaryButton label="Cancel" onPress={() => router.back()} />
          </>
        ) : null}

        {step === 'map' ? (
          <>
            <AppText variant="caption" style={styles.hint}>
              Tap a field to cycle mapping. Name is required.
            </AppText>
            {headers.map((header, index) => {
              const field = mapping[index] ?? 'skip'
              const label =
                CLIENT_CSV_FIELD_OPTIONS.find((o) => o.value === field)?.label ?? field
              return (
                <Pressable
                  key={`${header}-${index}`}
                  onPress={() => cycleField(index)}
                  style={[styles.mapRow, webPressableReset]}
                  accessibilityRole="button"
                >
                  <View style={styles.mapCol}>
                    <AppText variant="caption" style={styles.hint}>
                      CSV
                    </AppText>
                    <AppText style={styles.mapHeader}>{header || `Column ${index + 1}`}</AppText>
                  </View>
                  <AppText style={styles.mapArrow}>→</AppText>
                  <View style={styles.mapCol}>
                    <AppText variant="caption" style={styles.hint}>
                      Rinse
                    </AppText>
                    <AppText style={styles.mapField}>{label}</AppText>
                  </View>
                </Pressable>
              )
            })}
            <PrimaryButton label="Preview" onPress={handlePreview} />
            <SecondaryButton label="Back" onPress={() => setStep('paste')} />
          </>
        ) : null}

        {step === 'preview' ? (
          <>
            <AppText variant="caption" style={styles.hint}>
              {preview.rows.length} ready
              {preview.errors.length > 0 ? ` · ${preview.errors.length} skipped` : ''}
            </AppText>
            {preview.rows.slice(0, 8).map((row, i) => (
              <View key={`${row.name}-${i}`} style={styles.previewRow}>
                <AppText style={styles.mapHeader}>{row.name}</AppText>
                <AppText variant="caption" style={styles.hint}>
                  {[row.phone, row.email, row.vehicle_make].filter(Boolean).join(' · ') || 'No extras'}
                </AppText>
              </View>
            ))}
            {preview.rows.length > 8 ? (
              <AppText variant="caption" style={styles.hint}>
                +{preview.rows.length - 8} more
              </AppText>
            ) : null}
            <PrimaryButton
              label={busy ? 'Importing…' : `Import ${preview.rows.length}`}
              loading={busy}
              onPress={() => void handleImport()}
            />
            <SecondaryButton label="Back" onPress={() => setStep('map')} disabled={busy} />
          </>
        ) : null}
      </ScrollView>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hint: {
    color: colors.textMuted,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapCol: {
    flex: 1,
    gap: 2,
  },
  mapHeader: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  mapField: {
    color: colors.greenText,
    fontWeight: '600',
  },
  mapArrow: {
    color: colors.textMuted,
  },
  previewRow: {
    gap: 2,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
})
