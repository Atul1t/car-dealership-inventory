import { authApi } from './auth'
import * as client from './client'
import { vehiclesApi } from './vehicles'

describe('endpoint functions', () => {
  let request: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    request = vi.spyOn(client, 'apiRequest').mockResolvedValue(undefined)
  })

  it.each([
    ['register', () => authApi.register({ name: 'A', email: 'a@b.co', password: 'password1' }), '/api/auth/register', { method: 'POST', body: { name: 'A', email: 'a@b.co', password: 'password1' } }],
    ['login', () => authApi.login({ email: 'a@b.co', password: 'password1' }), '/api/auth/login', { method: 'POST', body: { email: 'a@b.co', password: 'password1' } }],
    ['me', () => authApi.me(), '/api/auth/me', undefined],
    ['list', () => vehiclesApi.list(), '/api/vehicles', undefined],
    ['search', () => vehiclesApi.search({ make: 'Tata', min_price: 5 }), '/api/vehicles/search', { params: { make: 'Tata', min_price: 5 } }],
    ['create', () => vehiclesApi.create({ make: 'Tata', model: 'Punch', category: 'SUV', price: 1, quantity: 1 }), '/api/vehicles', { method: 'POST', body: { make: 'Tata', model: 'Punch', category: 'SUV', price: 1, quantity: 1 } }],
    ['update', () => vehiclesApi.update(3, { price: 2 }), '/api/vehicles/3', { method: 'PUT', body: { price: 2 } }],
    ['remove', () => vehiclesApi.remove(3), '/api/vehicles/3', { method: 'DELETE' }],
    ['purchase', () => vehiclesApi.purchase(3, 2), '/api/vehicles/3/purchase', { method: 'POST', body: { quantity: 2 } }],
    ['restock', () => vehiclesApi.restock(3, 5), '/api/vehicles/3/restock', { method: 'POST', body: { quantity: 5 } }],
  ])('%s calls the right endpoint', async (_name, call, path, options) => {
    await call()

    if (options === undefined) expect(request).toHaveBeenCalledWith(path)
    else expect(request).toHaveBeenCalledWith(path, options)
  })
})
