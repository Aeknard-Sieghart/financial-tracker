import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  // Add a new toast notification
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}