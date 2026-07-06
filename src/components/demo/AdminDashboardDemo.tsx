'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type AdminView = 'overview' | 'orgs' | 'backups' | 'system' | 'audit'

type OrgStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'

interface DemoOrg {
  name: string
  slug: string
  plan: string
  status: OrgStatus
  trial: string
  booking: boolean
  created: string
  founding: boolean
}

const DEMO_ORGS: DemoOrg[] = [
  { name: 'Summit Detail', slug: 'summit-detail', plan: 'Pro', status: 'active', trial: '—', booking: true, created: 'Jan 14, 2026', founding: false },
  { name: 'Atlas Mobile Detailing', slug: 'atlas-detailing', plan: 'Starter', status: 'trialing', trial: 'Aug 12, 2026', booking: true, created: 'Jun 2, 2026', founding: false },
  { name: 'Bay Shine Co', slug: 'bay-shine', plan: 'Starter', status: 'past_due', trial: '—', booking: false, created: 'Mar 21, 2026', founding: false },
  { name: "Danny's Rinse Demo", slug: 'danny-demo', plan: 'Founding', status: 'active', trial: '—', booking: true, created: 'Feb 1, 2026', founding: true },
  { name: 'Clearcoat Mobile', slug: 'clearcoat-mobile', plan: 'Pro', status: 'active', trial: '—', booking: true, created: 'Apr 9, 2026', founding: false },
  { name: 'Peachtree Auto Spa', slug: 'peachtree-auto-spa', plan: 'Starter', status: 'trialing', trial: 'Jul 22, 2026', booking: true, created: 'Jun 28, 2026', founding: false },
  { name: 'Lowcountry Detail', slug: 'lowcountry-detail', plan: 'Starter', status: 'canceled', trial: '—', booking: false, created: 'Nov 3, 2025', founding: false },
  { name: 'Shineline Detailing', slug: 'shineline', plan: 'Founding', status: 'active', trial: '—', booking: true, created: 'Jan 30, 2026', founding: true },
]

const VIEW_LABELS: Record<AdminView, string> = {
  overview: 'Overview',
  orgs: 'Organizations',
  backups: 'Backups',
  system: 'System',
  audit: 'Audit log',
}

const STATUS_LABELS: Record<OrgStatus, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past due',
  canceled: 'Canceled',
  none: 'None',
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

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

export default function AdminDashboardDemo() {
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<DemoOrg>(DEMO_ORGS[0])
  const [cliOpen, setCliOpen] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  const switchView = useCallback((view: AdminView) => {
    setActiveView(view)
  }, [])

  const openDrawer = useCallback((org: DemoOrg) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    setSelectedOrg(org)
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

  const runBackup = () => {
    setBackupLoading(true)
    setBackupStatus('Preparing export…')
    window.setTimeout(() => {
      setBackupLoading(false)
      setBackupStatus('Last exported just now.')
      setToastVisible(true)
      window.setTimeout(() => setToastVisible(false), 2600)
    }, 1400)
  }

  return (
    <div className="demo-admin-dashboard">
      <div className="demo-admin-dashboard__banner">
        <Link href="/demo">← Demo index</Link>
        <span>Platform admin dashboard — static mock (design QA)</span>
        <span className="demo-admin-dashboard__banner-tag">Not wired to APIs</span>
      </div>

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
          </div>

          <div className="admin-sidebar-footer">Rinse HQ console · v1.0</div>
        </aside>

        <main className="admin-main" ref={mainRef}>
          <div className="admin-topbar">
            <div className="topbar-left">
              <div className="breadcrumb">
                <span>Console</span>
                <span className="crumb-sep">/</span>
                <span className="crumb-current">{VIEW_LABELS[activeView]}</span>
              </div>
              <div className="topbar-search">
                <IconSearch />
                <input type="text" placeholder="Jump to an org, invoice, or setting…" readOnly />
                <span className="kbd-hint">⌘K</span>
              </div>
            </div>
            <div className="topbar-right">
              <div className="env-pill">
                <span className="bdot" />
                <span>Production</span>
              </div>
              <button type="button" className="icon-btn" title="Documentation" aria-label="Open documentation">
                <IconDocs />
              </button>
              <button type="button" className="icon-btn" title="Notifications" aria-label="View notifications, 1 unread">
                <IconBell />
                <span className="ping" />
              </button>
              <div className="topbar-divider" />
              <button type="button" className="topbar-user">
                <div className="topbar-avatar">DS</div>
                <span className="topbar-user-name">Danny</span>
                <IconChevronDown />
              </button>
            </div>
          </div>

          <div className="admin-canvas-inner">
            <section className={`admin-view${activeView === 'overview' ? ' active' : ''}`} id="view-overview">
              <div className="admin-page-header">
                <div className="admin-page-title">Overview</div>
                <div className="admin-page-desc">
                  47 organizations across founding, starter, and pro plans. Booking and billing status at a glance.
                </div>
              </div>

              <div className="kpi-grid">
                <div className="admin-card kpi-card">
                  <div className="kpi-label">Total orgs</div>
                  <div className="kpi-value">47</div>
                  <div className="kpi-sub">+3 this week</div>
                </div>
                <div className="admin-card kpi-card">
                  <div className="kpi-label">Active</div>
                  <div className="kpi-value accent">31</div>
                  <div className="kpi-sub">66% of total</div>
                </div>
                <div className="admin-card kpi-card">
                  <div className="kpi-label">Trialing</div>
                  <div className="kpi-value">9</div>
                  <div className="kpi-sub">converts in ~11 days avg</div>
                </div>
                <div className="admin-card kpi-card">
                  <div className="kpi-label">Past due</div>
                  <div className="kpi-value warn">3</div>
                  <div className="kpi-sub">needs follow-up</div>
                </div>
                <div className="admin-card kpi-card">
                  <div className="kpi-label">Founding members</div>
                  <div className="kpi-value">4</div>
                  <div className="kpi-sub">of 20 cap</div>
                </div>
              </div>

              <div className="quick-actions">
                <button type="button" className="btn primary" onClick={() => switchView('backups')}>
                  <IconDownload />
                  Download full backup
                </button>
                <button type="button" className="btn">
                  <IconExternal />
                  Open PocketBase admin
                </button>
                <button type="button" className="btn">
                  <IconDocs />
                  View docs
                </button>
              </div>

              <div className="row-2">
                <div className="admin-card sparkline-card">
                  <div className="sparkline-head">
                    <div className="sparkline-title">Signups, last 30 days</div>
                    <div className="sparkline-badge">Coming soon</div>
                  </div>
                  <svg viewBox="0 0 400 100" width="100%" height="100" style={{ marginTop: 10 }} aria-hidden>
                    <polyline
                      fill="none"
                      stroke="#d4d4d8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      points="0,80 30,75 60,70 90,68 120,60 150,62 180,50 210,48 240,40 270,42 300,30 330,25 360,20 400,15"
                    />
                  </svg>
                  <div className="kpi-sub">Wired once analytics event stream ships.</div>
                </div>
                <div className="admin-card backup-mini">
                  <div className="sparkline-title">Last backup</div>
                  <div className="backup-mini-row">
                    <span>Status</span>
                    <b style={{ color: 'var(--green-text)' }}>Succeeded</b>
                  </div>
                  <div className="backup-mini-row">
                    <span>Ran</span>
                    <b>Jul 4, 2026 · 11:02 PM</b>
                  </div>
                  <div className="backup-mini-row">
                    <span>Size</span>
                    <b>4.8 MB</b>
                  </div>
                  <button type="button" className="btn small" style={{ marginTop: 4 }} onClick={() => switchView('backups')}>
                    View backup panel
                  </button>
                </div>
              </div>
            </section>

            <section className={`admin-view${activeView === 'orgs' ? ' active' : ''}`} id="view-orgs">
              <div className="admin-page-header">
                <div className="admin-page-title">Organizations</div>
                <div className="admin-page-desc">Every tenant on Rinse. Click a row to open support actions.</div>
              </div>

              <div className="admin-card">
                <div style={{ padding: 16 }}>
                  <div className="table-toolbar">
                    <div className="toolbar-left">
                      <div className="search-input">
                        <IconSearch />
                        Search business or slug…
                      </div>
                      <button type="button" className="filter-chip">
                        Status: All <IconChevronDown />
                      </button>
                      <button type="button" className="filter-chip">
                        Plan: All <IconChevronDown />
                      </button>
                      <button type="button" className="filter-chip">
                        Booking: All <IconChevronDown />
                      </button>
                    </div>
                    <button type="button" className="btn small">
                      Sort: Created ↓
                    </button>
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
                      {DEMO_ORGS.map((org) => (
                        <tr key={org.slug} onClick={() => openDrawer(org)}>
                          <td>
                            <div className="biz-name">
                              {org.founding ? <span className="star">★</span> : null}
                              {org.name}
                            </div>
                            <div className="biz-slug">/{org.slug}</div>
                          </td>
                          <td>
                            <span className="plan-pill">{org.plan}</span>
                          </td>
                          <td>
                            <StatusBadge status={org.status} />
                          </td>
                          <td>{org.trial}</td>
                          <td>
                            <button
                              type="button"
                              className={`toggle ${org.booking ? 'on' : 'off'}`}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Booking ${org.booking ? 'enabled' : 'disabled'} for ${org.name}, click to toggle`}
                              aria-pressed={org.booking}
                            >
                              <span className="knob" />
                            </button>
                          </td>
                          <td>{org.created}</td>
                          <td>
                            <button
                              type="button"
                              className="row-actions-btn"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`More actions for ${org.name}`}
                            >
                              ⋯
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="table-footer">
                    <span>Showing 8 of 47</span>
                    <span>Page 1 of 6</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={`admin-view${activeView === 'backups' ? ' active' : ''}`} id="view-backups">
              <div className="admin-page-header">
                <div className="admin-page-title">Backups &amp; disaster recovery</div>
                <div className="admin-page-desc">
                  Full export of every tenant&apos;s data, for disaster recovery only. Not a substitute for per-tenant
                  customer exports.
                </div>
              </div>

              <div className="backup-grid">
                <div className="admin-card" style={{ padding: 18 }}>
                  <div className="drawer-section-label">Pre-flight — collection counts</div>
                  <div className="preflight-item">
                    <span>Organizations</span>
                    <b>47</b>
                  </div>
                  <div className="preflight-item">
                    <span>Clients</span>
                    <b>842</b>
                  </div>
                  <div className="preflight-item">
                    <span>Jobs</span>
                    <b>3,201</b>
                  </div>
                  <div className="preflight-item">
                    <span>Invoices</span>
                    <b>1,890</b>
                  </div>
                  <div className="preflight-item">
                    <span>Photos (refs)</span>
                    <b>6,554</b>
                  </div>
                </div>
                <div
                  className="admin-card"
                  style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div className="drawer-section-label">Export</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                      Downloads a single JSON file with every tenant&apos;s data, authenticated with your admin session.
                      No secrets are exposed to the browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={backupLoading}
                    onClick={runBackup}
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
                    curl -X POST https://rinsehq.com/api/admin/backups/trigger \
                    <br />
                    &nbsp;&nbsp;-H &quot;Authorization: Bearer $INTERNAL_API_SECRET&quot; \
                    <br />
                    &nbsp;&nbsp;-o rinse-backup-$(date +%F).json
                  </div>
                ) : null}
              </div>
            </section>

            <section className={`admin-view${activeView === 'system' ? ' active' : ''}`} id="view-system">
              <div className="admin-page-header">
                <div className="admin-page-title">System health</div>
                <div className="admin-page-desc">
                  What we can verify from here — the rest lives in Vercel and Stripe dashboards.
                </div>
              </div>

              <div className="health-grid">
                <div className="admin-card health-card">
                  <div className="kpi-label">Database</div>
                  <div className="health-status-row">
                    <span className="health-dot ok" />
                    <span className="health-name">PocketBase — Online</span>
                  </div>
                  <div className="health-note">Last checked 30s ago.</div>
                </div>
                <div className="admin-card health-card">
                  <div className="kpi-label">Payments</div>
                  <div className="health-status-row">
                    <span className="health-dot ok" />
                    <span className="health-name">Stripe webhooks — Configured</span>
                  </div>
                  <div className="health-note">Signing secret set in Vercel.</div>
                </div>
                <div className="admin-card health-card">
                  <div className="kpi-label">Rate limiting</div>
                  <div className="health-status-row">
                    <span className="health-dot warn" />
                    <span className="health-name">Upstash — Not configured</span>
                  </div>
                  <div className="health-note">
                    Optional. Configure in Vercel → see <span className="mono">docs/PRODUCTION.md</span>.
                  </div>
                </div>
              </div>

              <div className="admin-card" style={{ padding: 18, marginTop: 12 }}>
                <div className="drawer-section-label">Security waves</div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                  CSP Report-Only and HSTS are live on production. Full wave history in{' '}
                  <span className="mono">docs/PRODUCTION.md</span> — Waves 2, 5, 7.
                </p>
              </div>
            </section>

            <section className={`admin-view${activeView === 'audit' ? ' active' : ''}`} id="view-audit">
              <div className="admin-page-header">
                <div className="admin-page-title">Audit log</div>
                <div className="admin-page-desc">
                  Events stream to Vercel Functions today. This view is a stub for the future{' '}
                  <span className="mono">/api/admin/audit</span> endpoint.
                </div>
              </div>

              <div className="admin-card">
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
                    <tr style={{ opacity: 0.55, cursor: 'default' }}>
                      <td className="mono">2026-07-05 09:14</td>
                      <td>
                        <span className="plan-pill">admin_backup_triggered</span>
                      </td>
                      <td>you@rinsehq.com</td>
                      <td className="mono">scope: all</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ padding: 16 }}>
                  <div className="empty-state">
                    Full log ingestion isn&apos;t built yet. Search{' '}
                    <span className="mono">admin_backup_triggered</span>, <span className="mono">auth_failure</span>,
                    or <span className="mono">webhook_reject</span> in Vercel → Functions in the meantime.
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

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
                /{selectedOrg.slug} · created {selectedOrg.created}
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
                rinsehq.com/book/{selectedOrg.slug}
                <button type="button" className="row-actions-btn" title="Copy" aria-label="Copy booking link">
                  <IconCopy />
                </button>
              </div>
            </div>

            <div>
              <div className="drawer-section-label">Subscription</div>
              <div className="admin-card drawer-card">
                <div className="kv-row">
                  <span className="kv-label">Plan</span>
                  <span className="plan-pill">{selectedOrg.plan}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Status</span>
                  <StatusBadge status={selectedOrg.status} />
                </div>
                <div className="kv-row">
                  <span className="kv-label">Current period ends</span>
                  <span className="kv-value">Aug 14, 2026</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Stripe customer</span>
                  <span className="mono kv-value">cus_9f2…a41</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Stripe subscription</span>
                  <span className="mono kv-value">sub_1k7…e02</span>
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
                    className={`toggle ${selectedOrg.booking ? 'on' : 'off'}`}
                    aria-label={`Booking enabled, click to disable`}
                    aria-pressed={selectedOrg.booking}
                  >
                    <span className="knob" />
                  </button>
                </div>
                <button type="button" className="btn small" style={{ justifyContent: 'flex-start' }}>
                  Extend trial…
                </button>
                <button type="button" className="btn small" style={{ justifyContent: 'flex-start' }}>
                  Change plan…
                </button>
                <button type="button" className="btn small" style={{ justifyContent: 'flex-start' }}>
                  Force subscription status…
                </button>
              </div>
            </div>

            <div>
              <div className="drawer-section-label">Recent activity</div>
              <div className="empty-state">No activity feed yet — jobs and invoices API for admin view is planned.</div>
            </div>

            <div className="danger-zone">
              <div className="danger-zone-title">Danger zone</div>
              <div className="danger-zone-desc">These affect the tenant immediately. Confirm before proceeding.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn danger small">
                  Disable booking
                </button>
                <button type="button" className="btn danger small">
                  Cancel subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`toast${toastVisible ? ' show' : ''}`} role="status" aria-live="polite">
        <span className="dot-ok" />
        <span>Backup downloaded</span>
      </div>
    </div>
  )
}
