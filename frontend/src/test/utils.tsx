import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { tokenStore } from '../api/client'
import { AppRoutes } from '../App'
import { AuthProvider } from '../context/AuthContext'
import type { User, Vehicle } from '../types'

/** Render the whole app (routes + auth) starting at `path`. */
export function renderApp(path = '/') {
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
  return { user, ...utils }
}

export const customer: User = { id: 1, name: 'Asha Rao', email: 'asha@example.com', role: 'user' }
export const admin: User = { id: 2, name: 'Admin', email: 'admin@example.com', role: 'admin' }

export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return { id: 1, make: 'Tata', model: 'Nexon EV', category: 'Electric', price: 1449000, quantity: 3, ...overrides }
}

/** Simulate a returning visitor: token and user saved by a previous login. */
export function storeSession(user: User, token = 'saved-token') {
  tokenStore.set(token)
  tokenStore.setUser(user)
}
