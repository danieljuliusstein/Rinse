'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from '@phosphor-icons/react'
import AppLogo from '@/components/AppLogo'
import InvoiceTemplateMock from '@/components/invoice/InvoiceTemplateMock'
import PaywallSheet from '@/components/PaywallSheet'
import { AccountReadyCelebration } from '@/components/setup'

function ReplayButton({ onClick, label = 'Replay' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="demo-motion__replay" onClick={onClick}>
      {label}
    </button>
  )
}

export default function SetupMotionDemoPage() {
  const [welcomeKey, setWelcomeKey] = useState(0)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [onboardingStep, setOnboardingStep] = useState<'business' | 'invoice'>('business')
  const [stepKey, setStepKey] = useState(0)
  const [logoOn, setLogoOn] = useState(true)
  const [logoKey, setLogoKey] = useState(0)
  const [invoiceKey, setInvoiceKey] = useState(0)
  const [pickOn, setPickOn] = useState(true)
  const [successKey, setSuccessKey] = useState(0)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const replayWelcome = () => setWelcomeKey((k) => k + 1)
  const replayStep = () => setStepKey((k) => k + 1)
  const replaySuccess = () => setSuccessKey((k) => k + 1)
  const replayLogo = () => {
    setLogoOn(false)
    requestAnimationFrame(() => {
      setLogoKey((k) => k + 1)
      setLogoOn(true)
    })
  }
  const replayInvoice = () => setInvoiceKey((k) => k + 1)

  return (
    <div className="demo-motion-lab">
      <header className="demo-motion-lab__header">
        <Link href="/demo" className="demo-motion-lab__back">
          ← Demo index
        </Link>
        <h1>Setup motion + UX lab</h1>
        <p>
          Wave 1 split shell at top; Wave 48 motion below. If motion looks instant, check macOS{' '}
          <strong>System Settings → Accessibility → Display → Reduce motion</strong> (should be off).
        </p>
      </header>

      <div className="demo-motion-lab__grid">
        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Split shell (with photo)</h2>
            <span className="demo-motion__frame-tag">IF 274886 · Wave 1</span>
          </div>
          <div className="demo-frame">
            <div className="setup-split setup-split--overlap setup-flow client-light-root demo-motion__clip demo-motion__clip--tall">
              <div className="setup-split__body setup-split__body--flush">
                <h2 className="setup-body-headline">Upload logo</h2>
                <p className="setup-body-lead">Hero band hidden until Wave 15 assets — body fills from top.</p>
                <div className="setup-placeholder-block" />
              </div>
              <footer className="setup-split__footer">
                <button type="button" className="setup-btn-primary">
                  Continue
                </button>
              </footer>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Welcome stagger</h2>
            <span className="demo-motion__frame-tag">IF 274878–274879 · Wave 2</span>
            <ReplayButton onClick={replayWelcome} />
          </div>
          <div className="demo-frame">
            <div
              key={welcomeKey}
              className="welcome-screen setup-split setup-flow client-light-root welcome-screen--no-hero demo-motion__clip demo-motion__clip--tall"
            >
              <div className="setup-split__body welcome-screen__body">
                <div className="welcome-screen__logo-wrap">
                  <AppLogo size={40} />
                </div>
                <p className="welcome-screen__eyebrow">Mobile detailing</p>
                <h1 className="welcome-screen__title">Run your business from your phone</h1>
                <p className="welcome-screen__lead">
                  Book clients, send invoices, and track jobs — built for solo mobile detailers.
                </p>
              </div>
              <footer className="setup-split__footer welcome-screen__footer">
                <button type="button" className="setup-btn-primary">
                  Get started
                </button>
                <p className="welcome-screen__signin">
                  Already have an account? <a href="#">Sign in</a>
                </p>
              </footer>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Auth step enter</h2>
            <ReplayButton
              label="Toggle mode"
              onClick={() => setAuthMode((m) => (m === 'login' ? 'signup' : 'login'))}
            />
          </div>
          <div className="demo-frame">
            <div className="auth-screen setup-flow client-light-root demo-motion__clip">
              <div className="auth-screen__logo">
                <AppLogo size={48} />
              </div>
              <div key={authMode} className="auth-step">
                <h1 className="auth-screen__title">{authMode === 'login' ? 'Sign in' : 'Create account'}</h1>
                <p className="auth-screen__subtitle">
                  {authMode === 'login'
                    ? 'Sign in to your jobs, clients, and business data'
                    : 'Your solo mobile detailing workspace'}
                </p>
                <div className="social-auth">
                  <button type="button" className="social-auth__btn">
                    Continue with Google
                  </button>
                  <button type="button" className="social-auth__btn">
                    Continue with Apple
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Onboarding step</h2>
            <div className="demo-motion-lab__actions">
              <button
                type="button"
                className="demo-motion__replay"
                onClick={() => {
                  setOnboardingStep('business')
                  replayStep()
                }}
              >
                Business
              </button>
              <button
                type="button"
                className="demo-motion__replay"
                onClick={() => {
                  setOnboardingStep('invoice')
                  replayStep()
                }}
              >
                Invoice
              </button>
            </div>
          </div>
          <div className="demo-frame">
            <div className="onboarding-flow setup-flow client-light-root demo-motion__clip demo-motion__clip--onboarding">
              <div className="onboarding-flow__top">
                <div className="onboarding-flow__progress" aria-hidden="true">
                  <div className="onboarding-flow__progress-seg onboarding-flow__progress-seg--done" />
                  <div
                    className={[
                      'onboarding-flow__progress-seg',
                      onboardingStep === 'invoice' ? ' onboarding-flow__progress-seg--done' : '',
                      ' onboarding-flow__progress-seg--current',
                    ].join('')}
                  />
                  <div className="onboarding-flow__progress-seg" />
                  <div className="onboarding-flow__progress-seg" />
                </div>
              </div>
              <div className="onboarding-flow__body">
                <div key={`${onboardingStep}-${stepKey}`} className="onboarding-step">
                  {onboardingStep === 'business' ? (
                    <p className="onboarding-step__intro">Quick setup — then you&apos;ll see your first invoice.</p>
                  ) : (
                    <p className="onboarding-preview-banner">Preview only — nothing is sent.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Logo complete pop</h2>
            <ReplayButton onClick={replayLogo} />
          </div>
          <div className="demo-frame">
            <div className="setup-flow client-light-root demo-motion__clip demo-motion__pad">
              <div
                key={logoKey}
                className={`onboarding-logo-picker onboarding-logo-picker--complete${logoOn ? '' : ' onboarding-logo-picker--uploading'}`}
              >
                {logoOn ? (
                  <img src="/logo.png" alt="" width={96} height={96} />
                ) : null}
                <span className="onboarding-logo-btn">Change logo</span>
                {!logoOn ? (
                  <div className="onboarding-logo-progress" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}>
                    <div className="onboarding-logo-progress__fill" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Account ready beat</h2>
            <span className="demo-motion__frame-tag">IF 274896 · Wave 8</span>
            <ReplayButton onClick={replaySuccess} />
          </div>
          <div className="demo-frame">
            <div key={successKey} className="demo-motion__clip demo-motion__clip--tall">
              <AccountReadyCelebration
                businessName="Summit Detail"
                logoUrl="/logo.png"
                amount={185}
                onContinue={() => undefined}
              />
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Invoice customize</h2>
            <ReplayButton onClick={replayInvoice} />
          </div>
          <div className="demo-frame">
            <div className="setup-flow client-light-root demo-motion__clip demo-motion__pad">
              <div className="onboarding-invoice-step">
                <p className="onboarding-preview-banner" role="status">
                  Preview only — nothing is sent.
                </p>
                <div className="ob-pick-list">
                  <button
                    type="button"
                    className={`ob-pick-card${pickOn ? ' ob-pick-card--on' : ''}`}
                    onClick={() => setPickOn((v) => !v)}
                  >
                    <div className="ob-pick-card__main">
                      <strong>Full detail</strong>
                      <span className="ob-pick-card__sub">Sedan · mobile</span>
                    </div>
                    <div className="ob-pick-card__right">
                      <span className="ob-pick-card__price">$185</span>
                      <span className="ob-pick-card__check" aria-hidden="true">
                        <Check size={12} weight="bold" />
                      </span>
                    </div>
                  </button>
                </div>
                <div key={invoiceKey} className="onboarding-invoice-preview onboarding-invoice-preview--hero">
                  <InvoiceTemplateMock
                    template="rinse"
                    accent="#22c55e"
                    businessName="Summit Detail"
                    logoUrl="/logo.png"
                    clientName="Sample Client"
                    serviceName="Full detail"
                    amount={185}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="demo-motion-lab__panel">
          <div className="demo-motion-lab__panel-head">
            <h2>Paywall sheet</h2>
            <ReplayButton label="Open sheet" onClick={() => setPaywallOpen(true)} />
          </div>
          <div className="demo-frame demo-frame--dark">
            <div className="demo-motion__pad demo-motion__pad--center">
              <p className="demo-motion__hint">Tap “Open sheet” — crown icon + plan rows stagger in.</p>
              <button type="button" className="setup-btn-primary" onClick={() => setPaywallOpen(true)}>
                Show paywall
              </button>
            </div>
          </div>
        </section>
      </div>

      <PaywallSheet open={paywallOpen} onOpenChange={setPaywallOpen} mode="nudge" feature="Unlimited invoices" />
    </div>
  )
}
