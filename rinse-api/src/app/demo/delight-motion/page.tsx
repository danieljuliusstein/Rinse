'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowsClockwise, CloudSlash, DeviceMobile, WifiSlash } from '@phosphor-icons/react'
import { Button, EmptyState } from '@/components/ui'
import { applyThemeToDocument, type ThemeMode } from '@/lib/theme'

function ReplayButton({ onClick, label = 'Replay' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="demo-motion__replay" onClick={onClick}>
      {label}
    </button>
  )
}

export default function DelightMotionDemoPage() {
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [emptyKey, setEmptyKey] = useState(0)
  const [successKey, setSuccessKey] = useState(0)
  const [done, setDone] = useState(false)

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyThemeToDocument(next)
  }

  const replaySuccess = () => {
    setDone(false)
    requestAnimationFrame(() => {
      setSuccessKey((k) => k + 1)
      setDone(true)
      window.setTimeout(() => setDone(false), 1200)
    })
  }

  return (
    <div className="demo-motion-lab">
      <header className="demo-motion-lab__header">
        <Link href="/demo" className="demo-motion-lab__back">
          ← Demo index
        </Link>
        <h1>Wave 55 — delight &amp; depth QA</h1>
        <p>
          Replay Wave 53–54 motion utilities and toggle dark theme to verify <code>--depth-*</code>{' '}
          card borders. Disable macOS Reduce motion to see animations.
        </p>
        <div className="demo-motion-lab__actions">
          <button type="button" className="demo-motion__replay" onClick={toggleTheme}>
            Theme: {theme}
          </button>
        </div>
      </header>

      <div className="demo-motion-lab__grid">
        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Illustrated empty</h2>
            <ReplayButton onClick={() => setEmptyKey((k) => k + 1)} />
          </div>
          <div className="demo-frame">
            <div className="demo-motion__pad" key={emptyKey}>
              <EmptyState
                illustration="jobs"
                title="No jobs yet"
                description="Your schedule will show up here."
                actionLabel="Add job"
                onAction={() => undefined}
              />
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Sheet success pop</h2>
            <ReplayButton onClick={replaySuccess} />
          </div>
          <div className="demo-frame">
            <div className="demo-motion__pad demo-motion__pad--center">
              <button
                key={successKey}
                type="button"
                className={['sheet-submit', done ? 'sheet-submit--done motion-sheet-done' : 'sheet-submit--ready']
                  .filter(Boolean)
                  .join(' ')}
                onClick={replaySuccess}
              >
                {done ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Attention pulse</h2>
          </div>
          <div className="demo-frame">
            <div className="demo-motion__pad demo-motion__pad--center offline-screen">
              <EmptyState
                icon={
                  <WifiSlash
                    size={48}
                    weight="duotone"
                    className="offline-screen__icon motion-attention-pulse"
                    aria-hidden="true"
                  />
                }
                title="You're offline"
                description="Reconnect to sync your latest data."
              />
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>PWA + offline banners</h2>
          </div>
          <div className="demo-frame">
            <div className="demo-motion__pad demo-motion__pad--stack">
              <div className="offline-banner" role="status">
                <CloudSlash size={18} color="var(--amber)" weight="fill" aria-hidden="true" />
                <span className="offline-banner__message">3 changes waiting to sync</span>
                <button type="button" className="offline-banner__sync offline-banner__sync--pulse">
                  <ArrowsClockwise size={14} weight="bold" aria-hidden="true" />
                  Sync now
                </button>
              </div>
              <div className="pwa-install-banner" role="region" aria-label="Install app">
                <span className="pwa-install-banner__icon" aria-hidden="true">
                  <DeviceMobile size={22} weight="duotone" />
                </span>
                <div className="pwa-install-banner__body">
                  <strong>Install Rinse</strong>
                  <span>Add to your home screen for faster access.</span>
                </div>
                <Button variant="primary" className="pwa-install-banner__btn">
                  Install
                </Button>
              </div>
              <div className="card">
                <p className="demo-motion__hint" style={{ margin: 0 }}>
                  Generic <code>.card</code> — border depth in {theme} mode
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
