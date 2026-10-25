import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeVehicle } from '../test/utils'
import { VehicleCard } from './VehicleCard'

function setup(props: Partial<Parameters<typeof VehicleCard>[0]> = {}) {
  const handlers = {
    onPurchase: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onRestock: vi.fn(),
  }
  render(<VehicleCard vehicle={makeVehicle()} isAdmin={false} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('VehicleCard', () => {
  it('shows the vehicle details with an INR price', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Tata Nexon EV' })).toBeInTheDocument()
    expect(screen.getByText('Electric')).toBeInTheDocument()
    expect(screen.getByText('₹14,49,000')).toBeInTheDocument()
    expect(screen.getByText('3 in stock')).toBeInTheDocument()
  })

  it('calls onPurchase with the vehicle when Purchase is clicked', async () => {
    const vehicle = makeVehicle()
    const { user, onPurchase } = setup({ vehicle })

    await user.click(screen.getByRole('button', { name: 'Purchase' }))

    expect(onPurchase).toHaveBeenCalledWith(vehicle)
  })

  it('disables Purchase when the vehicle is out of stock', () => {
    setup({ vehicle: makeVehicle({ quantity: 0 }) })

    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled()
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('highlights low stock', () => {
    setup({ vehicle: makeVehicle({ quantity: 2 }) })

    expect(screen.getByText('Only 2 left')).toBeInTheDocument()
  })

  it('disables Purchase while a purchase is in flight', () => {
    setup({ busy: true })

    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled()
  })

  it('hides admin controls from regular users', () => {
    setup()

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument()
  })

  it('gives admins edit, restock and delete controls', async () => {
    const vehicle = makeVehicle()
    const { user, onEdit, onRestock, onDelete } = setup({ vehicle, isAdmin: true })

    await user.click(screen.getByRole('button', { name: 'Edit Tata Nexon EV' }))
    await user.click(screen.getByRole('button', { name: 'Restock Tata Nexon EV' }))
    await user.click(screen.getByRole('button', { name: 'Delete Tata Nexon EV' }))

    expect(onEdit).toHaveBeenCalledWith(vehicle)
    expect(onRestock).toHaveBeenCalledWith(vehicle)
    expect(onDelete).toHaveBeenCalledWith(vehicle)
  })
})
