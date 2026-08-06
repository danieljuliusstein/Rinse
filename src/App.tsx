import { useEffect, useMemo, useState, type ReactNode } from 'react'
import MoneyOverview from './pages/MoneyOverview'
import Dashboard from './pages/Dashboard'
import SalesPipeline from './pages/SalesPipeline'
import Contacts from './pages/Contacts'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import ActivitiesPage from './pages/ActivitiesPage'
import CampaignsPage from './pages/CampaignsPage'
import FormsPage from './pages/FormsPage'
import AutomationsPage from './pages/AutomationsPage'
import ChatPage from './pages/ChatPage'
import AiAssistPage from './pages/AiAssistPage'
import InvoicesPage from './pages/InvoicesPage'
import ReceiptsPage from './pages/ReceiptsPage'
import CarsPage from './pages/CarsPage'
import RoutesPage from './pages/RoutesPage'
import LoginPage from './pages/LoginPage'
import { colors } from './theme/colors'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { DataProvider, useData } from './providers/DataProvider'
import { UiProvider } from './providers/UiProvider'
import { DeskNavProvider, useDeskNav } from './providers/DeskNavProvider'
import { useCreateActions } from './hooks/useCreateActions'
import { getDisplayName, getInitials } from './lib/auth'
import { loadAppSettings } from './lib/settings-api'
import {
  getCachedBusinessName,
  onBusinessUpdated,
} from './lib/business-brand'
import { BRAND } from './lib/brand-assets'
import { RinseLogo } from './components/brand/RinseLogo'
import {
  LayoutDashboard,
  Handshake,
  Wallet,
  FileText,
  ReceiptText,
  Car,
  Users,
  CalendarDays,
  Route,
  Activity,
  Megaphone,
  FileStack,
  Settings,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react'
import type { PageId } from './lib/types'

export type { PageId }

const SIDEBAR_COLLAPSED_KEY = 'desk.sidebarCollapsed'

type NavItem = { id: PageId; label: string; icon: LucideIcon }

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'deals', label: 'Deals', icon: Handshake },
      { id: 'money', label: 'Money', icon: Wallet },
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'receipts', label: 'Receipts', icon: ReceiptText },
    ],
  },
  {
    title: 'Fleet',
    items: [{ id: 'cars', label: 'Cars', icon: Car }],
  },
  {
    title: 'People & schedule',
    items: [
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      { id: 'routes', label: 'Routes', icon: Route },
      { id: 'activities', label: 'Activities', icon: Activity },
    ],
  },
  {
    title: 'Reach',
    items: [
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
      { id: 'forms', label: 'Forms', icon: FileStack },
    ],
  },
]

/** Soft-hidden for now — routes remain but stay out of the sidebar. */
const HIDDEN_NAV_PAGES = new Set<PageId>(['ai', 'chat', 'automations'])

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: CircleHelp },
]

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function Sidebar({ active, onNavigate }: { active: PageId; onNavigate: (id: PageId) => void }) {
  // #region agent log
  fetch('http://127.0.0.1:7459/ingest/ba28eed9-af8b-4e8b-819f-5876c609af86',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cbab19'},body:JSON.stringify({sessionId:'cbab19',runId:'pre-fix',hypothesisId:'A',location:'App.tsx:Sidebar',message:'Sidebar render ok',data:{active,hasRinseLogo:typeof RinseLogo==='function',brandMark:'RinseLogo'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed)
  const [businessName, setBusinessName] = useState(getCachedBusinessName)
  const name = getDisplayName()
  const initials = getInitials(name)
  const brandName = businessName || 'My Business'

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    let cancelled = false
    void loadAppSettings().then((s) => {
      if (cancelled) return
      const next = s.business_name.trim()
      if (next) {
        setBusinessName(next)
        try {
          localStorage.setItem('desk.businessName', next)
        } catch {
          /* ignore */
        }
      }
    })
    const unsub = onBusinessUpdated((next) => setBusinessName(next))
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  function navButton({ id, label, icon: Icon }: NavItem, opts?: { compact?: boolean }) {
    const isActive = active === id
    const compact = opts?.compact ?? collapsed
    return (
      <button
        key={id}
        type="button"
        title={compact ? label : undefined}
        onClick={() => onNavigate(id)}
        className={`w-full flex items-center rounded-lg text-[13px] font-medium transition-colors ${
          compact ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-1.5'
        } ${
          isActive
            ? 'text-white bg-brand-500/15'
            : 'text-white/55 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        <Icon
          className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-brand-400' : 'text-white/40'}`}
        />
        {!compact && (
          <>
            <span className="truncate">{label}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 bg-brand-400" />
            )}
          </>
        )}
      </button>
    )
  }

  return (
    <aside
      className={`flex flex-col min-h-screen flex-shrink-0 transition-[width] duration-200 ${collapsed ? 'w-14' : 'w-[210px]'}`}
      style={{ background: `linear-gradient(180deg, ${colors.sidebarFrom} 0%, ${colors.sidebarTo} 100%)` }}
    >
      <div className={`border-b border-white/10 ${collapsed ? 'px-2 py-3' : 'px-5 py-4'}`}>
        <button
          type="button"
          title={`${BRAND.product}${businessName ? ` · ${brandName}` : ''}`}
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center rounded-lg hover:bg-white/5 transition-colors ${collapsed ? 'justify-center px-1 py-1' : 'gap-2.5 px-1 py-0.5'}`}
        >
          <RinseLogo size={28} title={BRAND.name} />
          {!collapsed && (
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-white font-semibold text-sm tracking-tight truncate">
                {BRAND.product}
              </span>
              <span className="block text-[11px] text-white/45 truncate leading-tight mt-0.5">
                {brandName}
              </span>
            </span>
          )}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto thin-scrollbar py-2 ${collapsed ? 'px-1.5 space-y-0.5' : 'px-3 space-y-3'}`}>
        {collapsed
          ? NAV_SECTIONS.flatMap((s) => s.items).map((item) => navButton(item))
          : NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
                  {section.title}
                </div>
                <div className="space-y-px">
                  {section.items.map((item) => navButton(item))}
                </div>
              </div>
            ))}
      </nav>

      <div className={`${collapsed ? 'px-1.5' : 'px-3'} pb-1`}>
        <button
          type="button"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((v) => !v)}
          className={`w-full flex items-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 py-2 ${collapsed ? 'justify-center' : 'justify-center gap-2 px-3'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={collapsed ? '' : 'rotate-180'}>
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>

      <div className={`border-t border-white/10 py-1.5 space-y-px ${collapsed ? 'px-1.5' : 'px-3'}`}>
        {!collapsed && (
          <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
            Setup
          </div>
        )}
        {BOTTOM_ITEMS.map((item) => navButton(item))}
      </div>

      <div className={`border-t border-white/10 relative ${collapsed ? 'px-1.5 py-2' : 'px-3 py-3'}`}>
        <button
          type="button"
          title={collapsed ? name : undefined}
          onClick={() => setMenuOpen((v) => !v)}
          className={`w-full flex items-center rounded-lg hover:bg-white/5 cursor-pointer transition-colors text-left ${
            collapsed ? 'justify-center px-1 py-1.5' : 'gap-2.5 px-2 py-1.5'
          }`}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${colors.green}, ${colors.teal})`, fontSize: '10px' }}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium leading-tight truncate">{name}</p>
                <p className="text-white/40 text-xs leading-tight">Signed in</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-white/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </>
          )}
        </button>
        {menuOpen && (
          <div className={`absolute bottom-full mb-1 bg-[#0f2418] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 ${collapsed ? 'left-full ml-1 w-40' : 'left-3 right-3'}`}>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              onClick={() => {
                setMenuOpen(false)
                onNavigate('settings')
              }}
            >
              Settings
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              onClick={() => {
                setMenuOpen(false)
                onNavigate('dashboard')
              }}
            >
              Dashboard
            </button>
            <div className="border-t border-white/10" />
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs text-red-300 hover:bg-white/10"
              onClick={() => {
                setMenuOpen(false)
                void signOut()
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export function Header({
  title,
  subtitle,
  actions,
  leading,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Left of title — e.g. hierarchical back control */
  leading?: ReactNode
}) {
  const { clients, jobs, leads, invoices, refresh } = useData()
  const { signOut } = useAuth()
  const { setPage, openContact, openSettings, openInvoice } = useDeskNav()
  const { createContact, createDeal, createEvent, createExpense } = useCreateActions()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  /** Per-item read fingerprints — persisted across sessions */
  const [readMap, setReadMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('desk.notificationRead')
      if (raw) return JSON.parse(raw) as Record<string, string>
      // Migrate one-shot from older session dismissals
      const legacy = sessionStorage.getItem('desk.dismissedNotifications')
      if (legacy) {
        const parsed = JSON.parse(legacy) as Record<string, string>
        localStorage.setItem('desk.notificationRead', legacy)
        sessionStorage.removeItem('desk.dismissedNotifications')
        return parsed
      }
      return {}
    } catch {
      return {}
    }
  })
  /**
   * Fingerprint set present when the badge was last cleared by opening the panel.
   * Badge stays at 0 until the unread set changes (new/updated items).
   * Keeps "seen the badge" distinct from "read this item".
   */
  const [badgeClearedKey, setBadgeClearedKey] = useState(() => {
    try {
      return localStorage.getItem('desk.notificationBadgeCleared') || ''
    } catch {
      return ''
    }
  })
  const name = getDisplayName()
  const initials = getInitials(name)

  useEffect(() => {
    try {
      localStorage.setItem('desk.notificationRead', JSON.stringify(readMap))
    } catch {
      /* ignore */
    }
  }, [readMap])

  useEffect(() => {
    try {
      localStorage.setItem('desk.notificationBadgeCleared', badgeClearedKey)
    } catch {
      /* ignore */
    }
  }, [badgeClearedKey])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return [] as {
      key: string
      kind: string
      title: string
      detail: string
      go: () => void
    }[]
    const hits: {
      key: string
      kind: string
      title: string
      detail: string
      go: () => void
    }[] = []
    for (const c of clients) {
      if (![c.name, c.email, c.phone].some((f) => f?.toLowerCase().includes(q))) continue
      hits.push({
        key: `c-${c.id}`,
        kind: 'Contact',
        title: c.name,
        detail: c.email || c.phone || '',
        go: () => openContact(c.id),
      })
      if (hits.length >= 8) break
    }
    if (hits.length < 8) {
      for (const l of leads) {
        if (![l.name, l.email, l.phone, l.service_interest].some((f) => f?.toLowerCase().includes(q))) {
          continue
        }
        hits.push({
          key: `d-${l.id}`,
          kind: 'Deal',
          title: l.name,
          detail: `${l.stage} · ${l.quote_amount ? `$${l.quote_amount}` : 'no quote'}`,
          go: () => setPage('deals'),
        })
        if (hits.length >= 8) break
      }
    }
    if (hits.length < 8) {
      for (const j of jobs) {
        const clientName = clients.find((c) => c.id === j.client_id)?.name ?? ''
        const hay = [j.notes, j.date, clientName, j.status].join(' ').toLowerCase()
        if (!hay.includes(q)) continue
        hits.push({
          key: `j-${j.id}`,
          kind: 'Job',
          title: j.notes?.trim() || clientName || 'Job',
          detail: `${j.date} · ${j.status}`,
          go: () => setPage('calendar'),
        })
        if (hits.length >= 8) break
      }
    }
    if (hits.length < 8) {
      for (const inv of invoices) {
        const hay = [inv.invoice_number, inv.status, String(inv.total)].join(' ').toLowerCase()
        if (!hay.includes(q)) continue
        hits.push({
          key: `i-${inv.id}`,
          kind: 'Invoice',
          title: inv.invoice_number || 'Invoice',
          detail: `${inv.status} · $${inv.total}`,
          go: () => openInvoice(inv.id),
        })
        if (hits.length >= 8) break
      }
    }
    return hits
  }, [clients, leads, jobs, invoices, search, openContact, openInvoice])

  const allNotifications = useMemo(() => {
    const items: { id: string; fingerprint: string; title: string; detail: string; page: PageId }[] = []
    const attentionInvoices = invoices.filter((inv) => inv.status === 'overdue' || inv.status === 'sent')
    if (attentionInvoices.length > 0) {
      items.push({
        id: 'invoices',
        fingerprint: `invoices:${attentionInvoices.length}`,
        title: `${attentionInvoices.length} invoice${attentionInvoices.length === 1 ? '' : 's'} need attention`,
        detail: 'Open Invoices to review sent / overdue invoices',
        page: 'invoices',
      })
    }
    const scheduledCount = jobs.filter((j) => j.status === 'scheduled').length
    if (scheduledCount > 0) {
      items.push({
        id: 'jobs',
        fingerprint: `jobs:${scheduledCount}`,
        title: `${scheduledCount} scheduled job${scheduledCount === 1 ? '' : 's'}`,
        detail: 'Check Calendar for upcoming work',
        page: 'calendar',
      })
    }
    const openDeals = leads.filter((l) => l.stage !== 'booked').length
    if (openDeals > 0) {
      items.push({
        id: 'deals',
        fingerprint: `deals:${openDeals}`,
        title: `${openDeals} open deal${openDeals === 1 ? '' : 's'} in pipeline`,
        detail: 'Follow up on Inquiry / Quoted leads',
        page: 'deals',
      })
    }
    return items.slice(0, 6)
  }, [invoices, jobs, leads])

  const unreadNotifications = useMemo(
    () => allNotifications.filter((n) => readMap[n.id] !== n.fingerprint),
    [allNotifications, readMap],
  )

  const unreadKey = useMemo(
    () =>
      unreadNotifications
        .map((n) => n.fingerprint)
        .sort()
        .join('|'),
    [unreadNotifications],
  )

  /** Badge counts unseen items; opening the panel clears the badge without marking items read */
  const badgeCount = unreadKey && unreadKey === badgeClearedKey ? 0 : unreadNotifications.length

  function markNotificationRead(id: string, fingerprint: string) {
    setReadMap((prev) => ({ ...prev, [id]: fingerprint }))
  }

  function markAllNotificationsRead() {
    const next: Record<string, string> = { ...readMap }
    for (const n of allNotifications) next[n.id] = n.fingerprint
    setReadMap(next)
    setBadgeClearedKey(
      allNotifications
        .map((n) => n.fingerprint)
        .sort()
        .join('|'),
    )
  }

  function openBell() {
    setMenuOpen(false)
    setAvatarOpen(false)
    setBellOpen((v) => {
      const next = !v
      if (next) setBadgeClearedKey(unreadKey)
      return next
    })
  }

  function closeMenus() {
    setMenuOpen(false)
    setAvatarOpen(false)
    setBellOpen(false)
  }

  return (
    <header className="h-13 flex items-center justify-between px-5 bg-white border-b border-gray-100 flex-shrink-0" style={{ height: 52 }}>
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="flex items-center gap-2.5 relative shrink-0">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts, deals…"
            className="pl-7 pr-3 py-1.5 text-xs w-52 focus:outline-none rounded-full"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
          />
          <svg className="absolute left-2.5 top-2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          {results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs hover:bg-green-50"
                  onClick={() => {
                    setSearch('')
                    r.go()
                  }}
                >
                  <p className="font-medium text-gray-800">{r.title}</p>
                  <p className="text-gray-400">
                    <span className="uppercase tracking-wide text-[10px] text-green-700 mr-1.5">
                      {r.kind}
                    </span>
                    {r.detail}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={openBell}
            className="relative p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            title="Notifications"
            aria-label={
              badgeCount > 0
                ? `Notifications, ${badgeCount} unread`
                : 'Notifications'
            }
            aria-expanded={bellOpen}
            aria-haspopup="true"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {badgeCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: colors.green }}
              >
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-800">Notifications</p>
                <div className="flex items-center gap-2">
                  {unreadNotifications.length > 0 && (
                    <button
                      type="button"
                      className="text-[10px] font-medium text-gray-500 hover:text-gray-800"
                      onClick={() => markAllNotificationsRead()}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-[10px] font-medium text-green-700 hover:underline"
                    onClick={() => {
                      closeMenus()
                      openSettings('notifications')
                    }}
                  >
                    Preferences
                  </button>
                </div>
              </div>
              {allNotifications.length === 0 ? (
                <p className="px-3 py-6 text-xs text-gray-400 text-center">You&apos;re all caught up</p>
              ) : (
                <ul className="max-h-64 overflow-y-auto">
                  {allNotifications.map((n) => {
                    const unread = readMap[n.id] !== n.fingerprint
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-gray-50 last:border-0 flex gap-2.5 ${
                            unread ? 'bg-green-50/40' : ''
                          }`}
                          onClick={() => {
                            markNotificationRead(n.id, n.fingerprint)
                            closeMenus()
                            setPage(n.page)
                          }}
                        >
                          <span
                            className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                              unread ? 'bg-green-500' : 'bg-transparent'
                            }`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <p
                              className={`text-xs ${
                                unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
                              }`}
                            >
                              {n.title}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{n.detail}</p>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          title="Refresh data"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAvatarOpen(false)
              setBellOpen(false)
              setMenuOpen((v) => !v)
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-full transition-opacity hover:opacity-90"
            style={{ background: colors.green }}
          >
            + Create New
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {[
                { label: 'New Contact', fn: () => createContact() },
                { label: 'New Deal', fn: () => createDeal() },
                { label: 'New Event', fn: () => createEvent() },
                { label: 'Log Expense', fn: () => createExpense() },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-green-50"
                  onClick={() => {
                    setMenuOpen(false)
                    void item.fn()
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              setBellOpen(false)
              setAvatarOpen((v) => !v)
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.green}, ${colors.teal})`, fontSize: '10px' }}
          >
            {initials}
          </button>
          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-green-50"
                onClick={() => {
                  setAvatarOpen(false)
                  setPage('settings')
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-green-50"
                onClick={() => {
                  setAvatarOpen(false)
                  void signOut()
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function Shell() {
  const [page, setPage] = useState<PageId>('dashboard')
  const { loading, error } = useData()

  useEffect(() => {
    if (HIDDEN_NAV_PAGES.has(page)) setPage('dashboard')
  }, [page])

  const pages: Record<PageId, ReactNode> = {
    dashboard: <Dashboard />,
    deals: <SalesPipeline />,
    money: <MoneyOverview />,
    invoices: <InvoicesPage />,
    receipts: <ReceiptsPage />,
    cars: <CarsPage />,
    contacts: <Contacts />,
    calendar: <CalendarPage />,
    routes: <RoutesPage />,
    activities: <ActivitiesPage />,
    campaigns: <CampaignsPage />,
    forms: <FormsPage />,
    automations: <AutomationsPage />,
    chat: <ChatPage />,
    ai: <AiAssistPage />,
    settings: <SettingsPage />,
    help: <HelpPage />,
  }
  return (
    <DeskNavProvider page={page} setPage={setPage}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar active={page} onNavigate={setPage} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {error && <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg shadow">{error}</div>}
          {loading && <div className="absolute top-14 right-4 z-50 text-xs bg-white text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg shadow">Syncing…</div>}
          {pages[page]}
        </div>
      </div>
    </DeskNavProvider>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: `linear-gradient(160deg, ${colors.sidebarFrom} 0%, ${colors.sidebarTo} 100%)` }}
      >
        <RinseLogo size={48} />
        <p className="text-sm text-white/50">{BRAND.product}</p>
      </div>
    )
  }
  if (!user) return <LoginPage />
  return (
    <UiProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </UiProvider>
  )
}

export default function App() {
  return <AuthProvider><Gate /></AuthProvider>
}
