import type { Vehicle, VehicleInput, VehicleSearchCriteria } from '../types'
import { apiRequest } from './client'

const BASE = '/api/vehicles'

export const vehiclesApi = {
  list: () => apiRequest<Vehicle[]>(BASE),
  search: (criteria: VehicleSearchCriteria) =>
    apiRequest<Vehicle[]>(`${BASE}/search`, { params: { ...criteria } }),
  create: (input: VehicleInput) => apiRequest<Vehicle>(BASE, { method: 'POST', body: input }),
  update: (id: number, changes: Partial<VehicleInput>) =>
    apiRequest<Vehicle>(`${BASE}/${id}`, { method: 'PUT', body: changes }),
  remove: (id: number) => apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' }),
  purchase: (id: number, quantity = 1) =>
    apiRequest<Vehicle>(`${BASE}/${id}/purchase`, { method: 'POST', body: { quantity } }),
  restock: (id: number, quantity: number) =>
    apiRequest<Vehicle>(`${BASE}/${id}/restock`, { method: 'POST', body: { quantity } }),
}
