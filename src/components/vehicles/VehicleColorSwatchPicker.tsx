import { Platform, StyleSheet, TextInput, View } from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { normalizeVehicleColorHex, vehicleColorDisplayHex } from '@/src/lib/vehicle-color'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type VehicleColorSwatchPickerProps = {
  value: string
  onChange: (hex: string) => void
}

/** Android / web — native `<input type="color">` on web; swatch + hex on Android. */
export function VehicleColorSwatchPicker({ value, onChange }: VehicleColorSwatchPickerProps) {
  const displayHex = vehicleColorDisplayHex(value)

  const commit = (next: string) => {
    const normalized = normalizeVehicleColorHex(next)
    onChange(normalized ?? next)
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="sectionLabel" style={styles.label}>
        Color swatch
      </AppText>
      <View style={styles.row}>
        {Platform.OS === 'web' ? (
          <View style={styles.webWrap}>
            <input
              type="color"
              value={displayHex}
              onChange={(event) => commit(event.target.value)}
              aria-label="Pick vehicle color"
              style={{
                width: 44,
                height: 44,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
          </View>
        ) : (
          <View style={[styles.swatch, { backgroundColor: displayHex }]} />
        )}
        <TextInput
          style={styles.hexInput}
          value={value}
          onChangeText={onChange}
          placeholder="#1a3a6a"
          placeholderTextColor={colors.textMuted}
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
    gap: spacing.sm,
  },
  label: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  webWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hexInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
})
