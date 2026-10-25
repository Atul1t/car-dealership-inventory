import type { Vehicle } from '../types'
import { formatPrice, vehicleName } from '../utils/format'
import { CarIcon } from './Logo'
import { Button } from './ui/Button'

const LOW_STOCK_THRESHOLD = 2

/** Header colours per category; unknown categories fall back to slate. */
const CATEGORY_STYLES: Record<string, string> = {
  electric: 'from-emerald-400 to-teal-600',
  suv: 'from-amber-400 to-orange-600',
  sedan: 'from-sky-400 to-blue-600',
  hatchback: 'from-violet-400 to-purple-600',
  mpv: 'from-rose-400 to-pink-600',
  truck: 'from-orange-400 to-red-600',
  coupe: 'from-fuchsia-400 to-pink-600',
}

interface VehicleCardProps {
  vehicle: Vehicle
  isAdmin: boolean
  busy?: boolean
  onPurchase: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  onRestock: (vehicle: Vehicle) => void
}

export function VehicleCard({ vehicle, isAdmin, busy = false, onPurchase, onEdit, onDelete, onRestock }: VehicleCardProps) {
  const name = vehicleName(vehicle)
  const soldOut = vehicle.quantity === 0
  const gradient = CATEGORY_STYLES[vehicle.category.toLowerCase()] ?? 'from-slate-400 to-slate-600'

  return (
    <article
      aria-label={name}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`relative h-32 bg-gradient-to-br ${gradient}`}>
        <CarIcon className={`absolute right-4 bottom-2 size-24 text-white/80 ${soldOut ? 'opacity-50' : ''}`} />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {vehicle.category}
        </span>
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <IconButton label={`Edit ${name}`} onClick={() => onEdit(vehicle)}>
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4z" />
            </IconButton>
            <IconButton label={`Restock ${name}`} onClick={() => onRestock(vehicle)}>
              <path d="M12 5v14M5 12h14" />
            </IconButton>
            <IconButton label={`Delete ${name}`} onClick={() => onDelete(vehicle)} danger>
              <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
            </IconButton>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{vehicle.make}</p>
        <h3 className="sr-only">{name}</h3>
        <p className="text-lg font-bold text-slate-900" aria-hidden>
          {vehicle.model}
        </p>
        <p className="mt-2 text-xl font-extrabold text-slate-900">{formatPrice(vehicle.price)}</p>
        <StockIndicator quantity={vehicle.quantity} />

        <Button
          className="mt-4 w-full"
          disabled={soldOut}
          loading={busy}
          onClick={() => onPurchase(vehicle)}
          variant={soldOut ? 'secondary' : 'primary'}
        >
          {soldOut ? 'Sold out' : 'Purchase'}
        </Button>
      </div>
    </article>
  )
}

function StockIndicator({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return <p className="mt-1 text-sm font-medium text-rose-600">Out of stock</p>
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return <p className="mt-1 text-sm font-medium text-amber-600">Only {quantity} left</p>
  }
  return <p className="mt-1 text-sm font-medium text-emerald-600">{quantity} in stock</p>
}

interface IconButtonProps {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}

function IconButton({ label, onClick, danger = false, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label.split(' ')[0]}
      onClick={onClick}
      className={`grid size-8 cursor-pointer place-items-center rounded-lg bg-white/90 shadow-sm transition hover:bg-white ${danger ? 'text-rose-600' : 'text-slate-700'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
