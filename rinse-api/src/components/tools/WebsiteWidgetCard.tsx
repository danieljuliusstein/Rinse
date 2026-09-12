'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Code, Copy } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { useProGate } from '@/hooks/useProGate'
import { isProPlan } from '@/lib/subscription'
import { loadSettings } from '@/lib/settings'
import { loadOrganizationSlug } from '@/lib/tenant'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import { embedCalendarScriptHtml } from '@/lib/booking-embed'

export default function WebsiteWidgetCard() {
  const router = useRouter()
  const settings = loadSettings()
  const { org } = useOrgSubscription()
  const { runProGated, hasPro } = useProGate('embed_widget')
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    void loadOrganizationSlug().then((s) => setSlug(s?.trim() || null))
  }, [])

  const snippet = useMemo(() => {
    if (!slug || typeof window === 'undefined') return null
    return embedCalendarScriptHtml(window.location.origin, slug, settings.business_name)
  }, [slug, settings.business_name])

  const handleCopy = async () => {
    if (!snippet) return
    runProGated(async () => {
      await navigator.clipboard.writeText(snippet)
    })
  }

  return (
    <section className="card website-widget-card" data-coach="tools-widget">
      <div className="website-widget-card__head">
        <span className="website-widget-card__icon" aria-hidden="true">
          <Code size={22} weight="duotone" />
        </span>
        <div>
          <h2 className="website-widget-card__title">Website booking widget</h2>
          <p className="website-widget-card__sub">
            Embed your calendar on any site — clients book without leaving your brand.
            {!hasPro && org && !isProPlan(org) ? ' Pro plan required.' : ''}
          </p>
        </div>
      </div>
      {snippet ? (
        <pre className="website-widget-card__code">{snippet}</pre>
      ) : (
        <p className="website-widget-card__hint">Set up your booking link in Settings → Your business first.</p>
      )}
      <div className="website-widget-card__actions">
        {snippet ? (
          <Button variant="secondary" onClick={() => void handleCopy()}>
            <Copy size={16} /> Copy embed code
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => router.push('/settings/business')}>
          Open booking settings
        </Button>
      </div>
    </section>
  )
}
