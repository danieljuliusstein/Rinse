import { Pressable, StyleSheet, View } from 'react-native'
import { Boat, Bus, Car, DotsThree, Jeep, Truck, type Icon } from 'phosphor-react-native'
import type { VehicleType } from '@rinse/core'
import { AppText } from '@/src/components/ui/AppText'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'

export type VehicleTypeOption = {
  id: VehicleType
  label: string
  Icon: Icon
}

/** Matches PWA `detailing-app/src/lib/vehicle-type-icons.tsx`. */
export const VEHICLE_TYPE_OPTIONS: VehicleTypeOption[] = [
  { id: 'sedan', label: 'Sedan', Icon: Car },
  { id: 'suv', label: 'SUV', Icon: Jeep },
  { id: 'truck', label: 'Truck', Icon: Truck },
  { id: 'van', label: 'Van', Icon: Bus },
  { id: 'boat', label: 'Boat', Icon: Boat },
  { id: 'other', label: 'Other', Icon: DotsThree },
]

export function getVehicleTypeOption(type: VehicleType): VehicleTypeOption {
  return VEHICLE_TYPE_OPTIONS.find((option) => option.id === type) ?? VEHICLE_TYPE_OPTIONS[0]
}

export function VehicleTypeIcon({
  type,
  size = 28,
  color,
  weight = 'duotone',
}: {
  type: VehicleType
  size?: number
  color?: string
  weight?: 'duotone' | 'fill' | 'regular' | 'bold'
}) {
  const { Icon } = getVehicleTypeOption(type)
  return <Icon size={size} color={color} weight={weight} />
}

type VehicleTypePickerProps = {
  value: VehicleType
  onChange: (type: VehicleType) => void
  label?: string
  error?: string
  /** Omit boat (rare for garage CRM). Default includes all types. */
  exclude?: VehicleType[]
  /**
   * `solid` — filled green (edit / vehicle forms).
   * `soft` — green-dim + border (PWA New job / QuickAdd).
   */
  variant?: 'solid' | 'soft'
}

/** 3-column icon grid — matches PWA vehicle pickers. */
export function VehicleTypePicker({
  value,
  onChange,
  label = 'Vehicle type',
  error,
  exclude,
  variant = 'solid',
}: VehicleTypePickerProps) {
  const options = exclude?.length
    ? VEHICLE_TYPE_OPTIONS.filter((o) => !exclude.includes(o.id))
    : VEHICLE_TYPE_OPTIONS
  const soft = variant === 'soft'

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="sectionLabel" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.grid}>
        {options.map((option) => {
          const active = value === option.id
          const { Icon } = option
          const iconColor = active
            ? soft
              ? colors.greenText
              : '#071407'
            : colors.textMuted
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                selectionHaptic()
                onChange(option.id)
              }}
              style={({ pressed }) => [
                styles.btn,
                webInlinePressableReset,
                active && (soft ? styles.btnOnSoft : styles.btnOn),
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
            >
              <View style={styles.btnInner}>
                <Icon size={22} weight={active ? 'fill' : 'regular'} color={iconColor} />
                <AppText
                  style={[
                    styles.btnLabel,
                    active && (soft ? styles.btnLabelOnSoft : styles.btnLabelOn),
                  ]}
                >
                  {option.label}
                </AppText>
              </View>
            </Pressable>
          )
        })}
      </View>
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  label: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  btn: {
    width: '31%',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  btnInner: {
    alignItems: 'center',
    gap: 4,
  },
  btnOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  btnOnSoft: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },
  btnLabelOn: {
    fontWeight: '600',
    color: '#071407',
  },
  btnLabelOnSoft: {
    fontWeight: '600',
    color: colors.greenText,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
  },
})
