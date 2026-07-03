'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, ChatCircle, DotsThreeVertical, Phone, Trash } from '@phosphor-icons/react'
import { deleteClient } from '@/lib/api'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useActionToast } from '@/providers/ActionToastProvider'
import { buildSmsComposeUrl } from '@/lib/sms-compose'
import type { ClientWithStats } from '@/lib/types'

interface ClientCardMenuProps {
  client: ClientWithStats
  onClientRemoved?: (id: string) => void
}

export default function ClientCardMenu({ client, onClientRemoved }: ClientCardMenuProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showMessage } = useActionToast()
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
    const ok = await confirm({
      title: 'Remove client?',
      message: `Remove ${client.name} from your client list? This will permanently delete all of their jobs, vehicles, and related records. This cannot be undone.`,
      confirmLabel: 'Remove client',
      cancelLabel: 'Keep client',
      destructive: true,
    })
    if (!ok) return

    setRemoving(true)
    void deleteClient(client.id).then((result) => {
      if (result.ok) {
        onClientRemoved?.(client.id)
        return
      }
      setRemoving(false)
      showMessage(result.error ?? 'Could not remove this client. Try again.')
    })
  }

  return (
    <div className="client-card-menu" ref={rootRef}>
      <button
        type="button"
        className="client-card-menu-trigger"
        aria-label={`Actions for ${client.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <DotsThreeVertical size={20} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <div className="client-card-menu-popover" role="menu" aria-label="Client actions">
          <a
            href={client.phone ? `tel:${client.phone}` : undefined}
            role="menuitem"
            className={`client-card-menu-item${client.phone ? '' : ' client-card-menu-item--disabled'}`}
            onClick={(e) => {
              e.stopPropagation()
              if (!client.phone) e.preventDefault()
              else setOpen(false)
            }}
          >
            <Phone size={16} aria-hidden="true" />
            Call
          </a>
          <a
            href={
              client.phone
                ? buildSmsComposeUrl(client.phone, `Hi ${client.name.split(' ')[0] || client.name}`) ?? undefined
                : undefined
            }
            role="menuitem"
            className={`client-card-menu-item${client.phone ? '' : ' client-card-menu-item--disabled'}`}
            onClick={(e) => {
              e.stopPropagation()
              if (!client.phone) e.preventDefault()
              else setOpen(false)
            }}
          >
            <ChatCircle size={16} aria-hidden="true" />
            Text
          </a>
          <button
            type="button"
            role="menuitem"
            className="client-card-menu-item client-card-menu-item--primary"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              router.push(`/jobs/new?clientId=${client.id}`)
            }}
          >
            <CalendarPlus size={16} aria-hidden="true" />
            Book job
          </button>
          <button
            type="button"
            role="menuitem"
            className="client-card-menu-item client-card-menu-item--danger"
            disabled={removing}
            onClick={handleRemove}
          >
            <Trash size={16} aria-hidden="true" />
            {removing ? 'Removing…' : 'Remove client'}
          </button>
        </div>
      )}
    </div>
  )
}
