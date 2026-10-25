import { useEffect } from 'react'

export interface ToastMessage {
  id: number
  kind: 'success' | 'error'
  text: string
}

const DISMISS_AFTER_MS = 3500

/** Small non-blocking notification announced to screen readers via role="status". */
export function Toast({ message, onDismiss }: { message: ToastMessage | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, DISMISS_AFTER_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null
  const styles = message.kind === 'success' ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div role="status" className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${styles}`}>
        {message.text}
      </div>
    </div>
  )
}
