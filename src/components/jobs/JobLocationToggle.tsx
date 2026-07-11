import { Pressable, StyleSheet, View } from 'react-native'
import { House, MapPin } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'

type LocationType = 'mobile' | 'fixed'

type JobLocationToggleProps = {
  value: LocationType
  onChange: (value: LocationType) => void
  label?: string
}

/** Side-by-side Mobile / Fixed — matches PWA `.new-job-location-toggle`. */
export function JobLocationToggle({
  value,
  onChange,
  label = 'Location',
}: JobLocationToggleProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="sectionLabel" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.track}>
        {(
          [
            { id: 'mobile' as const, label: 'Mobile', Icon: MapPin },
            { id: 'fixed' as const, label: 'Fixed', Icon: House },
          ] as const
        ).map((opt) => {
          const active = value === opt.id
          const { Icon } = opt
          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                selectionHaptic()
                onChange(opt.id)
              }}
              style={({ pressed }) => [
                styles.opt,
                webInlinePressableReset,
                active && styles.optOn,
                pressed && styles.optPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
            >
              <View style={styles.optInner}>
                <Icon size={15} color={active ? '#071407' : colors.textMuted} weight={active ? 'fill' : 'regular'} />
                <AppText style={[styles.optLabel, active && styles.optLabelOn]}>{opt.label}</AppText>
              </View>
            </Pressable>
          )
        })}
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
  track: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  opt: {
    flex: 1,
    borderRadius: radii.md - 2,
    backgroundColor: 'transparent',
  },
  optInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  optOn: {
    backgroundColor: colors.green,
  },
  optPressed: {
    opacity: 0.9,
  },
  optLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  optLabelOn: {
    color: '#071407',
  },
})
