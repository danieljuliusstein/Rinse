import { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { Vehicle, VehicleType } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { VehicleColorSwatchPicker } from '@/src/components/vehicles/VehicleColorSwatchPicker'
import { VehicleVinField } from '@/src/components/vehicles/VehicleVinField'
import { VehiclePlateField } from '@/src/components/vehicles/VehiclePlateField'
import { AppSheet, AppText, PrimaryButton, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { getVehicle, updateVehicle } from '@/src/lib/damage-api'
import { normalizeVehicleColorHex } from '@/src/lib/vehicle-color'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import { colors, spacing } from '@/src/theme/colors'

export default function EditVehicleScreen() {
  const { id: clientId, vehicleId } = useLocalSearchParams<{ id: string; vehicleId: string }>()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')
  const [colorHex, setColorHex] = useState('')
  const [plate, setPlate] = useState('')
  const [vin, setVin] = useState('')
  const [type, setType] = useState<VehicleType>('sedan')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!clientId || !vehicleId) return
    const row = await getVehicle(clientId, vehicleId)
    setVehicle(row)
    if (row) {
      setMake(row.make)
      setModel(row.model)
      setYear(row.year ? String(row.year) : '')
      setColor(row.color ?? '')
      setColorHex(row.color_hex ?? '')
      setPlate(row.plate ?? '')
      setVin(row.vin ?? '')
      setType(row.type)
    }
  }, [clientId, vehicleId])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

  const handleSave = async () => {
    if (!vehicleId || !make.trim() || !model.trim()) {
      Alert.alert('Vehicle', 'Make and model are required.')
      return
    }
    setBusy(true)
    try {
      const updated = await updateVehicle(vehicleId, {
        make: make.trim(),
        model: model.trim(),
        year: year ? Number(year) : undefined,
        color: color.trim() || undefined,
        color_hex: normalizeVehicleColorHex(colorHex) ?? '',
        plate: plate.trim() || undefined,
        vin: vin.trim() || undefined,
        type,
      })
      if (!updated) throw new Error('Update failed')
      router.replace(`/(tabs)/clients/${clientId}/vehicles/${vehicleId}`)
    } catch (e) {
      Alert.alert('Vehicle', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

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
      subtitle={vehicle.make}
      footer={
        <View style={styles.actions}>
          <PrimaryButton label="Save changes" loading={busy} onPress={() => void handleSave()} />
        </View>
      }
    >
      <View style={styles.form}>
        <SectionGroup inset>
          <FormRow>
            <FormField label="Make" value={make} onChangeText={setMake} />
            <FormField label="Model" value={model} onChangeText={setModel} />
          </FormRow>
          <FormRow>
            <FormField label="Year" value={year} onChangeText={setYear} keyboardType="decimal-pad" />
            <FormField label="Color" value={color} onChangeText={setColor} />
          </FormRow>
          <VehicleColorSwatchPicker value={colorHex} onChange={setColorHex} />
          <VehiclePlateField plate={plate} onPlateChange={setPlate} />
          <VehicleVinField
            vin={vin}
            onVinChange={setVin}
            onDecoded={(decoded) => {
              if (decoded.make) setMake(decoded.make)
              if (decoded.model) setModel(decoded.model)
              if (decoded.year) setYear(String(decoded.year))
            }}
          />
          <VehicleTypePicker value={type} onChange={setType} />
        </SectionGroup>
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
})
