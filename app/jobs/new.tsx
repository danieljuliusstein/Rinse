import { useLocalSearchParams } from 'expo-router'
import { createJob } from '@/src/lib/api'
import { useOffline } from '@/src/providers/OfflineProvider'
import { JobCreateForm } from '@/src/components/forms/JobCreateForm'

export default function NewJobScreen() {
  const { refresh: refreshQueue } = useOffline()
  const { clientId, client, date } = useLocalSearchParams<{
    clientId?: string
    client?: string
    date?: string
  }>()

  return (
    <JobCreateForm
      initialClientId={clientId ?? client}
      initialDate={date}
      onSubmit={async (values, clientName) => {
        await createJob(values, clientName)
        await refreshQueue()
      }}
    />
  )
}
