import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Barcode, Camera, Check } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import {
  FieldBox,
  FieldLabel,
  ScanChip,
} from '@/src/components/vehicles/VehiclePlateField'
import { VehiclePhotoScanner } from '@/src/components/vehicles/VehiclePhotoScanner'
import { VinBarcodeScanner } from '@/src/components/vehicles/VinBarcodeScanner'
import { selectionHaptic } from '@/src/lib/haptics'
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
  const [decoded, setDecoded] = useState(false)
  const filled = vin.trim().length >= 17

  const handleDecode = async (rawVin: string) => {
    setDecoding(true)
    try {
      const result = await decodeVin(rawVin)
      onVinChange(result.vin)
      onDecoded?.({ make: result.make, model: result.model, year: result.year })
      setDecoded(true)
    } catch (e) {
      setDecoded(false)
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
      <View style={styles.labelRow}>
        <FieldLabel valid={filled}>VIN</FieldLabel>
        <View style={styles.scanRow}>
          <ScanChip
            icon={
              decoding ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Barcode size={14} color="#ffffff" weight="bold" />
              )
            }
            label="Barcode"
            onPress={() => {
              selectionHaptic()
              setBarcodeOpen(true)
            }}
          />
          <ScanChip
            icon={<Camera size={14} color="#ffffff" weight="bold" />}
            label="Camera"
            onPress={() => {
              selectionHaptic()
              setPhotoOpen(true)
            }}
          />
        </View>
      </View>
      <FieldBox filled={filled}>
        <View style={styles.inputRow}>
          <TextInput
            value={vin}
            onChangeText={(t) => {
              setDecoded(false)
              onVinChange(t)
            }}
            placeholder="17-character VIN"
            placeholderTextColor={colors.textDim}
            autoCapitalize="characters"
            style={styles.monoInput}
          />
          {decoded && filled ? (
            <View style={styles.badge}>
              <Check size={10} color={colors.greenText} weight="bold" />
              <AppText style={styles.badgeLabel}>Decoded</AppText>
            </View>
          ) : null}
        </View>
      </FieldBox>
      {!filled ? (
        <AppText style={styles.hint}>
          Scan the barcode on the door jamb or dashboard — we'll decode make, model, and year
          automatically.
        </AppText>
      ) : !decoded ? (
        <Pressable accessibilityRole="button" onPress={() => void handleDecode(vin)} disabled={decoding}>
          <AppText style={styles.decodeLink}>
            {decoding ? 'Decoding…' : 'Decode VIN for make/model/year'}
          </AppText>
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
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monoInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    padding: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeLabel: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
  },
  decodeLink: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.greenText,
  },
})
