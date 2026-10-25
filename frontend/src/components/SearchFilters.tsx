import { useState, type FormEvent } from 'react'
import type { VehicleSearchCriteria } from '../types'
import { ErrorAlert } from './ui/Alert'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'

interface SearchFiltersProps {
  categories: string[]
  searching: boolean
  onSearch: (criteria: VehicleSearchCriteria) => void
  onClear: () => void
}

const EMPTY = { make: '', model: '', category: '', minPrice: '', maxPrice: '' }

export function SearchFilters({ categories, searching, onSearch, onClear }: SearchFiltersProps) {
  const [filters, setFilters] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const update =
    (field: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFilters((current) => ({ ...current, [field]: event.target.value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const criteria = toCriteria(filters)
    if (criteria.min_price !== undefined && criteria.max_price !== undefined && criteria.min_price > criteria.max_price) {
      setError('Min price cannot be greater than max price')
      return
    }
    setError(null)
    onSearch(criteria)
  }

  function handleClear() {
    setFilters(EMPTY)
    setError(null)
    onClear()
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
      noValidate
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_auto]">
        <TextField className="col-span-2 sm:col-span-1" label="Make" placeholder="e.g. Tata" value={filters.make} onChange={update('make')} />
        <TextField className="col-span-2 sm:col-span-1" label="Model" placeholder="e.g. Nexon" value={filters.model} onChange={update('model')} />
        <div className="col-span-2 lg:col-span-1">
          <label htmlFor="filter-category" className="mb-1.5 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={update('category')}
            className="block h-10 w-full rounded-lg border-0 bg-white px-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="Min price (₹)"
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.minPrice}
          onChange={update('minPrice')}
        />
        <TextField
          label="Max price (₹)"
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.maxPrice}
          onChange={update('maxPrice')}
        />
        <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
          <Button type="submit" loading={searching} className="flex-1 lg:flex-none">
            Search
          </Button>
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>
      {error && (
        <div className="mt-4">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}
    </form>
  )
}

function toCriteria(filters: typeof EMPTY): VehicleSearchCriteria {
  const criteria: VehicleSearchCriteria = {}
  if (filters.make.trim()) criteria.make = filters.make.trim()
  if (filters.model.trim()) criteria.model = filters.model.trim()
  if (filters.category) criteria.category = filters.category
  if (filters.minPrice !== '') criteria.min_price = Number(filters.minPrice)
  if (filters.maxPrice !== '') criteria.max_price = Number(filters.maxPrice)
  return criteria
}
