import { Suspense } from 'react'
import SettingsInvoicingPage from '@/components/settings/SettingsInvoicingPage'
import ScreenLoading from '@/components/ui/ScreenLoading'

export default function InvoicingSettingsPage() {
  return (
    <Suspense fallback={<ScreenLoading body variant="settings" />}>
      <SettingsInvoicingPage />
    </Suspense>
  )
}
