import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { Package } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { AffixField, AppSheet, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { spacing } from '@/src/theme/colors'

export function PackageCreateSheet({
  visible,
  saving,
  pkg,
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean
  saving: boolean
  pkg?: Package | null
  onClose: () => void
  onSave: (input: {
    name: string
    base_price: number
    duration_minutes: number
    deposit_amount?: number
  }) => void
  onArchive?: () => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(pkg)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [duration, setDuration] = useState('60')

  useEffect(() => {
    if (!visible) return
    if (pkg) {
      setName(pkg.name)
      setPrice(String(pkg.base_price))
      setDeposit(pkg.deposit_amount != null && pkg.deposit_amount > 0 ? String(pkg.deposit_amount) : '')
      setDuration(String(pkg.duration_minutes))
      return
    }
    setName('')
    setPrice('')
    setDeposit('')
    setDuration('60')
  }, [visible, pkg])

  const parsedPrice = Number(price.replace(/[^0-9.]/g, '')) || 0
  const parsedDeposit = Number(deposit.replace(/[^0-9.]/g, '')) || 0
  const parsedDuration = Math.max(15, Number(duration.replace(/[^0-9]/g, '')) || 60)
  const canSave = name.trim().length > 0

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title={isEdit ? t('packages.editPackage') : t('packages.newPackage')}
      subtitle={t('packages.sheetSubtitle')}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {isEdit && onArchive ? (
            <SecondaryButton label={t('packages.archiveBtn')} onPress={onArchive} style={styles.footerBtn} />
          ) : null}
          <SecondaryButton label={t('common.cancel')} onPress={onClose} style={styles.footerBtn} />
          <PrimaryButton
            label={saving ? t('common.saving') : isEdit ? t('packages.saveChanges') : t('packages.addPackage')}
            loading={saving}
            disabled={!canSave}
            onPress={() =>
              onSave({
                name: name.trim(),
                base_price: parsedPrice,
                duration_minutes: parsedDuration,
                deposit_amount: parsedDeposit > 0 ? parsedDeposit : 0,
              })
            }
            style={styles.footerPrimary}
          />
        </View>
      }
    >
      <FormField label={t('packages.packageName')} value={name} onChangeText={setName} placeholder={t('packages.namePlaceholder')} />
      <AffixField label={t('packages.basePrice')} value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
      <AffixField
        label={t('packages.depositRequired')}
        value={deposit}
        onChangeText={setDeposit}
        placeholder={t('packages.depositPlaceholder')}
        keyboardType="decimal-pad"
      />
      <FormField
        label={t('packages.duration')}
        value={duration}
        onChangeText={setDuration}
        placeholder={t('packages.durationPlaceholder')}
        keyboardType="decimal-pad"
      />
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
  footerPrimary: {
    flex: 2,
  },
})
