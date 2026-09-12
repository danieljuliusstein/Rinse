import { useLocalSearchParams } from 'expo-router'
import { createClient } from '@/src/lib/api'
import { useOffline } from '@/src/providers/OfflineProvider'
import { ClientForm } from '@/src/components/forms/ClientForm'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { trackProductEvent } from '@/src/lib/telemetry'

export default function NewClientScreen() {
  const { parent } = useLocalSearchParams<{ parent?: string }>()
  const { refresh: refreshQueue } = useOffline()

  return (
    <AppSheet title="New client" subtitle="Add to your directory">
      <ClientForm
        submitLabel="Save client"
        hint="Changes sync automatically when you are back online."
        defaultValues={parent ? { parent_client_id: parent } : undefined}
        onSubmit={async (values) => {
          await createClient(values)
          await refreshQueue()
          trackProductEvent('client_created', {
            has_phone: Boolean(values.phone?.trim()),
            has_email: Boolean(values.email?.trim()),
            has_parent: Boolean(values.parent_client_id?.trim()),
          })
        }}
      />
    </AppSheet>
  )
}
