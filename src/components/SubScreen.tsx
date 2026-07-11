import type { ReactNode } from 'react'
import { useNavigation } from 'expo-router'
import { OperatorScreen } from '@/src/components/OperatorScreen'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { safeGoBack } from '@/src/lib/safe-go-back'

type SubScreenProps = {
  title: string
  subtitle?: string
  children: ReactNode
  tabDock?: boolean
  headerRight?: ReactNode
  onEdit?: () => void
}

/** Full-screen stack route with a back action in the header. */
export function SubScreen({
  title,
  subtitle,
  children,
  tabDock = false,
  headerRight,
  onEdit,
}: SubScreenProps) {
  const navigation = useNavigation()
  const back = () => safeGoBack(navigation, '/(tabs)')

  return (
    <OperatorScreen
      title={title}
      subtitle={subtitle}
      tabDock={tabDock}
      headerRight={
        headerRight ?? <DetailHeaderActions onBack={back} onEdit={onEdit} />
      }
    >
      {children}
    </OperatorScreen>
  )
}
