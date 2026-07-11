import { useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { Camera } from 'phosphor-react-native'
import { FormField } from '@/src/components/FormField'
import { VehiclePhotoScanner } from '@/src/components/vehicles/VehiclePhotoScanner'
import { normalizePlate } from '@/src/lib/plate'
import { colors, spacing } from '@/src/theme/colors'

export function VehiclePlateField({
  plate,
  onPlateChange,
}: {
  plate: string
  onPlateChange: (plate: string) => void
}) {
  const [scannerOpen, setScannerOpen] = useState(false)

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <FormField
          label="Plate"
          value={plate}
          onChangeText={(t) => onPlateChange(normalizePlate(t))}
          placeholder="ABC1234"
          autoCapitalize="characters"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan license plate"
        onPress={() => setScannerOpen(true)}
        style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
      >
        <View style={styles.scanBtnInner}>
          <Camera size={22} color={colors.greenText} weight="duotone" />
        </View>
      </Pressable>

      <VehiclePhotoScanner
        visible={scannerOpen}
        title="Scan license plate"
        hint="Fill the frame with the plate, then capture"
        target="plate"
        onClose={() => setScannerOpen(false)}
        onResult={(result) => {
          if (result.plate) onPlateChange(result.plate)
          else Alert.alert('Plate', 'Could not read a license plate from that photo')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
  },
  scanBtn: {
    marginTop: 28,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.greenSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34, 197, 94, 0.22)',
  },
  scanBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnPressed: {
    opacity: 0.85,
  },
})
