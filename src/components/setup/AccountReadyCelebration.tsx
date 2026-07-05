'use client'

import { motion, useReducedMotion } from 'motion/react'
import InvoiceTemplateMock from '@/components/invoice/InvoiceTemplateMock'
import { springCelebration, springPop } from '@/lib/motion'
import type { InvoiceTemplateId } from '@/lib/invoice-templates'

const CONFETTI = [
  { color: '#22c55e', top: '8%', left: '12%' },
  { color: '#86efac', top: '12%', left: '88%' },
  { color: '#ffffff', top: '18%', left: '6%' },
  { color: '#4ade80', top: '10%', left: '72%' },
  { color: '#bbf7d0', top: '16%', left: '42%' },
  { color: '#ffffff', top: '22%', left: '92%' },
  { color: '#22c55e', top: '28%', left: '18%' },
  { color: '#86efac', top: '24%', left: '58%' },
  { color: '#ffffff', top: '32%', left: '78%' },
  { color: '#4ade80', top: '14%', left: '28%' },
  { color: '#bbf7d0', top: '26%', left: '48%' },
  { color: '#ffffff', top: '20%', left: '36%' },
] as const

const SAMPLE_CLIENT = 'Sample Client'
const SAMPLE_SERVICE = 'Full detail'

export interface AccountReadyCelebrationProps {
  businessName: string
  logoUrl?: string | null
  template?: InvoiceTemplateId
  accent?: string
  amount?: number
  onContinue: () => void
}

export default function AccountReadyCelebration({
  businessName,
  logoUrl,
  template = 'rinse',
  accent = '#22c55e',
  amount = 185,
  onContinue,
}: AccountReadyCelebrationProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="setup-account-ready setup-flow client-light-root">
      <div
        className="setup-account-ready__preview-wrap onboarding-invoice-preview onboarding-invoice-preview--success-hero"
        aria-hidden="true"
      >
        <InvoiceTemplateMock
          template={template}
          accent={accent}
          businessName={businessName}
          logoUrl={logoUrl ?? undefined}
          scale="full"
          clientName={SAMPLE_CLIENT}
          serviceName={SAMPLE_SERVICE}
          serviceNote="Sedan · mobile"
          amount={amount}
        />
      </div>

      <div className="setup-account-ready__stage" role="status" aria-live="polite">
        {!reduceMotion
          ? CONFETTI.map((dot, i) => (
              <motion.span
                key={i}
                className="setup-account-ready__confetti"
                style={{ top: dot.top, left: dot.left, background: dot.color }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
                transition={{
                  delay: 0.5 + i * 0.05,
                  duration: 1.6,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                }}
                aria-hidden="true"
              />
            ))
          : null}

        <motion.div
          className="setup-account-ready__circle"
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.15, ...springCelebration }}
        >
          <motion.svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
            <motion.path
              d="M2 12L11 21L28 2"
              stroke="#fff"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={reduceMotion ? { duration: 0 } : { delay: 0.35, duration: 0.4, ease: 'easeOut' }}
            />
          </motion.svg>
        </motion.div>

        <motion.h1
          className="setup-account-ready__title"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.45, ...springPop }}
        >
          You&apos;re ready!
        </motion.h1>
        <motion.p
          className="setup-account-ready__lead"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.52, ...springPop }}
        >
          Your first invoice is set up — customize it next.
        </motion.p>
      </div>

      <footer className="setup-account-ready__footer">
        <button type="button" className="setup-btn-primary" onClick={onContinue}>
          See my invoice
        </button>
      </footer>
    </div>
  )
}
