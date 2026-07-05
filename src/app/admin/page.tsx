'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ScreenLoading } from '@/components/ui'
import { getPocketBaseAuthToken } from '@/lib/pb-auth'
import type { OrgSubscription } from '@/lib/subscription'

interface AdminOrg extends OrgSubscription {
  id: string
  name: string
  slug: string
  booking_enabled: boolean
  created: string
}

export default function AdminPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<AdminOrg[]>([])
  const [summary, setSummary] = useState<{ total: number; active: number; trialing: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const token = getPocketBaseAuthToken()
      if (!token) {
        router.replace('/auth')
        return
      }
      try {
        const res = await fetch('/api/admin/orgs', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Forbidden')
          return
        }
        setOrgs(data.orgs ?? [])
        setSummary(data.summary ?? null)
      } catch {
        setError('Could not load admin data')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const patchOrg = async (id: string, body: Record<string, unknown>) => {
    const token = getPocketBaseAuthToken()
    if (!token) return
    const res = await fetch(`/api/admin/orgs/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return
    const data = await res.json()
    setOrgs((current) => current.map((org) => (org.id === id ? { ...org, ...data.org } : org)))
  }

  if (loading) {
    return <ScreenLoading body variant="settings" />
  }

  if (error) {
    return (
      <div className="screen page-content legal-page">
        <h1 className="legal-page__title">Admin</h1>
        <p className="settings-msg settings-msg--error">{error}</p>
      </div>
    )
  }

  return (
    <div className="screen page-content admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Platform admin</h1>
        {summary ? (
          <p className="admin-page__summary">
            {summary.total} orgs · {summary.active} active · {summary.trialing} trialing
          </p>
        ) : null}
      </header>

      <div className="admin-table-wrap card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Trial end</th>
              <th>Booking</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id}>
                <td>
                  <strong>{org.name}</strong>
                  <div className="admin-table__sub">/{org.slug}</div>
                </td>
                <td>{org.plan}</td>
                <td>{org.subscription_status}</td>
                <td>{org.trial_ends_at ?? '—'}</td>
                <td>{org.booking_enabled ? 'On' : 'Off'}</td>
                <td className="admin-table__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth={false}
                    onClick={() =>
                      void patchOrg(org.id, { booking_enabled: !org.booking_enabled })
                    }
                  >
                    Toggle booking
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
