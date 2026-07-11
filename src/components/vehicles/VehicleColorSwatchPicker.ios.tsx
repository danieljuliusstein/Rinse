import { StyleSheet, TextInput, View } from 'react-native'
import { Host, ColorPicker } from '@expo/ui/swift-ui'
import { AppText } from '@/src/components/ui/AppText'
import { normalizeVehicleColorHex, vehicleColorDisplayHex } from '@/src/lib/vehicle-color'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function toOpaqueHex(value: string): string {
  const normalized = normalizeVehicleColorHex(value.slice(0, 7)) ?? normalizeVehicleColorHex(value)
  return normalized ?? vehicleColorDisplayHex(value)
}

type VehicleColorSwatchPickerProps = {
  value: string
  onChange: (hex: string) => void
}

/** iOS — SwiftUI ColorPicker + hex field. */
export function VehicleColorSwatchPicker({ value, onChange }: VehicleColorSwatchPickerProps) {
  const displayHex = vehicleColorDisplayHex(value)

  const commit = (next: string) => {
    const normalized = normalizeVehicleColorHex(toOpaqueHex(next))
    onChange(normalized ?? next)
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="sectionLabel" style={styles.label}>
        Color swatch
      </AppText>
      <View style={styles.row}>
        <View style={styles.iosHost}>
          <Host matchContents>
            <ColorPicker
              label="Paint"
              selection={displayHex}
              onSelectionChange={commit}
              supportsOpacity={false}
            />
          </Host>
        </View>
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
  iosHost: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
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
