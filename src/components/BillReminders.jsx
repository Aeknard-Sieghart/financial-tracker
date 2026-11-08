import { useWorkspaceSessionStorage } from '../hooks/useWorkspace'
import ActionButton from './ActionButton'
import { useState } from 'react'

export default function BillReminders({ reminders, today, onView }) {
  const storage = useWorkspaceSessionStorage()
  const [dismissed, setDismissed] = useState(() => storage.getItem('billReminderDismissed'))
  const [expanded, setExpanded] = useState(false)
  const signature = `${today}:${reminders.map(r => `${r.key}:${r.remaining}`).join('|')}`
  if (!reminders.length || dismissed === signature) return null
  const overdue = reminders.filter(r => r.overdue).length
  return <section className="bill-reminder-panel" aria-label="Upcoming payments">
    <div className="reminder-header"><div><h2>Upcoming payments <span className="reminder-count">{reminders.length}</span></h2><p>{overdue > 0 ? `${overdue} overdue · ` : ''}{reminders.length - overdue} due today or within 7 days</p></div><ActionButton icon="close" type="button" className="export-btn" onClick={() => { storage.setItem('billReminderDismissed', signature); setDismissed(signature) }} aria-label="Dismiss payment reminders for this session">Dismiss</ActionButton></div>
    <div className="reminder-list">{(expanded ? reminders : reminders.slice(0, 4)).map(r => <div className="reminder-row" key={r.key}><div><strong>{r.bill.name}</strong><p>{r.kind === 'debt' ? 'Debt payment' : 'Bill'} · <span className={r.overdue ? 'bill-overdue' : ''}>{r.overdue ? 'Overdue' : r.dueDate === today ? 'Due today' : 'Due soon'}</span> · {r.dueDate}{r.paid > 0 ? ' · Partially paid' : ''}</p></div><div className="reminder-actions"><span>{r.pending ? 'Amount pending' : r.remaining.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span><ActionButton as="a" icon="view" className="export-btn" href={r.kind === 'debt' ? '#debts' : '#monthly-bills'} onClick={() => { if (r.kind !== 'debt') onView(r.month) }}>{r.kind === 'debt' ? 'View debt' : 'View bill'}</ActionButton></div></div>)}</div>
    {reminders.length > 4 && <ActionButton icon="expand" className="menu-back" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer' : `Show all ${reminders.length} reminders`}</ActionButton>}
  </section>
}
