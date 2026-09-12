import { Platform, StyleSheet, TextInput, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { normalizeVehicleColorHex, vehicleColorDisplayHex } from '@/src/lib/vehicle-color'
import { colors } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type VehicleColorSwatchPickerProps = {
  value: string
  onChange: (hex: string) => void
  /** Hide the section label when a parent field already owns “Color”. */
  hideLabel?: boolean
}

/** Android / web — compact swatch + hex inside one field row. */
export function VehicleColorSwatchPicker({
  value,
  onChange,
  hideLabel = false,
}: VehicleColorSwatchPickerProps) {
  const displayHex = vehicleColorDisplayHex(value)
  const filled = Boolean(normalizeVehicleColorHex(value))

  const commit = (next: string) => {
    const normalized = normalizeVehicleColorHex(next)
    onChange(normalized ?? next)
  }

  return (
    <View style={styles.wrap}>
      {!hideLabel ? (
        <AppText style={styles.label}>Paint swatch</AppText>
      ) : null}
      <View style={[styles.field, filled && styles.fieldFilled]}>
        <View style={[styles.swatch, { backgroundColor: displayHex }]}>
          {Platform.OS === 'web' ? (
            <input
              type="color"
              value={displayHex}
              onChange={(event) => commit(event.target.value)}
              aria-label="Pick vehicle color"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ) : null}
        </View>
        <TextInput
          style={styles.hexInput}
          value={value}
          onChangeText={onChange}
          placeholder="#1a3a6a"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFilled: {
    backgroundColor: '#f0fdf4',
    borderColor: colors.greenBorder,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  hexInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    margin: 0,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
})
