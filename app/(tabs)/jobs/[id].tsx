import { useLocalSearchParams, useRouter } from 'expo-router'
import { JobDetailBody } from '@/src/components/detail/JobDetailBody'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { OperatorScreen } from '@/src/components/OperatorScreen'

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  if (!id) {
    return (
      <OperatorScreen title="Job" headerRight={<DetailHeaderActions onBack={() => router.back()} />}>
        <></>
      </OperatorScreen>
    )
  }

  return (
    <OperatorScreen
      title="Job"
      headerRight={
        <DetailHeaderActions
          onEdit={() => router.push(`/jobs/edit/${id}`)}
          onBack={() => router.back()}
        />
      }
    >
      <JobDetailBody jobId={id} onClose={() => router.back()} variant="screen" />
    </OperatorScreen>
  )
}
