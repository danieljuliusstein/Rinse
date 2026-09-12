'use client'

import BackButton from '@/components/BackButton'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import SettingsFooter from './SettingsFooter'

export default function SettingsDetailShell({
  title,
  children,
  showSave = true,
}: {
  title: string
  children: React.ReactNode
  showSave?: boolean
}) {
  const goBack = useSettingsBack()

  return (
    <div className="screen page-content body settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">{title}</h1>
      </header>
      <div className="settings-detail">{children}</div>
      <SettingsFooter showSave={showSave} />
    </div>
  )
}
