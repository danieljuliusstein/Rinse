import { Suspense } from 'react'
import SettingsBillingPage from '@/components/settings/SettingsBillingPage'
import ScreenLoading from '@/components/ui/ScreenLoading'

export default function BillingSettingsRoute() {
  return (
    <Suspense fallback={<ScreenLoading body variant="settings" />}>
      <SettingsBillingPage />
    </Suspense>
  )
}
