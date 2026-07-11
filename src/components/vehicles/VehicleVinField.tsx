import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'
import { Barcode, Camera } from 'phosphor-react-native'
import { FormField } from '@/src/components/FormField'
import { AppText } from '@/src/components/ui'
import { VehiclePhotoScanner } from '@/src/components/vehicles/VehiclePhotoScanner'
import { VinBarcodeScanner } from '@/src/components/vehicles/VinBarcodeScanner'
import { decodeVin } from '@/src/lib/vin-decode'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function VehicleVinField({
  vin,
  onVinChange,
  onDecoded,
}: {
  vin: string
  onVinChange: (vin: string) => void
  onDecoded?: (result: { make: string | null; model: string | null; year: number | null }) => void
}) {
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [decoding, setDecoding] = useState(false)

  const handleDecode = async (rawVin: string) => {
    setDecoding(true)
    try {
      const result = await decodeVin(rawVin)
      onVinChange(result.vin)
      onDecoded?.({ make: result.make, model: result.model, year: result.year })
    } catch (e) {
      Alert.alert('VIN', e instanceof Error ? e.message : 'Could not decode VIN')
    } finally {
      setDecoding(false)
    }
  }

  const applyVin = (next: string) => {
    onVinChange(next)
    void handleDecode(next)
  }

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.field}>
          <FormField label="VIN" value={vin} onChangeText={onVinChange} placeholder="17-character VIN" />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan VIN barcode"
          onPress={() => setBarcodeOpen(true)}
          style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
        >
          <View style={styles.scanBtnInner}>
            {decoding ? (
              <ActivityIndicator color={colors.greenText} />
            ) : (
              <Barcode size={22} color={colors.greenText} weight="duotone" />
            )}
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan VIN from photo"
          onPress={() => setPhotoOpen(true)}
          style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
        >
          <View style={styles.scanBtnInner}>
            <Camera size={22} color={colors.greenText} weight="duotone" />
          </View>
        </Pressable>
      </View>
      {vin.trim().length >= 17 ? (
        <Pressable accessibilityRole="button" onPress={() => void handleDecode(vin)} disabled={decoding}>
          <View>
            <AppText variant="caption" style={styles.decodeLink}>
              {decoding ? 'Decoding…' : 'Decode VIN for make/model/year'}
            </AppText>
          </View>
        </Pressable>
      ) : null}

      <VinBarcodeScanner
        visible={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        onVin={applyVin}
        onRequestPhotoScan={() => setPhotoOpen(true)}
      />
      <VehiclePhotoScanner
        visible={photoOpen}
        title="Scan VIN photo"
        hint="Fill the frame with the VIN sticker, then capture"
        target="vin"
        onClose={() => setPhotoOpen(false)}
        onResult={(result) => {
          if (result.vin) applyVin(result.vin)
          else Alert.alert('VIN', 'Could not read a VIN from that photo')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
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
  decodeLink: {
    color: colors.greenText,
    fontFamily: fonts.bodyMedium,
  },
})
