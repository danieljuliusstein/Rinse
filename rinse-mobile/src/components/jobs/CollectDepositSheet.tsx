import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import type { BusinessPolicies, DepositStatus } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AffixField } from '@/src/components/ui/AffixField'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { computeDepositDue } from '@/src/lib/deposits'
import { colors, spacing } from '@/src/theme/colors'

export function CollectDepositSheet({
  visible,
  onClose,
  revenue,
  policies,
  currentStatus,
  currentAmount,
  busy,
  onMarkPaid,
  onWaive,
  onSendPayLink,
}: {
  visible: boolean
  onClose: () => void
  revenue: number
  policies: BusinessPolicies
  currentStatus?: DepositStatus
  currentAmount?: number
  busy?: boolean
  onMarkPaid: (amount: number) => void
  onWaive: () => void
  onSendPayLink?: (amount: number) => void
}) {
  const due = computeDepositDue(policies, revenue)
  const [amount, setAmount] = useState(String(currentAmount && currentAmount > 0 ? currentAmount : due))

  useEffect(() => {
    if (!visible) return
    const next = currentAmount && currentAmount > 0 ? currentAmount : computeDepositDue(policies, revenue)
    setAmount(String(next))
  }, [visible, currentAmount, policies, revenue])

  const parsed = Math.max(0, Number(amount.replace(/[^0-9.]/g, '')) || 0)

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Collect deposit"
      subtitle={
        currentStatus === 'paid'
          ? 'Deposit already marked paid'
          : `Suggested $${due.toFixed(2)} from policy`
      }
      onClose={onClose}
    >
      <AffixField
        label="Deposit amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      {policies.collect_at_booking ? (
        <AppText variant="caption" style={styles.hint}>
          Policy: collect at booking is on.
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <PrimaryButton
          label="Mark paid"
          loading={busy}
          onPress={() => onMarkPaid(parsed)}
          disabled={parsed <= 0 || currentStatus === 'paid'}
        />
        {onSendPayLink ? (
          <SecondaryButton
            label="Send pay link"
            loading={busy}
            onPress={() => onSendPayLink(parsed)}
            disabled={parsed <= 0}
          />
        ) : null}
        <SecondaryButton
          label="Waive deposit"
          loading={busy}
          onPress={onWaive}
          disabled={currentStatus === 'waived' || currentStatus === 'paid'}
        />
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
})
