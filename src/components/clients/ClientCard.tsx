'use client'

import { MapPin } from '@phosphor-icons/react'
import CurrencyAmount from '@/components/ui/CurrencyAmount'
import MorphSurface from '@/components/ui/MorphSurface'
import ClientCardMenu from '@/components/clients/ClientCardMenu'
import { useDetailNavigation } from '@/hooks/useDetailNavigation'
import { openMapsDirections } from '@/lib/maps-url'
import {
  timeAgo,
  type ClientDerived,
  type ClientTag,
} from '@/lib/client-relationship-logic'
import type { ClientWithStats } from '@/lib/types'

const TAG_LABELS: Record<Exclude<ClientTag, null>, string> = {
  followup: 'Follow up',
  new: 'New',
}

const AVATAR_CLASS = {
  followup: 'amber',
  new: 'blue',
  vip: 'green',
  default: 'gray',
} as const

interface ClientCardProps {
  client: ClientWithStats
  derived: ClientDerived
  onClientRemoved?: (id: string) => void
}

export default function ClientCard({ client, derived, onClientRemoved }: ClientCardProps) {
  const { openClient } = useDetailNavigation()
  const avatarTone =
    derived.tag === 'followup'
      ? AVATAR_CLASS.followup
      : derived.tag === 'new'
        ? AVATAR_CLASS.new
        : derived.isVip
          ? AVATAR_CLASS.vip
          : AVATAR_CLASS.default

  const lastServiceLine = client.lastJobDate && client.lastServiceName
    ? `${client.lastServiceName} · ${timeAgo(client.lastJobDate)}`
    : client.lastJobDate
      ? timeAgo(client.lastJobDate)
      : 'No jobs yet'

  const openDetail = () => openClient(client.id)

  return (
    <div className={`client-card${derived.isVip ? ' vip' : ''}`}>
      <MorphSurface layoutId={`client-${client.id}`} as="button" className="client-card-main" onClick={openDetail}>
        <div className={`avatar ${avatarTone}`}>{derived.initials}</div>
        <div className="client-body">
          <div className="client-name">{client.name}</div>
          <div className="client-meta">{lastServiceLine}</div>
          {(derived.isVip || derived.tag) && (
            <div className="client-tags">
              {derived.isVip && <span className="badge green">VIP</span>}
              {derived.tag && (
                <span className={`badge ${derived.tag === 'followup' ? 'amber' : 'blue'}`}>
                  {TAG_LABELS[derived.tag]}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="client-right">
          <CurrencyAmount value={client.totalRevenue} variant="revenue" className="client-amount" />
          <div className="client-jobs">
            {client.jobCount} job{client.jobCount !== 1 ? 's' : ''}
          </div>
        </div>
      </MorphSurface>
      {client.address?.trim() ? (
        <button
          type="button"
          className="client-card-map"
          aria-label={`Navigate to ${client.name}`}
          onClick={() => openMapsDirections(client.address!)}
        >
          <MapPin size={16} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
      <ClientCardMenu client={client} onClientRemoved={onClientRemoved} />
    </div>
  )
}
