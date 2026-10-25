import { formatPrice, vehicleName } from './format'

describe('formatPrice', () => {
  it.each([
    [649000, '₹6,49,000'],
    [1449000, '₹14,49,000'],
    [999.5, '₹1,000'],
  ])('formats %d as %s', (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected)
  })
})

describe('vehicleName', () => {
  it('joins make and model', () => {
    expect(vehicleName({ make: 'Tata', model: 'Punch' })).toBe('Tata Punch')
  })
})
