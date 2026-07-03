'use client'

import { useRouter } from 'next/navigation'
import { CurrencyDollar, Wallet } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { SectionGroup } from '@/components/ui'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import SettingsFooter from './SettingsFooter'
import SettingsMenuListRow from './SettingsMenuListRow'

const EXPENSE_ITEMS = [
  {
    id: 'overhead',
    title: 'Overhead expenses',
    subtitle: 'Rent, insurance, subscriptions',
    href: '/settings/overhead',
    Icon: Wallet,
    tone: 'purple' as const,
  },
  {
    id: 'business',
    title: 'Business expenses',
    subtitle: 'One-off costs and purchases',
    href: '/settings/business-expenses',
    Icon: CurrencyDollar,
    tone: 'green' as const,
  },
]

export default function SettingsExpensesPage() {
  const router = useRouter()
  const goBack = useSettingsBack()

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Expenses</h1>
      </header>

      <div className="settings-hub">
        <SectionGroup title="Expense types">
          {EXPENSE_ITEMS.map((item) => (
            <SettingsMenuListRow
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              Icon={item.Icon}
              tone={item.tone}
              onClick={() => router.push(item.href)}
            />
          ))}
        </SectionGroup>
      </div>

      <SettingsFooter showSave={false} />
    </div>
  )
}
