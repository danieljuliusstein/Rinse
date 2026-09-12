'use client'

import { useMemo, useState } from 'react'
import { ArrowSquareOut, Copy } from '@phosphor-icons/react'
import {
  embedButtonScriptHtml,
  embedCalendarIframeHtml,
  embedCalendarScriptHtml,
  exampleSiteUrl,
  platformSetupSteps,
  PLATFORM_LABELS,
  socialSetupSteps,
  SOCIAL_PLACEMENTS,
  type WebsitePlatform,
} from '@/lib/booking-embed'

type Situation = 'social' | 'website'

type WebsiteBookingGuideProps = {
  appOrigin: string
  slug: string
  bookingUrl: string
  brandName?: string
  compact?: boolean
}

const PLATFORMS: WebsitePlatform[] = ['wix', 'squarespace', 'wordpress', 'other']

export default function WebsiteBookingGuide({
  appOrigin,
  slug,
  bookingUrl,
  brandName,
  compact,
}: WebsiteBookingGuideProps) {
  const displayBrand = brandName?.trim() || 'your business'
  const bookLabel = `Book with ${displayBrand}`

  const [situation, setSituation] = useState<Situation>('social')
  const [platform, setPlatform] = useState<WebsitePlatform>('wix')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedTab, setAdvancedTab] = useState<'button' | 'iframe'>('button')
  const [copied, setCopied] = useState<'link' | 'code' | 'advanced' | null>(null)

  const calendarCode = useMemo(
    () => embedCalendarScriptHtml(appOrigin, slug, displayBrand),
    [appOrigin, slug, displayBrand],
  )

  const advancedCode = useMemo(() => {
    if (advancedTab === 'button') {
      return embedButtonScriptHtml(appOrigin, slug, bookLabel)
    }
    return embedCalendarIframeHtml(appOrigin, slug)
  }, [advancedTab, appOrigin, slug, bookLabel])

  const steps = situation === 'social' ? socialSetupSteps() : platformSetupSteps(platform)
  const copyTarget = situation === 'social' ? bookingUrl : calendarCode
  const copyKey = situation === 'social' ? 'link' : 'code'

  async function copyText(text: string, key: typeof copied) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  const demoUrl = exampleSiteUrl(appOrigin, slug, displayBrand)

  return (
    <div className={`website-booking-guide${compact ? ' website-booking-guide--compact' : ''}`}>
      <p className="website-booking-guide__pitch">
        Keep your website, Instagram, or Google listing. Paste one link or one code block — bookings sync to
        this app in real time.
      </p>

      <div className="website-booking-guide__choices" role="tablist" aria-label="Where customers find you">
        <button
          type="button"
          role="tab"
          aria-selected={situation === 'social'}
          className={`website-booking-guide__choice${situation === 'social' ? ' active' : ''}`}
          onClick={() => setSituation('social')}
        >
          <span className="website-booking-guide__choice-title">Link only</span>
          <span className="website-booking-guide__choice-desc">Instagram, Google, texts — no website needed</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={situation === 'website'}
          className={`website-booking-guide__choice${situation === 'website' ? ' active' : ''}`}
          onClick={() => setSituation('website')}
        >
          <span className="website-booking-guide__choice-title">I have a website</span>
          <span className="website-booking-guide__choice-desc">Add a live calendar to the site you already use</span>
        </button>
      </div>

      {situation === 'website' ? (
        <div className="website-booking-guide__platforms">
          <p className="website-booking-guide__platforms-label">What built your site?</p>
          <div className="website-booking-guide__platform-row">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                className={`website-booking-guide__platform${platform === p ? ' active' : ''}`}
                onClick={() => setPlatform(p)}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ol className="website-booking-guide__steps">
        {steps.map((step, i) => (
          <li key={step}>
            <span className="website-booking-guide__step-num">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {situation === 'social' ? (
        <ul className="website-booking-guide__ideas">
          {SOCIAL_PLACEMENTS.map((place) => (
            <li key={place}>{place}</li>
          ))}
        </ul>
      ) : null}

      <div className="website-booking-guide__copy-block">
        <p className="website-booking-guide__copy-label">
          {situation === 'social' ? 'Your booking link' : 'Paste this on your website'}
        </p>
        <pre className="website-booking-guide__code">{copyTarget}</pre>
        <div className="website-booking-guide__actions">
          <button
            type="button"
            className="btn-primary website-booking-guide__copy-btn"
            onClick={() => void copyText(copyTarget, copyKey)}
          >
            <Copy size={16} weight="bold" aria-hidden="true" />
            {copied === copyKey ? 'Copied!' : situation === 'social' ? 'Copy booking link' : 'Copy code'}
          </button>
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary website-booking-guide__copy-btn"
          >
            <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
            See example site
          </a>
        </div>
      </div>

      {situation === 'website' ? (
        <div className="website-booking-guide__advanced">
          <button
            type="button"
            className="website-booking-guide__advanced-toggle"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((open) => !open)}
          >
            {showAdvanced ? 'Hide other options' : 'Other options (popup button, etc.)'}
          </button>
          {showAdvanced ? (
            <div className="website-booking-guide__advanced-body">
              <div className="website-booking-guide__platform-row">
                <button
                  type="button"
                  className={`website-booking-guide__platform${advancedTab === 'button' ? ' active' : ''}`}
                  onClick={() => setAdvancedTab('button')}
                >
                  Popup button
                </button>
                <button
                  type="button"
                  className={`website-booking-guide__platform${advancedTab === 'iframe' ? ' active' : ''}`}
                  onClick={() => setAdvancedTab('iframe')}
                >
                  Iframe only
                </button>
              </div>
              <p className="website-booking-guide__advanced-help">
                {advancedTab === 'button'
                  ? 'Adds a button that opens booking in a popup — good for your header or hero.'
                  : 'Some site builders only allow iframes — paste this block instead of the calendar code.'}
              </p>
              <pre className="website-booking-guide__code">{advancedCode}</pre>
              <button
                type="button"
                className="btn-ghost website-booking-guide__copy-btn"
                onClick={() => void copyText(advancedCode, 'advanced')}
              >
                <Copy size={16} weight="bold" aria-hidden="true" />
                {copied === 'advanced' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
