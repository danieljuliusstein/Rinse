import { useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SubScreen } from '@/src/components/SubScreen'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { FormField } from '@/src/components/FormField'
import { importClientsFromCsv } from '@/src/lib/api'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, spacing } from '@/src/theme/colors'

export default function ImportClientsScreen() {
  const router = useRouter()
  const { bump } = useDataRefresh()
  const [csv, setCsv] = useState('name,phone,email,address,notes\n')
  const [busy, setBusy] = useState(false)

  const handleImport = async () => {
    setBusy(true)
    try {
      const count = await importClientsFromCsv(csv)
      bump()
      Alert.alert('Import complete', `${count} client${count === 1 ? '' : 's'} imported.`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Could not import')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SubScreen title="Import clients" subtitle="Paste CSV" tabDock={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="caption" style={styles.hint}>
          First row must be headers: name, phone, email, address, notes
        </AppText>
        <FormField label="CSV data" value={csv} onChangeText={setCsv} multiline />
        <PrimaryButton label="Import" loading={busy} onPress={() => void handleImport()} />
        <SecondaryButton label="Cancel" onPress={() => router.back()} />
      </ScrollView>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hint: {
    color: colors.textMuted,
  },
})
