import { useState } from 'react'
import PeriodDatePicker from './PeriodDatePicker'
import { todayDate } from '../utils/recurring'

export default function RecurringManager({ schedules, categories, accounts = [], onChange }) {
  const [draft, setDraft] = useState({ type: 'expense', category: categories.expense[0]?.name || 'Other', amount: 0, description: '', startDate: todayDate() })
  return <section><h3>Monthly recurring transactions</h3><p className="budget-usage-note">Due entries are recorded when the app opens or returns to focus. Use bills for payments you want to confirm manually. Paused months are skipped; removing a schedule keeps its transaction history.</p>
    {schedules.map(rule => <div className="bill-row" key={rule.id}><div><strong>{rule.description || rule.category}</strong><p className="budget-usage-note">{rule.type} · ₱{rule.amount.toLocaleString('en', { minimumFractionDigits: 2 })} · day {Number(rule.startDate.slice(-2))} · {rule.active ? 'Active' : 'Paused'}</p></div><div className="export-buttons"><button className="export-btn" onClick={() => onChange(schedules.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))}>{rule.active ? 'Pause' : 'Resume'}</button><button className="export-btn" onClick={() => onChange(schedules.filter(r => r.id !== rule.id))}>Remove schedule</button></div></div>)}
    <form className="bill-editor" onSubmit={event => { event.preventDefault(); if (draft.amount <= 0) return; onChange([...schedules, { ...draft, id: crypto.randomUUID(), active: true }]); setDraft({ ...draft, amount: 0, description: '' }) }}>
      <div className="form-group"><label>Account<select value={draft.accountId || 'unassigned'} onChange={e => setDraft({ ...draft, accountId: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>
      <div className="form-group"><label>Type<select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value, category: categories[e.target.value][0]?.name || 'Other' })}><option value="expense">Expense</option><option value="income">Income</option></select></label></div>
      <div className="form-group"><label>Category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories[draft.type].map(c => <option key={c.id}>{c.name}</option>)}</select></label></div>
      <div className="form-group"><label>Monthly amount<input inputMode="numeric" value={`₱${draft.amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} onChange={() => {}} onKeyDown={e => { const cents = Math.round(draft.amount * 100); if (/^\d$/.test(e.key)) { e.preventDefault(); if (cents < 10000000000) setDraft({ ...draft, amount: (cents * 10 + Number(e.key)) / 100 }) } else if (e.key === 'Backspace') { e.preventDefault(); setDraft({ ...draft, amount: Math.floor(cents / 10) / 100 }) } }} /></label></div>
      <div className="form-group"><label>Description<input value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label></div>
      <div className="form-group"><label>First occurrence</label><PeriodDatePicker type="date" value={draft.startDate} onChange={e => setDraft({ ...draft, startDate: e.target.value })} /></div>
      <p className="budget-usage-note">Past start dates create all monthly entries due through today. For the 29th–31st, shorter months use their last day.</p><button className="primary-action" disabled={draft.amount <= 0}>Add schedule</button>
    </form>
  </section>
}
