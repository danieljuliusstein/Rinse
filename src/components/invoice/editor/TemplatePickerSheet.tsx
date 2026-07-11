import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { EDITOR_CHROME, EDITOR_TEMPLATES, type InvoiceEditorTemplateId } from '@/src/lib/invoice-editor'
import { webInlinePressableReset, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function TemplatePickerSheet({
  open,
  current,
  onClose,
  onPick,
}: {
  open: boolean
  current: InvoiceEditorTemplateId
  onClose: () => void
  onPick: (id: InvoiceEditorTemplateId) => void
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <AppText style={styles.title}>Template</AppText>
          <AppText style={styles.lead}>Resets block layout to the preset.</AppText>
          {EDITOR_TEMPLATES.map((tpl) => {
            const on = tpl.id === current
            return (
              <Pressable
                key={tpl.id}
                onPress={() => {
                  onPick(tpl.id)
                  onClose()
                }}
                style={[styles.row, on ? styles.rowOn : null, webPressableReset]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={{ flex: 1 }}>
                  <AppText style={styles.rowTitle}>{tpl.label}</AppText>
                  <AppText style={styles.rowDesc}>{tpl.description}</AppText>
                </View>
                {on ? <AppText style={styles.badge}>Current</AppText> : null}
              </Pressable>
            )
          })}
          <Pressable onPress={onClose} style={[styles.cancel, webInlinePressableReset]} accessibilityRole="button">
            <AppText style={styles.cancelText}>Cancel</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: EDITOR_CHROME.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 8,
    paddingBottom: 28,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: EDITOR_CHROME.text,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: EDITOR_CHROME.textMuted,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: EDITOR_CHROME.bg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowOn: {
    borderColor: EDITOR_CHROME.green,
  },
  rowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: EDITOR_CHROME.text,
  },
  rowDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: EDITOR_CHROME.textMuted,
    marginTop: 2,
  },
  badge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: EDITOR_CHROME.green,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: EDITOR_CHROME.textMuted,
  },
})
