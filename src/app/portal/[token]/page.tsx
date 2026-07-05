import { Suspense } from 'react'
import PortalView from '@/components/portal/PortalView'
import PortalErrorScreen from '@/components/portal/PortalErrorScreen'
import ScreenLoading from '@/components/ui/ScreenLoading'
import { buildPortalPayload, loadPortalBusiness } from '@/lib/server/portal-data'
import { getRequestAppBaseUrl, validatePortalToken } from '@/lib/server/portal-tokens'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const record = await validatePortalToken(token)

  if (!record) {
    const business = { name: 'Detailing', phone: '', email: '', address: '' }
    return <PortalErrorScreen type="LINK_EXPIRED" business={business} />
  }

  const payload = await buildPortalPayload(record, await getRequestAppBaseUrl())
  if (!payload) {
    const baseUrl = await getRequestAppBaseUrl()
    const orgId = record.organization_id ?? ''
    const business = orgId
      ? await loadPortalBusiness(baseUrl, orgId).catch(() => ({
          name: 'Detailing',
          phone: '',
          email: '',
          address: '',
        }))
      : { name: 'Detailing', phone: '', email: '', address: '' }
    return <PortalErrorScreen type="UNAVAILABLE" business={business} />
  }

  return (
    <Suspense
      fallback={
        <div className="portal-root client-light-root">
          <div className="portal-body">
            <ScreenLoading variant="detail" />
          </div>
        </div>
      }
    >
      <PortalView payload={payload} token={token} />
    </Suspense>
  )
}
