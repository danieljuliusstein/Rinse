import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { OverheadExpense } from '@/lib/rinse-core'
import * as api from '@/lib/api'
import { getOrganizationId } from '@/lib/org'
import type {
  DeskClient,
  DeskExpense,
  DeskInvoice,
  DeskJob,
  DeskLead,
  DeskPackage,
  DeskQuote,
  DeskVehicle,
} from '@/lib/types'
import { useAuth } from './AuthProvider'

interface DataContextValue {
  loading: boolean
  error: string | null
  clients: DeskClient[]
  vehicles: DeskVehicle[]
  jobs: DeskJob[]
  leads: DeskLead[]
  invoices: DeskInvoice[]
  quotes: DeskQuote[]
  expenses: DeskExpense[]
  overhead: OverheadExpense[]
  packages: DeskPackage[]
  refresh: () => Promise<void>
  setClients: Dispatch<SetStateAction<DeskClient[]>>
  setVehicles: Dispatch<SetStateAction<DeskVehicle[]>>
  setJobs: Dispatch<SetStateAction<DeskJob[]>>
  setLeads: Dispatch<SetStateAction<DeskLead[]>>
  setInvoices: Dispatch<SetStateAction<DeskInvoice[]>>
  setQuotes: Dispatch<SetStateAction<DeskQuote[]>>
  setExpenses: Dispatch<SetStateAction<DeskExpense[]>>
  setOverhead: Dispatch<SetStateAction<OverheadExpense[]>>
  setPackages: Dispatch<SetStateAction<DeskPackage[]>>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<DeskClient[]>([])
  const [vehicles, setVehicles] = useState<DeskVehicle[]>([])
  const [jobs, setJobs] = useState<DeskJob[]>([])
  const [leads, setLeads] = useState<DeskLead[]>([])
  const [invoices, setInvoices] = useState<DeskInvoice[]>([])
  const [quotes, setQuotes] = useState<DeskQuote[]>([])
  const [expenses, setExpenses] = useState<DeskExpense[]>([])
  const [overhead, setOverhead] = useState<OverheadExpense[]>([])
  const [packages, setPackages] = useState<DeskPackage[]>([])

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      setClients([])
      setVehicles([])
      setJobs([])
      setLeads([])
      setInvoices([])
      setQuotes([])
      setExpenses([])
      setOverhead([])
      setPackages([])
      setError(null)
      return
    }

    if (!getOrganizationId()) {
      setLoading(false)
      setError('Your account is not linked to an organization. Use the same operator login as the mobile app.')
      setClients([])
      setVehicles([])
      setJobs([])
      setLeads([])
      setInvoices([])
      setQuotes([])
      setExpenses([])
      setOverhead([])
      setPackages([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const settled = await Promise.allSettled([
        api.listClients(),
        api.listVehicles(),
        api.listJobs(),
        api.listLeads(),
        api.listInvoices(),
        api.listExpenses(),
        api.listOverheadExpenses(),
        api.listPackages(),
        api.listQuotes(),
      ])

      const value = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === 'fulfilled' ? r.value : fallback

      setClients(value(settled[0], []))
      setVehicles(value(settled[1], []))
      setJobs(value(settled[2], []))
      setLeads(value(settled[3], []))
      setInvoices(value(settled[4], []))
      setExpenses(value(settled[5], []))
      setOverhead(value(settled[6], []))
      setPackages(value(settled[7], []))
      setQuotes(value(settled[8], []))

      const failed = settled
        .map((r, i) => ({
          r,
          name: [
            'clients',
            'vehicles',
            'jobs',
            'leads',
            'invoices',
            'expenses',
            'overhead',
            'packages',
            'quotes',
          ][i]!,
        }))
        .filter((x) => x.r.status === 'rejected')

      // Only hard-fail UI when core lists fail (vehicles included — empty Cars used to look like "not syncing")
      const coreFailed = failed.filter(
        (x) => x.name === 'clients' || x.name === 'jobs' || x.name === 'vehicles',
      )
      if (coreFailed.length > 0) {
        const first = coreFailed[0]!.r as PromiseRejectedResult
        const msg = first.reason instanceof Error ? first.reason.message : 'Failed to load CRM data'
        setError(msg)
        console.error('[desk] core data load failed', failed)
      } else if (failed.length > 0) {
        console.warn('[desk] partial data load failures', failed)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load CRM data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      loading,
      error,
      clients,
      vehicles,
      jobs,
      leads,
      invoices,
      quotes,
      expenses,
      overhead,
      packages,
      refresh,
      setClients,
      setVehicles,
      setJobs,
      setLeads,
      setInvoices,
      setQuotes,
      setExpenses,
      setOverhead,
      setPackages,
    }),
    [
      loading,
      error,
      clients,
      vehicles,
      jobs,
      leads,
      invoices,
      quotes,
      expenses,
      overhead,
      packages,
      refresh,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
