import { Suspense } from 'react'
import ScreenLoading from '@/components/ui/ScreenLoading'
import QuotesPageClient from './QuotesPageClient'

export default function QuotesPage() {
  return (
    <Suspense fallback={<ScreenLoading body />}>
      <QuotesPageClient />
    </Suspense>
  )
}
