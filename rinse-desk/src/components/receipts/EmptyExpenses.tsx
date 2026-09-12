import { ArrowRight, Camera, FileText, Plus, ReceiptText, Smartphone } from 'lucide-react'

type Props = {
  onLog: () => void
  variant?: 'none' | 'no-results'
  query?: string
}

export function EmptyExpenses({ onLog, variant = 'none', query }: Props) {
  if (variant === 'no-results') {
    return (
      <div className="mx-8 flex animate-receipts-fade-up flex-col items-center justify-center rounded-2xl bg-white px-8 py-16 text-center ring-1 ring-ink-200">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
          <ReceiptText className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-[16px] font-semibold text-ink-900">
          No expenses match “{query}”
        </h3>
        <p className="mt-1.5 max-w-sm text-[13px] text-ink-500">
          Try a different vendor, category, or name. Your full expense log is still here — just
          filtered out for now.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-8 animate-receipts-fade-up overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200 shadow-card">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 to-ink-100 p-8 receipts-paper-grain">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-200/40 blur-3xl animate-receipts-glow-drift" />
          <div
            className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-brand-400/20 blur-3xl animate-receipts-glow-drift"
            style={{ animationDelay: '4s' }}
          />

          <div className="pointer-events-none absolute right-8 top-8 hidden h-36 w-28 select-none sm:block">
            <div
              className="animate-receipts-wiggle absolute inset-0 rotate-6 rounded-lg bg-white/90 shadow-lg ring-1 ring-ink-200 backdrop-blur-sm"
              style={{ animationDelay: '0s' }}
            />
            <div
              className="animate-receipts-wiggle absolute inset-0 -rotate-3 rounded-lg bg-white/95 shadow-lg ring-1 ring-ink-200 backdrop-blur-sm"
              style={{ animationDelay: '1.5s' }}
            />
            <div
              className="animate-receipts-wiggle absolute inset-0 rounded-lg bg-white shadow-xl ring-1 ring-ink-200"
              style={{ animationDelay: '0.8s', ['--tw-rotate' as string]: '2deg' }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-1.5 p-3">
                <div className="h-1.5 w-10 rounded-full bg-brand-400" />
                <div className="h-1 w-12 rounded-full bg-ink-200" />
                <div className="h-1 w-9 rounded-full bg-ink-200" />
                <div className="mt-1 h-1 w-7 rounded-full bg-ink-200" />
                <div className="my-1 h-px w-full border-t border-dashed border-ink-300" />
                <div className="h-1.5 w-8 rounded-full bg-ink-800/80" />
              </div>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 animate-receipts-pulse-ring" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              </span>
              Receipts · Expenses
            </span>
            <h2 className="mt-4 max-w-xs text-[26px] font-bold leading-tight tracking-tight text-ink-900">
              Every dollar your shop spends, with the paper to prove it.
            </h2>
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ink-500">
              Log expenses from the desk or the field. Attach a receipt photo so it&apos;s
              audit-ready — this tab is where your expense paper trail lives.
            </p>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={onLog}
              className="group flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(22,163,74,0.3),0_10px_24px_-10px_rgba(22,163,74,0.55)] transition-all hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Log your first expense
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="mt-2.5 text-[11px] text-ink-400">
              Takes 10 seconds. Attach a receipt photo now or later from the edit panel.
            </p>
          </div>
        </div>

        <div className="border-t border-ink-200 bg-ink-50 p-8 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
            How expenses land here
          </p>

          <ol className="mt-5 space-y-5">
            {[
              {
                n: 1,
                icon: <Smartphone className="h-4 w-4" />,
                title: 'Log from desk or the road',
                body: 'Fuel, chemicals, a quick parts run — entered here or on mobile with an optional photo of the receipt.',
                muted: false,
              },
              {
                n: 2,
                icon: <Camera className="h-4 w-4" />,
                title: 'Receipt photo attached',
                body: 'Upload from Desk or snap on mobile. It shows as a thumbnail here and opens in a lightbox for proof.',
                muted: true,
              },
              {
                n: 3,
                icon: <FileText className="h-4 w-4" />,
                title: 'Desk reviews & light-edits',
                body: 'Fix a typo, reclassify the category, adjust the amount, or replace the receipt photo.',
                muted: true,
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-3.5">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      step.muted
                        ? 'bg-ink-100 text-ink-400 ring-1 ring-ink-200'
                        : 'bg-brand-100 text-brand-600'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="absolute -left-3 top-1 text-[10px] font-bold text-ink-300">
                    0{step.n}
                  </span>
                  {step.n < 3 ? <span className="mt-1 h-4 w-px bg-ink-300" /> : null}
                </div>
                <div className="pt-0.5">
                  <p className="text-[13px] font-semibold text-ink-900">{step.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-7 rounded-xl border border-dashed border-ink-300 bg-ink-100 p-3.5">
            <p className="text-[11px] leading-relaxed text-ink-500">
              <span className="font-semibold text-ink-600">Lives elsewhere:</span> spend totals,
              category breakdowns, and tax-ready exports are on the{' '}
              <span className="font-medium">Money</span> tab. This tab is proof + records, not
              analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
