const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** 1449000 -> "₹14,49,000" (Indian digit grouping). */
export function formatPrice(amount: number): string {
  return inr.format(amount)
}

export function vehicleName(vehicle: { make: string; model: string }): string {
  return `${vehicle.make} ${vehicle.model}`
}
