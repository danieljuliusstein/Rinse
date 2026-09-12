import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import * as api from '@/lib/api'
import * as platform from '@/lib/platform-api'
import { emailOutreachStats } from '@/lib/metrics'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DeskActivity, DeskCampaign, DeskPackage } from '@/lib/types'
import { SoftBlobBackdrop } from '@/components/graphics/SoftBlobs'
import { RevenueWonCard } from '@/components/dashboard/RevenueWonCard'
import { NewContactsCard } from '@/components/dashboard/NewContactsCard'
import { DealsByPipelineCard } from '@/components/dashboard/DealsByPipelineCard'
import { InvoiceCollectionCard } from '@/components/dashboard/InvoiceCollectionCard'
import { ContactsByLabelCard } from '@/components/dashboard/ContactsByLabelCard'
import { EmailStatsCard } from '@/components/dashboard/EmailStatsCard'
import { PackagesCard } from '@/components/dashboard/PackagesCard'
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard'
import { JobStatusCard } from '@/components/dashboard/JobStatusCard'
import { ContactTrendCard } from '@/components/dashboard/ContactTrendCard'
import { getCachedBusinessName, onBusinessUpdated } from '@/lib/business-brand'

export default function Dashboard() {
  const { clients, jobs, leads, invoices, packages, setPackages, loading: dataLoading } = useData()
  const { setPage, openContact } = useDeskNav()
  const { alert, promptForm, toast } = useUi()
  const { createPackage, createActivity } = useCreateActions()
  const [businessName, setBusinessName] = useState(getCachedBusinessName)
  const [activities, setActivities] = useState<DeskActivity[]>([])
  const [campaigns, setCampaigns] = useState<DeskCampaign[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const wasDataLoading = useRef(false)

  useEffect(() => onBusinessUpdated(setBusinessName), [])

  useEffect(() => {
    let cancelled = false
    setActivitiesLoading(true)
    void platform
      .listActivities()
      .then((rows) => {
        if (!cancelled) setActivities(rows)
      })
      .catch(() => {
        if (!cancelled) setActivities([])
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false)
      })
    void platform
      .listCampaigns()
      .then((camps) => {
        if (!cancelled) setCampaigns(camps)
      })
      .catch(() => {
        if (!cancelled) setCampaigns([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Re-pull activities/campaigns when Header refresh finishes loading CRM data
  useEffect(() => {
    if (dataLoading) {
      wasDataLoading.current = true
      return
    }
    if (!wasDataLoading.current) return
    wasDataLoading.current = false
    let cancelled = false
    void platform.listActivities().then((rows) => {
      if (!cancelled) setActivities(rows)
    }).catch(() => { /* keep prior */ })
    void platform.listCampaigns().then((camps) => {
      if (!cancelled) setCampaigns(camps)
    }).catch(() => { /* keep prior */ })
    return () => {
      cancelled = true
    }
  }, [dataLoading])

  async function editPackage(pkg: DeskPackage) {
    if (pkg.id === 'x') {
      void createPackage()
      return
    }
    const values = await promptForm({
      title: 'Edit package',
      submitLabel: 'Save',
      fields: [
        { name: 'name', label: 'Package name', required: true, defaultValue: pkg.name },
        {
          name: 'base_price',
          label: 'Base price',
          type: 'number',
          required: true,
          defaultValue: String(pkg.base_price),
        },
      ],
    })
    if (!values?.name) return
    try {
      const updated = await api.updatePackage(pkg.id, {
        name: values.name,
        base_price: Number(values.base_price) || 0,
      })
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      toast('Package updated')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update package', 'Update failed')
    }
  }

  async function archivePackage(pkg: DeskPackage) {
    if (pkg.id === 'x') return
    if (!window.confirm(`Archive “${pkg.name}”? It will be hidden from new bookings.`)) return
    try {
      const updated = await api.updatePackage(pkg.id, { active: false })
      setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      toast('Package archived')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not archive package', 'Archive failed')
    }
  }

  async function onNewActivity() {
    const created = await createActivity({ navigate: false })
    if (created) {
      setActivities((prev) => [created, ...prev])
    }
  }

  const collectible = invoices.filter(
    (i) => i.sent_at || i.status === 'sent' || i.status === 'paid' || i.status === 'overdue',
  )
  const emailStats = useMemo(() => emailOutreachStats(campaigns, activities), [campaigns, activities])

  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => (b.occurred_at || '').localeCompare(a.occurred_at || ''))
      .slice(0, 4)
  }, [activities])

  const subtitle = businessName.trim()
    ? `${businessName.trim()} · sales overview`
    : 'Sales overview'

  function contactName(id: string) {
    return clients.find((c) => c.id === id)?.name || 'Contact'
  }

  function formatActivityWhen(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Header title="Dashboard" subtitle={subtitle} />
      <div className="flex-1 min-h-0 overflow-y-auto p-3 relative flex flex-col gap-2.5">
        <SoftBlobBackdrop className="pointer-events-none absolute -top-4 right-0 w-[420px] h-[200px] opacity-90" />
        <div className="grid grid-cols-3 grid-rows-4 gap-2.5 relative flex-1 min-h-0 min-w-0 overflow-hidden [&>*]:min-h-0 [&>*]:min-w-0">
          <NewContactsCard clients={clients} onOpen={() => setPage('contacts')} />

          <div className="row-span-2 min-h-0">
            <RevenueWonCard
              jobs={jobs}
              invoices={invoices}
              invoicesSent={collectible.length}
              onOpenInvoices={() => setPage('invoices')}
            />
          </div>

          <div className="row-span-2 min-h-0">
            <ContactsByLabelCard
              clients={clients}
              onOpen={() => setPage('contacts')}
              onOpenLabel={() => setPage('contacts')}
              onOpenContact={(id) => openContact(id)}
            />
          </div>

          <InvoiceCollectionCard
            invoices={invoices}
            onOpen={() => setPage('invoices')}
            onOpenPaid={() => setPage('invoices')}
            onOpenDueSoon={() => setPage('invoices')}
            onOpenOverdue={() => setPage('invoices')}
            onSendReminders={() => setPage('invoices')}
          />

          <DealsByPipelineCard
            leads={leads}
            onOpen={() => setPage('deals')}
            onOpenStage={() => setPage('deals')}
          />

          <EmailStatsCard
            sent={emailStats.sent}
            opened={emailStats.opened}
            clicked={emailStats.clicked}
            campaignCount={emailStats.campaignCount}
            onOpen={() => setPage('campaigns')}
          />

          <PackagesCard
            packages={packages}
            onEdit={(pkg) => void editPackage(pkg)}
            onArchive={(pkg) => void archivePackage(pkg)}
            onCreate={() => void createPackage()}
          />

          <ContactTrendCard
            clients={clients}
            onOpen={() => setPage('contacts')}
          />

          <RecentActivitiesCard
            activities={recentActivities}
            loading={activitiesLoading}
            contactName={contactName}
            formatWhen={formatActivityWhen}
            onViewAll={() => setPage('activities')}
            onNew={() => void onNewActivity()}
            onOpenActivity={(a) => (a.contact_id ? openContact(a.contact_id) : setPage('activities'))}
          />

          <JobStatusCard
            jobs={jobs}
            onOpen={() => setPage('calendar')}
            onOpenStatus={() => setPage('calendar')}
          />
        </div>
      </div>
    </div>
  )
}
