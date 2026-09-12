import { Globe, Moon, Package } from 'lucide-react'
import { Card, CardHeader, CardBody, Field, Select, Toggle, Divider } from '../primitives'
import type { DeskAppSettings } from '@/lib/settings-api'
import { DOCUMENT_LOCALES } from '@/lib/document-locales'
import { COMMON_TIME_ZONES, detectDeviceTimeZone } from '@/lib/quiet-hours'

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  const hr12 = h % 12 === 0 ? 12 : h % 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return { value: h, label: `${hr12}:00 ${ampm}` }
})

function timezoneOptions(current: string) {
  const device = detectDeviceTimeZone()
  const base = COMMON_TIME_ZONES.map((z) => ({ value: z.value, label: z.label }))
  if (!base.some((z) => z.value === device)) {
    base.unshift({ value: device, label: `Device (${device})` })
  }
  if (current && !base.some((z) => z.value === current)) {
    base.unshift({ value: current, label: current.replace(/_/g, ' ') })
  }
  return base
}

export function PreferencesSection({
  settings,
  setSettings,
}: {
  settings: DeskAppSettings
  setSettings: (patch: Partial<DeskAppSettings>) => void
}) {
  const zones = timezoneOptions(settings.timezone)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Locale"
          description="Timezone and document language for invoices and receipts."
          icon={<Globe size={16} />}
          accent
        />
        <CardBody className="space-y-4">
          <Field label="Timezone" htmlFor="tz" hint="Used for quiet hours, scheduling, and reminders.">
            <Select
              id="tz"
              value={settings.timezone}
              onChange={(v) => setSettings({ timezone: v })}
            >
              {zones.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Document language"
            hint="Language of customer invoices, receipts, and share emails. Same list as mobile."
          >
            <Select
              id="doc-locale"
              value={settings.document_locale}
              onChange={(v) =>
                setSettings({
                  document_locale: DOCUMENT_LOCALES.find((l) => l.value === v)?.value ?? 'en',
                })
              }
            >
              {DOCUMENT_LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label} · {l.englishLabel}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Quiet hours"
          description="Auto emails wait until morning in your timezone. Manual sends are unaffected."
          icon={<Moon size={16} />}
        />
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-ink-900">Enable quiet hours</p>
              <p className="text-[12px] text-ink-500">Default 9:00 PM – 8:00 AM</p>
            </div>
            <Toggle
              checked={settings.quiet_hours_enabled}
              onChange={(v) => setSettings({ quiet_hours_enabled: v })}
            />
          </div>
          {settings.quiet_hours_enabled && (
            <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 animate-settings-fade-rise">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-ink-500">
                <Moon size={13} className="text-brand-600" />
                Quiet window
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Quiet start" htmlFor="q-start">
                  <Select
                    id="q-start"
                    value={settings.quiet_start_hour}
                    onChange={(v) => setSettings({ quiet_start_hour: Number(v) || 0 })}
                  >
                    {HOUR_LABELS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quiet end" htmlFor="q-end">
                  <Select
                    id="q-end"
                    value={settings.quiet_end_hour}
                    onChange={(v) => setSettings({ quiet_end_hour: Number(v) || 0 })}
                  >
                    {HOUR_LABELS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Job supplies"
          description="Inventory usage tracking on jobs."
          icon={<Package size={16} />}
        />
        <CardBody>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Package size={15} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink-900">Track job supplies</p>
                <p className="text-[12px] text-ink-500">
                  Log product usage per job for cost tracking.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.track_job_supplies}
              onChange={(v) => setSettings({ track_job_supplies: v })}
            />
          </div>
          <Divider className="my-4" />
          <p className="text-[12px] text-ink-500">
            Travel rate ($/mile) lives under Schedule — same as the mobile app.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
