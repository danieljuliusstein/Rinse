import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { generatePocketBaseId, type TechRosterEntry } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { FormField } from '@/src/components/FormField'
import { AppText, PrimaryButton, ScreenLoading, SecondaryButton } from '@/src/components/ui'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import { normalizeTechRoster } from '@/src/lib/wave5-prefs'
import { colors, spacing } from '@/src/theme/colors'

const COLORS = ['#22c55e', '#2563eb', '#d97706', '#7c3aed', '#dc2626']

export default function SettingsTeamScreen() {
  // Team management is temporarily hidden per product decision.
  // This preserves the codebase while removing the UI surface — re-enable later if needed.
  return null
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingBottom: spacing.xl },
  muted: { color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1 },
  remove: { color: colors.danger },
})
