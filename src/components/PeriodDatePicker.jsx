import { useEffect, useRef, useState } from 'react'

export default function PeriodDatePicker({ type, value, min, max, onChange }) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(Number(value.slice(0, 4)))
  const [month, setMonth] = useState(Number(value.slice(5, 7)) - 1)
  const root = useRef(null)
  const trigger = useRef(null)
  const months = Array.from({ length: 12 }, (_, i) => new Date(2024, i).toLocaleString('en', { month: 'short' }))
  useEffect(() => {
    const outside = (event) => { if (!root.current.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  const key = (m, day) => `${year}-${String(m + 1).padStart(2, '0')}${day ? `-${String(day).padStart(2, '0')}` : ''}`
  const disabled = (date) => Boolean((min && date < min) || (max && date > max))
  const choose = (date) => { onChange({ target: { value: date } }); setOpen(false); trigger.current.focus() }
  const move = (offset) => { const date = new Date(year, month + offset); setYear(date.getFullYear()); setMonth(date.getMonth()) }
  return <div className="period-picker" ref={root} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current.focus() } }}>
    <button ref={trigger} type="button" className="period-picker-trigger" aria-label={`Choose ${type === 'month' ? 'month' : 'date'}: ${value}`} aria-expanded={open} onClick={() => { setYear(Number(value.slice(0, 4))); setMonth(Number(value.slice(5, 7)) - 1); setOpen(!open) }}>
      <span>{new Date(`${value}${type === 'month' ? '-01' : ''}T12:00:00`).toLocaleDateString('en', { year: 'numeric', month: 'short', ...(type === 'date' ? { day: 'numeric' } : {}) })}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h3m2 0h3"/></svg>
    </button>
    {open && <div className="period-calendar" role="group" aria-label="Calendar">
      <div className="calendar-toolbar"><button type="button" aria-label="Previous" onClick={() => type === 'month' ? setYear(year - 1) : move(-1)}>‹</button><strong>{type === 'date' ? `${months[month]} ` : ''}{year}</strong><button type="button" aria-label="Next" onClick={() => type === 'month' ? setYear(year + 1) : move(1)}>›</button></div>
      <div className={type === 'month' ? 'calendar-months' : 'calendar-days'}>
        {type === 'date' && <>{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span key={day}>{day}</span>)}{Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => <span key={`blank-${i}`} />)}</>}
        {Array.from({ length: type === 'month' ? 12 : new Date(year, month + 1, 0).getDate() }, (_, i) => {
          const date = type === 'month' ? key(i) : key(month, i + 1)
          return <button type="button" key={date} disabled={disabled(date)} aria-pressed={value === date} className={value === date ? 'selected' : ''} onClick={() => choose(date)}>{type === 'month' ? months[i] : i + 1}</button>
        })}
      </div>
    </div>}
  </div>
}
