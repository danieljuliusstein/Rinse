import { useEffect, useState } from 'react'
import { useData } from '@/providers/DataProvider'
import { useUi } from '@/providers/UiProvider'
import * as platform from '@/lib/platform-api'
import type { CampaignChannel, CampaignStatus, DeskCampaign } from '@/lib/types'
import { colors } from '@/theme/colors'
import { useOptionalTour } from '@/components/tour/tour-provider'

const STATUSES: CampaignStatus[] = ['draft', 'active', 'paused', 'completed']
const CHANNELS: CampaignChannel[] = ['email', 'sms', 'ads', 'other']

const STATUS_PILL: Record<CampaignStatus, { bg: string; text: string }> = {
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  active: { bg: colors.greenSoft, text: colors.greenText },
  paused: { bg: '#fef3c7', text: '#b45309' },
  completed: { bg: '#e0f2fe', text: '#0369a1' },
}

const fieldClass =
  'mt-1.5 w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-green-400 transition-colors'

type Props = {
  campaign: DeskCampaign
  onBack: () => void
  onSaved: () => Promise<void>
  onDeleted: () => void
}

export default function CampaignEditor({ campaign, onBack, onSaved, onDeleted }: Props) {
  const { clients } = useData()
  const { alert, toast } = useUi()
  const tour = useOptionalTour()
  const [name, setName] = useState(campaign.name)
  const [status, setStatus] = useState<CampaignStatus>(campaign.status)
  const [channel, setChannel] = useState<CampaignChannel>(campaign.channel)
  const [subject, setSubject] = useState(campaign.subject ?? '')
  const [body, setBody] = useState(campaign.body ?? '')
  const [audience, setAudience] = useState<Set<string>>(() => new Set(campaign.audience_ids))
  const [audienceSearch, setAudienceSearch] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(campaign.name)
    setStatus(campaign.status)
    setChannel(campaign.channel)
    setSubject(campaign.subject ?? '')
    setBody(campaign.body ?? '')
    setAudience(new Set(campaign.audience_ids))
  }, [campaign])

  const filteredClients = clients.filter((c) => {
    const q = audienceSearch.trim().toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  })

  const allVisibleSelected =
    filteredClients.length > 0 && filteredClients.every((c) => audience.has(c.id))

  function toggleAudience(id: string) {
    setAudience((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setAudience((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const c of filteredClients) next.delete(c.id)
      } else {
        for (const c of filteredClients) next.add(c.id)
      }
      return next
    })
  }

  async function onSave() {
    setBusy(true)
    if (tour?.active || campaign.id.startsWith('tour-')) {
      toast('Campaign saved')
      tour?.completeStop('campaigns')
      setBusy(false)
      await onSaved()
      return
    }

    try {
      await platform.updateCampaign(campaign.id, {
        name: name.trim() || campaign.name,
        status,
        channel,
        subject,
        body,
        audience_ids: [...audience],
      })
      toast('Campaign saved')
      await onSaved()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed', 'Campaigns')
    } finally {
      setBusy(false)
    }
  }

  async function onSend() {
    setBusy(true)
    if (tour?.active || campaign.id.startsWith('tour-')) {
      toast('Logged outreach to 4 contact(s)')
      tour?.completeStop('campaigns')
      setBusy(false)
      await onSaved()
      return
    }

    try {
      await platform.updateCampaign(campaign.id, {
        name: name.trim() || campaign.name,
        status,
        channel: 'email',
        subject,
        body,
        audience_ids: [...audience],
      })
      const result = await platform.sendCampaignEmail(campaign.id)
      if (result.mode === 'live') {
        const errHint = result.errors.length ? ` · ${result.errors.length} error(s)` : ''
        toast(
          `Sent ${result.sent} via Resend · skipped ${result.skipped}${errHint}`,
          result.sent === 0 && result.skipped > 0 ? 'err' : undefined,
        )
      } else {
        toast(`Logged outreach to ${result.sent} contact(s) · no email delivered`)
      }
      await onSaved()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not send campaign', 'Campaigns')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete “${campaign.name}”? This cannot be undone.`)) return
    setBusy(true)
    if (tour?.active || campaign.id.startsWith('tour-')) {
      toast('Campaign deleted')
      setBusy(false)
      onDeleted()
      return
    }

    try {
      await platform.deleteCampaign(campaign.id)
      toast('Campaign deleted')
      onDeleted()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Campaigns')
      setBusy(false)
    }
  }

  const mailLive = platform.isCampaignMailLive()
  const statusStyle = STATUS_PILL[status]
  const displayName = name.trim() || campaign.name

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h2>
            <span
              className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {status}
            </span>
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-gray-100 text-gray-600">
              {channel}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Sent {campaign.stats_sent} · Opened {campaign.stats_opened} · Clicked{' '}
            {campaign.stats_clicked ?? 0} · {audience.size} contact
            {audience.size === 1 ? '' : 's'} in audience
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDelete()}
            className="px-3 py-1.5 text-xs rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSave()}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSend()}
            className="px-3 py-1.5 text-xs rounded-lg text-white font-semibold disabled:opacity-60"
            style={{ background: colors.green }}
            title={
              mailLive
                ? 'Sends via Resend and tracks unique opens'
                : 'Marks campaign sent and logs email activities — does not deliver mail'
            }
          >
            {mailLive ? 'Send email' : 'Mark sent'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Details card */}
          <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div>
              <h3 className="text-xs font-semibold text-gray-800">Campaign details</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Name, status, and message content</p>
            </div>

            <label className="block text-xs font-medium text-gray-600">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-gray-600">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                  className={`${fieldClass} capitalize`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Channel
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as CampaignChannel)}
                  className={`${fieldClass} capitalize`}
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-xs font-medium text-gray-600">
              Subject
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={fieldClass}
                placeholder="Subject line for logged outreach"
              />
            </label>

            <label className="block text-xs font-medium text-gray-600">
              Message body
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className={`${fieldClass} resize-y min-h-[140px]`}
                placeholder="Message content to log on each contact…"
              />
            </label>

            <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              {mailLive ? (
                <>
                  Send email delivers through Resend to contacts with an address, logs an outbound
                  activity per recipient, and increments unique opens on the dashboard when recipients
                  open the message.
                </>
              ) : (
                <>
                  Mark sent logs an outbound email activity per contact and marks the campaign
                  completed. It does not deliver mail through an ESP. Set{' '}
                  <code className="text-[10px]">VITE_CAMPAIGN_MAIL_URL</code> to enable Resend.
                </>
              )}
            </p>

            {channel !== 'email' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Channel “{channel}” is stored on the campaign only. Mark sent still logs email-type
                activities using the subject/body above.
              </p>
            )}
          </section>

          {/* Audience card */}
          <section className="bg-white border border-gray-100 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden lg:sticky lg:top-5 max-h-[min(560px,calc(100vh-11rem))]">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Audience</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {audience.size} of {clients.length} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="text-[11px] font-medium text-green-700 hover:text-green-800 px-2 py-1 rounded-md hover:bg-green-50"
                >
                  {allVisibleSelected ? 'Clear' : 'Select all'}
                </button>
              </div>
              <div className="relative">
                <input
                  value={audienceSearch}
                  onChange={(e) => setAudienceSearch(e.target.value)}
                  type="text"
                  placeholder="Search contacts…"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-green-400 focus:bg-white"
                />
                <svg
                  className="absolute left-2 top-2 text-gray-400"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
              {filteredClients.map((c) => {
                const checked = audience.has(c.id)
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2.5 px-4 py-2 text-xs cursor-pointer border-b border-gray-50 last:border-0 ${
                      checked ? 'bg-green-50/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 shrink-0"
                      checked={checked}
                      onChange={() => toggleAudience(c.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-800 truncate">{c.name}</span>
                      <span className="block text-[11px] text-gray-400 truncate mt-0.5">
                        {c.email || 'No email'}
                      </span>
                    </span>
                  </label>
                )
              })}
              {filteredClients.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-gray-400">
                  {clients.length === 0 ? 'No contacts yet' : 'No matches'}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="sm:hidden flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete()}
          className="px-3 py-2 text-xs rounded-lg border border-red-100 text-red-600 disabled:opacity-60"
        >
          Delete
        </button>
        <div className="flex-1" />
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSave()}
          className="px-3 py-2 text-xs rounded-lg border border-gray-200 text-gray-700 disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSend()}
          className="px-3 py-2 text-xs rounded-lg text-white font-semibold disabled:opacity-60"
          style={{ background: colors.green }}
          title={
            mailLive
              ? 'Sends via Resend and tracks unique opens'
              : 'Marks campaign sent and logs email activities — does not deliver mail'
          }
        >
          {mailLive ? 'Send email' : 'Mark sent'}
        </button>
      </div>
    </div>
  )
}
