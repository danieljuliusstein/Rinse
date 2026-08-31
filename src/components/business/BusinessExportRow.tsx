import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { DownloadSimple, FileText } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { colors, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type BusinessExportRowProps = {
  exporting?: boolean
  onExportCsv: () => void
  onExportPdf: () => void
}

export function BusinessExportRow({ exporting, onExportCsv, onExportPdf }: BusinessExportRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onExportCsv}
        disabled={exporting}
        style={({ pressed }) => [styles.csv, webPressableReset, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Export CSV"
      >
        {exporting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <DownloadSimple size={17} color="#ffffff" weight="bold" />
            <AppText style={styles.csvLabel}>Export CSV</AppText>
          </>
        )}
      </Pressable>
      <Pressable
        onPress={onExportPdf}
        disabled={exporting}
        style={({ pressed }) => [styles.pdf, webPressableReset, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Export PDF"
      >
        <FileText size={17} color={colors.textSecondary} weight="duotone" />
        <AppText style={styles.pdfLabel}>Export PDF</AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  csv: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.green,
    paddingVertical: 14,
    minHeight: 48,
  },
  csvLabel: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: '#ffffff',
  },
  pdf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 14,
    minHeight: 48,
  },
  pdfLabel: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
})
