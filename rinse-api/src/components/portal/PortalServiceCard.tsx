import type { DocumentLocale } from '@rinse/core'
import { getDocumentStrings, normalizeDocumentLocale } from '@rinse/core'
import type { PortalPayload } from '@/lib/server/portal-data'
import { capitalize, formatPortalDate } from '@/lib/portal-display'

export default function PortalServiceCard({
  job,
  locale,
}: {
  job: NonNullable<PortalPayload['job']>
  locale?: DocumentLocale
}) {
  const s = getDocumentStrings(normalizeDocumentLocale(locale))

  return (
    <div className="portal-card">
      <div className="portal-card-inner">
        <div className="portal-section-label">{s.service}</div>
        <div className="portal-service-row">
          <span className="portal-service-key">{s.package}</span>
          <span className="portal-service-val">{job.packageName}</span>
        </div>
        <div className="portal-service-row">
          <span className="portal-service-key">{s.vehicle}</span>
          <span className="portal-service-val">{capitalize(job.vehicleType)}</span>
        </div>
        <div className="portal-service-row">
          <span className="portal-service-key">{s.location}</span>
          <span className="portal-service-val">
            {job.locationType === 'mobile' ? s.mobileDetail : s.shopDetail}
          </span>
        </div>
        <div className="portal-service-row">
          <span className="portal-service-key">{s.date}</span>
          <span className="portal-service-val">{formatPortalDate(job.date)}</span>
        </div>
      </div>
    </div>
  )
}
