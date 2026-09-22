import { FREE_PLAN, STARTER_PLAN, EARLY_PLAN } from '../../../../packages/core/src/pricing';
export function PricingSection({ onStartTrial }: { onStartTrial: (interest?: 'free' | 'starter') => void }) {
  return <section id="pricing" className="px-6 py-24 bg-[#f7f8f6] border-t border-black/10">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-center">Start your business. Keep costs simple.</h2>
      <p className="text-center my-6">Two plans. No trial countdown. Upgrade when the extra tools help.</p>
      <div className="grid md:grid-cols-2 gap-6 mt-10">{[FREE_PLAN, STARTER_PLAN].map(plan => <article key={plan.id} className="rounded-2xl p-7 bg-white border border-black/10 flex flex-col gap-5">
        <h3 className="text-2xl font-bold">{plan.name}</h3><p className="text-4xl font-bold">{plan.priceLabel}</p><p>{plan.tagline}</p>
        {plan.id === 'starter' && <aside className="rounded-xl bg-green-50 p-4"><strong>Early launch offer · {EARLY_PLAN.priceLabel}</strong><p className="mt-2 text-sm">{EARLY_PLAN.tagline} A waitlist signup does not reserve this offer. Availability is checked when you upgrade.</p></aside>}
        <ul className="space-y-3 flex-1">{plan.features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
        <button className="rinse-primary" onClick={() => onStartTrial(plan.id)}>Join waitlist · {plan.name}</button>
      </article>)}</div>
      <p className="mt-6 text-sm text-center">Customer payment processing costs apply to operators on either plan. No Rinse transaction commission.</p>
    </div>
  </section>;
}
