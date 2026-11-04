import { useState } from 'react'
import { billStatus, localMonth } from '../utils/bills'
import PeriodDatePicker from './PeriodDatePicker'

const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })

export default function Bills({ bills, transactions, categories, accounts = [], onChange, onPayment, editorOnly = false, onDone }) {
  const [month, setMonth] = useState(localMonth())
  const [draft, setDraft] = useState(() => editorOnly ? { id: crypto.randomUUID(), name: '', amount: 0, dueDay: 1, category: categories.expense[0]?.name || 'Other', startMonth: localMonth() } : null)
  const [payment, setPayment] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState('')
  const today = new Date()
  const date = `${localMonth(today)}-${String(today.getDate()).padStart(2, '0')}`
  function save(event) {
    event.preventDefault()
    const bill = { ...draft, name: draft.name.trim(), amount: Math.round(Number(draft.amount) * 100) / 100, dueDay: Number(draft.dueDay) }
    if (!bill.name || !Number.isFinite(bill.amount) || bill.amount <= 0) return
    onChange([...bills.filter(b => b.id !== bill.id), bill])
    setDraft(null)
    onDone?.()
  }
  return <section className="bills-panel">
    {!editorOnly && <><div className="transaction-list-header"><div><h2>Monthly bills</h2><p className="budget-usage-note">Track what is due and record payments separately from spending limits. Add bills from Manage finances.</p></div></div>
    <div className="bill-month">Billing month <PeriodDatePicker type="month" value={month} onChange={e => { setMonth(e.target.value); setPayment(null) }} /></div>
    {bills.filter(b => b.startMonth <= month).length === 0 && <p className="empty-message">No bills for this month. Add a bill to track its due date and payments.</p>}
    {bills.filter(b => b.startMonth <= month).map(bill => {
      const state = billStatus(bill, transactions, month)
      return <div className="bill-row" key={bill.id}>
        <div><strong>{bill.name}</strong> <span className={state.status === 'Paid' ? 'budget-paid-status' : 'budget-partial-status'}>{state.status}</span>{state.overdue && <span className="bill-overdue"> Overdue</span>}<p className="budget-usage-note">Due {state.dueDate} · {bill.category}</p></div>
        <div className="budget-amount-actions"><span>{money(state.paid)} / {money(bill.amount)}</span>{state.remaining > 0 && <button className="budget-pay-btn" onClick={() => { setPayment({ billId: bill.id, amount: state.remaining, date }); setDraft(null); setError('') }}>{state.paid > 0 ? 'Pay remaining' : 'Pay'}</button>}<button className="export-btn" onClick={() => { setDraft({ ...bill }); setPayment(null) }}>Edit</button><button className="export-btn" onClick={() => setRemoving(bill.id)}>Remove</button></div>
      </div>
    })}</>}
    {draft && <form className="bill-editor" onSubmit={save}><h3>{bills.some(b => b.id === draft.id) ? 'Edit bill' : 'New monthly bill'}</h3><p className="budget-usage-note">Changes to a bill apply across billing months. Payments remain in transaction history.</p>
      <div className="form-group"><label>Bill name<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label></div>
      <div className="form-group"><label>Monthly amount<input inputMode="numeric" aria-label="Monthly amount in pesos" value={money(Number(draft.amount))} onChange={() => {}} onKeyDown={e => {
        const cents = Math.round(Number(draft.amount) * 100)
        if (/^\d$/.test(e.key)) { e.preventDefault(); if (cents < 10000000000) setDraft({ ...draft, amount: (cents * 10 + Number(e.key)) / 100 }) }
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); setDraft({ ...draft, amount: e.key === 'Delete' ? 0 : Math.floor(cents / 10) / 100 }) }
      }} /></label><p className="budget-usage-note">Type digits to enter pesos and cents. Backspace removes a digit.</p></div>
      <div className="form-group"><label>Due day of month<input required type="number" min="1" max="31" value={draft.dueDay} onChange={e => setDraft({ ...draft, dueDay: e.target.value })} /></label></div>
      <div className="form-group"><label>First billing month</label><PeriodDatePicker type="month" value={draft.startMonth} onChange={e => setDraft({ ...draft, startMonth: e.target.value })} /></div>
      <div className="form-group"><label>Expense category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.expense.map(c => <option key={c.id}>{c.name}</option>)}</select></label></div>
      <div className="export-buttons"><button className="primary-action" type="submit" disabled={!Number(draft.amount)}>Save bill</button><button className="export-btn" type="button" onClick={() => { setDraft(null); onDone?.() }}>Cancel</button></div>
    </form>}
    {payment && <form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      const bill = bills.find(b => b.id === payment.billId)
      const amount = Math.round(Number(payment.amount) * 100) / 100
      if (!bill || !Number.isFinite(amount) || amount <= 0 || amount > billStatus(bill, transactions, month).remaining) { setError('Enter an amount up to the remaining balance.'); return }
      onPayment({ id: crypto.randomUUID(), type: 'expense', category: bill.category, description: `${bill.name} payment (${month})`, amount, date: payment.date, billId: bill.id, billMonth: month, accountId: payment.accountId || 'unassigned' })
      setPayment(null)
    }}><h3>Record payment · {bills.find(b => b.id === payment.billId)?.name}</h3><p className="budget-usage-note">Records an expense for the {month} bill. No money is transferred.</p><div className="form-group"><label>Amount<input type="number" min="0.01" step="0.01" required value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} /></label></div><div className="form-group"><label>Payment date<input type="date" required value={payment.date} onChange={e => setPayment({ ...payment, date: e.target.value })} /></label></div>{error && <p role="alert">{error}</p>}<div className="export-buttons"><button className="primary-action" type="submit">Save payment</button><button className="export-btn" type="button" onClick={() => setPayment(null)}>Cancel</button></div></form>}
    {payment && <div className="form-group"><label>Payment account<select value={payment.accountId || 'unassigned'} onChange={e => setPayment({ ...payment, accountId: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>}
    {removing && <div className="backup-confirm"><p>Remove this bill? Recorded expenses will stay in your transaction history.</p><button className="export-btn" onClick={() => { onChange(bills.filter(b => b.id !== removing)); setRemoving(null); setDraft(null); setPayment(null) }}>Remove bill</button><button className="export-btn" onClick={() => setRemoving(null)}>Cancel</button></div>}
  </section>
}
