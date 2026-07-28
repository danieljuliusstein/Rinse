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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roster, setRoster] = useState<TechRosterEntry[]>([])
  const [name, setName] = useState('')

  const refresh = useCallback(async () => {
    const settings = await loadSettings()
    setRoster(normalizeTechRoster(settings.tech_roster))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setRoster((prev) => [
      ...prev,
      { id: generatePocketBaseId(), name: trimmed, color: COLORS[prev.length % COLORS.length]! },
    ])
    setName('')
  }

  const save = async () => {
    setSaving(true)
    try {
      await saveSettings({ tech_roster: roster })
      Alert.alert('Saved', 'Team roster updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title="Team">
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Team" subtitle="Assign jobs to techs">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {roster.length === 0 ? (
          <AppText variant="caption" style={styles.muted}>
            Solo mode — jobs default to You until you add techs.
          </AppText>
        ) : (
          roster.map((tech) => (
            <View key={tech.id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: tech.color }]} />
              <AppText variant="bodySemiBold" style={styles.name}>
                {tech.name}
              </AppText>
              <Pressable
                onPress={() => setRoster((prev) => prev.filter((t) => t.id !== tech.id))}
                hitSlop={8}
              >
                <AppText variant="caption" style={styles.remove}>
                  Remove
                </AppText>
              </Pressable>
            </View>
          ))
        )}
        <FormField label="Add tech" value={name} onChangeText={setName} placeholder="Name" />
        <SecondaryButton label="Add" onPress={add} />
        <PrimaryButton label="Save" loading={saving} onPress={() => void save()} />
      </ScrollView>
    </SettingsScreen>
  )
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
