import { useCallback, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { fmt } from '@rinse/core'
import type { Package } from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { PackageCreateSheet } from '@/src/components/settings/PackageCreateSheet'
import { AppText, ListRow, PrimaryButton, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { createPackage, deletePackage, listAllPackages, updatePackage } from '@/src/lib/packages-api'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsPackagesScreen() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [saving, setSaving] = useState(false)

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

  const openAdd = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (pkg: Package) => {
    setEditing(pkg)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setEditing(null)
  }

  const handleSave = async (input: { name: string; base_price: number; duration_minutes: number }) => {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updatePackage(editing.id, input)
        if (!updated) throw new Error('Could not save package')
      } else {
        await createPackage({
          name: input.name,
          base_price: input.base_price,
          duration_minutes: input.duration_minutes,
          active: true,
        })
      }
      closeSheet()
      await load(true)
    } catch (e) {
      Alert.alert(editing ? 'Edit package' : 'Add package', e instanceof Error ? e.message : 'Could not save package')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = () => {
    if (!editing) return
    Alert.alert('Archive package?', `"${editing.name}" will be hidden from new jobs and bookings.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true)
            try {
              const ok = await deletePackage(editing.id)
              if (!ok) throw new Error('Could not archive package')
              closeSheet()
              await load(true)
            } catch (e) {
              Alert.alert('Archive package', e instanceof Error ? e.message : 'Could not archive package')
            } finally {
              setSaving(false)
            }
          })()
        },
      },
    ])
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
          <PrimaryButton label="Add package" onPress={openAdd} />
          <SectionGroup title="Active packages">
            {packages.filter((p) => p.active).map((pkg) => (
              <ListRow
                key={pkg.id}
                title={pkg.name}
                subtitle={`${fmt(pkg.base_price)} · ${pkg.duration_minutes} min`}
                onPress={() => openEdit(pkg)}
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

      <PackageCreateSheet
        visible={sheetOpen}
        saving={saving}
        pkg={editing}
        onClose={closeSheet}
        onSave={(input) => void handleSave(input)}
        onArchive={editing ? handleArchive : undefined}
      />
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
