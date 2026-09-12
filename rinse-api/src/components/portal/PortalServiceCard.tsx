import type { PortalPayload } from '@/lib/server/portal-data'
import { capitalize, formatPortalDate } from '@/lib/portal-display'

export default function PortalServiceCard({ job }: { job: NonNullable<PortalPayload['job']> }) {
  return (
    <div className="portal-card">
      <div className="portal-card-inner">
        <div className="portal-section-label">Service</div>
        <div className="portal-service-row">
          <span className="portal-service-key">Package</span>
          <span className="portal-service-val">{job.packageName}</span>
        </div>
        <div className="portal-service-row">
          <span className="portal-service-key">Vehicle</span>
          <span className="portal-service-val">{capitalize(job.vehicleType)}</span>
        </div>
        <div className="portal-service-row">
          <span className="portal-service-key">Location</span>
          <span className="portal-service-val">
            {job.locationType === 'mobile' ? 'Mobile detail' : 'Shop detail'}
          </span>
        </div>
        <div className="portal-service-row">
          <span className="portal-service-key">Date</span>
          <span className="portal-service-val">{formatPortalDate(job.date)}</span>
        </div>
      </div>
    </div>
  )
}
