import { useEffect, useState } from 'react'
import { useWorkspaceStorage } from './useWorkspace'

// Persistence for independent collections; transaction generation stays in App.
export function useStoredState(key, fallback) {
  const storage = useWorkspaceStorage()
  const [value, setValue] = useState(() => {
    try { return JSON.parse(storage.getItem(key)) ?? fallback }
    catch { return fallback }
  })
  useEffect(() => { storage.setItem(key, JSON.stringify(value)) }, [storage, key, value])
  return [value, setValue]
}
