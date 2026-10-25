import { useState, type FormEvent } from 'react'
import type { Vehicle } from '../types'
import { errorMessage } from '../utils/errors'
import { vehicleName } from '../utils/format'
import { ErrorAlert } from './ui/Alert'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { TextField } from './ui/TextField'

interface RestockModalProps {
  vehicle: Vehicle
  onSubmit: (quantity: number) => Promise<void>
  onClose: () => void
}

export function RestockModal({ vehicle, onSubmit, onClose }: RestockModalProps) {
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const amount = Number(quantity)
    if (!Number.isInteger(amount) || amount < 1) {
      setError('Enter a whole number of at least 1')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit(amount)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Restock ${vehicleName(vehicle)}`}
      description={`Currently ${vehicle.quantity} in stock.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <TextField
          label="Units to add"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Restock
          </Button>
        </div>
      </form>
    </Modal>
  )
}
