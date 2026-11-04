import { useEffect, useState } from 'react'

// Persistence for independent collections; transaction generation stays in App.
export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
    catch { return fallback }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue]
}
