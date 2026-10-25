import { ApiError, apiRequest, tokenStore } from './client'

function mockFetch(status: number, body?: unknown) {
  const response = new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

describe('apiRequest', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch(200, [{ id: 1 }])

    await expect(apiRequest('/api/vehicles')).resolves.toEqual([{ id: 1 }])
  })

  it('sends JSON bodies with the right content type', async () => {
    const fetchSpy = mockFetch(201, { id: 1 })

    await apiRequest('/api/vehicles', { method: 'POST', body: { make: 'Honda' } })

    const [, init] = fetchSpy.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ make: 'Honda' }))
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
  })

  it('attaches the stored bearer token', async () => {
    tokenStore.set('abc.def.ghi')
    const fetchSpy = mockFetch(200, {})

    await apiRequest('/api/auth/me')

    const [, init] = fetchSpy.mock.calls[0]
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer abc.def.ghi')
  })

  it('omits Authorization when there is no token', async () => {
    const fetchSpy = mockFetch(200, {})

    await apiRequest('/api/health')

    const [, init] = fetchSpy.mock.calls[0]
    expect(new Headers(init?.headers).has('Authorization')).toBe(false)
  })

  it('appends query params, skipping empty values', async () => {
    const fetchSpy = mockFetch(200, [])

    await apiRequest('/api/vehicles/search', { params: { make: 'hon', model: '', min_price: 100, max_price: undefined } })

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/vehicles/search?make=hon&min_price=100')
  })

  it('returns undefined for 204 No Content', async () => {
    mockFetch(204)

    await expect(apiRequest('/api/vehicles/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws ApiError with the server detail message', async () => {
    mockFetch(400, { detail: 'Insufficient stock' })

    await expect(apiRequest('/api/vehicles/1/purchase', { method: 'POST' })).rejects.toEqual(
      new ApiError(400, 'Insufficient stock'),
    )
  })

  it('summarises FastAPI validation errors', async () => {
    mockFetch(422, { detail: [{ loc: ['body', 'price'], msg: 'Input should be greater than 0' }] })

    await expect(apiRequest('/api/vehicles', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 422,
      message: 'price: Input should be greater than 0',
    })
  })

  it('notifies listeners and clears the saved session on 401', async () => {
    tokenStore.set('expired')
    tokenStore.setUser({ id: 1, name: 'A', email: 'a@b.co', role: 'user' })
    const onUnauthorized = vi.fn()
    const unsubscribe = tokenStore.onUnauthorized(onUnauthorized)
    mockFetch(401, { detail: 'Invalid or expired token' })

    await expect(apiRequest('/api/vehicles')).rejects.toBeInstanceOf(ApiError)

    expect(tokenStore.get()).toBeNull()
    expect(tokenStore.getUser()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('reports network failures as a friendly ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/vehicles')).rejects.toMatchObject({
      status: 0,
      message: 'Cannot reach the server. Is the API running?',
    })
  })
})

describe('tokenStore user persistence', () => {
  it('round-trips the signed-in user', () => {
    const user = { id: 7, name: 'Asha', email: 'asha@example.com', role: 'admin' as const }

    tokenStore.setUser(user)

    expect(tokenStore.getUser()).toEqual(user)
  })

  it('returns null for corrupted stored data', () => {
    localStorage.setItem('dealership.user', '{not json')

    expect(tokenStore.getUser()).toBeNull()
  })
})
