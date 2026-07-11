import { createClient } from '@/src/lib/api'
import { useOffline } from '@/src/providers/OfflineProvider'
import { ClientForm } from '@/src/components/forms/ClientForm'
import { AppSheet } from '@/src/components/ui/AppSheet'

export default function NewClientScreen() {
  const { refresh: refreshQueue } = useOffline()

  return (
    <AppSheet title="New client" subtitle="Add to your directory">
      <ClientForm
        submitLabel="Save client"
        hint="Changes sync automatically when you are back online."
        onSubmit={async (values) => {
          await createClient(values)
          await refreshQueue()
        }}
      />
    </AppSheet>
  )
}
