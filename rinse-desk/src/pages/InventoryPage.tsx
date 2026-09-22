import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  DollarSign,
  Edit2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { Header } from '../App'
import { useUi } from '@/providers/UiProvider'
import { money } from '@/lib/metrics'
import type { DeskEquipment, DeskSupply } from '@/lib/types'
import {
  createEquipment,
  createSupply,
  deleteEquipment,
  deleteSupply,
  listEquipment,
  listSupplies,
  restockSupply,
  updateEquipment,
  updateSupply,
} from '@/lib/supplies-api'

type InventoryTab = 'all' | 'supplies' | 'equipment' | 'low_stock'
type SupplyKindFilter = 'all' | DeskSupply['kind']

const SUPPLY_KIND_LABELS: Record<string, string> = {
  chemical: 'Chemical / Compound',
  consumable: 'Towel / Pad / Consumable',
  tool: 'Small Tool / Brush',
  other: 'General Supply',
}

export default function InventoryPage() {
  const { toast } = useUi()

  const [supplies, setSupplies] = useState<DeskSupply[]>([])
  const [equipment, setEquipment] = useState<DeskEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<InventoryTab>('all')
  const [kindFilter, setKindFilter] = useState<SupplyKindFilter>('all')

  // Modals
  const [restockItem, setRestockItem] = useState<DeskSupply | null>(null)
  const [editingSupply, setEditingSupply] = useState<DeskSupply | 'new' | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<DeskEquipment | 'new' | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sList, eList] = await Promise.all([listSupplies(), listEquipment()])
      setSupplies(sList)
      setEquipment(eList)
    } catch (err: any) {
      toast(err?.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Metrics
  const lowStockCount = useMemo(() => {
    return supplies.filter((s) => s.reorder_threshold != null && s.quantity_on_hand <= s.reorder_threshold).length
  }, [supplies])

  const totalInventoryValue = useMemo(() => {
    return supplies.reduce((acc, s) => {
      const cost = s.cost_per_unit ?? 0
      return acc + s.quantity_on_hand * cost
    }, 0)
  }, [supplies])

  const activeEquipmentCount = useMemo(() => {
    return equipment.filter((e) => e.status !== 'retired').length
  }, [equipment])

  // Filtered lists
  const filteredSupplies = useMemo(() => {
    let result = supplies
    if (activeTab === 'low_stock') {
      result = result.filter(
        (s) => s.reorder_threshold != null && s.quantity_on_hand <= s.reorder_threshold,
      )
    }
    if (kindFilter !== 'all') {
      result = result.filter((s) => s.kind === kindFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.supplier?.toLowerCase().includes(q) ||
          Boolean(s.kind?.toLowerCase().includes(q)) ||
          s.notes?.toLowerCase().includes(q),
      )
    }
    return result
  }, [supplies, activeTab, kindFilter, search])

  const filteredEquipment = useMemo(() => {
    if (activeTab === 'low_stock' || (activeTab === 'supplies')) return []
    let result = equipment
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.supplier?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q),
      )
    }
    return result
  }, [equipment, activeTab, search])

  // Handlers for quick +/- quantity adjustment
  const handleQuickAdjust = async (supply: DeskSupply, delta: number) => {
    const nextQty = Math.max(0, supply.quantity_on_hand + delta)
    if (nextQty === supply.quantity_on_hand) return

    setBusyId(supply.id)
    try {
      const updated = await updateSupply(supply.id, { quantity_on_hand: nextQty })
      setSupplies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch (err: any) {
      toast(err?.message || 'Failed to update quantity')
    } finally {
      setBusyId(null)
    }
  }

  // Delete handlers
  const handleDeleteSupply = async (supply: DeskSupply) => {
    if (!window.confirm(`Delete supply "${supply.name}"? This cannot be undone.`)) return
    setBusyId(supply.id)
    try {
      await deleteSupply(supply.id)
      setSupplies((prev) => prev.filter((s) => s.id !== supply.id))
      toast(`Deleted ${supply.name}`)
    } catch (err: any) {
      toast(err?.message || 'Failed to delete supply')
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteEquipment = async (item: DeskEquipment) => {
    if (!window.confirm(`Delete equipment "${item.name}"? This cannot be undone.`)) return
    setBusyId(item.id)
    try {
      await deleteEquipment(item.id)
      setEquipment((prev) => prev.filter((e) => e.id !== item.id))
      toast(`Deleted ${item.name}`)
    } catch (err: any) {
      toast(err?.message || 'Failed to delete equipment')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-w-0 bg-rinse-bg">
      <Header
        title="Inventory"
        subtitle={`${supplies.length} supplies · ${equipment.length} equipment assets`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingEquipment('new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rinse-card hover:bg-rinse-elevated border border-rinse-border text-rinse-text transition-colors shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5 text-rinse-text-muted" />
              <span>Add Equipment</span>
            </button>
            <button
              type="button"
              onClick={() => setEditingSupply('new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rinse-primary text-rinse-primary-foreground hover:opacity-95 shadow-sm transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supply</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-rinse-card border border-rinse-border rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-rinse-text">{supplies.length}</div>
              <div className="text-xs text-rinse-text-muted">Total Supply SKUs</div>
            </div>
          </div>

          <div className="bg-rinse-card border border-rinse-border rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                lowStockCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-rinse-text">{lowStockCount}</div>
              <div className="text-xs text-rinse-text-muted">
                {lowStockCount > 0 ? 'Needs Reordering' : 'Stock Levels Good'}
              </div>
            </div>
          </div>

          <div className="bg-rinse-card border border-rinse-border rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-rinse-text">{money(totalInventoryValue)}</div>
              <div className="text-xs text-rinse-text-muted">Estimated On-Hand Value</div>
            </div>
          </div>

          <div className="bg-rinse-card border border-rinse-border rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-rinse-text">{activeEquipmentCount}</div>
              <div className="text-xs text-rinse-text-muted">Active Tools & Machinery</div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-rinse-card border border-rinse-border rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Tab Pills */}
            <div className="inline-flex rounded-lg bg-rinse-elevated p-1 border border-rinse-border">
              {(
                [
                  { id: 'all', label: 'All Items' },
                  { id: 'supplies', label: 'Supplies' },
                  { id: 'equipment', label: 'Equipment' },
                  { id: 'low_stock', label: `Low Stock (${lowStockCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-rinse-card text-rinse-text shadow-sm'
                      : 'text-rinse-text-muted hover:text-rinse-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Filter for supplies */}
            {activeTab !== 'equipment' && (
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as SupplyKindFilter)}
                className="text-xs bg-rinse-elevated border border-rinse-border rounded-lg px-2.5 py-1.5 text-rinse-text font-medium focus:outline-none focus:ring-1 focus:ring-rinse-primary"
              >
                <option value="all">All Supply Types</option>
                <option value="chemical">Chemicals & Compounds</option>
                <option value="consumable">Towels & Consumables</option>
                <option value="tool">Small Tools & Brushes</option>
                <option value="other">General / Other</option>
              </select>
            )}
          </div>

          {/* Search input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-rinse-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search supplies or equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-rinse-elevated border border-rinse-border rounded-lg text-rinse-text placeholder:text-rinse-text-muted focus:outline-none focus:ring-1 focus:ring-rinse-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rinse-text-muted hover:text-rinse-text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-rinse-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Loading inventory assets...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Supplies Table */}
            {activeTab !== 'equipment' && (
              <div className="bg-rinse-card border border-rinse-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-rinse-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-rinse-primary" />
                    <h3 className="text-sm font-semibold text-rinse-text">Supplies & Consumables</h3>
                    <span className="text-xs text-rinse-text-muted">({filteredSupplies.length})</span>
                  </div>
                </div>

                {filteredSupplies.length === 0 ? (
                  <div className="p-8 text-center text-sm text-rinse-text-muted">
                    No supplies match the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-rinse-elevated text-rinse-text-muted font-medium border-b border-rinse-border">
                        <tr>
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Type</th>
                          <th className="px-4 py-2.5">Stock Level</th>
                          <th className="px-4 py-2.5">Unit</th>
                          <th className="px-4 py-2.5">Unit Cost</th>
                          <th className="px-4 py-2.5">Total Value</th>
                          <th className="px-4 py-2.5">Supplier</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rinse-border">
                        {filteredSupplies.map((supply) => {
                          const isLow =
                            supply.reorder_threshold != null &&
                            supply.quantity_on_hand <= supply.reorder_threshold
                          const isBusy = busyId === supply.id

                          return (
                            <tr
                              key={supply.id}
                              className={`hover:bg-rinse-elevated/50 transition-colors ${
                                isBusy ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-rinse-text">
                                <div className="flex items-center gap-2">
                                  <span>{supply.name}</span>
                                  {isLow && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                      Low
                                    </span>
                                  )}
                                </div>
                                {supply.notes && (
                                  <p className="text-[11px] text-rinse-text-muted truncate max-w-[200px]">
                                    {supply.notes}
                                  </p>
                                )}
                              </td>

                              <td className="px-4 py-3 text-rinse-text-muted">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rinse-elevated border border-rinse-border text-rinse-text">
                                    {supply.kind ? SUPPLY_KIND_LABELS[supply.kind] || supply.kind : 'General Supply'}
                                  </span>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center border border-rinse-border rounded-lg bg-rinse-elevated overflow-hidden">
                                    <button
                                      type="button"
                                      title="Decrease stock"
                                      disabled={supply.quantity_on_hand <= 0}
                                      onClick={() => void handleQuickAdjust(supply, -1)}
                                      className="p-1 hover:bg-rinse-card text-rinse-text-muted hover:text-rinse-text disabled:opacity-30"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-10 text-center font-semibold text-rinse-text text-xs">
                                      {supply.quantity_on_hand}
                                    </span>
                                    <button
                                      type="button"
                                      title="Increase stock"
                                      onClick={() => void handleQuickAdjust(supply, 1)}
                                      className="p-1 hover:bg-rinse-card text-rinse-text-muted hover:text-rinse-text"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {supply.reorder_threshold != null && (
                                    <span className="text-[10px] text-rinse-text-muted">
                                      min: {supply.reorder_threshold}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-rinse-text-muted font-medium">
                                {supply.unit}
                              </td>

                              <td className="px-4 py-3 text-rinse-text">
                                {supply.cost_per_unit != null ? money(supply.cost_per_unit) : '—'}
                              </td>

                              <td className="px-4 py-3 font-semibold text-rinse-text">
                                {supply.cost_per_unit != null
                                  ? money(supply.quantity_on_hand * supply.cost_per_unit)
                                  : '—'}
                              </td>

                              <td className="px-4 py-3 text-rinse-text-muted">
                                {supply.supplier || '—'}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setRestockItem(supply)}
                                    className="px-2 py-1 text-[11px] font-semibold rounded-md bg-rinse-elevated hover:bg-rinse-border text-rinse-text transition-colors"
                                  >
                                    Restock
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSupply(supply)}
                                    className="p-1 text-rinse-text-muted hover:text-rinse-text rounded hover:bg-rinse-elevated transition-colors"
                                    title="Edit supply"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteSupply(supply)}
                                    className="p-1 text-rinse-text-muted hover:text-red-500 rounded hover:bg-rinse-elevated transition-colors"
                                    title="Delete supply"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Equipment Table */}
            {activeTab !== 'supplies' && activeTab !== 'low_stock' && (
              <div className="bg-rinse-card border border-rinse-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-rinse-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-rinse-text">Machinery & Equipment</h3>
                    <span className="text-xs text-rinse-text-muted">({filteredEquipment.length})</span>
                  </div>
                </div>

                {filteredEquipment.length === 0 ? (
                  <div className="p-8 text-center text-sm text-rinse-text-muted">
                    No equipment found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-rinse-elevated text-rinse-text-muted font-medium border-b border-rinse-border">
                        <tr>
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Purchase Price</th>
                          <th className="px-4 py-2.5">Purchase Date</th>
                          <th className="px-4 py-2.5">Supplier</th>
                          <th className="px-4 py-2.5">Notes</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rinse-border">
                        {filteredEquipment.map((item) => {
                          const isBusy = busyId === item.id

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-rinse-elevated/50 transition-colors ${
                                isBusy ? 'opacity-50 pointer-events-none' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-rinse-text">
                                {item.name}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    item.status === 'retired'
                                      ? 'bg-rinse-elevated text-rinse-text-muted border border-rinse-border'
                                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {item.status === 'retired' ? 'Retired' : 'Active'}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-rinse-text font-semibold">
                                {item.purchase_price != null ? money(item.purchase_price) : '—'}
                              </td>

                              <td className="px-4 py-3 text-rinse-text-muted">
                                {item.purchase_date || '—'}
                              </td>

                              <td className="px-4 py-3 text-rinse-text-muted">
                                {item.supplier || '—'}
                              </td>

                              <td className="px-4 py-3 text-rinse-text-muted max-w-[200px] truncate">
                                {item.notes || '—'}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingEquipment(item)}
                                    className="p-1 text-rinse-text-muted hover:text-rinse-text rounded hover:bg-rinse-elevated transition-colors"
                                    title="Edit equipment"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteEquipment(item)}
                                    className="p-1 text-rinse-text-muted hover:text-red-500 rounded hover:bg-rinse-elevated transition-colors"
                                    title="Delete equipment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <RestockModal
          supply={restockItem}
          onClose={() => setRestockItem(null)}
          onSuccess={(updatedSupply) => {
            setSupplies((prev) => prev.map((s) => (s.id === updatedSupply.id ? updatedSupply : s)))
            setRestockItem(null)
            toast(`Restocked ${updatedSupply.name}!`)
          }}
        />
      )}

      {/* Add / Edit Supply Modal */}
      {editingSupply && (
        <SupplyModal
          supply={editingSupply === 'new' ? null : editingSupply}
          onClose={() => setEditingSupply(null)}
          onSuccess={(savedSupply) => {
            if (editingSupply === 'new') {
              setSupplies((prev) => [...prev, savedSupply])
              toast(`Added supply: ${savedSupply.name}`)
            } else {
              setSupplies((prev) => prev.map((s) => (s.id === savedSupply.id ? savedSupply : s)))
              toast(`Updated supply: ${savedSupply.name}`)
            }
            setEditingSupply(null)
          }}
        />
      )}

      {/* Add / Edit Equipment Modal */}
      {editingEquipment && (
        <EquipmentModal
          equipment={editingEquipment === 'new' ? null : editingEquipment}
          onClose={() => setEditingEquipment(null)}
          onSuccess={(saved) => {
            if (editingEquipment === 'new') {
              setEquipment((prev) => [...prev, saved])
              toast(`Added equipment: ${saved.name}`)
            } else {
              setEquipment((prev) => prev.map((e) => (e.id === saved.id ? saved : e)))
              toast(`Updated equipment: ${saved.name}`)
            }
            setEditingEquipment(null)
          }}
        />
      )}
    </div>
  )
}

/* =========================================================================
   Restock Modal Component
   ========================================================================= */

function RestockModal({
  supply,
  onClose,
  onSuccess,
}: {
  supply: DeskSupply
  onClose: () => void
  onSuccess: (supply: DeskSupply) => void
}) {
  const [addQty, setAddQty] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<string>(
    supply.cost_per_unit != null ? String(supply.cost_per_unit) : '',
  )
  const [recordExpense, setRecordExpense] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numCost = parseFloat(unitCost) || 0
  const totalExpense = Math.round(numCost * addQty * 100) / 100

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (addQty <= 0) {
      setError('Please enter a quantity greater than 0.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const parsedCost = unitCost.trim() ? parseFloat(unitCost) : undefined
      const { supply: updated } = await restockSupply(
        supply,
        addQty,
        parsedCost,
        recordExpense,
      )
      onSuccess(updated)
    } catch (err: any) {
      setError(err?.message || 'Failed to restock supply')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-rinse-card border border-rinse-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rinse-border bg-rinse-elevated/40">
          <div>
            <h3 className="text-sm font-bold text-rinse-text">Restock Item</h3>
            <p className="text-xs text-rinse-text-muted mt-0.5">{supply.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rinse-text-muted hover:text-rinse-text p-1 rounded-lg hover:bg-rinse-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRestock} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-rinse-elevated rounded-lg border border-rinse-border flex items-center justify-between">
            <span className="text-rinse-text-muted">Current Stock:</span>
            <span className="font-semibold text-rinse-text">
              {supply.quantity_on_hand} {supply.unit}
            </span>
          </div>

          <div>
            <label className="block font-medium text-rinse-text mb-1">
              Quantity to Add ({supply.unit}) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={addQty}
              onChange={(e) => setAddQty(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-rinse-text mb-1">
              Cost Per Unit ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-rinse-border">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={recordExpense}
                onChange={(e) => setRecordExpense(e.target.checked)}
                className="mt-0.5 rounded border-rinse-border text-rinse-primary focus:ring-rinse-primary"
              />
              <div className="text-rinse-text">
                <span className="font-medium">Record in Money Expenses</span>
                <p className="text-rinse-text-muted text-[11px] mt-0.5">
                  Automatically logs a business expense of {money(totalExpense)} under category "supplies".
                </p>
              </div>
            </label>
          </div>

          <div className="p-3 bg-rinse-elevated/60 border border-rinse-border rounded-lg flex items-center justify-between text-rinse-text font-medium">
            <span>New Stock Level:</span>
            <span className="text-rinse-primary font-bold">
              {supply.quantity_on_hand + addQty} {supply.unit}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-rinse-border">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rinse-elevated hover:bg-rinse-border text-rinse-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rinse-primary text-rinse-primary-foreground hover:opacity-95 shadow-sm transition-opacity"
            >
              {busy ? 'Saving...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================================
   Add / Edit Supply Modal
   ========================================================================= */

function SupplyModal({
  supply,
  onClose,
  onSuccess,
}: {
  supply: DeskSupply | null
  onClose: () => void
  onSuccess: (supply: DeskSupply) => void
}) {
  const [name, setName] = useState(supply?.name ?? '')
  const [kind, setKind] = useState<DeskSupply['kind']>(supply?.kind ?? 'chemical')
  const [unit, setUnit] = useState(supply?.unit ?? 'oz')
  const [quantity, setQuantity] = useState<string>(String(supply?.quantity_on_hand ?? 0))
  const [reorderThreshold, setReorderThreshold] = useState<string>(
    supply?.reorder_threshold != null ? String(supply.reorder_threshold) : '',
  )
  const [costPerUnit, setCostPerUnit] = useState<string>(
    supply?.cost_per_unit != null ? String(supply.cost_per_unit) : '',
  )
  const [supplier, setSupplier] = useState(supply?.supplier ?? '')
  const [notes, setNotes] = useState(supply?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const payload: Omit<DeskSupply, 'id'> = {
        name: name.trim(),
        kind,
        unit: unit.trim() || 'unit',
        quantity_on_hand: parseFloat(quantity) || 0,
        reorder_threshold: reorderThreshold.trim() ? parseFloat(reorderThreshold) : undefined,
        cost_per_unit: costPerUnit.trim() ? parseFloat(costPerUnit) : undefined,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      let saved: DeskSupply
      if (supply) {
        saved = await updateSupply(supply.id, payload)
      } else {
        saved = await createSupply(payload)
      }
      onSuccess(saved)
    } catch (err: any) {
      setError(err?.message || 'Failed to save supply')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-rinse-card border border-rinse-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rinse-border bg-rinse-elevated/40">
          <h3 className="text-sm font-bold text-rinse-text">
            {supply ? 'Edit Supply Item' : 'New Supply Item'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-rinse-text-muted hover:text-rinse-text p-1 rounded-lg hover:bg-rinse-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-rinse-text mb-1">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Iron Remover, Ceramic Wash..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-rinse-text mb-1">Category</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as DeskSupply['kind'])}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              >
                <option value="chemical">Chemical / Compound</option>
                <option value="consumable">Towel / Pad / Consumable</option>
                <option value="tool">Small Tool / Brush</option>
                <option value="other">General Supply</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-rinse-text mb-1">Unit of Measure</label>
              <input
                type="text"
                placeholder="oz, gal, bottles, units"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-rinse-text mb-1">Quantity On Hand</label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-rinse-text mb-1">Reorder Alert At</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Optional"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-rinse-text mb-1">Cost Per Unit ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-rinse-text mb-1">Supplier / Brand</label>
            <input
              type="text"
              placeholder="e.g. Koch Chemie, CARPRO, Detail King"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-rinse-text mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="Dilution ratio, storage notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-rinse-border">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rinse-elevated hover:bg-rinse-border text-rinse-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rinse-primary text-rinse-primary-foreground hover:opacity-95 shadow-sm transition-opacity"
            >
              {busy ? 'Saving...' : supply ? 'Save Changes' : 'Create Supply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================================
   Add / Edit Equipment Modal
   ========================================================================= */

function EquipmentModal({
  equipment,
  onClose,
  onSuccess,
}: {
  equipment: DeskEquipment | null
  onClose: () => void
  onSuccess: (saved: DeskEquipment) => void
}) {
  const [name, setName] = useState(equipment?.name ?? '')
  const [status, setStatus] = useState<DeskEquipment['status']>(equipment?.status ?? 'active')
  const [purchasePrice, setPurchasePrice] = useState<string>(
    equipment?.purchase_price != null ? String(equipment.purchase_price) : '',
  )
  const [purchaseDate, setPurchaseDate] = useState<string>(equipment?.purchase_date ?? '')
  const [supplier, setSupplier] = useState(equipment?.supplier ?? '')
  const [notes, setNotes] = useState(equipment?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Equipment name is required.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const payload: Omit<DeskEquipment, 'id'> = {
        name: name.trim(),
        status,
        purchase_price: purchasePrice.trim() ? parseFloat(purchasePrice) : undefined,
        purchase_date: purchaseDate.trim() || undefined,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      let saved: DeskEquipment
      if (equipment) {
        saved = await updateEquipment(equipment.id, payload)
      } else {
        saved = await createEquipment(payload)
      }
      onSuccess(saved)
    } catch (err: any) {
      setError(err?.message || 'Failed to save equipment')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-rinse-card border border-rinse-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rinse-border bg-rinse-elevated/40">
          <h3 className="text-sm font-bold text-rinse-text">
            {equipment ? 'Edit Equipment' : 'New Equipment Asset'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-rinse-text-muted hover:text-rinse-text p-1 rounded-lg hover:bg-rinse-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-rinse-text mb-1">Equipment Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kranzle K1122TST Pressure Washer, Rupes LHR15..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-rinse-text mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeskEquipment['status'])}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              >
                <option value="active">Active / In Service</option>
                <option value="retired">Retired / Broken</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-rinse-text mb-1">Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-rinse-text mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-rinse-text mb-1">Supplier / Vendor</label>
              <input
                type="text"
                placeholder="e.g. Obsessed Garage, CleanFreak"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-rinse-text mb-1">Notes / Serial Number</label>
            <textarea
              rows={2}
              placeholder="Serial #, warranty, service history..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-rinse-elevated border border-rinse-border rounded-lg px-3 py-2 text-rinse-text focus:ring-1 focus:ring-rinse-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-rinse-border">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rinse-elevated hover:bg-rinse-border text-rinse-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rinse-primary text-rinse-primary-foreground hover:opacity-95 shadow-sm transition-opacity"
            >
              {busy ? 'Saving...' : equipment ? 'Save Changes' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
