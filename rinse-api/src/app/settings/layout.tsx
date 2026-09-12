'use client'

import { SettingsDraftProvider } from '@/components/settings/SettingsDraftProvider'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsDraftProvider>{children}</SettingsDraftProvider>
}
