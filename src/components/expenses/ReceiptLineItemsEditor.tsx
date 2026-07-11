import { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Plus, Trash } from 'phosphor-react-native'
import type { ExpenseLine } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { AppText, SecondaryButton } from '@/src/components/ui'
import { usePremiumGate } from '@/src/hooks/usePremiumGate'
import { parseReceiptImage } from '@/src/lib/receipt-parse'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const EMPTY_LINE: ExpenseLine = { category: 'supplies', description: '', amount: 0 }

export function ReceiptLineItemsEditor({
  lines,
  onChange,
  onTotalChange,
  onMerchantChange,
  onDateChange,
}: {
  lines: ExpenseLine[]
  onChange: (lines: ExpenseLine[]) => void
  onTotalChange: (total: number) => void
  onMerchantChange?: (merchant: string) => void
  onDateChange?: (date: string) => void
}) {
  const { runGated } = usePremiumGate('receipt_ocr')
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const updateLine = (index: number, patch: Partial<ExpenseLine>) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line))
    onChange(next)
    onTotalChange(next.reduce((sum, line) => sum + (Number(line.amount) || 0), 0))
  }

  const addLine = () => onChange([...lines, { ...EMPTY_LINE }])

  const removeLine = (index: number) => {
    const next = lines.filter((_, i) => i !== index)
    const safe = next.length ? next : [{ ...EMPTY_LINE }]
    onChange(safe)
    onTotalChange(safe.reduce((sum, line) => sum + (Number(line.amount) || 0), 0))
  }

  const applyScan = async (uri: string, mimeType: string) => {
    setScanning(true)
    setScanError(null)
    try {
      const result = await parseReceiptImage(uri, mimeType)
      onChange(result.lines)
      onTotalChange(result.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0))
      if (result.merchant) onMerchantChange?.(result.merchant)
      if (result.date) onDateChange?.(result.date)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Scan failed — enter lines manually')
      if (lines.length === 1 && !lines[0].description) {
        updateLine(0, { description: 'Receipt item' })
      }
    } finally {
      setScanning(false)
    }
  }

  const pickReceipt = () => {
    runGated(() => {
      void (async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
          setScanError('Camera permission is required to scan receipts.')
          return
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.85,
        })
        if (result.canceled || !result.assets[0]?.uri) return

        const asset = result.assets[0]
        setPreviewUri(asset.uri)
        await applyScan(asset.uri, asset.mimeType ?? 'image/jpeg')
      })()
    })
  }

  return (
    <View style={styles.root}>
      <SecondaryButton label={scanning ? 'Scanning…' : 'Scan receipt'} onPress={pickReceipt} disabled={scanning} />
      <AppText variant="caption" style={styles.hint}>
        Scan a receipt — we&apos;ll draft line items to confirm.
      </AppText>
      {scanError ? (
        <AppText variant="caption" style={styles.error} accessibilityRole="alert">
          {scanError}
        </AppText>
      ) : null}

      {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} accessibilityLabel="Receipt preview" /> : null}

      {lines.map((line, index) => (
        <View key={`receipt-line-${index}`} style={styles.row}>
          <View style={styles.rowFields}>
            <FormField
              label="Description"
              value={line.description}
              onChangeText={(description) => updateLine(index, { description })}
              placeholder="Item"
            />
            <FormField
              label="Amount"
              value={line.amount > 0 ? String(line.amount) : ''}
              onChangeText={(value) =>
                updateLine(index, { amount: value === '' ? 0 : Number(value) || 0 })
              }
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          {lines.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove line"
              onPress={() => removeLine(index)}
              style={styles.removeBtn}
            >
              <Trash size={18} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ))}

      <Pressable accessibilityRole="button" onPress={addLine} style={styles.addRow}>
        <Plus size={16} color={colors.greenText} weight="bold" />
        <AppText style={styles.addLabel}>Add line</AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    marginTop: -4,
  },
  error: {
    color: colors.danger,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowFields: {
    flex: 1,
    gap: spacing.sm,
  },
  removeBtn: {
    marginTop: 28,
    padding: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addLabel: {
    color: colors.greenText,
    fontFamily: fonts.bodyMedium,
  },
})
