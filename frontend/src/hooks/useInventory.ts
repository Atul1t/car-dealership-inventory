import { useCallback, useEffect, useState } from 'react'
import { vehiclesApi } from '../api/vehicles'
import type { Vehicle, VehicleInput, VehicleSearchCriteria } from '../types'
import { errorMessage } from '../utils/errors'

type LoadStatus = 'loading' | 'ready' | 'error'

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

/**
 * Owns the dashboard's vehicle list and every operation that changes it.
 * Components stay presentational and just call these actions.
 */
export function useInventory() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const addCategory = (category: string) => setCategories((current) => uniqueSorted([...current, category]))

  const run = useCallback(async (request: () => Promise<Vehicle[]>, isFullList: boolean) => {
    setError(null)
    try {
      const result = await request()
      setVehicles(result)
      if (isFullList) setCategories(uniqueSorted(result.map((v) => v.category)))
      setStatus('ready')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  const loadAll = useCallback(() => run(vehiclesApi.list, true), [run])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const search = useCallback(
    async (criteria: VehicleSearchCriteria) => {
      setSearching(true)
      await run(() => vehiclesApi.search(criteria), false)
      setSearching(false)
    },
    [run],
  )

  const replace = (updated: Vehicle) =>
    setVehicles((current) => current.map((vehicle) => (vehicle.id === updated.id ? updated : vehicle)))

  return {
    vehicles,
    categories,
    status,
    error,
    searching,
    loadAll,
    search,
    async purchase(vehicle: Vehicle) {
      replace(await vehiclesApi.purchase(vehicle.id))
    },
    async create(input: VehicleInput) {
      const created = await vehiclesApi.create(input)
      setVehicles((current) => [...current, created])
      addCategory(created.category)
    },
    async update(id: number, changes: Partial<VehicleInput>) {
      const updated = await vehiclesApi.update(id, changes)
      replace(updated)
      addCategory(updated.category)
    },
    async remove(id: number) {
      await vehiclesApi.remove(id)
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id))
    },
    async restock(id: number, quantity: number) {
      replace(await vehiclesApi.restock(id, quantity))
    },
  }
}
