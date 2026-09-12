import { useEffect, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText } from '@/src/components/ui/AppText'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui/Button'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { colors, spacing } from '@/src/theme/colors'

export type JobExpenseDraft = {
  travel_cost: number
  marketing_cost: number
  equipment_depreciation: number
}

type JobExpensesSheetProps = {
  visible: boolean
  value: JobExpenseDraft
  onSave: (value: JobExpenseDraft) => void
  onClose: () => void
}

/** Draft travel / marketing / equipment costs before save — PWA JobExpensesSheet parity. */
export function JobExpensesSheet({ visible, value, onSave, onClose }: JobExpensesSheetProps) {
  const insets = useSafeAreaInsets()
  const [travel, setTravel] = useState(value.travel_cost)
  const [marketing, setMarketing] = useState(value.marketing_cost)
  const [equipment, setEquipment] = useState(value.equipment_depreciation)

  useEffect(() => {
    if (!visible) return
    setTravel(value.travel_cost)
    setMarketing(value.marketing_cost)
    setEquipment(value.equipment_depreciation)
  }, [visible, value.travel_cost, value.marketing_cost, value.equipment_depreciation])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <AppText variant="h2" style={styles.title}>
          Job expenses
        </AppText>
        <AppText variant="caption" style={styles.sub}>
          Travel, marketing, and equipment for this job
        </AppText>

        <View style={styles.fields}>
          <AffixField
            label="Travel"
            value={formatMoneyInput(travel)}
            onChangeText={(t) => setTravel(parseMoneyInput(t))}
          />
          <AffixField
            label="Marketing"
            value={formatMoneyInput(marketing)}
            onChangeText={(t) => setMarketing(parseMoneyInput(t))}
          />
          <AffixField
            label="Equipment"
            value={formatMoneyInput(equipment)}
            onChangeText={(t) => setEquipment(parseMoneyInput(t))}
          />
        </View>

        <View style={styles.actions}>
          <SecondaryButton label="Cancel" onPress={onClose} style={styles.actionBtn} />
          <PrimaryButton
            label="Done"
            onPress={() => {
              onSave({
                travel_cost: travel,
                marketing_cost: marketing,
                equipment_depreciation: equipment,
              })
              onClose()
            }}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: 4,
  },
  sub: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  fields: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
})
