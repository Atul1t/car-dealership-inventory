import { screen, waitFor, within } from '@testing-library/react'
import { authApi } from '../api/auth'
import { ApiError, tokenStore } from '../api/client'
import { vehiclesApi } from '../api/vehicles'
import { admin, customer, makeVehicle, renderApp } from '../test/utils'
import type { User } from '../types'

vi.mock('../api/auth')
vi.mock('../api/vehicles')

const nexon = makeVehicle({ id: 1, make: 'Tata', model: 'Nexon EV', category: 'Electric', price: 1449000, quantity: 3 })
const creta = makeVehicle({ id: 2, make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1100000, quantity: 5 })
const seltos = makeVehicle({ id: 3, make: 'Kia', model: 'Seltos', category: 'SUV', price: 1090000, quantity: 0 })

async function openDashboard(as: User = customer, vehicles = [nexon, creta, seltos]) {
  tokenStore.set('token')
  vi.mocked(authApi.me).mockResolvedValue(as)
  vi.mocked(vehiclesApi.list).mockResolvedValue(vehicles)
  const utils = renderApp('/')
  await screen.findByRole('heading', { name: /showroom inventory/i })
  return utils
}

function card(name: string) {
  return screen.getByRole('article', { name })
}

describe('DashboardPage – browsing', () => {
  it('lists every vehicle from the API', async () => {
    await openDashboard()

    expect(await screen.findByRole('article', { name: 'Tata Nexon EV' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('summarises the inventory', async () => {
    await openDashboard()

    const stats = await screen.findByRole('region', { name: /inventory summary/i })
    expect(within(stats).getByText('3')).toBeInTheDocument() // models
    expect(within(stats).getByText('8')).toBeInTheDocument() // units in stock
    expect(within(stats).getByText('1')).toBeInTheDocument() // sold out
  })

  it('shows an empty state when there is no stock', async () => {
    await openDashboard(customer, [])

    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument()
  })

  it('shows an error when the inventory fails to load', async () => {
    tokenStore.set('token')
    vi.mocked(authApi.me).mockResolvedValue(customer)
    vi.mocked(vehiclesApi.list).mockRejectedValue(new ApiError(500, 'Database unavailable'))
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable')
  })

  it('can hide sold-out vehicles', async () => {
    const { user } = await openDashboard()
    await screen.findByRole('article', { name: 'Kia Seltos' })

    await user.click(screen.getByRole('checkbox', { name: /in stock only/i }))

    expect(screen.queryByRole('article', { name: 'Kia Seltos' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('can sort by price', async () => {
    const { user } = await openDashboard()
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    await user.selectOptions(screen.getByLabelText(/sort by/i), 'price-asc')

    const names = screen.getAllByRole('article').map((el) => el.getAttribute('aria-label'))
    expect(names).toEqual(['Kia Seltos', 'Hyundai Creta', 'Tata Nexon EV'])
  })
})

describe('DashboardPage – search', () => {
  it('searches with the entered filters', async () => {
    const { user } = await openDashboard()
    vi.mocked(vehiclesApi.search).mockResolvedValue([creta])

    await user.type(screen.getByLabelText('Make'), 'hyun')
    await user.selectOptions(screen.getByLabelText('Category'), 'SUV')
    await user.type(screen.getByLabelText(/min price/i), '1000000')
    await user.type(screen.getByLabelText(/max price/i), '1200000')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(vehiclesApi.search).toHaveBeenCalledWith({
      make: 'hyun',
      category: 'SUV',
      min_price: 1000000,
      max_price: 1200000,
    })
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
    expect(card('Hyundai Creta')).toBeInTheDocument()
  })

  it('offers every category from the inventory', async () => {
    await openDashboard()
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    const options = within(screen.getByLabelText('Category')).getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['All categories', 'Electric', 'SUV'])
  })

  it('validates the price range before calling the API', async () => {
    const { user } = await openDashboard()

    await user.type(screen.getByLabelText(/min price/i), '500')
    await user.type(screen.getByLabelText(/max price/i), '100')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Min price cannot be greater than max price')
    expect(vehiclesApi.search).not.toHaveBeenCalled()
  })

  it('clearing the filters reloads the full inventory', async () => {
    const { user } = await openDashboard()
    vi.mocked(vehiclesApi.search).mockResolvedValue([creta])
    await user.type(screen.getByLabelText('Make'), 'hyun')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3))
    expect(screen.getByLabelText('Make')).toHaveValue('')
  })
})

describe('DashboardPage – purchasing', () => {
  it('purchases a vehicle and updates its stock', async () => {
    const { user } = await openDashboard()
    vi.mocked(vehiclesApi.purchase).mockResolvedValue({ ...nexon, quantity: 2 })
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    await user.click(within(card('Tata Nexon EV')).getByRole('button', { name: 'Purchase' }))

    expect(vehiclesApi.purchase).toHaveBeenCalledWith(1)
    expect(await within(card('Tata Nexon EV')).findByText('Only 2 left')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Purchased Tata Nexon EV')
  })

  it('shows the error when a purchase fails', async () => {
    const { user } = await openDashboard()
    vi.mocked(vehiclesApi.purchase).mockRejectedValue(new ApiError(400, 'Insufficient stock'))
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    await user.click(within(card('Tata Nexon EV')).getByRole('button', { name: 'Purchase' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Insufficient stock')
  })

  it('does not let anyone buy a sold-out vehicle', async () => {
    await openDashboard()

    const seltosCard = await screen.findByRole('article', { name: 'Kia Seltos' })
    expect(within(seltosCard).getByRole('button', { name: 'Sold out' })).toBeDisabled()
  })
})

describe('DashboardPage – admin tools', () => {
  it('hides admin tools from regular users', async () => {
    await openDashboard(customer)
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument()
  })

  it('lets an admin add a vehicle', async () => {
    const { user } = await openDashboard(admin)
    const swift = makeVehicle({ id: 9, make: 'Maruti Suzuki', model: 'Swift', category: 'Hatchback', price: 649000, quantity: 4 })
    vi.mocked(vehiclesApi.create).mockResolvedValue(swift)

    await user.click(await screen.findByRole('button', { name: /add vehicle/i }))
    const dialog = screen.getByRole('dialog', { name: /add vehicle/i })
    await user.type(within(dialog).getByLabelText('Make'), 'Maruti Suzuki')
    await user.type(within(dialog).getByLabelText('Model'), 'Swift')
    await user.type(within(dialog).getByLabelText('Category'), 'Hatchback')
    await user.type(within(dialog).getByLabelText(/price/i), '649000')
    await user.type(within(dialog).getByLabelText(/quantity/i), '4')
    await user.click(within(dialog).getByRole('button', { name: /save/i }))

    expect(vehiclesApi.create).toHaveBeenCalledWith({
      make: 'Maruti Suzuki',
      model: 'Swift',
      category: 'Hatchback',
      price: 649000,
      quantity: 4,
    })
    expect(await screen.findByRole('article', { name: 'Maruti Suzuki Swift' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the add dialog open and shows API errors', async () => {
    const { user } = await openDashboard(admin)
    vi.mocked(vehiclesApi.create).mockRejectedValue(new ApiError(422, 'price: Input should be greater than 0'))

    await user.click(await screen.findByRole('button', { name: /add vehicle/i }))
    const dialog = screen.getByRole('dialog', { name: /add vehicle/i })
    await user.type(within(dialog).getByLabelText('Make'), 'X')
    await user.type(within(dialog).getByLabelText('Model'), 'Y')
    await user.type(within(dialog).getByLabelText('Category'), 'Z')
    await user.type(within(dialog).getByLabelText(/price/i), '1')
    await user.click(within(dialog).getByRole('button', { name: /save/i }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('greater than 0')
  })

  it('lets an admin edit a vehicle, sending only changed fields', async () => {
    const { user } = await openDashboard(admin)
    vi.mocked(vehiclesApi.update).mockResolvedValue({ ...nexon, price: 1399000 })
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    await user.click(screen.getByRole('button', { name: 'Edit Tata Nexon EV' }))
    const dialog = screen.getByRole('dialog', { name: /edit vehicle/i })
    expect(within(dialog).getByLabelText('Model')).toHaveValue('Nexon EV')
    const price = within(dialog).getByLabelText(/price/i)
    await user.clear(price)
    await user.type(price, '1399000')
    await user.click(within(dialog).getByRole('button', { name: /save/i }))

    expect(vehiclesApi.update).toHaveBeenCalledWith(1, { price: 1399000 })
    expect(await within(card('Tata Nexon EV')).findByText('₹13,99,000')).toBeInTheDocument()
  })

  it('lets an admin delete a vehicle after confirming', async () => {
    const { user } = await openDashboard(admin)
    vi.mocked(vehiclesApi.remove).mockResolvedValue(undefined)
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    await user.click(screen.getByRole('button', { name: 'Delete Tata Nexon EV' }))
    const dialog = screen.getByRole('dialog', { name: /delete vehicle/i })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(vehiclesApi.remove).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Tata Nexon EV' })).not.toBeInTheDocument())
  })

  it('does nothing if the admin cancels the delete', async () => {
    const { user } = await openDashboard(admin)
    await screen.findByRole('article', { name: 'Tata Nexon EV' })

    await user.click(screen.getByRole('button', { name: 'Delete Tata Nexon EV' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(vehiclesApi.remove).not.toHaveBeenCalled()
    expect(card('Tata Nexon EV')).toBeInTheDocument()
  })

  it('lets an admin restock a sold-out vehicle', async () => {
    const { user } = await openDashboard(admin)
    vi.mocked(vehiclesApi.restock).mockResolvedValue({ ...seltos, quantity: 5 })
    await screen.findByRole('article', { name: 'Kia Seltos' })

    await user.click(screen.getByRole('button', { name: 'Restock Kia Seltos' }))
    const dialog = screen.getByRole('dialog', { name: /restock/i })
    await user.clear(within(dialog).getByLabelText(/units to add/i))
    await user.type(within(dialog).getByLabelText(/units to add/i), '5')
    await user.click(within(dialog).getByRole('button', { name: 'Restock' }))

    expect(vehiclesApi.restock).toHaveBeenCalledWith(3, 5)
    expect(await within(card('Kia Seltos')).findByText('5 in stock')).toBeInTheDocument()
    expect(within(card('Kia Seltos')).getByRole('button', { name: 'Purchase' })).toBeEnabled()
  })

  it('closes dialogs with Escape', async () => {
    const { user } = await openDashboard(admin)

    await user.click(await screen.findByRole('button', { name: /add vehicle/i }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
