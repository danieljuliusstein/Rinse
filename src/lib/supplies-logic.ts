import type { Job, Package, SupplyUsage } from '@rinse/core'

export function defaultSuppliesFromPackage(pkg: Package | undefined): SupplyUsage[] {
  if (!pkg?.default_supplies?.length) return []
  return pkg.default_supplies.map((d) => ({
    supply_id: d.supply_id,
    quantity_used: d.default_qty,
  }))
}

export function resolveSuppliesUsed(
  job: Pick<Job, 'supplies_used'>,
  pkg: Package | undefined,
  explicit?: SupplyUsage[]
): SupplyUsage[] {
  if (explicit?.length) return explicit
  if (job.supplies_used.length) return job.supplies_used
  return defaultSuppliesFromPackage(pkg)
}
