import { ArrowClockwise, ArrowCounterClockwise } from 'phosphor-react-native'
import { Pressable, StyleSheet, Switch, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { EDITOR_CHROME } from '@/src/lib/invoice-editor'
import { webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function EditorToolbar({
  canUndo,
  canRedo,
  snapEnabled,
  saving,
  onTemplate,
  onUndo,
  onRedo,
  onSnapChange,
  onSave,
}: {
  canUndo: boolean
  canRedo: boolean
  snapEnabled: boolean
  saving?: boolean
  onTemplate: () => void
  onUndo: () => void
  onRedo: () => void
  onSnapChange: (next: boolean) => void
  onSave: () => void
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Pressable
          onPress={onTemplate}
          style={({ pressed }) => [styles.btn, pressed ? styles.pressed : null, webInlinePressableReset]}
          accessibilityRole="button"
          accessibilityLabel="Template"
        >
          <AppText style={styles.btnText}>Template</AppText>
        </Pressable>
        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          style={({ pressed }) => [
            styles.iconBtn,
            !canUndo ? styles.disabled : null,
            pressed && canUndo ? styles.pressed : null,
            webInlinePressableReset,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Undo"
        >
          <ArrowCounterClockwise size={16} color={EDITOR_CHROME.text} />
        </Pressable>
        <Pressable
          onPress={onRedo}
          disabled={!canRedo}
          style={({ pressed }) => [
            styles.iconBtn,
            !canRedo ? styles.disabled : null,
            pressed && canRedo ? styles.pressed : null,
            webInlinePressableReset,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Redo"
        >
          <ArrowClockwise size={16} color={EDITOR_CHROME.text} />
        </Pressable>
      </View>

      <View style={styles.right}>
        <View style={styles.snapRow}>
          <AppText style={styles.snapLabel}>Snap</AppText>
          <Switch
            value={snapEnabled}
            onValueChange={onSnapChange}
            trackColor={{ false: EDITOR_CHROME.border, true: EDITOR_CHROME.green }}
            thumbColor="#fff"
            accessibilityLabel="Snap to guides"
          />
        </View>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.save,
            saving ? styles.disabled : null,
            pressed && !saving ? styles.pressed : null,
            webInlinePressableReset,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <AppText style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</AppText>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: EDITOR_CHROME.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: EDITOR_CHROME.surface,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EDITOR_CHROME.surface,
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: EDITOR_CHROME.text,
  },
  snapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: EDITOR_CHROME.textMuted,
  },
  save: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: EDITOR_CHROME.green,
  },
  saveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: '#052e16',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
})
