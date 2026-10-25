import type { Vehicle } from '../types'

export function InventoryStats({ vehicles }: { vehicles: Vehicle[] }) {
  const stats = [
    { label: 'Models listed', value: vehicles.length },
    { label: 'Units in stock', value: vehicles.reduce((sum, v) => sum + v.quantity, 0) },
    { label: 'Sold out', value: vehicles.filter((v) => v.quantity === 0).length },
    { label: 'Categories', value: new Set(vehicles.map((v) => v.category)).size },
  ]

  return (
    <section aria-label="Inventory summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}
