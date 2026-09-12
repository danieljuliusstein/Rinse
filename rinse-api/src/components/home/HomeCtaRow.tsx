'use client'

import { useRouter } from 'next/navigation'
import { PaperPlaneTilt, Plus, Receipt } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import { findSendInvoicePath } from '@/lib/invoice-hub'
import type { Invoice, JobWithRelations } from '@/lib/types'

interface HomeCtaRowProps {
  invoices?: Invoice[]
  jobs?: JobWithRelations[]
}

export default function HomeCtaRow({ invoices = [], jobs = [] }: HomeCtaRowProps) {
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const { runGated: runSendGated } = usePremiumGate('send_invoice')

  const go = (path: string) => {
    if (isLoggedOut) router.push('/auth')
    else router.push(path)
  }

  const handleSend = () => {
    runSendGated(() => go(findSendInvoicePath(invoices, jobs)))
  }

  return (
    <div className="home-cta-row">
      <Button className="home-cta-row__btn" variant="primary" onClick={handleSend}>
        <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />
        Send invoice
      </Button>
      <div className="home-cta-row__btn-row">
        <Button className="home-cta-row__btn" variant="ghost" onClick={() => go('/jobs/new')}>
          <Plus size={18} weight="bold" aria-hidden="true" />
          New job
        </Button>
        <Button className="home-cta-row__btn" variant="ghost" onClick={() => go('/invoices/new')}>
          <Receipt size={18} weight="duotone" aria-hidden="true" />
          Create
        </Button>
      </div>
    </div>
  )
}
