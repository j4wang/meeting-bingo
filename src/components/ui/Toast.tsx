import { useEffect } from 'react'
import type { Toast as ToastType } from '../../types'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast.persistent) return
    const id = setTimeout(() => onDismiss(toast.id), 3000)
    return () => clearTimeout(id)
  }, [toast.id, toast.persistent, onDismiss])

  return (
    <div className="flex items-center gap-3 bg-gray-900 text-white rounded-lg px-4 py-3 shadow-lg min-w-[220px] max-w-xs">
      <span className="flex-1 text-sm">{toast.message}</span>
      {toast.persistent && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      )}
    </div>
  )
}
