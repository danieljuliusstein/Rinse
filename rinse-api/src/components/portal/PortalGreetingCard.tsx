export default function PortalGreetingCard({
  clientName,
  subtitle,
}: {
  clientName: string
  subtitle?: string
}) {
  return (
    <div className="portal-card">
      <div className="portal-card-inner">
        <div className="portal-section-label">Prepared for</div>
        <div className="portal-greeting-name">Hi, {clientName}</div>
        {subtitle && <div className="portal-greeting-sub">{subtitle}</div>}
      </div>
    </div>
  )
}
