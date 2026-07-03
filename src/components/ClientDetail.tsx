'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Car,
  ChatText,
  Envelope,
  FileText,
  MapPin,
  PencilSimple,
  Phone,
  Plus,
  Receipt,
  Trash,
} from '@phosphor-icons/react'
import { VehicleTypeIcon } from '@/lib/vehicle-type-icons'
import BackButton from '@/components/BackButton'
import { Button, EmptyState, ListRow, SectionGroup } from '@/components/ui'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import { fmt, mapJobStatusForDisplay } from '@/lib/calculations'
import { vehicleDisplayName } from '@/lib/damage-docs'
import { deleteClient } from '@/lib/api'
import { openMapsDirections } from '@/lib/maps-url'
import { buildSmsComposeUrl } from '@/lib/sms-compose'
import { DEFAULT_AUTO_TEMPLATES, mergeTemplateBodyForContext } from '@/lib/messages'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import type { Client, JobWithRelations, QuoteWithRelations, Vehicle } from '@/lib/types'

interface ClientDetailProps {
  client: Client
  jobs: JobWithRelations[]
  vehicles: Vehicle[]
  quotes: QuoteWithRelations[]
  totalRevenue: number
}

function quoteStatusForBadge(status: string): string {
  if (status === 'accepted') return 'accepted'
  if (status === 'declined' || status === 'expired') return 'declined'
  if (status === 'sent') return 'sent'
  return 'draft'
}

export default function ClientDetail({ client, jobs, vehicles, quotes, totalRevenue }: ClientDetailProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const [removing, setRemoving] = useState(false)
  const avgJob = jobs.length > 0 ? totalRevenue / jobs.length : 0
  const recentQuotes = quotes.slice(0, 3)
  const upcomingJobs = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress')
  const pastJobs = jobs.filter((j) => j.status !== 'scheduled' && j.status !== 'in_progress')
  const billableJobs = jobs.filter(
    (j) => (j.status === 'completed' || j.status === 'paid') && !j.invoice_id
  )

  const handleRemove = async () => {
    const parts = [
      jobs.length > 0 ? `${jobs.length} job${jobs.length === 1 ? '' : 's'}` : null,
      vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    const detail = parts.length > 0 ? ` This will permanently delete ${parts.join(' and ')}.` : ''
    const ok = await confirm({
      title: 'Remove client?',
      message: `Remove ${client.name} from your client list?${detail} This cannot be undone.`,
      confirmLabel: 'Remove client',
      cancelLabel: 'Keep client',
      destructive: true,
    })
    if (!ok) return

    setRemoving(true)
    void deleteClient(client.id).then((result) => {
      if (result.ok) {
        router.replace('/clients')
        return
      }
      setRemoving(false)
      showMessage(result.error ?? 'Could not remove this client. Try again.')
    })
  }

  return (
    <div className="screen page-content body client-detail">
      <header className="client-detail__header">
        <BackButton onClick={() => router.back()} />
        <div className="client-detail__identity">
          <h1 className="client-detail__name">{client.name}</h1>
          {client.phone ? <p className="client-detail__meta">{client.phone}</p> : null}
          {client.email ? <p className="client-detail__meta">{client.email}</p> : null}
          {client.address ? <p className="client-detail__meta">{client.address}</p> : null}
          {client.address ? (
            <button
              type="button"
              className="client-detail__directions"
              onClick={() => openMapsDirections(client.address!)}
            >
              <MapPin size={14} aria-hidden="true" />
              Directions
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="client-detail__edit"
          onClick={() => router.push(`/clients/${client.id}/edit`)}
          aria-label="Edit client"
        >
          <PencilSimple size={20} color="var(--text-muted)" />
        </button>
      </header>

      {(client.phone || client.email) && (
        <div className="client-detail__actions">
          {client.phone ? (
            <a href={`tel:${client.phone}`} className="client-detail__action">
              <Phone size={20} color="var(--text-secondary)" aria-hidden="true" />
              <span>Call</span>
            </a>
          ) : null}
          {client.phone ? (
            <a
              href={
                buildSmsComposeUrl(
                  client.phone,
                  mergeTemplateBodyForContext(
                    DEFAULT_AUTO_TEMPLATES.find((t) => t.id === 'follow_up')?.emailBody ??
                      'Hi {{name}},',
                    { name: client.name },
                  ),
                ) ?? undefined
              }
              className="client-detail__action"
            >
              <ChatText size={20} color="var(--text-secondary)" aria-hidden="true" />
              <span>Text</span>
            </a>
          ) : null}
          {client.email ? (
            <a href={`mailto:${client.email}`} className="client-detail__action">
              <Envelope size={20} color="var(--text-secondary)" aria-hidden="true" />
              <span>Email</span>
            </a>
          ) : null}
        </div>
      )}

      <div className="client-detail__cta-row">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push(`/jobs/new?clientId=${client.id}`)}
        >
          <Plus size={18} aria-hidden="true" />
          New job
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push(`/quotes/new?clientId=${client.id}`)}
        >
          <FileText size={18} aria-hidden="true" />
          Quote
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={billableJobs.length === 0}
          onClick={() => {
            if (billableJobs.length === 1) {
              router.push(`/jobs/${billableJobs[0].id}/invoice`)
            } else {
              router.push('/invoices/new')
            }
          }}
        >
          <Receipt size={18} aria-hidden="true" />
          Invoice
        </Button>
      </div>

      <div className="card client-detail__stats">
        <div className="client-detail__stats-grid">
          {[
            ['Total revenue', fmt(totalRevenue)],
            ['Total jobs', String(jobs.length)],
            ['Avg job', fmt(avgJob)],
            ['Lead source', client.lead_source?.replace(/_/g, ' ') ?? '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="client-detail__stat-label">{label}</div>
              <div
                className={`client-detail__stat-value${
                  label === 'Lead source' ? ' client-detail__stat-value--cap' : ''
                }`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {client.notes?.trim() ? (
        <SectionGroup title="Notes">
          <div className="card client-detail__notes">
            <p>{client.notes}</p>
          </div>
        </SectionGroup>
      ) : null}

      <SectionGroup
        title="Quotes"
        action={
          quotes.length > 0 ? (
            <button
              type="button"
              className="ui-section__action"
              onClick={() => router.push(`/quotes?client=${client.id}`)}
            >
              View all
            </button>
          ) : undefined
        }
      >
        {quotes.length === 0 ? (
          <EmptyState
            illustration="quotes"
            title="No quotes yet"
            description="Send a price estimate before booking."
            actionLabel="Create quote"
            onAction={() => router.push(`/quotes/new?clientId=${client.id}`)}
          />
        ) : (
          recentQuotes.map((q) => (
            <ListRow
              key={q.id}
              icon={<FileText size={18} weight="duotone" />}
              iconTone="blue"
              title={q.quote_number}
              subtitle={q.package?.name ?? '—'}
              badgeStatus={quoteStatusForBadge(q.status)}
              trailing={<CurrencyAmount value={q.subtotal} variant="revenue" className="ui-list-row__amount" />}
              onClick={() => router.push(`/quotes/${q.id}`)}
            />
          ))
        )}
      </SectionGroup>

      <SectionGroup
        title="Vehicles"
        action={
          <button
            type="button"
            className="ui-section__action"
            onClick={() => router.push(`/clients/${client.id}/vehicles/new`)}
          >
            <Plus size={14} weight="bold" aria-hidden="true" />
            Add
          </button>
        }
      >
        {vehicles.length === 0 ? (
          <EmptyState
            illustration="damage"
            title="Add a vehicle"
            description="Document pre-existing damage on each vehicle."
            actionLabel="Add vehicle"
            onAction={() => router.push(`/clients/${client.id}/vehicles/new`)}
          />
        ) : (
          vehicles.map((vehicle) => (
            <ListRow
              key={vehicle.id}
              icon={<VehicleTypeIcon type={vehicle.type} size={18} weight="duotone" />}
              iconTone="green"
              title={vehicleDisplayName(vehicle)}
              subtitle={`${vehicle.plate ? `${vehicle.plate} · ` : ''}${vehicle.type}`}
              onClick={() => router.push(`/clients/${client.id}/vehicles/${vehicle.id}`)}
            />
          ))
        )}
      </SectionGroup>

      <SectionGroup title="Upcoming">
        {upcomingJobs.length === 0 ? (
          <EmptyState
            illustration="jobs"
            title="Nothing scheduled"
            description="Book a job for this client from Home or New job above."
            actionLabel="New job"
            onAction={() => router.push(`/jobs/new?clientId=${client.id}`)}
          />
        ) : (
          upcomingJobs.map((job) => (
            <ListRow
              key={job.id}
              icon={<Car size={18} weight="duotone" />}
              iconTone="amber"
              title={job.package?.name ?? 'Job'}
              subtitle={`${new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })} · Tap to complete`}
              badgeStatus={mapJobStatusForDisplay(job)}
              trailing={<CurrencyAmount value={job.revenue} variant="revenue" className="ui-list-row__amount" />}
              onClick={() => router.push(`/jobs/${job.id}`)}
            />
          ))
        )}
      </SectionGroup>

      <SectionGroup title="Job history">
        {pastJobs.length === 0 ? (
          <EmptyState
            illustration="jobs"
            title="No completed jobs yet"
            description="Finished jobs and invoices appear here."
          />
        ) : (
          pastJobs.map((job) => (
            <ListRow
              key={job.id}
              icon={<Car size={18} weight="duotone" />}
              iconTone="green"
              title={job.package?.name ?? 'Job'}
              subtitle={new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              badgeStatus={mapJobStatusForDisplay(job)}
              trailing={<CurrencyAmount value={job.revenue} variant="revenue" className="ui-list-row__amount" />}
              onClick={() => router.push(`/jobs/${job.id}`)}
            />
          ))
        )}
      </SectionGroup>

      <Button variant="danger" fullWidth disabled={removing} onClick={handleRemove}>
        <Trash size={16} aria-hidden="true" />
        {removing ? 'Removing…' : 'Remove client'}
      </Button>
    </div>
  )
}
