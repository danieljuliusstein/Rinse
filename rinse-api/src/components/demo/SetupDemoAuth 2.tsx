'use client'

import AppLogo from '@/components/AppLogo'
import { SetupRowField } from '@/components/forms'

interface SetupDemoAuthProps {
  onContinue: () => void
}

export default function SetupDemoAuth({ onContinue }: SetupDemoAuthProps) {
  return (
    <div className="auth-screen setup-flow client-light-root">
      <div className="auth-screen__logo">
        <AppLogo size={48} priority />
      </div>
      <div className="auth-step">
        <h1 className="auth-screen__title">Create account</h1>
        <p className="auth-screen__subtitle">Your solo mobile detailing workspace</p>

        <div className="social-auth">
          <button type="button" className="social-auth__btn" disabled>
            Continue with Google
          </button>
          <button type="button" className="social-auth__btn" disabled>
            Continue with Apple
          </button>
        </div>

        <form
          className="auth-form page-form"
          onSubmit={(e) => {
            e.preventDefault()
            onContinue()
          }}
        >
          <div className="ob-field-group">
            <SetupRowField
              id="demo-auth-business"
              label="Business name"
              defaultValue="Summit Detail"
              readOnly
            />
            <SetupRowField
              id="demo-auth-email"
              label="Email"
              type="email"
              defaultValue="you@example.com"
              readOnly
            />
            <SetupRowField
              id="demo-auth-password"
              label="Password"
              type="password"
              defaultValue="••••••••"
              readOnly
            />
          </div>
          <p className="auth-slug-preview">
            Booking link: <strong>/book/summit-detail</strong>
          </p>
          <button type="submit" className="setup-btn-primary">
            Create account
          </button>
        </form>

        <button type="button" className="auth-link" onClick={onContinue}>
          Already have an account? Sign in
        </button>
      </div>
    </div>
  )
}
