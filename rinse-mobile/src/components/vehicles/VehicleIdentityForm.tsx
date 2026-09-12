import { type ReactNode } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import type { VehicleType } from '@rinse/core'
import { CaretRight, Check, WarningCircle } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import { VehicleColorSwatchPicker } from '@/src/components/vehicles/VehicleColorSwatchPicker'
import {
  FieldBox,
  FieldLabel,
  VehiclePlateField,
} from '@/src/components/vehicles/VehiclePlateField'
import { VehicleVinField } from '@/src/components/vehicles/VehicleVinField'
import {
  getVehicleTypeOption,
  VehicleTypePicker,
} from '@/src/lib/vehicle-type-icons'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type VehicleIdentityValues = {
  make: string
  model: string
  year: string
  color: string
  colorHex: string
  plate: string
  vin: string
  type: VehicleType
}

export function vehicleIdentityDisplayName(values: Pick<VehicleIdentityValues, 'make' | 'model' | 'year'>) {
  const make = values.make.trim() || 'New vehicle'
  const parts = [make]
  if (values.model.trim()) parts.push(values.model.trim())
  if (values.year.trim()) parts.push(values.year.trim())
  return parts.join(' · ')
}

export function vehicleIdentityCanSave(values: VehicleIdentityValues) {
  return (
    values.make.trim().length > 0 &&
    values.model.trim().length > 0 &&
    values.year.trim().length > 0 &&
    Boolean(values.type)
  )
}

export function vehicleIdentitySaveHint(values: VehicleIdentityValues) {
  if (!values.make.trim() || !values.model.trim()) return 'Make and model required'
  if (!values.year.trim()) return 'Year required'
  if (!values.type) return 'Select a vehicle type'
  return 'Complete required fields'
}

export type VehicleIdentitySaveState = 'disabled' | 'ready' | 'saving' | 'success'

export function VehicleStatusIsland({ saveState }: { saveState: VehicleIdentitySaveState }) {
  if (saveState === 'success') {
    return (
      <View style={[styles.island, styles.islandReady]}>
        <Check size={12} color={colors.greenText} weight="bold" />
        <AppText style={styles.islandReadyLabel}>Saved</AppText>
      </View>
    )
  }
  if (saveState === 'ready' || saveState === 'saving') {
    return (
      <View style={[styles.island, styles.islandReady]}>
        <View style={styles.islandDot} />
        <AppText style={styles.islandReadyLabel}>
          {saveState === 'saving' ? 'Saving' : 'Ready'}
        </AppText>
      </View>
    )
  }
  return (
    <View style={[styles.island, styles.islandIncomplete]}>
      <WarningCircle size={12} color={colors.textMuted} weight="fill" />
      <AppText style={styles.islandIncompleteLabel}>Incomplete</AppText>
    </View>
  )
}

function SectionHeader({
  index,
  title,
  trailing,
}: {
  index: string
  title: string
  trailing?: ReactNode
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIndex}>
        <AppText style={styles.sectionIndexLabel}>{index}</AppText>
      </View>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {trailing}
      <View style={styles.sectionRule} />
    </View>
  )
}

export function VehicleIdentityForm({
  values,
  onChange,
  saveState,
}: {
  values: VehicleIdentityValues
  onChange: (patch: Partial<VehicleIdentityValues>) => void
  saveState: VehicleIdentitySaveState
}) {
  const makeValid = values.make.trim().length > 0
  const modelValid = values.model.trim().length > 0
  const yearValid = values.year.trim().length > 0
  const colorValid = values.color.trim().length > 0
  const typeLabel = values.type ? getVehicleTypeOption(values.type).label : null

  return (
    <View style={styles.root}>
      <View style={styles.statusRow}>
        <VehicleStatusIsland saveState={saveState} />
      </View>

      <View style={styles.section}>
        <SectionHeader index="01" title="Vehicle identity" />
        <View style={styles.grid2}>
          <View style={styles.gridCell}>
            <FieldLabel valid={makeValid}>Make</FieldLabel>
            <FieldBox filled={makeValid}>
              <TextInput
                value={values.make}
                onChangeText={(make) => onChange({ make })}
                placeholder="e.g. Lexus"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
            </FieldBox>
          </View>
          <View style={styles.gridCell}>
            <FieldLabel valid={modelValid}>Model</FieldLabel>
            <FieldBox filled={modelValid}>
              <TextInput
                value={values.model}
                onChangeText={(model) => onChange({ model })}
                placeholder="e.g. ES 350"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
            </FieldBox>
          </View>
        </View>

        <View style={[styles.grid2, styles.gridGap]}>
          <View style={styles.gridCell}>
            <FieldLabel valid={yearValid}>Year</FieldLabel>
            <FieldBox filled={yearValid} hasError={!yearValid && values.year.length > 0}>
              <TextInput
                value={values.year}
                onChangeText={(year) => onChange({ year: year.replace(/[^0-9]/g, '').slice(0, 4) })}
                placeholder="e.g. 2021"
                placeholderTextColor={colors.textDim}
                keyboardType="number-pad"
                style={styles.input}
              />
            </FieldBox>
          </View>
          <View style={styles.gridCell}>
            <FieldLabel valid={colorValid}>Color</FieldLabel>
            <FieldBox filled={colorValid}>
              <TextInput
                value={values.color}
                onChangeText={(color) => onChange({ color })}
                placeholder="e.g. Black"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
            </FieldBox>
          </View>
        </View>

        <VehicleColorSwatchPicker
          value={values.colorHex}
          onChange={(colorHexNext) => onChange({ colorHex: colorHexNext })}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader index="02" title="Plate & VIN" />
        <VehiclePlateField
          plate={values.plate}
          onPlateChange={(plate) => onChange({ plate })}
        />
        <View style={styles.vinWrap}>
          <VehicleVinField
            vin={values.vin}
            onVinChange={(vin) => onChange({ vin })}
            onDecoded={(decoded) => {
              const patch: Partial<VehicleIdentityValues> = {}
              if (decoded.make) patch.make = decoded.make
              if (decoded.model) patch.model = decoded.model
              if (decoded.year) patch.year = String(decoded.year)
              if (Object.keys(patch).length) onChange(patch)
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          index="03"
          title="Vehicle type"
          trailing={
            typeLabel ? (
              <View style={styles.typeBadge}>
                <Check size={10} color={colors.greenText} weight="bold" />
                <AppText style={styles.typeBadgeLabel}>{typeLabel}</AppText>
              </View>
            ) : null
          }
        />
        <VehicleTypePicker
          value={values.type}
          onChange={(type) => onChange({ type })}
          hideLabel
          variant="solid"
          showDescriptions
        />
      </View>

      <View style={styles.outOfScope}>
        <View style={styles.outOfScopeIcon}>
          <CaretRight size={14} color={colors.textDim} weight="bold" />
        </View>
        <View style={styles.outOfScopeText}>
          <AppText style={styles.outOfScopeTitle}>Damage map & photos</AppText>
          <AppText style={styles.outOfScopeBody}>
            Lives on the vehicle profile — not in this sheet
          </AppText>
        </View>
        <View style={styles.outOfScopeChip}>
          <AppText style={styles.outOfScopeChipLabel}>Profile</AppText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  island: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  islandReady: {
    backgroundColor: colors.greenSoft,
  },
  islandIncomplete: {
    backgroundColor: colors.surfaceActive,
  },
  islandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  islandReadyLabel: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  islandIncompleteLabel: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIndex: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIndexLabel: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  gridGap: {
    marginTop: 0,
  },
  gridCell: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  vinWrap: {
    marginTop: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeLabel: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
    textTransform: 'uppercase',
  },
  outOfScope: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  outOfScopeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfScopeText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  outOfScopeTitle: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  outOfScopeBody: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
  },
  outOfScopeChip: {
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  outOfScopeChipLabel: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
})
