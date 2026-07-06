'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import AdminAccountPanel from '@/components/admin/AdminAccountPanel'
import {
  downloadFullBackup,
  fetchAdminEvents,
  fetchAdminOrgs,
  fetchBackupPreflight,
  fetchSignupMetrics,
  patchAdminOrg,
  type AdminOrg,
  type AdminOrgSummary,
  type AdminView,
  type PlatformEventDto,
} from '@/lib/admin-api'
import { getCurrentUserEmail, getPocketBaseAuthToken } from '@/lib/pb-auth'
import { checkPocketBaseHealth } from '@/lib/pocketbase'
import type { SubscriptionStatus } from '@/lib/subscription'
import { truncateMiddle } from '@/lib/truncate'
import { parseAdminViewParam } from '@/lib/route-lanes'
import { formatPlatformEventLabel, formatPlatformEventTime } from '@/lib/platform-event-labels'
import { ScreenLoading } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'

type OrgStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'

const VIEW_LABELS: Record<AdminView, string> = {
  overview: 'Overview',
  orgs: 'Organizations',
  backups: 'Backups',
  system: 'System',
  audit: 'Audit log',
  account: 'Account',
}

const STATUS_LABELS: Record<OrgStatus, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past due',
  canceled: 'Canceled',
  none: 'None',
}

const PREFLIGHT_KEYS = ['organizations', 'clients', 'jobs', 'invoices', 'quotes'] as const

function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatPlanLabel(plan: string): string {
  if (!plan) return '—'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function toOrgStatus(status: SubscriptionStatus): OrgStatus {
  if (status === 'active' || status === 'trialing' || status === 'past_due' || status === 'canceled' || status === 'none') {
    return status
  }
  return 'none'
}

function userInitials(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return local.slice(0, 2).toUpperCase() || '?'
}

function userDisplayName(email: string): string {
  const local = email.split('@')[0] ?? email
  const first = local.split(/[._-]+/)[0] ?? local
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function SignupSparkline({ series }: { series: { date: string; count: number }[] }) {
  if (!series.length) return null
  const width = 320
  const height = 56
  const max = Math.max(...series.map((point) => point.count), 1)
  const points = series
    .map((point, index) => {
      const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width
      const y = height - 6 - (point.count / max) * (height - 12)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="signup-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Signups over the last 30 days">
      <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconOverview() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function IconOrgs() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 21V7a1 1 0 0 1 1-1h6v15" />
      <path d="M14 21V11a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v10" />
      <path d="M8 9h0M8 12h0M8 15h0M8 18h0" />
    </svg>
  )
}

function IconBackups() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  )
}

function IconSystem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6z" />
    </svg>
  )
}

function IconAudit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  )
}

function IconAccount() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" />
    </svg>
  )
}

function IconExternal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </svg>
  )
}

function IconDocs() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg className="icon-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  )
}

function StatusBadge({ status }: { status: OrgStatus }) {
  return (
    <span className={`badge ${status}`}>
      <span className="bdot" />
      {STATUS_LABELS[status]}
    </span>
  )
}

function NavItem({
  view,
  activeView,
  onSelect,
  icon,
  label,
}: {
  view: AdminView
  activeView: AdminView
  onSelect: (view: AdminView) => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      className={`admin-nav-item${activeView === view ? ' active' : ''}`}
      onClick={() => onSelect(view)}
    >
      {icon}
      <span className="nav-label">{label}</span>
    </button>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuth()
  const initialView = parseAdminViewParam(searchParams.get('view')) ?? 'overview'
  const [activeView, setActiveView] = useState<AdminView>(initialView)
  const [orgs, setOrgs] = useState<AdminOrg[]>([])
  const [summary, setSummary] = useState<AdminOrgSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrgStatus>('all')
  const [planFilter, setPlanFilter] = useState<'all' | string>('all')
  const [bookingFilter, setBookingFilter] = useState<'all' | 'on' | 'off'>('all')
  const [cliOpen, setCliOpen] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [backupCounts, setBackupCounts] = useState<Record<string, number> | null>(null)
  const [backupPreflightLoading, setBackupPreflightLoading] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [pbOnline, setPbOnline] = useState<boolean | null>(null)
  const [patchingId, setPatchingId] = useState<string | null>(null)
  const [trialDraft, setTrialDraft] = useState('')
  const [signupSeries, setSignupSeries] = useState<{ date: string; count: number }[]>([])
  const [signupTotal, setSignupTotal] = useState(0)
  const [signupLoading, setSignupLoading] = useState(false)
  const [auditEvents, setAuditEvents] = useState<PlatformEventDto[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [orgActivity, setOrgActivity] = useState<PlatformEventDto[]>([])
  const [orgActivityLoading, setOrgActivityLoading] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const orgsLoadedRef = useRef(false)

  const userEmail = getCurrentUserEmail() ?? 'admin'
  const pbAdminUrl = process.env.NEXT_PUBLIC_PB_URL ? `${process.env.NEXT_PUBLIC_PB_URL.replace(/\/$/, '')}/_/` : null
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname)

  const selectedOrg = useMemo(
    () => orgs.find((org) => org.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId],
  )

  const recomputeSummary = useCallback((list: AdminOrg[]): AdminOrgSummary => ({
    total: list.length,
    active: list.filter((o) => o.subscription_status === 'active').length,
    trialing: list.filter((o) => o.subscription_status === 'trialing').length,
    past_due: list.filter((o) => o.subscription_status === 'past_due').length,
    founding: list.filter((o) => o.founding_member || o.plan === 'founding').length,
  }), [])

  const loadOrgs = useCallback(async () => {
    const token = getPocketBaseAuthToken()
    if (!token) {
      router.replace('/auth/admin')
      return
    }
    if (!orgsLoadedRef.current) setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminOrgs()
      setOrgs(data.orgs)
      setSummary(data.summary)
      orgsLoadedRef.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadOrgs()
  }, [loadOrgs])

  useEffect(() => {
    if (activeView !== 'overview') return
    let cancelled = false
    setSignupLoading(true)
    void (async () => {
      try {
        const metrics = await fetchSignupMetrics(30)
        if (!cancelled) {
          setSignupSeries(metrics.series)
          setSignupTotal(metrics.total)
        }
      } catch {
        if (!cancelled) {
          setSignupSeries([])
          setSignupTotal(0)
        }
      } finally {
        if (!cancelled) setSignupLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeView])

  useEffect(() => {
    if (activeView !== 'audit') return
    let cancelled = false
    setAuditLoading(true)
    void (async () => {
      try {
        const events = await fetchAdminEvents({ limit: 100 })
        if (!cancelled) setAuditEvents(events)
      } catch {
        if (!cancelled) setAuditEvents([])
      } finally {
        if (!cancelled) setAuditLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeView])

  useEffect(() => {
    if (!drawerOpen || !selectedOrgId) {
      setOrgActivity([])
      return
    }
    let cancelled = false
    setOrgActivityLoading(true)
    void (async () => {
      try {
        const events = await fetchAdminEvents({ organizationId: selectedOrgId, limit: 20 })
        if (!cancelled) setOrgActivity(events)
      } catch {
        if (!cancelled) setOrgActivity([])
      } finally {
        if (!cancelled) setOrgActivityLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [drawerOpen, selectedOrgId])

  useEffect(() => {
    if (!profileMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [profileMenuOpen])

  useEffect(() => {
    if (activeView !== 'backups' && activeView !== 'overview') return
    let cancelled = false
    setBackupPreflightLoading(true)
    void (async () => {
      try {
        const data = await fetchBackupPreflight()
        if (!cancelled) setBackupCounts(data.counts)
      } catch {
        if (!cancelled) setBackupCounts(null)
      } finally {
        if (!cancelled) setBackupPreflightLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeView])

  useEffect(() => {
    if (activeView !== 'system') return
    let cancelled = false
    void (async () => {
      const ok = await checkPocketBaseHealth()
      if (!cancelled) setPbOnline(ok)
    })()
    return () => {
      cancelled = true
    }
  }, [activeView])

  useEffect(() => {
    if (selectedOrg?.trial_ends_at) {
      setTrialDraft(selectedOrg.trial_ends_at.slice(0, 10))
    } else {
      setTrialDraft('')
    }
  }, [selectedOrg?.id, selectedOrg?.trial_ends_at])

  const filteredOrgs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return orgs.filter((org) => {
      if (q && !org.name.toLowerCase().includes(q) && !org.slug.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && toOrgStatus(org.subscription_status) !== statusFilter) return false
      if (planFilter !== 'all' && org.plan !== planFilter) return false
      if (bookingFilter === 'on' && !org.booking_enabled) return false
      if (bookingFilter === 'off' && org.booking_enabled) return false
      return true
    })
  }, [orgs, searchQuery, statusFilter, planFilter, bookingFilter])

  const planOptions = useMemo(() => {
    const plans = new Set(orgs.map((o) => o.plan).filter(Boolean))
    return Array.from(plans).sort()
  }, [orgs])

  const switchView = useCallback(
    (view: AdminView) => {
      setActiveView(view)
      const params = new URLSearchParams()
      if (view !== 'overview') params.set('view', view)
      const qs = params.toString()
      router.replace(qs ? `/admin?${qs}` : '/admin')
    },
    [router],
  )

  useEffect(() => {
    const view = parseAdminViewParam(searchParams.get('view')) ?? 'overview'
    setActiveView(view)
  }, [searchParams])

  const openDrawer = useCallback((org: AdminOrg) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    setSelectedOrgId(org.id)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    lastFocusedRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    drawerCloseRef.current?.focus()
    sidebarRef.current?.setAttribute('inert', '')
    mainRef.current?.setAttribute('inert', '')
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      sidebarRef.current?.removeAttribute('inert')
      mainRef.current?.removeAttribute('inert')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [drawerOpen, closeDrawer])

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
    window.setTimeout(() => setToastVisible(false), 2600)
  }

  const updateOrg = useCallback(
    async (id: string, patch: Parameters<typeof patchAdminOrg>[1]) => {
      setPatchingId(id)
      try {
        const updated = await patchAdminOrg(id, patch)
        setOrgs((current) => {
          const next = current.map((org) => (org.id === id ? updated : org))
          setSummary(recomputeSummary(next))
          return next
        })
        showToast('Organization updated')
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Update failed')
        return null
      } finally {
        setPatchingId(null)
      }
    },
    [recomputeSummary],
  )

  const toggleBooking = useCallback(
    async (org: AdminOrg, e?: React.MouseEvent) => {
      e?.stopPropagation()
      await updateOrg(org.id, { booking_enabled: !org.booking_enabled })
    },
    [updateOrg],
  )

  const runBackup = async () => {
    setBackupLoading(true)
    setBackupStatus('Preparing export…')
    try {
      const { filename, blob } = await downloadFullBackup()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      const now = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
      setLastBackupAt(now)
      setBackupStatus(`Last exported ${now}.`)
      showToast('Backup downloaded')
    } catch (err) {
      setBackupStatus(err instanceof Error ? err.message : 'Backup failed')
    } finally {
      setBackupLoading(false)
    }
  }

  const copyBookingLink = async (slug: string) => {
    const url = `${appOrigin}/book/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Booking link copied')
    } catch {
      showToast('Could not copy link')
    }
  }

  if (loading) {
    return <ScreenLoading body variant="settings" />
  }

  if (error) {
    return (
      <div className="admin-root">
        <div className="admin-canvas-inner" style={{ padding: 32 }}>
          <div className="admin-page-title">Platform admin</div>
          <p className="settings-msg settings-msg--error" role="alert">
            {error}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
            Access requires a signed-in account on the platform admin allowlist.
          </p>
          <button type="button" className="btn" style={{ display: 'inline-flex', marginTop: 16 }} onClick={() => router.replace('/auth/admin')}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  const s = summary ?? recomputeSummary(orgs)
  const activePct = s.total ? Math.round((s.active / s.total) * 100) : 0

  return (
    <div className="admin-root">
      <aside className="admin-sidebar" ref={sidebarRef}>
        <div className="admin-brand">
          <div className="dot" />
          <div>
            <div className="admin-brand-text">Rinse HQ</div>
            <div className="admin-brand-sub">Platform console</div>
          </div>
        </div>

        <div className="admin-nav-group-label">Console</div>
        <div className="admin-nav">
          <NavItem view="overview" activeView={activeView} onSelect={switchView} icon={<IconOverview />} label="Overview" />
          <NavItem view="orgs" activeView={activeView} onSelect={switchView} icon={<IconOrgs />} label="Organizations" />
          <NavItem view="backups" activeView={activeView} onSelect={switchView} icon={<IconBackups />} label="Backups" />
          <NavItem view="system" activeView={activeView} onSelect={switchView} icon={<IconSystem />} label="System" />
          <NavItem view="audit" activeView={activeView} onSelect={switchView} icon={<IconAudit />} label="Audit log" />
          <NavItem view="account" activeView={activeView} onSelect={switchView} icon={<IconAccount />} label="Account" />
        </div>
      </aside>

      <main className="admin-main" ref={mainRef}>
        <div className="admin-topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              <span>Console</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{VIEW_LABELS[activeView]}</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="env-pill">
              <span className="bdot" />
              <span>{isLocalhost ? 'Local' : 'Production'}</span>
            </div>
            <div className="topbar-divider" />
            <div className="topbar-user-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className={`topbar-user${profileMenuOpen ? ' open' : ''}`}
                aria-label={`Signed in as ${userEmail}`}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <div className="topbar-avatar">{userInitials(userEmail)}</div>
                <span className="topbar-user-name">{userDisplayName(userEmail)}</span>
                <IconChevronDown />
              </button>
              {profileMenuOpen ? (
                <div className="topbar-user-menu" role="menu" aria-label="Account menu">
                  <div className="topbar-user-menu-head">
                    <div className="topbar-user-menu-name">{userDisplayName(userEmail)}</div>
                    <div className="topbar-user-menu-email">{userEmail}</div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-user-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      switchView('account')
                    }}
                  >
                    Account settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="topbar-user-menu-item danger"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      void logout({ lane: 'admin' })
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="admin-canvas-inner">
          <section className={`admin-view${activeView === 'overview' ? ' active' : ''}`}>
            <div className="admin-page-header">
              <div className="admin-page-title">Overview</div>
              <div className="admin-page-desc">
                {s.total} organization{s.total === 1 ? '' : 's'} across founding, starter, and pro plans.
              </div>
            </div>

            <div className="kpi-grid">
              <div className="admin-card kpi-card">
                <div className="kpi-label">Total orgs</div>
                <div className="kpi-value">{s.total}</div>
              </div>
              <div className="admin-card kpi-card">
                <div className="kpi-label">Active</div>
                <div className="kpi-value accent">{s.active}</div>
                <div className="kpi-sub">{activePct}% of total</div>
              </div>
              <div className="admin-card kpi-card">
                <div className="kpi-label">Trialing</div>
                <div className="kpi-value">{s.trialing}</div>
              </div>
              <div className="admin-card kpi-card">
                <div className="kpi-label">Past due</div>
                <div className="kpi-value warn">{s.past_due}</div>
                <div className="kpi-sub">{s.past_due ? 'needs follow-up' : 'all clear'}</div>
              </div>
              <div className="admin-card kpi-card">
                <div className="kpi-label">Founding members</div>
                <div className="kpi-value">{s.founding}</div>
              </div>
            </div>

            <div className="quick-actions">
              <button type="button" className="btn primary" onClick={() => void runBackup()} disabled={backupLoading}>
                <IconDownload />
                Download full backup
              </button>
              {pbAdminUrl ? (
                <a href={pbAdminUrl} target="_blank" rel="noopener noreferrer" className="btn">
                  <IconExternal />
                  Open PocketBase admin
                </a>
              ) : null}
            </div>

            <div className="row-2">
              <div className="admin-card sparkline-card">
                <div className="sparkline-head">
                  <div className="sparkline-title">Signups, last 30 days</div>
                  <div className="sparkline-badge">{signupTotal} total</div>
                </div>
                {signupLoading ? (
                  <div className="kpi-sub">Loading signup trend…</div>
                ) : signupSeries.some((point) => point.count > 0) ? (
                  <>
                    <SignupSparkline series={signupSeries} />
                    <div className="kpi-sub">New organizations per day from platform events.</div>
                  </>
                ) : (
                  <div className="kpi-sub">No signups in this window yet.</div>
                )}
              </div>
              <div className="admin-card backup-mini">
                <div className="sparkline-title">Last backup</div>
                <div className="backup-mini-row">
                  <span>Status</span>
                  <b style={{ color: lastBackupAt ? 'var(--green-text)' : 'var(--text-muted)' }}>
                    {lastBackupAt ? 'Succeeded' : 'Not run this session'}
                  </b>
                </div>
                {lastBackupAt ? (
                  <div className="backup-mini-row">
                    <span>Ran</span>
                    <b>{lastBackupAt}</b>
                  </div>
                ) : null}
                <button type="button" className="btn small" style={{ marginTop: 4 }} onClick={() => switchView('backups')}>
                  View backup panel
                </button>
              </div>
            </div>
          </section>

          <section className={`admin-view${activeView === 'orgs' ? ' active' : ''}`}>
            <div className="admin-page-header">
              <div className="admin-page-title">Organizations</div>
              <div className="admin-page-desc">Every tenant on Rinse. Click a row to open support actions.</div>
            </div>

            <div className="admin-card">
              <div style={{ padding: 16 }}>
                <div className="table-toolbar">
                  <div className="toolbar-left">
                    <label className="search-input">
                      <IconSearch />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search business or slug…"
                        aria-label="Search organizations"
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', font: 'inherit' }}
                      />
                    </label>
                    <select
                      className="filter-chip"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | OrgStatus)}
                      aria-label="Filter by status"
                    >
                      <option value="all">Status: All</option>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="filter-chip"
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      aria-label="Filter by plan"
                    >
                      <option value="all">Plan: All</option>
                      {planOptions.map((plan) => (
                        <option key={plan} value={plan}>
                          {formatPlanLabel(plan)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="filter-chip"
                      value={bookingFilter}
                      onChange={(e) => setBookingFilter(e.target.value as 'all' | 'on' | 'off')}
                      aria-label="Filter by booking"
                    >
                      <option value="all">Booking: All</option>
                      <option value="on">Booking: On</option>
                      <option value="off">Booking: Off</option>
                    </select>
                  </div>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Trial ends</th>
                      <th>Booking</th>
                      <th>Created</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrgs.map((org) => {
                      const status = toOrgStatus(org.subscription_status)
                      const isPatching = patchingId === org.id
                      return (
                        <tr key={org.id} onClick={() => openDrawer(org)}>
                          <td>
                            <div className="biz-name">
                              {org.founding_member || org.plan === 'founding' ? <span className="star">★</span> : null}
                              {org.name}
                            </div>
                            <div className="biz-slug">/{org.slug}</div>
                          </td>
                          <td>
                            <span className="plan-pill">{formatPlanLabel(org.plan)}</span>
                          </td>
                          <td>
                            <StatusBadge status={status} />
                          </td>
                          <td>{formatAdminDate(org.trial_ends_at)}</td>
                          <td>
                            <button
                              type="button"
                              className={`toggle ${org.booking_enabled ? 'on' : 'off'}`}
                              disabled={isPatching}
                              onClick={(e) => void toggleBooking(org, e)}
                              aria-label={`Booking ${org.booking_enabled ? 'enabled' : 'disabled'} for ${org.name}`}
                              aria-pressed={org.booking_enabled}
                            >
                              <span className="knob" />
                            </button>
                          </td>
                          <td>{formatAdminDate(org.created)}</td>
                          <td>
                            <button
                              type="button"
                              className="row-actions-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDrawer(org)
                              }}
                              aria-label={`Open ${org.name}`}
                            >
                              ⋯
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="table-footer">
                  <span>
                    Showing {filteredOrgs.length} of {orgs.length}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className={`admin-view${activeView === 'backups' ? ' active' : ''}`}>
            <div className="admin-page-header">
              <div className="admin-page-title">Backups &amp; disaster recovery</div>
              <div className="admin-page-desc">
                Full export of every tenant&apos;s data, for disaster recovery only.
              </div>
            </div>

            <div className="backup-grid">
              <div className="admin-card" style={{ padding: 18 }}>
                <div className="drawer-section-label">Pre-flight — collection counts</div>
                {backupPreflightLoading ? (
                  <div className="kpi-sub">Loading counts…</div>
                ) : backupCounts ? (
                  PREFLIGHT_KEYS.map((key) => (
                    <div className="preflight-item" key={key}>
                      <span>{formatPlanLabel(key)}</span>
                      <b>{backupCounts[key] ?? 0}</b>
                    </div>
                  ))
                ) : (
                  <div className="kpi-sub">Could not load pre-flight counts.</div>
                )}
              </div>
              <div className="admin-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="drawer-section-label">Export</div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                    Downloads a single JSON file with every tenant&apos;s data, authenticated with your admin session.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn primary"
                  disabled={backupLoading}
                  onClick={() => void runBackup()}
                  style={{ justifyContent: 'center' }}
                >
                  {backupLoading ? <IconSpinner /> : <IconDownload />}
                  <span>{backupLoading ? 'Preparing export…' : 'Download full backup'}</span>
                </button>
                <div className="backup-status-text" aria-live="polite">
                  {backupStatus}
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ padding: 18 }}>
              <button type="button" className="cli-collapse-btn" onClick={() => setCliOpen((v) => !v)}>
                Prefer the CLI? Show command {cliOpen ? '▴' : '▾'}
              </button>
              {cliOpen ? (
                <div className="cli-block">
                  curl -X POST {appOrigin || 'https://rinsehq.com'}/api/admin/backups/trigger \
                  <br />
                  &nbsp;&nbsp;-H &quot;Authorization: Bearer $INTERNAL_API_SECRET&quot; \
                  <br />
                  &nbsp;&nbsp;-o rinse-backup-$(date +%F).json
                </div>
              ) : null}
            </div>
          </section>

          <section className={`admin-view${activeView === 'system' ? ' active' : ''}`}>
            <div className="admin-page-header">
              <div className="admin-page-title">System health</div>
              <div className="admin-page-desc">What we can verify from here — the rest lives in Vercel and Stripe.</div>
            </div>

            <div className="health-grid">
              <div className="admin-card health-card">
                <div className="kpi-label">Database</div>
                <div className="health-status-row">
                  <span className={`health-dot ${pbOnline ? 'ok' : pbOnline === false ? 'warn' : ''}`} />
                  <span className="health-name">
                    PocketBase — {pbOnline === null ? 'Checking…' : pbOnline ? 'Online' : 'Unreachable'}
                  </span>
                </div>
              </div>
              <div className="admin-card health-card">
                <div className="kpi-label">Payments</div>
                <div className="health-status-row">
                  <span className="health-dot warn" />
                  <span className="health-name">Stripe webhooks — Configure in Vercel</span>
                </div>
              </div>
              <div className="admin-card health-card">
                <div className="kpi-label">Rate limiting</div>
                <div className="health-status-row">
                  <span className="health-dot warn" />
                  <span className="health-name">Upstash — Optional</span>
                </div>
                <div className="health-note">
                  See <span className="mono">docs/PRODUCTION.md</span>.
                </div>
              </div>
            </div>
          </section>

          <section className={`admin-view${activeView === 'audit' ? ' active' : ''}`}>
            <div className="admin-page-header">
              <div className="admin-page-title">Audit log</div>
              <div className="admin-page-desc">
                Platform events stored in PocketBase. Security events also stream to Vercel Functions logs.
              </div>
            </div>

            <div className="admin-card">
              <div style={{ padding: 0, overflowX: 'auto' }}>
                {auditLoading ? (
                  <div className="empty-state" style={{ margin: 16 }}>
                    Loading events…
                  </div>
                ) : auditEvents.length === 0 ? (
                  <div className="empty-state" style={{ margin: 16 }}>
                    No events yet. New signups, admin actions, and billing updates will appear here.
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Actor</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEvents.map((event) => (
                        <tr key={event.id}>
                          <td>{formatPlatformEventTime(event.created)}</td>
                          <td>{formatPlatformEventLabel(event.type)}</td>
                          <td>{event.actor_email ?? '—'}</td>
                          <td>{event.detail ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>

          <section className={`admin-view${activeView === 'account' ? ' active' : ''}`}>
            <AdminAccountPanel />
          </section>
        </div>
      </main>

      {selectedOrg ? (
        <div
          className={`drawer-overlay${drawerOpen ? ' open' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDrawer()
          }}
          role="presentation"
        >
          <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-org-title">
            <div className="drawer-header">
              <div>
                <div className="admin-page-title" style={{ fontSize: 19 }} id="drawer-org-title">
                  {selectedOrg.name}
                </div>
                <div className="biz-slug" style={{ marginTop: 4 }}>
                  /{selectedOrg.slug} · created {formatAdminDate(selectedOrg.created)}
                </div>
              </div>
              <button
                type="button"
                className="drawer-close"
                ref={drawerCloseRef}
                onClick={closeDrawer}
                aria-label="Close organization details"
              >
                ✕
              </button>
            </div>
            <div className="drawer-body">
              <div>
                <div className="drawer-section-label">Booking link</div>
                <div className="link-chip">
                  {appOrigin.replace(/^https?:\/\//, '')}/book/{selectedOrg.slug}
                  <button
                    type="button"
                    className="row-actions-btn"
                    title="Copy"
                    aria-label="Copy booking link"
                    onClick={() => void copyBookingLink(selectedOrg.slug)}
                  >
                    <IconCopy />
                  </button>
                </div>
              </div>

              <div>
                <div className="drawer-section-label">Subscription</div>
                <div className="admin-card drawer-card">
                  <div className="kv-row">
                    <span className="kv-label">Plan</span>
                    <select
                      className="filter-chip"
                      value={selectedOrg.plan}
                      disabled={patchingId === selectedOrg.id}
                      onChange={(e) => {
                        const plan = e.target.value as 'founding' | 'starter' | 'pro'
                        void updateOrg(selectedOrg.id, { plan })
                      }}
                    >
                      <option value="founding">Founding</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Status</span>
                    <StatusBadge status={toOrgStatus(selectedOrg.subscription_status)} />
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Trial ends</span>
                    <span className="kv-value">{formatAdminDate(selectedOrg.trial_ends_at)}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Current period ends</span>
                    <span className="kv-value">{formatAdminDate(selectedOrg.current_period_end)}</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Stripe customer</span>
                    <span className="mono kv-value">
                      {selectedOrg.stripe_customer_id
                        ? truncateMiddle(selectedOrg.stripe_customer_id, 8, 4)
                        : '—'}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Stripe subscription</span>
                    <span className="mono kv-value">
                      {selectedOrg.stripe_subscription_id
                        ? truncateMiddle(selectedOrg.stripe_subscription_id, 8, 4)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="drawer-section-label">Support actions</div>
                <div className="admin-card drawer-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>Booking enabled</span>
                    <button
                      type="button"
                      className={`toggle ${selectedOrg.booking_enabled ? 'on' : 'off'}`}
                      disabled={patchingId === selectedOrg.id}
                      aria-pressed={selectedOrg.booking_enabled}
                      onClick={() => void toggleBooking(selectedOrg)}
                    >
                      <span className="knob" />
                    </button>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    Extend trial
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="date"
                        value={trialDraft}
                        onChange={(e) => setTrialDraft(e.target.value)}
                        className="filter-chip"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn small"
                        disabled={!trialDraft || patchingId === selectedOrg.id}
                        onClick={() => void updateOrg(selectedOrg.id, { trial_ends_at: trialDraft })}
                      >
                        Save
                      </button>
                    </div>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    Force subscription status
                    <select
                      className="filter-chip"
                      value={toOrgStatus(selectedOrg.subscription_status)}
                      disabled={patchingId === selectedOrg.id}
                      onChange={(e) =>
                        void updateOrg(selectedOrg.id, {
                          subscription_status: e.target.value as SubscriptionStatus,
                        })
                      }
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <div className="drawer-section-label">Activity</div>
                <div className="admin-card drawer-card">
                  {orgActivityLoading ? (
                    <div className="kpi-sub">Loading activity…</div>
                  ) : orgActivity.length === 0 ? (
                    <div className="empty-state" style={{ padding: '12px 0', border: 'none' }}>
                      No platform events for this org yet.
                    </div>
                  ) : (
                    orgActivity.map((event) => (
                      <div key={event.id} className="kv-row">
                        <span className="kv-label">{formatPlatformEventTime(event.created)}</span>
                        <span className="kv-value" style={{ textAlign: 'right', maxWidth: '58%' }}>
                          {formatPlatformEventLabel(event.type)}
                          {event.detail ? ` · ${event.detail}` : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="danger-zone">
                <div className="danger-zone-title">Danger zone</div>
                <div className="danger-zone-desc">These affect the tenant immediately.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn danger small"
                    disabled={!selectedOrg.booking_enabled || patchingId === selectedOrg.id}
                    onClick={() => void updateOrg(selectedOrg.id, { booking_enabled: false })}
                  >
                    Disable booking
                  </button>
                  <button
                    type="button"
                    className="btn danger small"
                    disabled={patchingId === selectedOrg.id}
                    onClick={() => {
                      if (window.confirm(`Cancel subscription for ${selectedOrg.name}?`)) {
                        void updateOrg(selectedOrg.id, { subscription_status: 'canceled' })
                      }
                    }}
                  >
                    Cancel subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`toast${toastVisible ? ' show' : ''}`} role="status" aria-live="polite">
        <span className="dot-ok" />
        <span>{toastMessage}</span>
      </div>
    </div>
  )
}
