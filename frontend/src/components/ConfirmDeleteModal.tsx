import { useState } from 'react'
import type { Vehicle } from '../types'
import { errorMessage } from '../utils/errors'
import { vehicleName } from '../utils/format'
import { ErrorAlert } from './ui/Alert'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

interface ConfirmDeleteModalProps {
  vehicle: Vehicle
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDeleteModal({ vehicle, onConfirm, onClose }: ConfirmDeleteModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(errorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <Modal
      title="Delete vehicle?"
      description={`${vehicleName(vehicle)} will be removed from the inventory. This can't be undone.`}
      onClose={onClose}
    >
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} autoFocus>
          Cancel
        </Button>
        <Button variant="danger" loading={deleting} onClick={handleConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  )
}
