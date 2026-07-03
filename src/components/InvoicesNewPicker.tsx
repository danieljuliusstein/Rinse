'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from '@phosphor-icons/react'
import { EmptyState, ListRow, SectionGroup } from '@/components/ui'
import { createInvoiceForJob, getJobs } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import { notifyFinancialDataChanged } from '@/lib/financial-data-events'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import type { JobWithRelations } from '@/lib/types'

interface Props {
  jobs: JobWithRelations[]
}

export default function InvoicesNewPicker({ jobs: initialJobs }: Props) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const { runGated: runCreateInvoiceGated } = usePremiumGate('create_invoice')

  const candidates = useMemo(
    () =>
      jobs
        .filter((j) => !j.invoice_id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [jobs]
  )

  const handleCreate = async (jobId: string) => {
    runCreateInvoiceGated(() => {
      void (async () => {
        setBusyId(jobId)
        setMessage('')
        try {
          await createInvoiceForJob(jobId)
          notifyFinancialDataChanged()
          router.push(`/jobs/${jobId}/invoice`)
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Could not create invoice')
          const refreshed = await getJobs()
          setJobs(refreshed)
        } finally {
          setBusyId(null)
        }
      })()
    })
  }

  return (
    <div className="screen page-content body screen--dock-nav">
      <header className="page-header">
        <div>
          <h1>Create invoice</h1>
          <p>Pick a job to invoice</p>
        </div>
      </header>

      {message ? <p className="invoice-screen__message">{message}</p> : null}

      {candidates.length === 0 ? (
        <EmptyState
          illustration="invoices"
          title="No jobs ready to invoice"
          description="Complete a job first, or open an existing invoice from the list."
          actionLabel="View invoices"
          onAction={() => router.push('/invoices')}
        />
      ) : (
        <SectionGroup title="Jobs without invoice">
          {candidates.map((job) => (
            <ListRow
              key={job.id}
              icon={<Briefcase size={20} weight="duotone" />}
              iconTone="blue"
              title={job.client?.name ?? 'Client'}
              subtitle={`${job.date} · ${job.package?.name ?? 'Service'}`}
              amount={fmt(job.revenue + job.tip)}
              onClick={() => void handleCreate(job.id)}
              className={busyId === job.id ? 'ui-list-row--busy' : ''}
            />
          ))}
        </SectionGroup>
      )}
    </div>
  )
}
