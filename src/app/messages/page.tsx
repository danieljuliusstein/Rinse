import { Suspense } from 'react'
import MessagesScreen from '@/components/messages/MessagesScreen'
import ScreenLoading from '@/components/ui/ScreenLoading'

export default function MessagesPage() {
  return (
    <Suspense fallback={<ScreenLoading body label="Loading messages…" />}>
      <MessagesScreen />
    </Suspense>
  )
}
