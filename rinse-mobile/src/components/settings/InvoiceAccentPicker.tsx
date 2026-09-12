import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { AccentColorSwatch } from '@/src/components/settings/AccentColorSwatch'
import { AppText } from '@/src/components/ui'
import { isValidHexColor, normalizeAccentColor } from '@/src/lib/brand-color'
import { INVOICE_ACCENT_PRESETS } from '@/src/lib/invoice-templates'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function InvoiceAccentPicker({
  value,
  onChange,
}: {
  value: string | null | undefined
  onChange: (next: string | null) => void
}) {
  const accent = normalizeAccentColor(value)
  const [hexDraft, setHexDraft] = useState(value ?? '')

  useEffect(() => {
    setHexDraft(value ?? '')
  }, [value])

  const commitHex = (next: string) => {
    setHexDraft(next)
    const trimmed = next.trim()
    if (!trimmed) {
      onChange(null)
      return
    }
    if (isValidHexColor(trimmed)) onChange(trimmed.toLowerCase())
  }

  return (
    <View style={styles.wrap}>
      <AppText style={styles.head}>Accent color</AppText>
      <View style={styles.presets}>
        {INVOICE_ACCENT_PRESETS.map((hex) => {
          const on = accent === hex
          return (
            <Pressable
              key={hex}
              accessibilityLabel={`Accent ${hex}`}
              onPress={() => {
                setHexDraft(hex)
                onChange(hex)
              }}
              style={[styles.preset, { backgroundColor: hex }, on ? styles.presetOn : null]}
            />
          )
        })}
      </View>
      <View style={styles.row}>
        <AccentColorSwatch
          color={accent}
          onChange={(hex) => {
            setHexDraft(hex)
            onChange(hex.toLowerCase())
          }}
        />
        <TextInput
          style={styles.hexInput}
          value={hexDraft}
          placeholder="#22c55e"
          placeholderTextColor={colors.textMuted}
          onChangeText={commitHex}
          onBlur={() => {
            if (hexDraft.trim() && !isValidHexColor(hexDraft)) {
              setHexDraft(value ?? '')
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  head: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preset: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetOn: {
    borderColor: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hexInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
})
