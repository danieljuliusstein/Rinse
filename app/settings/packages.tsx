import { useCallback, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { fmt } from '@rinse/core'
import type { Package } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, ListRow, PrimaryButton, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { createPackage, deletePackage, listAllPackages } from '@/src/lib/packages-api'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsPackagesScreen() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      setPackages(await listAllPackages())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  const handleAdd = () => {
    Alert.prompt?.('New package', 'Package name', async (name) => {
      if (!name?.trim()) return
      await createPackage({ name: name.trim(), base_price: 0, active: true })
      void load(true)
    })
    if (!Alert.prompt) {
      void createPackage({ name: 'New package', base_price: 0, active: true }).then(() => load(true))
    }
  }

  return (
    <SettingsScreen title="Service packages" subtitle="Manage offerings">
      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />}
        >
          <PrimaryButton label="Add package" onPress={handleAdd} />
          <SectionGroup title="Active packages">
            {packages.filter((p) => p.active).map((pkg) => (
              <ListRow
                key={pkg.id}
                title={pkg.name}
                subtitle={`${fmt(pkg.base_price)} · ${pkg.duration_minutes} min`}
                onPress={() => {
                  Alert.alert(pkg.name, undefined, [
                    {
                      text: 'Archive',
                      style: 'destructive',
                      onPress: () => void deletePackage(pkg.id).then(() => load(true)),
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }}
              />
            ))}
            {packages.filter((p) => p.active).length === 0 ? (
              <AppText variant="body" style={styles.muted}>
                No packages yet.
              </AppText>
            ) : null}
          </SectionGroup>
        </ScrollView>
      )}
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  muted: {
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
  },
})
