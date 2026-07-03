'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, ChatText, CheckCircle, FileText, MapPin, PencilSimple, Receipt, Trash } from '@phosphor-icons/react'
import JobPhotosEntry from '@/components/jobs/JobPhotosEntry'
import JobTimer from '@/components/jobs/JobTimer'
import { suggestNextServiceDate } from '@/lib/next-service'
import { normalizeReturnDays } from '@/lib/package-cadence'
import BackButton from '@/components/BackButton'
import { Badge, Button, ListRow, SectionGroup } from '@/components/ui'
import ShareLinkActions from '@/components/portal/ShareLinkActions'
import { SHARE_LINK_PRESETS } from '@/lib/share-link-presets'
import { openMapsDirections } from '@/lib/maps-url'
import { deleteJob, getJob, getQuotes, updateJob } from '@/lib/api'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import {
  effectiveRate,
  fmtDetailed,
  jobExpensesForDisplay,
  marginPct,
  netProfit,
} from '@/lib/calculations'
import { buildJobEditData } from '@/lib/job-edit-data'
import { loadSettingsAsync } from '@/lib/settings'
import { DEFAULT_AUTO_TEMPLATES, mergeTemplateBodyForContext } from '@/lib/messages'
import { buildSmsComposeUrl } from '@/lib/sms-compose'
import { isCompletingJob } from '@/lib/supplies-logic'
import type { ExpenseLine, JobStatus, JobWithRelations } from '@/lib/types'

const statusToJobBadge = (displayStatus: JobStatus | 'overdue'): string => {
  if (displayStatus === 'overdue') return 'overdue'
  if (displayStatus === 'paid') return 'paid'
  if (displayStatus === 'invoiced') return 'sent'
  if (displayStatus === 'in_progress') return 'in_progress'
  if (displayStatus === 'scheduled') return 'scheduled'
  return 'draft'
}

const expenseLabel: Record<ExpenseLine['category'], string> = {
  supplies: 'Supplies used',
  travel: 'Gas/travel',
  equipment: 'Equipment',
  marketing: 'Marketing',
  labor: 'Labor',
  other: 'Other',
}

interface JobDetailProps {
  job: JobWithRelations
}

export default function JobDetail({ job: initialJob }: JobDetailProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const [job, setJob] = useState(initialJob)
  const [cancelling, setCancelling] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | null>(null)

  useEffect(() => {
    setJob(initialJob)
  }, [initialJob])

  useEffect(() => {
    let cancelled = false
    void getQuotes().then((quotes) => {
      if (cancelled) return
      const linked = quotes.find((q) => q.job_id === job.id)
      setLinkedQuoteId(linked?.id ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [job.id])
  const expenses = jobExpensesForDisplay(job)
  const profit = netProfit(job)
  const rate = effectiveRate(job)
  const margin = marginPct(job)

  const displayStatus =
    job.invoice?.status === 'overdue'
      ? 'overdue'
      : job.status

  const payments = job.invoice?.payments ?? []
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const balanceDue = (job.revenue + job.tip) - totalPaid

  const invoiceNumber = job.invoice?.invoice_number
  const dateLabel = new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const isPostService =
    job.status === 'completed' || job.status === 'invoiced' || job.status === 'paid'

  const showNextService =
    (job.status === 'completed' || job.status === 'paid' || job.status === 'invoiced') &&
    job.package &&
    job.client
  const returnDays = normalizeReturnDays(job.package?.expected_return_days)
  const nextServiceDate = showNextService ? suggestNextServiceDate(job.date, returnDays) : null

  const isUpcoming = job.status === 'scheduled' || job.status === 'in_progress'

  const smsTemplateId = isPostService ? 'job_completion' : 'appointment_reminder'
  const smsTemplate = DEFAULT_AUTO_TEMPLATES.find((t) => t.id === smsTemplateId)
  const smsComposeUrl =
    job.client?.phone && smsTemplate
      ? buildSmsComposeUrl(
          job.client.phone,
          mergeTemplateBodyForContext(smsTemplate.emailBody, {
            name: job.client.name,
            packageName: job.package?.name,
            date: dateLabel,
            time: job.start_time
              ? new Date(`1970-01-01T${job.start_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : undefined,
          }),
        )
      : null

  const handleMarkComplete = async () => {
    if (isCompletingJob(job.status, 'completed')) {
      const appSettings = await loadSettingsAsync()
      if (appSettings.track_job_supplies) {
        router.push(`/jobs/${job.id}/edit`)
        showMessage('Log supplies used, then set status to Complete')
        return
      }
    }

    setCompleting(true)
    try {
      const updated = await updateJob(job.id, buildJobEditData(job, { status: 'completed' }))
      if (!updated) {
        showMessage('Could not mark job complete')
        return
      }
      const refreshed = await getJob(job.id)
      if (refreshed) setJob(refreshed)
      showMessage('Job marked complete — you can invoice from here')
    } catch {
      showMessage('Could not mark job complete')
    } finally {
      setCompleting(false)
    }
  }

  const handleCancel = async () => {
    const cancelDateLabel = new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const clientName = job.client?.name ?? 'this client'
    const ok = await confirm({
      title: 'Cancel appointment?',
      message: `Cancel the appointment for ${clientName} on ${cancelDateLabel}? The time slot will be freed on your website calendar. This cannot be undone.`,
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep appointment',
      destructive: true,
    })
    if (!ok) return

    setCancelling(true)
    void deleteJob(job.id).then((result) => {
      if (result.ok) {
        router.replace('/jobs')
        return
      }
      setCancelling(false)
      showMessage(result.error ?? 'Could not cancel this appointment. Try again.')
    })
  }

  return (
    <div className="screen page-content body job-detail-screen">
      <div className="job-detail-header">
        <BackButton onClick={() => router.back()} />
        <div className="job-detail-header__body">
          <div className="job-detail-header__name">{job.client?.name ?? 'Unknown client'}</div>
          <div className="job-detail-header__meta">
            {invoiceNumber ? `${invoiceNumber} · ` : ''}
            {dateLabel}
          </div>
        </div>
        <Badge key={statusToJobBadge(displayStatus)} status={statusToJobBadge(displayStatus)} />
      </div>

      {isUpcoming ? (
        <Button fullWidth disabled={completing} onClick={() => void handleMarkComplete()}>
          <CheckCircle size={18} weight="bold" aria-hidden="true" />
          {completing ? 'Marking complete…' : 'Mark job complete'}
        </Button>
      ) : null}

      <div className="card job-detail-card-spaced">
        <div className="job-detail-kv-grid">
          {[
            ['Package', job.package?.name ?? '—'],
            ['Vehicle', `${job.vehicle_type.charAt(0).toUpperCase() + job.vehicle_type.slice(1)}`],
            ['Location', job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1)],
            ['Hours worked', job.hours_worked > 0 ? `${job.hours_worked} hrs` : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="job-detail-kv__label">{label}</div>
              <div className="job-detail-kv__value">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {job.location_type === 'mobile' && job.client?.address ? (
        <div className="detail-context-links job-detail-card-spaced">
          <button
            type="button"
            className="detail-context-link detail-context-link--full"
            onClick={() => openMapsDirections(job.client!.address!)}
          >
            <MapPin size={18} aria-hidden="true" />
            Directions — {job.client.address}
          </button>
        </div>
      ) : null}

      {smsComposeUrl ? (
        <div className="detail-context-links job-detail-card-spaced">
          <a href={smsComposeUrl} className="detail-context-link detail-context-link--full">
            <ChatText size={18} aria-hidden="true" />
            Text client — open in Messages
          </a>
        </div>
      ) : null}

      <div className="card job-detail-card-spaced">
        <div className="job-detail-money-row">
          <span className="job-detail-money-row__label">Revenue</span>
          <span className="money job-detail-money-row__value">{fmtDetailed(job.revenue)}</span>
        </div>
        {job.tip > 0 && (
          <div className="job-detail-money-row">
            <span className="job-detail-money-row__label">Tip</span>
            <span className="money job-detail-money-row__value">{fmtDetailed(job.tip)}</span>
          </div>
        )}

        {expenses.length > 0 && <div className="divider" />}

        {expenses.map((exp, i) => (
          <div key={i} className="job-detail-money-row">
            <span className="job-detail-money-row__label">
              {expenseLabel[exp.category]}
              {exp.description ? ` · ${exp.description}` : ''}
            </span>
            <span className="money money-negative">−{fmtDetailed(exp.amount)}</span>
          </div>
        ))}

        <div className="divider" />

        <div className="job-detail-money-row job-detail-money-row--profit">
          <span className="job-detail-money-row__label">Net profit</span>
          <span className={`money ${profit >= 0 ? 'money-positive' : 'money-negative'}`}>
            {fmtDetailed(profit)}
          </span>
        </div>

        <div className="job-detail-money-footer">
          <span>
            Margin{' '}
            <span
              className={`money job-detail-margin--${
                margin >= 50 ? 'good' : margin >= 30 ? 'warn' : 'bad'
              }`}
            >
              {margin}%
            </span>
          </span>
          {rate !== null && (
            <span>
              Effective rate{' '}
              <span className="money job-detail-effective-rate">
                ${rate.toFixed(2)}/hr
              </span>
            </span>
          )}
        </div>
      </div>

      {(job.status === 'invoiced' || job.status === 'paid' || job.invoice) && payments.length > 0 && (
        <div className="card job-detail-card-spaced">
          <div className="section-title job-detail-section-title">Payments</div>
          {payments.map((p, i) => (
            <div key={i} className="job-detail-money-row job-detail-money-row--compact">
              <span className="job-detail-money-row__label">
                {p.method} · {new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="money money-positive">{fmtDetailed(p.amount)}</span>
            </div>
          ))}
          {balanceDue > 0 && job.invoice && (
            <>
              <div className="divider" />
              <div className="job-detail-money-row">
                <span className="job-detail-balance-due">Balance due</span>
                <span className="money job-detail-balance-due__value">{fmtDetailed(balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {nextServiceDate && job.client && job.package && (
        <div className="card job-detail-card-spaced">
          <div className="section-title">Next service</div>
          <div className="job-detail-next-service">
            Suggested:{' '}
            {new Date(nextServiceDate + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            <span className="job-detail-next-service__cadence"> ({returnDays}-day cadence)</span>
          </div>
          <Button
            fullWidth
            onClick={() =>
              router.push(
                `/jobs/new?clientId=${job.client_id}&packageId=${job.package_id}&date=${nextServiceDate}`
              )
            }
          >
            <CalendarPlus size={18} /> Book next
          </Button>
        </div>
      )}

      {linkedQuoteId ? (
        <div className="detail-context-links">
          <button
            type="button"
            className="detail-context-link detail-context-link--full"
            onClick={() => router.push(`/quotes/${linkedQuoteId}`)}
          >
            <FileText size={18} aria-hidden="true" />
            View quote
          </button>
        </div>
      ) : job.client_id && job.package_id ? (
        <div className="detail-context-links">
          <button
            type="button"
            className="detail-context-link detail-context-link--full"
            onClick={() =>
              router.push(
                `/quotes/new?clientId=${job.client_id}&packageId=${job.package_id}&vehicleType=${job.vehicle_type}&locationType=${job.location_type}`
              )
            }
          >
            <FileText size={18} aria-hidden="true" />
            Create quote
          </button>
        </div>
      ) : null}

      {isUpcoming && job.client ? (
        <div className="card job-detail-phase job-detail-card-spaced">
          <div className="section-title">{SHARE_LINK_PRESETS.appointment.sectionTitle}</div>
          <p className="job-detail-phase__hint">
            Send a confirmation link before the appointment. Invoicing is available after the job is complete.
          </p>
          <ShareLinkActions
            clientId={job.client_id}
            clientEmail={job.client.email}
            clientName={job.client.name}
            jobId={job.id}
            context="appointment"
          />
        </div>
      ) : null}

      {isPostService ? (
        <SectionGroup title="Invoice">
          <ListRow
            icon={<Receipt size={18} weight="duotone" />}
            iconTone="green"
            title={job.invoice ? job.invoice.invoice_number : 'Create invoice'}
            subtitle={
              job.invoice
                ? `${job.invoice.status}${balanceDue > 0 ? ` · ${fmtDetailed(balanceDue)} due` : ''}`
                : 'Generate and send to client'
            }
            badgeStatus={job.invoice?.status}
            onClick={() => router.push(`/jobs/${job.id}/invoice`)}
          />
        </SectionGroup>
      ) : null}

      {isUpcoming ? (
        <JobTimer
          jobId={job.id}
          onStopped={(hours) => {
            if (hours > 0) {
              showMessage(`Tracked ${hours.toFixed(2)} hrs — update hours on edit if needed`)
            }
          }}
        />
      ) : null}

      <JobPhotosEntry job={job} onPress={() => router.push(`/jobs/${job.id}/photos`)} />

      {job.notes && (
        <div className="card job-detail-card-spaced">
          <div className="section-title">Notes</div>
          <div className="job-detail-notes">{job.notes}</div>
        </div>
      )}

      {isPostService && job.client ? (
        <div className="card job-detail-phase job-detail-card-spaced">
          <div className="section-title">{SHARE_LINK_PRESETS.full.sectionTitle}</div>
          <p className="job-detail-phase__hint">Share invoice, photos, and service details after the job.</p>
          <ShareLinkActions
            clientId={job.client_id}
            clientEmail={job.client.email}
            clientName={job.client.name}
            jobId={job.id}
            context="full"
            invoiceNumber={job.invoice?.invoice_number}
          />
        </div>
      ) : null}

      <button className="btn-ghost job-detail-full-btn" onClick={() => router.push(`/jobs/${job.id}/edit`)}>
        <PencilSimple size={16} weight="regular" color="var(--text-secondary)" />
        Edit job
      </button>

      {isUpcoming ? (
        <button
          type="button"
          className="btn-danger job-detail-full-btn"
          disabled={cancelling}
          onClick={handleCancel}
        >
          <Trash size={16} weight="regular" aria-hidden="true" />
          {cancelling ? 'Cancelling…' : 'Cancel appointment'}
        </button>
      ) : null}
    </div>
  )
}
