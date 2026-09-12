'use client'

import { motion } from 'motion/react'
import AppLogo from '@/components/AppLogo'
import { SetupHeroBand, SetupHeroCurve } from '@/components/setup'
import { SETUP_HERO_WELCOME } from '@/lib/setup-hero-assets'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface SetupDemoWelcomeProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export default function SetupDemoWelcome({ onGetStarted, onSignIn }: SetupDemoWelcomeProps) {
  const hasHero = Boolean(SETUP_HERO_WELCOME)

  return (
    <div
      className={[
        'welcome-screen',
        'welcome-screen--motion',
        'setup-split',
        'setup-flow',
        'client-light-root',
        hasHero ? 'setup-split--curve' : 'welcome-screen--no-hero',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasHero ? (
        <>
          <div className="setup-split__hero">
            <SetupHeroBand src={SETUP_HERO_WELCOME} priority />
          </div>
          <SetupHeroCurve tone="light" />
        </>
      ) : null}

      <motion.div
        className="setup-split__body welcome-screen__body"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div className="welcome-screen__logo-wrap" variants={staggerItem}>
          <AppLogo size={40} priority />
        </motion.div>
        <motion.p className="welcome-screen__eyebrow" variants={staggerItem}>
          Mobile detailing
        </motion.p>
        <motion.h1 className="welcome-screen__title" variants={staggerItem}>
          Run your business from your phone
        </motion.h1>
        <motion.p className="welcome-screen__lead" variants={staggerItem}>
          Book clients, send invoices, and track jobs — built for solo mobile detailers.
        </motion.p>
      </motion.div>

      <motion.footer
        className="setup-split__footer welcome-screen__footer"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <button type="button" className="setup-btn-primary" onClick={onGetStarted}>
            Get started
          </button>
        </motion.div>
        <motion.p className="welcome-screen__signin" variants={staggerItem}>
          Already have an account?{' '}
          <button type="button" className="setup-demo-inline-link" onClick={onSignIn}>
            Sign in
          </button>
        </motion.p>
      </motion.footer>
    </div>
  )
}
