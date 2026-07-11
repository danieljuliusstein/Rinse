import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { VehicleType } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { SectionGroup } from '@/src/components/ui/SectionGroup'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { createLead } from '@/src/lib/leads-api'
import { checkPremiumGate } from '@/src/lib/subscription'
import { VehicleTypePicker } from '@/src/lib/vehicle-type-icons'
import { spacing } from '@/src/theme/colors'

export default function NewLeadScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter the lead name.')
      return
    }
    setSaving(true)
    try {
      const gate = await checkPremiumGate('new_lead')
      if (!gate.allowed) return

      await createLead({
        name: name.trim(),
        phone: phone.trim() || undefined,
        source: 'other',
        vehicle_type: vehicleType,
        service_interest: service.trim() || undefined,
        stage: 'inquiry',
      })
      setDone(true)
      setTimeout(() => router.back(), 600)
    } catch (e) {
      Alert.alert('Could not save lead', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppSheet title="New lead" subtitle="Capture an inquiry">
      <View style={styles.root}>
        <SectionGroup inset>
          <FormRow>
            <FormField label="Name" value={name} onChangeText={setName} />
            <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </FormRow>
          <FormField label="Service interest" value={service} onChangeText={setService} />
          <VehicleTypePicker value={vehicleType} onChange={setVehicleType} />
        </SectionGroup>
        <SheetSubmitButton
          label="Save lead"
          loading={saving}
          done={done}
          ready={name.trim().length > 0}
          onPress={() => void save()}
        />
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
})
