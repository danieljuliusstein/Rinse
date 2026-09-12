import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { AccentColorSwatch } from '@/src/components/settings/AccentColorSwatch'
import { AppText, Card } from '@/src/components/ui'
import { accentTint, isValidHexColor, normalizeAccentColor } from '@/src/lib/brand-color'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function AccentColorField({
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
      <AppText style={styles.lead}>Used on your booking page and client portal.</AppText>
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
      <Card style={[styles.previewCard, { backgroundColor: accentTint(accent, 0.06) }]}>
        <AppText style={styles.previewLabel}>Preview</AppText>
        <View style={[styles.previewButton, { backgroundColor: accent }]}>
          <AppText style={styles.previewButtonText}>Book now</AppText>
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
  previewCard: {
    gap: 10,
    padding: spacing.md,
    alignItems: 'stretch',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  previewButton: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  previewButtonText: {
    color: '#fff',
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    textAlign: 'center',
  },
})
