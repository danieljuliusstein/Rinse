import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { InvoiceDetailBody } from '@/src/components/detail/InvoiceDetailBody'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { ScreenShell } from '@/src/components/ScreenShell'
import { useSafeBack } from '@/src/lib/safe-go-back'

export default function InvoiceDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const goBack = useSafeBack('/(tabs)/invoices')
  const [header, setHeader] = useState<{ title: string; subtitle?: string } | null>(null)

  if (!id) {
    return (
      <ScreenShell title={t('invoices.detail.title')} headerRight={<DetailHeaderActions onBack={goBack} />} invoiceSurface>
        <></>
      </ScreenShell>
    )
  }

  return (
    <ScreenShell
      title={header?.title ?? t('invoices.detail.loading')}
      subtitle={header?.subtitle}
      headerRight={<DetailHeaderActions onBack={goBack} />}
      invoiceSurface
    >
      <InvoiceDetailBody
        invoiceId={id}
        onClose={() => router.back()}
        onMetaChange={setHeader}
        variant="screen"
      />
    </ScreenShell>
  )
}
