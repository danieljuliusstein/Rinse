import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { getClient, updateClient } from '@/src/lib/api'
import { useOffline } from '@/src/providers/OfflineProvider'
import { ClientForm } from '@/src/components/forms/ClientForm'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText } from '@/src/components/ui/AppText'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import type { Client } from '@rinse/core'
import { colors, spacing } from '@/src/theme/colors'

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { refresh: refreshQueue } = useOffline()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void getClient(id)
      .then((row) => {
        if (!cancelled) setClient(row)
      })
      .catch((e) => {
        if (!cancelled) Alert.alert('Load failed', e instanceof Error ? e.message : 'Try again')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <AppSheet title="Edit client">
        <ScreenLoading label="Loading client…" />
      </AppSheet>
    )
  }

  if (!client) {
    return (
      <AppSheet title="Edit client">
        <AppText variant="body" style={{ color: colors.danger, padding: spacing.md }}>
          Client not found
        </AppText>
      </AppSheet>
    )
  }

  return (
    <AppSheet title="Edit client" subtitle={client.name}>
      <ClientForm
        submitLabel="Save changes"
        hint="Edits queue offline when PocketBase is unreachable."
        defaultValues={{
          name: client.name,
          phone: client.phone ?? '',
          email: client.email ?? '',
          address: client.address ?? '',
          notes: client.notes ?? '',
        }}
        onSubmit={async (values) => {
          if (!id) return
          await updateClient(id, values)
          await refreshQueue()
        }}
      />
    </AppSheet>
  )
}
