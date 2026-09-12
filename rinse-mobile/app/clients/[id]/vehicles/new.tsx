import { useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  VehicleIdentityForm,
  vehicleIdentityCanSave,
  vehicleIdentityDisplayName,
  vehicleIdentitySaveHint,
  type VehicleIdentitySaveState,
  type VehicleIdentityValues,
} from '@/src/components/vehicles/VehicleIdentityForm'
import { AppSheet, AppText } from '@/src/components/ui'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { createVehicle } from '@/src/lib/damage-api'
import { normalizeVehicleColorHex } from '@/src/lib/vehicle-color'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export default function NewVehicleScreen() {
  const { id: clientId, vin: vinParam, make: makeParam, model: modelParam, year: yearParam } =
    useLocalSearchParams<{
      id: string
      vin?: string
      make?: string
      model?: string
      year?: string
    }>()
  const router = useRouter()
  const [values, setValues] = useState<VehicleIdentityValues>({
    make: typeof makeParam === 'string' ? makeParam : '',
    model: typeof modelParam === 'string' ? modelParam : '',
    year: typeof yearParam === 'string' ? yearParam : '',
    color: '',
    colorHex: '',
    plate: '',
    vin: typeof vinParam === 'string' ? vinParam : '',
    type: 'sedan',
  })
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const canSave = vehicleIdentityCanSave(values)
  const saveState: VehicleIdentitySaveState = saved
    ? 'success'
    : busy
      ? 'saving'
      : canSave
        ? 'ready'
        : 'disabled'

  const handleChange = (patch: Partial<VehicleIdentityValues>) => {
    setSaved(false)
    setValues((prev) => ({ ...prev, ...patch }))
  }

  const handleSave = async () => {
    if (!clientId || !canSave || busy || saved) return
    setBusy(true)
    try {
      const vehicle = await createVehicle({
        client_id: clientId,
        make: values.make.trim(),
        model: values.model.trim(),
        year: values.year ? Number(values.year) : undefined,
        color: values.color.trim() || undefined,
        color_hex: normalizeVehicleColorHex(values.colorHex) ?? '',
        plate: values.plate.trim() || undefined,
        vin: values.vin.trim() || undefined,
        type: values.type,
      })
      setSaved(true)
      setTimeout(() => {
        router.replace(`/(tabs)/clients/${clientId}/vehicles/${vehicle.id}`)
      }, 700)
    } catch (e) {
      Alert.alert('Vehicle', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const subtitle = useMemo(() => vehicleIdentityDisplayName(values), [values])

  return (
    <AppSheet
      title="Add vehicle"
      subtitle={subtitle}
      footer={
        <View style={styles.footer}>
          {!canSave && !saved ? (
            <AppText style={styles.hint}>{vehicleIdentitySaveHint(values)}</AppText>
          ) : null}
          <SheetSubmitButton
            label="Save vehicle"
            doneLabel="Vehicle saved"
            ready={canSave || saved}
            done={saved}
            loading={busy}
            onPress={() => void handleSave()}
          />
        </View>
      }
    >
      <VehicleIdentityForm values={values} onChange={handleChange} saveState={saveState} />
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
  hint: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
    textAlign: 'center',
  },
})
