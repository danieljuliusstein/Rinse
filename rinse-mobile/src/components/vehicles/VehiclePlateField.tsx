import { useState, type ReactNode } from 'react'
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Camera, Check } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import { VehiclePhotoScanner } from '@/src/components/vehicles/VehiclePhotoScanner'
import { normalizePlate } from '@/src/lib/plate'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function VehiclePlateField({
  plate,
  onPlateChange,
}: {
  plate: string
  onPlateChange: (plate: string) => void
}) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanned, setScanned] = useState(false)
  const filled = plate.trim().length > 0

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <FieldLabel valid={filled}>Plate</FieldLabel>
        <ScanChip
          icon={<Camera size={14} color="#ffffff" weight="bold" />}
          label="Scan"
          onPress={() => {
            selectionHaptic()
            setScannerOpen(true)
          }}
        />
      </View>
      <FieldBox filled={filled}>
        <View style={styles.inputRow}>
          <TextInput
            value={plate}
            onChangeText={(t) => {
              setScanned(false)
              onPlateChange(normalizePlate(t))
            }}
            placeholder="7ABC123"
            placeholderTextColor={colors.textDim}
            autoCapitalize="characters"
            style={styles.monoInput}
          />
          {scanned && filled ? (
            <View style={styles.badge}>
              <Camera size={10} color={colors.greenText} weight="bold" />
              <AppText style={styles.badgeLabel}>Scanned</AppText>
            </View>
          ) : null}
        </View>
      </FieldBox>

      <VehiclePhotoScanner
        visible={scannerOpen}
        title="Scan license plate"
        hint="Fill the frame with the plate, then capture"
        target="plate"
        onClose={() => setScannerOpen(false)}
        onResult={(result) => {
          if (result.plate) {
            onPlateChange(result.plate)
            setScanned(true)
          } else {
            Alert.alert('Plate', 'Could not read a license plate from that photo')
          }
        }}
      />
    </View>
  )
}

export function FieldLabel({ children, valid }: { children: ReactNode; valid?: boolean }) {
  return (
    <View style={styles.fieldLabelRow}>
      <AppText style={styles.fieldLabel}>{children}</AppText>
      {valid ? (
        <View style={styles.validDot}>
          <Check size={9} color="#ffffff" weight="bold" />
        </View>
      ) : null}
    </View>
  )
}

export function FieldBox({
  children,
  filled,
  hasError,
}: {
  children: ReactNode
  filled: boolean
  hasError?: boolean
}) {
  return (
    <View
      style={[
        styles.fieldBox,
        filled && styles.fieldBoxFilled,
        hasError && styles.fieldBoxError,
      ]}
    >
      {children}
    </View>
  )
}

export function ScanChip({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.scanChip, webInlinePressableReset, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <AppText style={styles.scanChipLabel}>{label}</AppText>
    </Pressable>
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
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  validDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fieldBoxFilled: {
    backgroundColor: '#f0fdf4',
    borderColor: colors.greenBorder,
  },
  fieldBoxError: {
    backgroundColor: '#fef2f2',
    borderColor: 'rgba(239,68,68,0.3)',
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
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  scanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scanChipLabel: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.88,
  },
})
