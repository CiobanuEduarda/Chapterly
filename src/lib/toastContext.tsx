"use client"
import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// Define types
export type ToastType = "success" | "error" | "info"

export type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextType = {
  toasts: Toast[]
  showToast: (message: string, type: ToastType) => void
  hideToast: (id: number) => void
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast container component
export function ToastContainer() {
  const context = useContext(ToastContext)

  if (!context) {
    return null
  }

  const { toasts, hideToast } = context

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md flex justify-between items-center min-w-[300px] ${
            toast.type === "success"
              ? "bg-[#52796F] text-white"
              : toast.type === "error"
                ? "bg-[#C76E77] text-white"
                : "bg-[#A1AD92] text-[#042405]"
          }`}
        >
          <p>{toast.message}</p>
          <button onClick={() => hideToast(toast.id)} className="ml-4 text-sm opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// Provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Show a new toast
  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts((prevToasts) => [...prevToasts, { id, message, type }])

    // Automatically remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, 3000)
  }, [])

  // Hide a toast by id
  const hideToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const value = {
    toasts,
    showToast,
    hideToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Custom hook to use the toast context
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

