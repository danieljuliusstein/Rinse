import { Pressable, StyleSheet, View } from 'react-native'
import { Boat, Bus, Car, Check, DotsThree, Jeep, Truck, type Icon } from '@/src/icons'
import type { VehicleType } from '@rinse/core'
import { AppText } from '@/src/components/ui/AppText'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type VehicleTypeOption = {
  id: VehicleType
  label: string
  description: string
  Icon: Icon
}

/** Matches PWA `detailing-app/src/lib/vehicle-type-icons.tsx`. */
export const VEHICLE_TYPE_OPTIONS: VehicleTypeOption[] = [
  { id: 'sedan', label: 'Sedan', description: '4-door', Icon: Car },
  { id: 'suv', label: 'SUV', description: 'Lifted / tall', Icon: Jeep },
  { id: 'truck', label: 'Truck', description: 'Open bed', Icon: Truck },
  { id: 'van', label: 'Van', description: 'Enclosed', Icon: Bus },
  { id: 'boat', label: 'Boat', description: 'Marine', Icon: Boat },
  { id: 'other', label: 'Other', description: 'Custom', Icon: DotsThree },
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
  value: VehicleType | null
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
  /** Hide built-in label when a parent section header owns the title. */
  hideLabel?: boolean
  /** Show type description under the label (Bolt edit sheet). Default true for solid. */
  showDescriptions?: boolean
}

/** 3-column icon grid — matches Bolt edit-vehicle + PWA pickers. */
export function VehicleTypePicker({
  value,
  onChange,
  label = 'Vehicle type',
  error,
  exclude,
  variant = 'solid',
  hideLabel = false,
  showDescriptions,
}: VehicleTypePickerProps) {
  const options = exclude?.length
    ? VEHICLE_TYPE_OPTIONS.filter((o) => !exclude.includes(o.id))
    : VEHICLE_TYPE_OPTIONS
  const soft = variant === 'soft'
  const withDesc = showDescriptions ?? !soft

  return (
    <View style={styles.wrap}>
      {!hideLabel && label ? (
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
              : '#ffffff'
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
                withDesc && styles.btnTall,
                webInlinePressableReset,
                active && (soft ? styles.btnOnSoft : styles.btnOn),
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
            >
              {active && !soft ? (
                <View style={styles.checkBadge}>
                  <Check size={10} color={colors.green} weight="bold" />
                </View>
              ) : null}
              <View style={styles.btnInner}>
                <Icon size={24} weight={active ? 'fill' : 'regular'} color={iconColor} />
                <AppText
                  style={[
                    styles.btnLabel,
                    active && (soft ? styles.btnLabelOnSoft : styles.btnLabelOn),
                  ]}
                >
                  {option.label}
                </AppText>
                {withDesc ? (
                  <AppText
                    style={[
                      styles.btnDesc,
                      active && (soft ? styles.btnDescOnSoft : styles.btnDescOn),
                    ]}
                  >
                    {option.description}
                  </AppText>
                ) : null}
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
    gap: 10,
  },
  btn: {
    width: '31%',
    flexGrow: 1,
    maxWidth: '32.5%',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    position: 'relative',
  },
  btnTall: {
    paddingVertical: 14,
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
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  btnLabelOn: {
    color: '#ffffff',
  },
  btnLabelOnSoft: {
    color: colors.greenText,
  },
  btnDesc: {
    fontSize: 9,
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
  },
  btnDescOn: {
    color: 'rgba(255,255,255,0.7)',
  },
  btnDescOnSoft: {
    color: colors.greenText,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
  },
})
