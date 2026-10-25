import { useCallback, useMemo, useState } from 'react'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { InventoryStats } from '../components/InventoryStats'
import { Navbar } from '../components/Navbar'
import { RestockModal } from '../components/RestockModal'
import { SearchFilters } from '../components/SearchFilters'
import { ErrorAlert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Toast, type ToastMessage } from '../components/ui/Toast'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleFormModal } from '../components/VehicleFormModal'
import { useAuth } from '../context/AuthContext'
import { useInventory } from '../hooks/useInventory'
import type { Vehicle, VehicleInput } from '../types'
import { errorMessage } from '../utils/errors'
import { vehicleName } from '../utils/format'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'stock-desc'

const SORTERS: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
  featured: () => 0, // keep the API's make/model order
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'stock-desc': (a, b) => b.quantity - a.quantity,
}

/** Which admin dialog is open, if any. */
type Dialog =
  | { type: 'add' }
  | { type: 'edit'; vehicle: Vehicle }
  | { type: 'delete'; vehicle: Vehicle }
  | { type: 'restock'; vehicle: Vehicle }
  | null

export function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const inventory = useInventory()
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('featured')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const notify = (kind: ToastMessage['kind'], text: string) => setToast({ id: Date.now(), kind, text })
  const dismissToast = useCallback(() => setToast(null), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  const visibleVehicles = useMemo(() => {
    const filtered = inStockOnly ? inventory.vehicles.filter((v) => v.quantity > 0) : inventory.vehicles
    return [...filtered].sort(SORTERS[sortKey])
  }, [inventory.vehicles, inStockOnly, sortKey])

  async function handlePurchase(vehicle: Vehicle) {
    setPurchasingId(vehicle.id)
    try {
      await inventory.purchase(vehicle)
      notify('success', `Purchased ${vehicleName(vehicle)}`)
    } catch (err) {
      notify('error', errorMessage(err))
    } finally {
      setPurchasingId(null)
    }
  }

  // Dialog actions: errors propagate so the dialog can show them and stay open.
  async function handleSave(input: Partial<VehicleInput>) {
    if (dialog?.type === 'edit') {
      await inventory.update(dialog.vehicle.id, input)
      notify('success', `Updated ${vehicleName({ ...dialog.vehicle, ...input })}`)
    } else {
      await inventory.create(input as VehicleInput)
      notify('success', `Added ${vehicleName(input as VehicleInput)}`)
    }
    closeDialog()
  }

  async function handleDelete(vehicle: Vehicle) {
    await inventory.remove(vehicle.id)
    notify('success', `Deleted ${vehicleName(vehicle)}`)
    closeDialog()
  }

  async function handleRestock(vehicle: Vehicle, quantity: number) {
    await inventory.restock(vehicle.id, quantity)
    notify('success', `Added ${quantity} × ${vehicleName(vehicle)}`)
    closeDialog()
  }

  return (
    <div className="min-h-screen pb-16">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-600">Hello, {user?.name.split(' ')[0]}</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Showroom inventory</h1>
          </div>
          {isAdmin && <Button onClick={() => setDialog({ type: 'add' })}>+ Add vehicle</Button>}
        </div>

        <InventoryStats vehicles={inventory.vehicles} />

        <SearchFilters
          categories={inventory.categories}
          searching={inventory.searching}
          onSearch={inventory.search}
          onClear={inventory.loadAll}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{visibleVehicles.length}</span>{' '}
            {visibleVehicles.length === 1 ? 'vehicle' : 'vehicles'}
          </p>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="size-4 rounded border-slate-300 accent-brand-600"
              />
              In stock only
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Sort by
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-9 rounded-lg border-0 bg-white px-2 text-sm shadow-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="featured">Make &amp; model</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="stock-desc">Most in stock</option>
              </select>
            </label>
          </div>
        </div>

        {inventory.status === 'loading' && <GridSkeleton />}
        {inventory.status === 'error' && <ErrorAlert>{inventory.error}</ErrorAlert>}
        {inventory.status === 'ready' && visibleVehicles.length === 0 && <EmptyState />}
        {inventory.status === 'ready' && visibleVehicles.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={isAdmin}
                busy={purchasingId === vehicle.id}
                onPurchase={handlePurchase}
                onEdit={(v) => setDialog({ type: 'edit', vehicle: v })}
                onDelete={(v) => setDialog({ type: 'delete', vehicle: v })}
                onRestock={(v) => setDialog({ type: 'restock', vehicle: v })}
              />
            ))}
          </div>
        )}
      </main>

      {(dialog?.type === 'add' || dialog?.type === 'edit') && (
        <VehicleFormModal
          vehicle={dialog.type === 'edit' ? dialog.vehicle : undefined}
          categories={inventory.categories}
          onSubmit={handleSave}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmDeleteModal vehicle={dialog.vehicle} onConfirm={() => handleDelete(dialog.vehicle)} onClose={closeDialog} />
      )}
      {dialog?.type === 'restock' && (
        <RestockModal
          vehicle={dialog.vehicle}
          onSubmit={(quantity) => handleRestock(dialog.vehicle, quantity)}
          onClose={closeDialog}
        />
      )}

      <Toast key={toast?.id} message={toast} onDismiss={dismissToast} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-lg font-semibold text-slate-900">No vehicles found</p>
      <p className="mt-1 text-sm text-slate-500">Try clearing the filters or check back after the next delivery.</p>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading vehicles">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  )
}
