import {
  computeDashboard,
  computeJobsForDate,
  computeWeekDays,
} from './aggregates'
import { normalizeInvoice } from '../invoices'
import {
  applyInventoryDeduction,
  applySupplyExpenses,
  inventoryDeltaFromUsageChange,
  isCompletedStatus,
  isCompletingJob,
  resolveSuppliesUsed,
} from '../supplies-logic'
import { defaultQuickJobStatus } from '../job-create'
import { buildDashboardInsights } from '../dashboard-insights'
import { loadData, newId, saveData } from '../storage'
import type {
  Client,
  ClientWithStats,
  DashboardData,
  DashboardKpis,
  Job,
  JobEditData,
  JobWithRelations,
  Package,
  QuickJobData,
  RecentJobRow,
  WeekDay,
} from '../types'

function hydrateJob(job: Job, data: ReturnType<typeof loadData>): JobWithRelations {
  return {
    ...job,
    client: data.clients.find((c) => c.id === job.client_id),
    package: data.packages.find((p) => p.id === job.package_id),
    invoice: (() => {
      const inv = data.invoices.find((i) => i.id === job.invoice_id)
      return inv ? normalizeInvoice(inv) : undefined
    })(),
  }
}

export function getPackages(): Package[] {
  const data = loadData()
  return data.packages.filter((p) => p.active)
}

export function getClients(): Client[] {
  return loadData().clients
}

export function getRecentClients(limit: number): Client[] {
  const clients = loadData().clients
  return [...clients]
    .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))
    .slice(0, limit)
}

export function getJobs(): JobWithRelations[] {
  const data = loadData()
  return [...data.jobs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((j) => hydrateJob(j, data))
}

export function getJob(id: string): JobWithRelations | null {
  const data = loadData()
  const job = data.jobs.find((j) => j.id === id)
  if (!job) return null
  return hydrateJob(job, data)
}

export function createClient(input: import('../types').ClientInput): Client {
  const data = loadData()
  const trimmed = input.name.trim()
  if (!trimmed) throw new Error('Client name is required')

  const client: Client = {
    id: newId(),
    name: trimmed,
    phone: input.phone,
    email: input.email,
    address: input.address,
    lead_source: input.lead_source,
    tags: input.tags,
    notes: input.notes,
    created: new Date().toISOString(),
  }
  data.clients.push(client)
  saveData(data)
  return client
}

export function updateClient(id: string, input: Partial<import('../types').ClientInput>): Client | null {
  const data = loadData()
  const idx = data.clients.findIndex((c) => c.id === id)
  if (idx === -1) return null

  const current = data.clients[idx]
  data.clients[idx] = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    phone: input.phone !== undefined ? input.phone : current.phone,
    email: input.email !== undefined ? input.email : current.email,
    address: input.address !== undefined ? input.address : current.address,
    lead_source: input.lead_source !== undefined ? input.lead_source : current.lead_source,
    tags: input.tags !== undefined ? input.tags : current.tags,
    notes: input.notes !== undefined ? input.notes : current.notes,
  }
  saveData(data)
  return data.clients[idx]
}

export function getAllPackages(): Package[] {
  return loadData().packages
}

export function createPackage(input: import('../types').PackageInput): Package {
  const data = loadData()
  const pkg: Package = {
    id: newId(),
    name: input.name.trim(),
    base_price: input.base_price,
    description: input.description,
    expected_return_days: input.expected_return_days ?? 90,
    duration_minutes: input.duration_minutes ?? 120,
    default_supplies: input.default_supplies,
    active: input.active !== false,
  }
  data.packages.push(pkg)
  saveData(data)
  return pkg
}

export function updatePackage(id: string, input: Partial<import('../types').PackageInput>): Package | null {
  const data = loadData()
  const idx = data.packages.findIndex((p) => p.id === id)
  if (idx === -1) return null

  const current = data.packages[idx]
  data.packages[idx] = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    base_price: input.base_price !== undefined ? input.base_price : current.base_price,
    description: input.description !== undefined ? input.description : current.description,
    expected_return_days:
      input.expected_return_days !== undefined ? input.expected_return_days : current.expected_return_days,
    duration_minutes:
      input.duration_minutes !== undefined ? input.duration_minutes : current.duration_minutes,
    default_supplies: input.default_supplies !== undefined ? input.default_supplies : current.default_supplies,
    active: input.active !== undefined ? input.active : current.active,
  }
  saveData(data)
  return data.packages[idx]
}

export function findOrCreateClient(name: string, existingId: string | null): Client {
  const data = loadData()

  if (existingId) {
    const existing = data.clients.find((c) => c.id === existingId)
    if (existing) return existing
  }

  const trimmed = name.trim()
  if (!trimmed) throw new Error('Client name is required')

  const match = data.clients.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  if (match) return match

  const client: Client = {
    id: newId(),
    name: trimmed,
    created: new Date().toISOString(),
  }
  data.clients.push(client)
  saveData(data)
  return client
}

export function createJob(input: QuickJobData): Job {
  const data = loadData()
  const client = findOrCreateClient(input.clientName, input.clientId)
  const pkg = data.packages.find((p) => p.id === input.packageId)
  const suppliesUsed = resolveSuppliesUsed({ supplies_used: [] }, pkg, input.supplies_used)
  const { supplies_used, expenses } = applySupplyExpenses(suppliesUsed, data.supplies)

  const job: Job = {
    id: newId(),
    date: input.date,
    start_time: input.start_time,
    hours_worked: 0,
    location_type: input.locationType,
    package_id: input.packageId,
    vehicle_type: input.vehicleType,
    client_id: client.id,
    status: defaultQuickJobStatus(input.date),
    revenue: input.revenue,
    tip: input.tip,
    notes: input.notes,
    expenses,
    supplies_used,
    travel_cost: input.travel_cost ?? 0,
    marketing_cost: input.marketing_cost ?? 0,
    equipment_depreciation: input.equipment_depreciation ?? 0,
    photo_count: 0,
    recurrence_cadence: input.recurrence_cadence,
    recurrence_anchor_date: input.recurrence_cadence
      ? input.recurrence_anchor_date ?? input.date
      : undefined,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  if (supplies_used.length > 0) {
    data.supplies = applyInventoryDeduction(data.supplies, supplies_used)
  }

  data.jobs.unshift(job)
  saveData(data)
  return job
}

export function getDashboardData(): DashboardData {
  const data = loadData()
  const jobs = data.jobs.map((j) => hydrateJob(j, data))
  const invoices = data.invoices.map((i) => normalizeInvoice(i))
  const base = computeDashboard(jobs, invoices)
  return {
    ...base,
    insights: buildDashboardInsights(jobs, invoices, base.kpis, base.priorRevenueMtd),
  }
}

export function updateJob(id: string, updates: JobEditData): Job | null {
  const data = loadData()
  const idx = data.jobs.findIndex((j) => j.id === id)
  if (idx === -1) return null

  const current = data.jobs[idx]
  const pkg = data.packages.find((p) => p.id === updates.packageId)
  const completing = isCompletingJob(current.status, updates.status)
  const alreadyCompleted = isCompletedStatus(current.status)

  let suppliesUsed = updates.supplies_used ?? current.supplies_used
  let expenses = current.expenses

  if (completing) {
    suppliesUsed = resolveSuppliesUsed(current, pkg, updates.supplies_used)
    const applied = applySupplyExpenses(suppliesUsed, data.supplies, current.expenses)
    suppliesUsed = applied.supplies_used
    expenses = applied.expenses
    data.supplies = applyInventoryDeduction(data.supplies, suppliesUsed)
  } else if (alreadyCompleted && updates.supplies_used !== undefined) {
    suppliesUsed = resolveSuppliesUsed(current, pkg, updates.supplies_used)
    const applied = applySupplyExpenses(suppliesUsed, data.supplies, current.expenses)
    suppliesUsed = applied.supplies_used
    expenses = applied.expenses
    const delta = inventoryDeltaFromUsageChange(current.supplies_used, suppliesUsed)
    if (delta.length > 0) {
      data.supplies = applyInventoryDeduction(data.supplies, delta)
    }
  }

  data.jobs[idx] = {
    ...current,
    date: updates.date ?? current.date,
    package_id: updates.packageId,
    vehicle_type: updates.vehicleType,
    location_type: updates.locationType,
    revenue: updates.revenue,
    tip: updates.tip,
    hours_worked: updates.hours_worked,
    start_time: updates.start_time,
    status: updates.status,
    notes: updates.notes,
    supplies_used: suppliesUsed,
    travel_cost: updates.travel_cost ?? current.travel_cost,
    marketing_cost: updates.marketing_cost ?? current.marketing_cost,
    equipment_depreciation: updates.equipment_depreciation ?? current.equipment_depreciation,
    recurrence_cadence: updates.recurrence_cadence,
    recurrence_anchor_date: updates.recurrence_cadence
      ? updates.recurrence_anchor_date ?? current.recurrence_anchor_date ?? current.date
      : undefined,
    expenses,
    updated: new Date().toISOString(),
  }
  saveData(data)
  return data.jobs[idx]
}

export function deleteJob(id: string): boolean {
  const data = loadData()
  const job = data.jobs.find((j) => j.id === id)
  if (!job) return false

  data.invoices = data.invoices.filter((i) => i.job_id !== id && i.id !== job.invoice_id)
  if (data.quotes) {
    data.quotes = data.quotes.map((q) => (q.job_id === id ? { ...q, job_id: undefined } : q))
  }
  delete data.job_photos[id]
  data.jobs = data.jobs.filter((j) => j.id !== id)
  saveData(data)
  return true
}

export function deleteClient(id: string): boolean {
  const data = loadData()
  if (!data.clients.some((c) => c.id === id)) return false

  const jobIds = data.jobs.filter((j) => j.client_id === id).map((j) => j.id)
  const jobIdSet = new Set(jobIds)
  for (const jobId of jobIds) {
    deleteJob(jobId)
  }

  const fresh = loadData()
  fresh.invoices = fresh.invoices.filter((i) => i.client_id !== id && !jobIdSet.has(i.job_id))
  if (fresh.quotes) {
    fresh.quotes = fresh.quotes.filter((q) => q.client_id !== id)
  }

  const vehicleIds = new Set((fresh.vehicles ?? []).filter((v) => v.client_id === id).map((v) => v.id))
  if (fresh.damage_docs) {
    fresh.damage_docs = fresh.damage_docs.filter(
      (d) => !vehicleIds.has(d.vehicle_id) && !(d.linked_job_id && jobIdSet.has(d.linked_job_id))
    )
  }
  fresh.vehicles = (fresh.vehicles ?? []).filter((v) => v.client_id !== id)
  fresh.clients = fresh.clients.filter((c) => c.id !== id)
  saveData(fresh)
  return true
}

export function getClient(id: string): Client | null {
  return loadData().clients.find((c) => c.id === id) ?? null
}

export function getClientsWithStats(): ClientWithStats[] {
  const data = loadData()
  return data.clients.map((client) => {
    const clientJobs = data.jobs.filter((j) => j.client_id === client.id)
    return enrichClientWithStats(client, clientJobs, data.packages)
  })
}

export function getClientJobs(clientId: string): JobWithRelations[] {
  const data = loadData()
  return data.jobs
    .filter((j) => j.client_id === clientId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((j) => hydrateJob(j, data))
}

export function getWeekDays(): WeekDay[] {
  return computeWeekDays(loadData().jobs)
}

export function getJobsForDate(date: string): RecentJobRow[] {
  const data = loadData()
  const jobs = data.jobs.map((j) => hydrateJob(j, data))
  return computeJobsForDate(jobs, date)
}

export function getJobsRaw(): Job[] {
  return loadData().jobs
}
