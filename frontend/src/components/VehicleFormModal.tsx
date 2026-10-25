import { useState, type FormEvent } from 'react'
import type { Vehicle, VehicleInput } from '../types'
import { errorMessage } from '../utils/errors'
import { ErrorAlert } from './ui/Alert'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { TextField } from './ui/TextField'

interface VehicleFormModalProps {
  /** When given, the form edits this vehicle; otherwise it creates a new one. */
  vehicle?: Vehicle
  categories: string[]
  onSubmit: (input: Partial<VehicleInput>) => Promise<void>
  onClose: () => void
}

interface FormState {
  make: string
  model: string
  category: string
  price: string
  quantity: string
}

const EDITABLE_FIELDS = ['make', 'model', 'category', 'price'] as const

export function VehicleFormModal({ vehicle, categories, onSubmit, onClose }: VehicleFormModalProps) {
  const isEdit = vehicle !== undefined
  const [form, setForm] = useState<FormState>({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  function buildPayload(): Partial<VehicleInput> | string {
    const values: VehicleInput = {
      make: form.make.trim(),
      model: form.model.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      quantity: form.quantity === '' ? 0 : Number(form.quantity),
    }
    if (!values.make || !values.model || !values.category) return 'Make, model and category are required'
    if (!Number.isFinite(values.price) || values.price <= 0) return 'Price must be greater than 0'
    if (!Number.isInteger(values.quantity) || values.quantity < 0) return 'Quantity must be a whole number ≥ 0'

    if (!isEdit) return values
    // Only send what actually changed.
    return Object.fromEntries(
      EDITABLE_FIELDS.filter((field) => values[field] !== vehicle[field]).map((field) => [field, values[field]]),
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const payload = buildPayload()
    if (typeof payload === 'string') {
      setError(payload)
      return
    }
    if (isEdit && Object.keys(payload).length === 0) {
      onClose()
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit vehicle' : 'Add vehicle'}
      description={isEdit ? 'Update the listing details.' : 'Add a new model to the showroom.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Make" required value={form.make} onChange={update('make')} autoFocus />
          <TextField label="Model" required value={form.model} onChange={update('model')} />
        </div>
        <TextField
          label="Category"
          required
          list="vehicle-categories"
          value={form.category}
          onChange={update('category')}
        />
        <datalist id="vehicle-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Price (₹)"
            type="number"
            min={1}
            step="0.01"
            inputMode="decimal"
            required
            value={form.price}
            onChange={update('price')}
          />
          {!isEdit && (
            <TextField
              label="Quantity in stock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
              value={form.quantity}
              onChange={update('quantity')}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Save vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
