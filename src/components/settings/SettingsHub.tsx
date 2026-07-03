'use client'

import { type ReactNode, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { SectionGroup } from '@/components/ui'
import { useMilestones } from '@/hooks/useMilestones'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import { MILESTONE_COUNT } from '@/lib/milestones'
import { searchSettings, type SettingsSearchResult } from '@/lib/settings-search'
import SettingsFooter from './SettingsFooter'
import SettingsMenuListRow from './SettingsMenuListRow'
import ProfileCompleteCard from '@/components/home/ProfileCompleteCard'
import { useAuth } from '@/providers/AuthProvider'
import {
  SETTINGS_MENU_GROUPS,
  SETTINGS_MENU_ITEMS,
  type SettingsMenuItem,
} from '@/lib/settings-menu'

function SettingsMenuTrailing({
  itemId,
  profileCompletion,
  hasUnviewed,
  unlockedCount,
  faq,
}: {
  itemId?: string
  profileCompletion: ReturnType<typeof useProfileCompletion>
  hasUnviewed: boolean
  unlockedCount: number
  faq?: boolean
}) {
  const badges: ReactNode[] = []

  if (faq) {
    badges.push(
      <span key="faq" className="settings-search-kind-badge">
        FAQ
      </span>
    )
  }
  if (itemId === 'business' && profileCompletion && !profileCompletion.isComplete) {
    badges.push(
      <span key="profile" className="settings-menu-profile-badge">
        {profileCompletion.totalCount - profileCompletion.completedCount} left
      </span>
    )
  }
  if (itemId === 'progress' && hasUnviewed) {
    badges.push(
      <span key="milestones" className="settings-menu-milestone-badge">
        {unlockedCount}/{MILESTONE_COUNT}
      </span>
    )
  }

  if (badges.length === 0) return undefined

  return <span className="settings-menu-trailing">{badges}</span>
}

function hubRowFromItem(
  item: SettingsMenuItem,
  onSelect: (href: string) => void,
  profileCompletion: ReturnType<typeof useProfileCompletion>,
  hasUnviewed: boolean,
  unlockedCount: number,
) {
  return (
    <SettingsMenuListRow
      key={item.id}
      title={item.title}
      subtitle={item.subtitle}
      Icon={item.Icon}
      tone={item.tone}
      onClick={() => onSelect(item.href)}
      trailing={
        <SettingsMenuTrailing
          itemId={item.id}
          profileCompletion={profileCompletion}
          hasUnviewed={hasUnviewed}
          unlockedCount={unlockedCount}
        />
      }
    />
  )
}

function hubRowFromSearch(
  result: SettingsSearchResult,
  onSelect: (href: string) => void,
  profileCompletion: ReturnType<typeof useProfileCompletion>,
  hasUnviewed: boolean,
  unlockedCount: number,
) {
  const Icon = result.Icon ?? result.menuItem?.Icon
  const tone = result.tone ?? result.menuItem?.tone ?? 'blue'
  const itemId = result.menuItem?.id

  if (!Icon) {
    return (
      <SettingsMenuListRow
        key={`${result.kind}-${result.href}-${result.title}`}
        title={result.title}
        subtitle={result.matchHint ?? result.subtitle}
        Icon={MagnifyingGlass}
        tone="blue"
        onClick={() => onSelect(result.href)}
        trailing={
          <SettingsMenuTrailing
            faq={result.kind === 'faq'}
            profileCompletion={profileCompletion}
            hasUnviewed={hasUnviewed}
            unlockedCount={unlockedCount}
          />
        }
      />
    )
  }

  return (
    <SettingsMenuListRow
      key={`${result.kind}-${result.href}-${result.title}`}
      title={result.title}
      subtitle={result.matchHint ?? result.subtitle}
      Icon={Icon}
      tone={tone}
      onClick={() => onSelect(result.href)}
      trailing={
        <SettingsMenuTrailing
          itemId={itemId}
          faq={result.kind === 'faq'}
          profileCompletion={profileCompletion}
          hasUnviewed={hasUnviewed}
          unlockedCount={unlockedCount}
        />
      }
    />
  )
}

export default function SettingsHub() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const goBack = useSettingsBack()
  const [searchQuery, setSearchQuery] = useState('')
  const { hasUnviewed, unlockedCount } = useMilestones()
  const profileCompletion = useProfileCompletion()
  const searchResults = useMemo(() => searchSettings(searchQuery), [searchQuery])
  const searching = searchQuery.trim().length > 0
  const showingSimilar = searching && searchResults.length > 0 && searchResults.every((r) => r.similar)

  const navigate = (href: string) => {
    router.push(href)
  }

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Settings</h1>
      </header>

      {isLoggedIn && profileCompletion && !profileCompletion.isComplete ? (
        <ProfileCompleteCard completion={profileCompletion} compact />
      ) : null}

      <div className="settings-search-field premium-search">
        <MagnifyingGlass size={16} className="premium-search__icon settings-search-field__icon" aria-hidden="true" />
        <input
          type="search"
          className="premium-search__input settings-search-field__input"
          placeholder="Search settings, help, pipeline…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search settings"
        />
      </div>

      {searching && searchResults.length === 0 ? (
        <p className="settings-search-empty">
          No settings match &ldquo;{searchQuery.trim()}&rdquo;. Try words like booking, pipeline, stripe, or messages.
        </p>
      ) : null}

      <div className="settings-hub">
        {searching ? (
          <SectionGroup title={showingSimilar ? 'Similar matches' : 'Results'}>
            {searchResults.map((result) =>
              hubRowFromSearch(result, navigate, profileCompletion, hasUnviewed, unlockedCount),
            )}
          </SectionGroup>
        ) : (
          SETTINGS_MENU_GROUPS.map((group) => {
            const items = SETTINGS_MENU_ITEMS.filter((item) => item.group === group.id)
            if (items.length === 0) return null

            return (
              <SectionGroup key={group.id} title={group.label}>
                {items.map((item) =>
                  hubRowFromItem(item, navigate, profileCompletion, hasUnviewed, unlockedCount),
                )}
              </SectionGroup>
            )
          })
        )}
      </div>

      <SettingsFooter />
    </div>
  )
}
