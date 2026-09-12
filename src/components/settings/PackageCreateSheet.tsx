import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
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
  onSave: (input: { name: string; base_price: number; duration_minutes: number }) => void
  onArchive?: () => void
}) {
  const isEdit = Boolean(pkg)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('60')

  useEffect(() => {
    if (!visible) return
    if (pkg) {
      setName(pkg.name)
      setPrice(String(pkg.base_price))
      setDuration(String(pkg.duration_minutes))
      return
    }
    setName('')
    setPrice('')
    setDuration('60')
  }, [visible, pkg])

  const parsedPrice = Number(price.replace(/[^0-9.]/g, '')) || 0
  const parsedDuration = Math.max(15, Number(duration.replace(/[^0-9]/g, '')) || 60)
  const canSave = name.trim().length > 0

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title={isEdit ? 'Edit package' : 'New package'}
      subtitle="Service name, price, and estimated duration"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {isEdit && onArchive ? (
            <SecondaryButton label="Archive package" onPress={onArchive} style={styles.footerBtn} />
          ) : null}
          <SecondaryButton label="Cancel" onPress={onClose} style={styles.footerBtn} />
          <PrimaryButton
            label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add package'}
            loading={saving}
            disabled={!canSave}
            onPress={() =>
              onSave({
                name: name.trim(),
                base_price: parsedPrice,
                duration_minutes: parsedDuration,
              })
            }
            style={styles.footerPrimary}
          />
        </View>
      }
    >
      <FormField label="Package name" value={name} onChangeText={setName} placeholder="Full detail" autoFocus />
      <AffixField label="Base price" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
      <FormField
        label="Duration (minutes)"
        value={duration}
        onChangeText={setDuration}
        placeholder="60"
        keyboardType="number-pad"
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
