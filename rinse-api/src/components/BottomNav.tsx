'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SquaresFour,
  Briefcase,
  Users,
  ChartBar,
  Plus,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { useVisualViewportBottom } from '@/hooks/useVisualViewportBottom'
import { useQuickAction } from '@/providers/QuickActionContext'
import { useAuth } from '@/providers/AuthProvider'

interface NavItem {
  href: string
  label: string
  Icon: PhosphorIcon
}

const LEFT_TABS: NavItem[] = [
  { href: '/', label: 'Home', Icon: SquaresFour },
  { href: '/jobs', label: 'Jobs', Icon: Briefcase },
]

const RIGHT_TABS: NavItem[] = [
  { href: '/clients', label: 'Clients', Icon: Users },
  { href: '/reports', label: 'Business', Icon: ChartBar },
]

function NavTab({ tab, active }: { tab: NavItem; active: boolean }) {
  const { Icon } = tab
  const tourId =
    tab.href === '/jobs'
      ? 'nav-jobs'
      : tab.href === '/clients'
        ? 'nav-clients'
        : tab.href === '/reports'
          ? 'nav-reports'
          : undefined
  return (
    <Link
      href={tab.href}
      className={`bottom-nav-tab${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
      data-tour={tourId}
    >
      <span className="bottom-nav-tab-icon">
        <Icon
          size={22}
          weight={active ? 'fill' : 'regular'}
          color={active ? 'var(--green)' : 'var(--text-hint)'}
          aria-hidden="true"
        />
      </span>
      <span className="bottom-nav-tab-label">{tab.label}</span>
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const navRef = useVisualViewportBottom<HTMLElement>()
  const { menuOpen, openMenu, closeMenu } = useQuickAction()
  const { isLoggedIn, isPlatformAdmin } = useAuth()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  if (isPlatformAdmin) return null

  if (
    pathname === '/auth' ||
    pathname === '/welcome' ||
    pathname === '/intro' ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/book/') ||
    pathname.startsWith('/embed/') ||
    pathname === '/onboarding' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname.startsWith('/terms/') ||
    pathname.startsWith('/jobs/new') ||
    pathname.startsWith('/settings')
  ) return null

  const leftTabs = isLoggedIn ? LEFT_TABS : LEFT_TABS.slice(0, 1)
  const rightTabs = isLoggedIn ? RIGHT_TABS : []

  return (
    <nav ref={navRef} className="bottom-nav" aria-label="Main navigation">
      {leftTabs.map((tab) => (
        <NavTab key={tab.href} tab={tab} active={isActive(tab.href)} />
      ))}

      {isLoggedIn ? (
        <div className="bottom-nav-fab">
          <button
            type="button"
            data-tour="fab"
            className={`bottom-nav-fab-link${menuOpen ? ' bottom-nav-fab-link--open' : ''}`}
            aria-label={menuOpen ? 'Close quick actions' : 'Quick actions'}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => {
              if (menuOpen) closeMenu()
              else openMenu()
            }}
          >
            <Plus size={24} weight="bold" color="#071407" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="bottom-nav-fab" aria-hidden="true" />
      )}

      {rightTabs.map((tab) => (
        <NavTab key={tab.href} tab={tab} active={isActive(tab.href)} />
      ))}
    </nav>
  )
}
