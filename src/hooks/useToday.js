import { useEffect, useState } from 'react'
import { todayDate } from '../utils/recurring'

export function useToday() {
  const [today, setToday] = useState(todayDate)
  useEffect(() => {
    const refresh = () => setToday(todayDate())
    const interval = window.setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [])
  return today
}
