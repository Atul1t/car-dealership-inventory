import { screen } from '@testing-library/react'
import { tokenStore } from '../api/client'
import { customer, renderApp, storeSession } from '../test/utils'

// No module mocks here: the real API client runs against a stubbed fetch.
describe('expired session', () => {
  it('returns to the login page when the API rejects the saved token', async () => {
    storeSession(customer, 'expired-token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    renderApp('/')

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(tokenStore.get()).toBeNull()
    expect(tokenStore.getUser()).toBeNull()
  })
})
