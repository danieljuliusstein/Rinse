'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from '@phosphor-icons/react'
import JobDetail from '@/components/JobDetail'
import ClientDetail from '@/components/ClientDetail'
import InvoicePreview from '@/components/InvoicePreview'
import { ScreenLoading, ScreenMessage } from '@/components/ui'
import type { DetailOverlayTarget } from '@/providers/DetailOverlayProvider'
import {
  getClient,
  getClientJobs,
  getJob,
  getQuotes,
  getVehiclesForClient,
} from '@/lib/api'
import type { Client, JobWithRelations, QuoteWithRelations, Vehicle } from '@/lib/types'

interface Props {
  target: DetailOverlayTarget
  layoutId: string
  onClose: () => void
}

export default function DetailOverlayPanel({ target, layoutId, onClose }: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      <motion.div
        className="detail-overlay"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      >
        <button type="button" className="detail-overlay__scrim" aria-label="Close" onClick={onClose} />
        <motion.div
          className="detail-overlay__panel"
          layoutId={reduceMotion ? undefined : layoutId}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        >
          <header className="detail-overlay__header">
            <button type="button" className="icon-btn detail-overlay__close" aria-label="Close" onClick={onClose}>
              <X size={18} weight="bold" />
            </button>
          </header>
          <div className="detail-overlay__body">
            <DetailOverlayContent target={target} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function DetailOverlayContent({ target }: { target: DetailOverlayTarget }) {
  if (target.kind === 'job') return <JobOverlayContent id={target.id} />
  if (target.kind === 'client') return <ClientOverlayContent id={target.id} />
  return <InvoiceOverlayContent jobId={target.jobId} />
}

function JobOverlayContent({ id }: { id: string }) {
  const [job, setJob] = useState<JobWithRelations | null | undefined>(undefined)

  useEffect(() => {
    void getJob(id).then(setJob)
  }, [id])

  if (job === undefined) return <ScreenLoading variant="detail" inline />
  if (!job) return <ScreenMessage>Job not found</ScreenMessage>
  return <JobDetail job={job} />
}

function ClientOverlayContent({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null | undefined>(undefined)
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])

  useEffect(() => {
    void Promise.all([getClient(id), getClientJobs(id), getVehiclesForClient(id), getQuotes()]).then(
      ([c, j, v, allQuotes]) => {
        setClient(c)
        setJobs(j)
        setVehicles(v)
        setQuotes(allQuotes.filter((q) => q.client_id === id))
      },
    )
  }, [id])

  if (client === undefined) return <ScreenLoading variant="detail" inline />
  if (!client) return <ScreenMessage>Client not found</ScreenMessage>

  const totalRevenue = jobs.reduce((s, j) => s + j.revenue + j.tip, 0)
  return (
    <ClientDetail
      client={client}
      jobs={jobs}
      vehicles={vehicles}
      quotes={quotes}
      totalRevenue={totalRevenue}
    />
  )
}

function InvoiceOverlayContent({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobWithRelations | null | undefined>(undefined)

  useEffect(() => {
    void getJob(jobId).then(setJob)
  }, [jobId])

  if (job === undefined) return <ScreenLoading variant="detail" inline />
  if (!job) return <ScreenMessage>Job not found</ScreenMessage>
  return <InvoicePreview job={job} />
}
