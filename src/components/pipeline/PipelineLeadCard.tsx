'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DotsThreeVertical } from '@phosphor-icons/react'
import CreateClientConfirmSheet from '@/components/pipeline/CreateClientConfirmSheet'
import ScheduleLeadJobSheet, {
  type ScheduleLeadJobInput,
} from '@/components/pipeline/ScheduleLeadJobSheet'
import { Badge, Button, ListRow } from '@/components/ui'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import {
  convertLeadToJob,
  createQuoteForLead,
  deleteLead,
  updateLeadStage,
} from '@/lib/api'
import {
  leadSourceBadgeTone,
  leadSourceLabel,
  leadStageLabel,
} from '@/lib/lead-sources'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import { usePremiumGate } from '@/hooks/usePremiumGate'
import type { LeadStage, LeadWithRelations } from '@/lib/types'

function serviceLabel(lead: LeadWithRelations): string {
  if (lead.package?.name) return lead.package.name
  if (lead.service_interest) return lead.service_interest
  return 'Service TBD'
}

function leadSubtitle(lead: LeadWithRelations): string {
  const parts = [
    serviceLabel(lead),
    lead.vehicle_type
      ? lead.vehicle_type.charAt(0).toUpperCase() + lead.vehicle_type.slice(1)
      : null,
    lead.phone,
  ].filter(Boolean)
  return parts.join(' · ')
}

function LeadCardMenu({
  lead,
  onMove,
  onEdit,
  onDelete,
}: {
  lead: LeadWithRelations
  onMove: (stage: LeadStage) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const otherStages = (['inquiry', 'quoted', 'booked'] as const).filter((s) => s !== lead.stage)

  return (
    <div className="pipeline-lead-menu" ref={rootRef}>
      <button
        type="button"
        className="pipeline-lead-menu__trigger"
        data-coach="pipeline-lead-menu"
        aria-label={`Actions for ${lead.name}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
      </button>
      {open ? (
        <div className="pipeline-lead-menu__popover" role="menu">
          {otherStages.map((stage) => (
            <button
              key={stage}
              type="button"
              role="menuitem"
              className="pipeline-lead-menu__item"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onMove(stage)
              }}
            >
              Move to {leadStageLabel(stage)}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="pipeline-lead-menu__item"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onEdit()
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className="pipeline-lead-menu__item pipeline-lead-menu__item--danger"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

interface Props {
  lead: LeadWithRelations
  onEdit: () => void
  onRefresh: () => void
}

export default function PipelineLeadCard({ lead, onEdit, onRefresh }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const { runGated: runCreateQuoteGated } = usePremiumGate('create_quote')
  const { runGated: runCreateJobGated } = usePremiumGate('create_job')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const runCreateQuote = async () => {
    setActionLoading(true)
    try {
      const quote = await createQuoteForLead(lead.id)
      onRefresh()
      router.push(`/quotes/${quote.id}`)
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Could not create quote')
    } finally {
      setActionLoading(false)
      setConfirmOpen(false)
    }
  }

  const handleSendQuote = () => {
    if (lead.quote_id) {
      router.push(`/quotes/${lead.quote_id}`)
      return
    }
    if (!lead.package_id) {
      showMessage('Select a service package on this lead before sending a quote.')
      onEdit()
      return
    }
    if (!lead.client_id) {
      setConfirmOpen(true)
      return
    }
    runCreateQuoteGated(() => void runCreateQuote())
  }

  const handleConvert = async (input?: ScheduleLeadJobInput) => {
    if (lead.job_id) {
      router.push(`/jobs/${lead.job_id}`)
      return
    }
    runCreateJobGated(() => {
      void (async () => {
        setActionLoading(true)
        try {
          const { jobId } = await convertLeadToJob(lead.id, input)
          onRefresh()
          setScheduleOpen(false)
          router.push(`/jobs/${jobId}`)
        } catch (e) {
          showMessage(e instanceof Error ? e.message : 'Could not create job')
        } finally {
          setActionLoading(false)
        }
      })()
    })
  }

  const handleScheduleClick = () => {
    if (lead.job_id) {
      void handleConvert()
      return
    }
    setScheduleOpen(true)
  }

  const handleMove = async (stage: LeadStage) => {
    await updateLeadStage(lead.id, stage)
    onRefresh()
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Remove lead?',
      message: `Remove ${lead.name} from the pipeline?`,
      confirmLabel: 'Remove lead',
      cancelLabel: 'Keep lead',
      destructive: true,
    })
    if (!ok) return
    await deleteLead(lead.id)
    onRefresh()
  }

  const quoteSubtitle = lead.quote?.quote_number
    ? `${lead.quote.quote_number} · ${lead.quote.status}`
    : undefined

  const showQuoteCta = lead.stage === 'quoted' || (lead.stage === 'inquiry' && Boolean(lead.package_id))
  const showScheduleCta = lead.stage === 'booked'

  return (
    <>
      <div className={`pipeline-lead-item${actionLoading ? ' pipeline-lead-item--busy' : ''}`}>
        <ListRow
          title={lead.name}
          subtitle={leadSubtitle(lead)}
          badge={
            <span className="pipeline-lead-row__badges">
              <Badge tone={leadSourceBadgeTone(lead.source)}>{leadSourceLabel(lead.source)}</Badge>
              {quoteSubtitle ? <Badge tone="gray">{quoteSubtitle}</Badge> : null}
            </span>
          }
          trailing={
            <div className="pipeline-lead-row__trailing">
              {lead.quote_amount ? (
                <CurrencyAmount
                  value={lead.quote_amount}
                  variant="revenue"
                  className="ui-list-row__amount"
                />
              ) : null}
              <LeadCardMenu
                lead={lead}
                onMove={handleMove}
                onEdit={onEdit}
                onDelete={() => void handleDelete()}
              />
            </div>
          }
          onClick={onEdit}
        />

        {showQuoteCta ? (
          <div className="pipeline-lead-item__action">
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => void handleSendQuote()}
            >
              {actionLoading ? 'Creating quote…' : lead.quote_id ? 'Open quote' : 'Send quote'}
            </Button>
          </div>
        ) : null}

        {showScheduleCta ? (
          <div className="pipeline-lead-item__action">
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => void handleScheduleClick()}
            >
              {actionLoading ? 'Scheduling…' : lead.job_id ? 'View job' : 'Schedule job'}
            </Button>
          </div>
        ) : null}
      </div>

      {confirmOpen ? (
        <CreateClientConfirmSheet
          lead={lead}
          loading={actionLoading}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => runCreateQuoteGated(() => void runCreateQuote())}
        />
      ) : null}

      {scheduleOpen ? (
        <ScheduleLeadJobSheet
          lead={lead}
          loading={actionLoading}
          onClose={() => setScheduleOpen(false)}
          onConfirm={(input) => void handleConvert(input)}
        />
      ) : null}
    </>
  )
}
