import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ClientDetailBody } from '@/src/components/detail/ClientDetailBody'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { OperatorScreen } from '@/src/components/OperatorScreen'

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [header, setHeader] = useState<{ title: string; subtitle?: string } | null>(null)

  if (!id) {
    return (
      <OperatorScreen title="Client" headerRight={<DetailHeaderActions onBack={() => router.back()} />}>
        <></>
      </OperatorScreen>
    )
  }

  return (
    <OperatorScreen
      title={header?.title ?? 'Client'}
      subtitle={header?.subtitle}
      headerRight={
        <DetailHeaderActions
          onEdit={() => router.push(`/clients/edit/${id}`)}
          onBack={() => router.back()}
        />
      }
    >
      <ClientDetailBody
        clientId={id}
        onClose={() => router.back()}
        onMetaChange={setHeader}
        variant="screen"
      />
    </OperatorScreen>
  )
}
