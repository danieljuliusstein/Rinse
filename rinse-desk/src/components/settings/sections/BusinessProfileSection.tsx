import { Building2, MapPin, FileText, Route, Globe } from 'lucide-react'
import { Card, CardHeader, CardBody, Field, TextInput, TextArea } from '../primitives'
import type { DeskAppSettings } from '@/lib/settings-api'

const TEMPLATES = [
  { id: 'rinse' as const, label: 'Rinse', note: 'Branded, green accents' },
  { id: 'classic' as const, label: 'Classic', note: 'Traditional layout' },
  { id: 'minimal' as const, label: 'Minimal', note: 'Clean, text-forward' },
]

export function BusinessProfileSection({
  settings,
  setSettings,
}: {
  settings: DeskAppSettings
  setSettings: (patch: Partial<DeskAppSettings>) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Shop identity"
          description="How customers and invoices see your shop."
          icon={<Building2 size={16} />}
          accent
        />
        <CardBody className="space-y-4">
          <Field
            label="Business name"
            htmlFor="biz-name"
            hint="Required. Appears under Rinse Desk in the sidebar and on invoices."
          >
            <TextInput
              id="biz-name"
              value={settings.business_name}
              onChange={(v) => setSettings({ business_name: v })}
              placeholder="Your shop name"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Public phone" htmlFor="biz-phone">
              <TextInput
                id="biz-phone"
                value={settings.business_phone}
                onChange={(v) => setSettings({ business_phone: v })}
                inputMode="tel"
                placeholder="(310) 555-0142"
              />
            </Field>
            <Field label="Booking email" htmlFor="biz-email" hint="Where confirmations are sent.">
              <TextInput
                id="biz-email"
                value={settings.business_email}
                onChange={(v) => setSettings({ business_email: v })}
                inputMode="email"
                type="email"
                placeholder="hello@yourshop.com"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Business address"
          description="Also used as the Routes depot start and end point."
          icon={<MapPin size={16} />}
        />
        <CardBody className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-brand-200/70 bg-brand-50/60 px-3.5 py-2.5">
            <Route size={15} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-[12.5px] leading-snug text-brand-700">
              <span className="font-semibold">Depot for Routes.</span> Daily routes start and end
              here. Optimization runs against this address.
            </p>
          </div>
          <Field label="Street address" htmlFor="biz-addr">
            <TextInput
              id="biz-addr"
              value={settings.business_address}
              onChange={(v) => setSettings({ business_address: v })}
              placeholder="1280 Lincoln Blvd, Unit B"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Invoice defaults"
          description="Terms footer and template applied to new invoices."
          icon={<FileText size={16} />}
        />
        <CardBody className="space-y-4">
          <Field
            label="Invoice terms footer"
            htmlFor="biz-footer"
            hint="Printed at the bottom of every invoice."
          >
            <TextArea
              id="biz-footer"
              value={settings.invoice_terms_footer}
              onChange={(v) => setSettings({ invoice_terms_footer: v })}
              rows={4}
              placeholder="Due on receipt. Thank you for your business."
            />
          </Field>
          <Field label="Invoice template">
            <div className="grid grid-cols-3 gap-2.5">
              {TEMPLATES.map((t) => {
                const selected = settings.invoice_template === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSettings({ invoice_template: t.id })}
                    className={`relative rounded-xl border p-3 text-left transition-all duration-150 ${
                      selected
                        ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/15'
                        : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/40'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`text-[13px] font-semibold ${
                          selected ? 'text-brand-700' : 'text-ink-900'
                        }`}
                      >
                        {t.label}
                      </span>
                      {selected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-2.5 w-2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-tight text-ink-500">{t.note}</p>
                  </button>
                )
              })}
            </div>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Website & embed security"
          description="Protect your live booking widget on your website."
          icon={<Globe size={16} />}
        />
        <CardBody className="space-y-4">
          <Field
            label="Allowed website domains"
            htmlFor="allowed-origins"
            hint="Enter your website address (e.g. https://sparkledetailing.com). One per line or comma-separated. Limits iframe embedding to only your approved sites."
          >
            <TextArea
              id="allowed-origins"
              rows={3}
              value={settings.allowed_origins.join('\n')}
              onChange={(v) =>
                setSettings({
                  allowed_origins: v
                    .split(/[,\n]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="https://yourwebsite.com&#10;https://www.yourwebsite.com"
            />
          </Field>
        </CardBody>
      </Card>
    </div>
  )
}
