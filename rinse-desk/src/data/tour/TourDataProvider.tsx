// ---------------------------------------------------------------------------
// TourDataProvider — supplies & ensures rich dummy data for the Desk tour
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useData } from '@/providers/DataProvider'
import { adaptClients, adaptInvoices, adaptLeads, adaptVehicles } from './adapters'
import type { DataMode, TourContact, TourDeal, TourInvoice, TourVehicle } from './types'
import type { DeskJob, DeskPackage } from '@/lib/types'
import {
  getTourDummyClients,
  getTourDummyExpenses,
  getTourDummyInvoices,
  getTourDummyJobs,
  getTourDummyLeads,
  getTourDummyPackages,
  getTourDummyVehicles,
} from './tour-dummy-data'
import { setTourSessionActive } from '@/lib/onboarding-tour'

export interface TourDataValue {
  contacts: TourContact[]
  deals: TourDeal[]
  invoices: TourInvoice[]
  vehicles: TourVehicle[]
  jobs: DeskJob[]
  packages: DeskPackage[]
  mode: DataMode
}

const TourDataContext = createContext<TourDataValue | null>(null)

export function useTourData(): TourDataValue {
  const ctx = useContext(TourDataContext)
  if (!ctx) throw new Error('useTourData must be used within <TourDataProvider>')
  return ctx
}

export function useTourDataOptional(): TourDataValue | null {
  return useContext(TourDataContext)
}

export function TourDataProvider({ children }: { children: ReactNode }) {
  const {
    clients,
    leads,
    invoices,
    vehicles,
    jobs,
    packages,
    setClients,
    setLeads,
    setInvoices,
    setVehicles,
    setJobs,
    setPackages,
    setExpenses,
  } = useData()

  // Mark tour session active for the duration of the tour
  useEffect(() => {
    setTourSessionActive(true)
    return () => {
      setTourSessionActive(false)
    }
  }, [])

  // Ensure every screen has rich dummy data ready so the user never has to fill anything out
  useEffect(() => {
    const dummyLeads = getTourDummyLeads()
    const dummyClients = getTourDummyClients()
    const dummyVehicles = getTourDummyVehicles()
    const dummyJobs = getTourDummyJobs()
    const dummyInvoices = getTourDummyInvoices()
    const dummyPackages = getTourDummyPackages()
    const dummyExpenses = getTourDummyExpenses()

    setLeads((prev) => {
      const hasTour = prev.some((l) => l.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyLeads, ...prev]
    })

    setClients((prev) => {
      const hasTour = prev.some((c) => c.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyClients, ...prev]
    })

    setVehicles((prev) => {
      const hasTour = prev.some((v) => v.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyVehicles, ...prev]
    })

    setJobs((prev) => {
      const hasTour = prev.some((j) => j.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyJobs, ...prev]
    })

    setInvoices((prev) => {
      const hasTour = prev.some((i) => i.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyInvoices, ...prev]
    })

    setPackages((prev) => {
      const hasTour = prev.some((p) => p.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyPackages, ...prev]
    })

    setExpenses((prev) => {
      const hasTour = prev.some((e) => e.id.startsWith('tour-'))
      if (hasTour) return prev
      return [...dummyExpenses, ...prev]
    })
  }, [setClients, setExpenses, setInvoices, setJobs, setLeads, setPackages, setVehicles])

  // Clean up all tour dummy & simulated records when the tour provider unmounts
  useEffect(() => {
    return () => {
      const isTourId = (id: string) =>
        id.startsWith('tour-') || id.startsWith('dummy-') || id.startsWith('temp-')
      setLeads((prev) => prev.filter((l) => !isTourId(l.id)))
      setClients((prev) => prev.filter((c) => !isTourId(c.id)))
      setVehicles((prev) => prev.filter((v) => !isTourId(v.id)))
      setJobs((prev) => prev.filter((j) => !isTourId(j.id)))
      setInvoices((prev) => prev.filter((i) => !isTourId(i.id)))
      setPackages((prev) => prev.filter((p) => !isTourId(p.id)))
      setExpenses((prev) => prev.filter((e) => !isTourId(e.id)))
    }
  }, [setClients, setExpenses, setInvoices, setJobs, setLeads, setPackages, setVehicles])

  const value = useMemo<TourDataValue>(() => {
    const byId = new Map(clients.map((c) => [c.id, c.name]))
    return {
      contacts: adaptClients(clients),
      deals: adaptLeads(leads),
      invoices: adaptInvoices(
        invoices.map((inv) => ({
          ...inv,
          clientName: byId.get(inv.client_id) ?? inv.invoice_number,
          amount: inv.total,
          id: inv.id,
          status: inv.status,
        })),
      ),
      vehicles: adaptVehicles(vehicles),
      jobs,
      packages,
      mode: 'live-ready',
    }
  }, [clients, leads, invoices, vehicles, jobs, packages])

  return <TourDataContext.Provider value={value}>{children}</TourDataContext.Provider>
}
