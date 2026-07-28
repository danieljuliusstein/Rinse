import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { VehicleType } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { VehicleColorSwatchPicker } from '@/src/components/vehicles/VehicleColorSwatchPicker'
import { VehicleVinField } from '@/src/components/vehicles/VehicleVinField'
import { VehiclePlateField } from '@/src/components/vehicles/VehiclePlateField'
import { AppSheet, PrimaryButton, SectionGroup } from '@/src/components/ui'
import { createVehicle } from '@/src/lib/damage-api'
import { normalizeVehicleColorHex } from '@/src/lib/vehicle-color'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import { spacing } from '@/src/theme/colors'

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
  const [make, setMake] = useState(typeof makeParam === 'string' ? makeParam : '')
  const [model, setModel] = useState(typeof modelParam === 'string' ? modelParam : '')
  const [year, setYear] = useState(typeof yearParam === 'string' ? yearParam : '')
  const [color, setColor] = useState('')
  const [colorHex, setColorHex] = useState('')
  const [plate, setPlate] = useState('')
  const [vin, setVin] = useState(typeof vinParam === 'string' ? vinParam : '')
  const [type, setType] = useState<VehicleType>('sedan')
  const [busy, setBusy] = useState(false)

  const handleSave = async () => {
    if (!clientId || !make.trim() || !model.trim()) {
      Alert.alert('Vehicle', 'Make and model are required.')
      return
    }
    setBusy(true)
    try {
      const vehicle = await createVehicle({
        client_id: clientId,
        make: make.trim(),
        model: model.trim(),
        year: year ? Number(year) : undefined,
        color: color.trim() || undefined,
        color_hex: normalizeVehicleColorHex(colorHex) ?? '',
        plate: plate.trim() || undefined,
        vin: vin.trim() || undefined,
        type,
      })
      router.replace(`/(tabs)/clients/${clientId}/vehicles/${vehicle.id}`)
    } catch (e) {
      Alert.alert('Vehicle', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppSheet
      title="Add vehicle"
      subtitle="Client vehicle"
      footer={
        <View style={styles.actions}>
          <PrimaryButton label="Save vehicle" loading={busy} onPress={() => void handleSave()} />
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
