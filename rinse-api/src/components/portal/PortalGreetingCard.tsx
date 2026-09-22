export default function PortalGreetingCard({
  clientName,
  subtitle,
  preparedForLabel = 'Prepared for',
  hiNameLabel = 'Hi,',
}: {
  clientName: string
  subtitle?: string
  preparedForLabel?: string
  hiNameLabel?: string
}) {
  return (
    <div className="portal-card">
      <div className="portal-card-inner">
        <div className="portal-section-label">{preparedForLabel}</div>
        <div className="portal-greeting-name">{hiNameLabel} {clientName}</div>
        {subtitle && <div className="portal-greeting-sub">{subtitle}</div>}
      </div>
    </div>
  )
}
