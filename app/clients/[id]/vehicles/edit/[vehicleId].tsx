import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { Vehicle } from '@rinse/core'
import {
  VehicleIdentityForm,
  vehicleIdentityCanSave,
  vehicleIdentityDisplayName,
  vehicleIdentitySaveHint,
  type VehicleIdentitySaveState,
  type VehicleIdentityValues,
} from '@/src/components/vehicles/VehicleIdentityForm'
import { AppSheet, AppText, ScreenLoading } from '@/src/components/ui'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { getVehicle, updateVehicle } from '@/src/lib/damage-api'
import { normalizeVehicleColorHex } from '@/src/lib/vehicle-color'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const EMPTY: VehicleIdentityValues = {
  make: '',
  model: '',
  year: '',
  color: '',
  colorHex: '',
  plate: '',
  vin: '',
  type: 'sedan',
}

export default function EditVehicleScreen() {
  const { id: clientId, vehicleId } = useLocalSearchParams<{ id: string; vehicleId: string }>()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [values, setValues] = useState<VehicleIdentityValues>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    if (!clientId || !vehicleId) return
    const row = await getVehicle(clientId, vehicleId)
    setVehicle(row)
    if (row) {
      setValues({
        make: row.make,
        model: row.model,
        year: row.year ? String(row.year) : '',
        color: row.color ?? '',
        colorHex: row.color_hex ?? '',
        plate: row.plate ?? '',
        vin: row.vin ?? '',
        type: row.type,
      })
    }
  }, [clientId, vehicleId])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

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
    if (!vehicleId || !canSave || busy || saved) return
    setBusy(true)
    try {
      const updated = await updateVehicle(vehicleId, {
        make: values.make.trim(),
        model: values.model.trim(),
        year: values.year ? Number(values.year) : undefined,
        color: values.color.trim() || undefined,
        color_hex: normalizeVehicleColorHex(values.colorHex) ?? '',
        plate: values.plate.trim() || undefined,
        vin: values.vin.trim() || undefined,
        type: values.type,
      })
      if (!updated) throw new Error('Update failed')
      setSaved(true)
      setTimeout(() => {
        router.replace(`/(tabs)/clients/${clientId}/vehicles/${vehicleId}`)
      }, 700)
    } catch (e) {
      Alert.alert('Vehicle', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const subtitle = useMemo(() => vehicleIdentityDisplayName(values), [values])

  if (loading) {
    return (
      <AppSheet title="Edit vehicle">
        <ScreenLoading label="Loading vehicle…" />
      </AppSheet>
    )
  }

  if (!vehicle) {
    return (
      <AppSheet title="Edit vehicle">
        <AppText variant="body" style={{ color: colors.danger, padding: spacing.md }}>
          Vehicle not found
        </AppText>
      </AppSheet>
    )
  }

  return (
    <AppSheet
      title="Edit vehicle"
      subtitle={subtitle}
      footer={
        <View style={styles.footer}>
          {!canSave && !saved ? (
            <AppText style={styles.hint}>{vehicleIdentitySaveHint(values)}</AppText>
          ) : null}
          <SheetSubmitButton
            label="Save changes"
            doneLabel="Changes saved"
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
