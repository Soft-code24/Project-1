import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const value = useMemo(() => {
    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))
    const showToast = (message, tone = 'default') => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
      setTimeout(() => dismiss(id), 2600)
    }
    return { showToast, dismiss }
  }, [])

  const toneStyles = {
    default: 'bg-charcoal text-white',
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
  }
  const ToneIcon = { default: Info, success: CheckCircle2, error: XCircle }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:top-24"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => {
          const Icon = ToneIcon[t.tone] || Info
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-lg px-4 py-3 shadow-overlay animate-slide-up ${toneStyles[t.tone] || toneStyles.default}`}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <p className="text-label-md">{t.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
