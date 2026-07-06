'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EnvelopeSimple } from '@phosphor-icons/react'
import { getActiveBackend } from '@/lib/api'
import { requestTourReplay, TOUR_REPLAY_EVENT } from '@/lib/product-tour'
import {
  APP_DISPLAY_NAME,
  buildBugReportMailto,
  buildContactMailto,
  buildDebugInfo,
  getAppVersion,
  getSupportEmail,
} from '@/lib/support-config'
import { loadOrganizationSlug } from '@/lib/tenant'
import { Button, ListRow, SectionGroup, ScreenLoading } from '@/components/ui'
import SettingsDetailShell from './SettingsDetailShell'
import { useSettingsDraft } from './SettingsDraftProvider'

const FAQ_LINKS = [
  { href: '/settings/faq#pipeline', label: 'Lead pipeline' },
  { href: '/settings/faq#online-payments', label: 'Online payments (Stripe)' },
  { href: '/settings/faq#schedule', label: 'Booking schedule & time off' },
  { href: '/settings/faq#auto-messages', label: 'Auto messages' },
  { href: '/settings/faq', label: 'All FAQ' },
  { href: '/terms?from=settings', label: 'Terms of service' },
  { href: '/privacy', label: 'Privacy policy' },
] as const

export default function SettingsSupportPage() {
  const router = useRouter()
  const { settings, ready } = useSettingsDraft()
  const [backend, setBackend] = useState('unknown')
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const supportEmail = getSupportEmail()
  const contactMailto = buildContactMailto()

  useEffect(() => {
    void getActiveBackend().then((b) => setBackend(b))
    void loadOrganizationSlug().then(setOrgSlug)
  }, [])

  const debugInfo = useMemo(
    () =>
      buildDebugInfo({
        backend,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        orgSlug,
        businessName: settings?.business_name,
      }),
    [backend, orgSlug, settings?.business_name],
  )

  const bugMailto = buildBugReportMailto(debugInfo)

  const handleCopyDebug = async () => {
    setCopyMsg(null)
    try {
      await navigator.clipboard.writeText(debugInfo)
      setCopyMsg('Copied — paste into your support email')
    } catch {
      setCopyMsg('Could not copy — select and copy the text manually')
    }
  }

  const handleReplayTour = () => {
    requestTourReplay()
    window.dispatchEvent(new Event(TOUR_REPLAY_EVENT))
  }

  if (!ready) {
    return <ScreenLoading body variant="settings" />
  }

  return (
    <SettingsDetailShell title="Help & support" showSave={false}>
      <section className="card settings-support-contact">
        <h2 className="settings-support-contact__title">Contact us</h2>
        <p className="settings-support-contact__lead">
          Questions, bugs, or account help — we&apos;re here for you.
        </p>
        <p className="settings-support-contact__hint">We typically reply within 1 business day.</p>
        {contactMailto ? (
          <a href={contactMailto} className="btn-secondary settings-support-contact__btn">
            <EnvelopeSimple size={18} weight="bold" aria-hidden="true" />
            Email support
          </a>
        ) : (
          <p className="settings-msg settings-msg--warn">Support email not configured.</p>
        )}
        {supportEmail ? (
          <p className="settings-support-contact__email">{supportEmail}</p>
        ) : null}
      </section>

      <SectionGroup title="Help topics">
        <ListRow title="Replay app tour" onClick={handleReplayTour} />
        {FAQ_LINKS.map((link) => (
          <ListRow
            key={link.href}
            title={link.label}
            onClick={() => router.push(link.href)}
          />
        ))}
      </SectionGroup>

      <section className="card settings-support-bug">
        <h2 className="settings-support-bug__title">Report a bug</h2>
        <p className="settings-support-bug__lead">
          Copy debug info and send it with a short description of what went wrong.
        </p>
        <Button type="button" variant="ghost" onClick={() => void handleCopyDebug()}>
          Copy debug info
        </Button>
        {bugMailto ? (
          <a href={bugMailto} className="btn-ghost settings-support-bug__email-link">
            Email support with debug info
          </a>
        ) : null}
        {copyMsg ? <p className="settings-msg">{copyMsg}</p> : null}
        <pre className="settings-support-bug__preview" aria-label="Debug info preview">
          {debugInfo}
        </pre>
      </section>

      <p className="settings-support-meta">
        {APP_DISPLAY_NAME} · v{getAppVersion()}
      </p>
    </SettingsDetailShell>
  )
}
