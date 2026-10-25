import { screen, waitFor } from '@testing-library/react'
import { authApi } from '../api/auth'
import { ApiError, tokenStore } from '../api/client'
import { vehiclesApi } from '../api/vehicles'
import { customer, renderApp, storeSession } from '../test/utils'

vi.mock('../api/auth')
vi.mock('../api/vehicles')

beforeEach(() => {
  vi.mocked(vehiclesApi.list).mockResolvedValue([])
})

describe('authentication flow', () => {
  it('redirects anonymous visitors to the login page', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('logs in and lands on the dashboard', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'jwt-token', token_type: 'bearer', user: customer })
    const { user } = renderApp('/login')

    await user.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('heading', { name: /showroom inventory/i })).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith({ email: 'asha@example.com', password: 'password123' })
    expect(tokenStore.get()).toBe('jwt-token')
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
  })

  it('shows the server error when login fails', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    const { user } = renderApp('/login')

    await user.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong-pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(tokenStore.get()).toBeNull()
  })

  it('refuses to register when passwords do not match', async () => {
    const { user } = renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Asha Rao')
    await user.type(screen.getByLabelText(/^email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password124')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('refuses to register with a password shorter than 8 characters', async () => {
    const { user } = renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Asha Rao')
    await user.type(screen.getByLabelText(/^email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters')
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('registers, signs in automatically and shows the dashboard', async () => {
    vi.mocked(authApi.register).mockResolvedValue(customer)
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'new-token', token_type: 'bearer', user: customer })
    const { user } = renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Asha Rao')
    await user.type(screen.getByLabelText(/^email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('heading', { name: /showroom inventory/i })).toBeInTheDocument()
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Asha Rao',
      email: 'asha@example.com',
      password: 'password123',
    })
    expect(tokenStore.get()).toBe('new-token')
  })

  it('remembers the signed-in user across reloads without extra API calls', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'jwt-token', token_type: 'bearer', user: customer })
    const { user, unmount } = renderApp('/login')
    await user.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await screen.findByRole('heading', { name: /showroom inventory/i })
    unmount()

    renderApp('/') // simulate a page reload

    expect(await screen.findByRole('heading', { name: /showroom inventory/i })).toBeInTheDocument()
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledTimes(1)
  })

  it('treats a stored token without a stored user as signed out', async () => {
    tokenStore.set('orphan-token')

    renderApp('/')

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(tokenStore.get()).toBeNull()
  })

  it('logs out', async () => {
    storeSession(customer)
    const { user } = renderApp('/')

    await user.click(await screen.findByRole('button', { name: /log out/i }))

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    await waitFor(() => expect(tokenStore.get()).toBeNull())
    expect(tokenStore.getUser()).toBeNull()
  })

  it('sends signed-in users away from the login page', async () => {
    storeSession(customer)

    renderApp('/login')

    expect(await screen.findByRole('heading', { name: /showroom inventory/i })).toBeInTheDocument()
  })
})
