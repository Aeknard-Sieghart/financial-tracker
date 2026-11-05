import ActionButton from './ActionButton'
import { useState } from 'react'
import { billStatus, localMonth } from '../utils/bills'
import PeriodDatePicker from './PeriodDatePicker'
import AccountEditorSurface from './AccountEditorSurface'
import BillProviderIcon from './BillProviderIcon'
import { BILL_PROVIDERS, providerFor } from '../constants/billProviders'
import BillAmountInput from './BillAmountInput'

const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })

export default function Bills({ bills, transactions, categories, accounts: allAccounts = [], onChange, onPayment, editorOnly = false, onDone, initialMonth, onMoveToDebt }) {
  const accounts = allAccounts.filter(a => !a.archived)
  const [month, setMonth] = useState(initialMonth || localMonth())
  const [draft, setDraft] = useState(() => editorOnly ? { id: crypto.randomUUID(), name: '', amount: 0, dueDay: 1, category: categories.expense[0]?.name || 'Other', startMonth: localMonth() } : null)
  const [payment, setPayment] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState('')
  const [monthAmount, setMonthAmount] = useState(null)
  const [movingBill, setMovingBill] = useState(null)
  const today = new Date()
  const date = `${localMonth(today)}-${String(today.getDate()).padStart(2, '0')}`
  function save(event) {
    event.preventDefault()
    const bill = { ...draft, name: draft.name.trim(), amount: Math.round(Number(draft.amount) * 100) / 100, dueDay: Number(draft.dueDay) }
    if (!bill.name || !Number.isFinite(bill.amount) || (bill.amountType !== 'variable' && bill.amount <= 0)) return
    onChange([...bills.filter(b => b.id !== bill.id), bill])
    setDraft(null)
    onDone?.()
  }
  return <section className="bills-panel">
    {!editorOnly && <><div className="transaction-list-header"><div><h2>Monthly bills</h2><p className="budget-usage-note">Track what is due and record payments separately from spending limits.</p></div><ActionButton icon="add" type="button" className="export-btn" onClick={() => { setDraft({ id: crypto.randomUUID(), name: '', amount: 0, dueDay: 1, category: categories.expense[0]?.name || 'Other', startMonth: month }); setPayment(null); setError('') }}>Add monthly bill</ActionButton></div>
    <div className="bill-month">Billing month <PeriodDatePicker type="month" value={month} onChange={e => { setMonth(e.target.value); setPayment(null) }} /></div>
    {bills.filter(b => b.startMonth <= month).length === 0 && <p className="empty-message">No bills for this month. Add a bill to track its due date and payments.</p>}
    {bills.filter(b => b.startMonth <= month).map(bill => {
      const state = billStatus(bill, transactions, month)
      return <div className="bill-row" key={bill.id}>
        <div className="bill-identity"><BillProviderIcon bill={bill} /><div><strong>{bill.name}</strong> <span className={state.status === 'Paid' ? 'budget-paid-status' : 'budget-partial-status'}>{state.status}</span>{state.overdue && <span className="bill-overdue"> Overdue</span>}<p className="budget-usage-note">Due {state.dueDate} · {providerFor(bill)?.name || bill.category} · {bill.amountType === 'variable' ? 'Variable' : 'Fixed'}</p></div></div>
        {onMoveToDebt && ['tala', 'shopeepay'].includes(providerFor(bill)?.id) && state.remaining > 0 && <ActionButton icon="transfer" className="export-btn" onClick={() => setMovingBill(bill)}>Move to debt</ActionButton>}
        <div className="budget-amount-actions"><span>{state.pending ? 'Enter this month’s amount' : `${money(state.paid)} / ${money(state.amount)}`}</span>{bill.amountType === 'variable' && <ActionButton icon="edit" className="export-btn" onClick={() => { setMonthAmount({ id: bill.id, month, amount: state.amount ?? 0 }); setError('') }}>{state.pending ? 'Set amount' : 'Edit month amount'}</ActionButton>}{state.remaining > 0 && <ActionButton icon="pay" className="budget-pay-btn" onClick={() => { setPayment({ billId: bill.id, amount: state.remaining, date }); setDraft(null); setError('') }}>{state.paid > 0 ? 'Pay remaining' : 'Pay'}</ActionButton>}<ActionButton icon="edit" className="export-btn" onClick={() => { setDraft({ ...bill }); setPayment(null) }}>Edit</ActionButton><ActionButton icon="remove" className="export-btn" onClick={() => setRemoving(bill.id)}>Remove</ActionButton></div>
      </div>
    })}</>}
    {draft && <AccountEditorSurface embedded={editorOnly} title={bills.some(b => b.id === draft.id) ? 'Edit monthly bill' : 'Add monthly bill'} onClose={() => { setDraft(null); onDone?.() }}><form className="bill-editor" onSubmit={save}><h3>{bills.some(b => b.id === draft.id) ? 'Edit bill' : 'New monthly bill'}</h3><p className="budget-usage-note">Changes to a bill apply across billing months. Payments remain in transaction history.</p>
      <div className="form-group"><label>Bill name<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label></div>
      <div className="form-group"><label>Provider<select value={draft.provider || providerFor(draft)?.id || 'other'} onChange={e => setDraft({ ...draft, provider: e.target.value })}><option value="other">Other / general bill</option>{BILL_PROVIDERS.filter(p => !['tala', 'shopeepay'].includes(p.id) || (bills.some(b => b.id === draft.id) && providerFor(draft)?.id === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="bill-provider-preview"><BillProviderIcon bill={draft} /><span>{providerFor(draft)?.name || 'General bill'}</span></div><p className="budget-usage-note">For loans and credit repayments, use Add debt in Manage finances.</p></div>
      <div className="form-group"><label>Amount type<select value={draft.amountType || 'fixed'} onChange={e => {
        const monthlyAmounts = { ...draft.monthlyAmounts }
        if (e.target.value === 'variable' && draft.amountType !== 'variable' && draft.amount > 0) {
          for (const t of transactions.filter(t => t.billId === draft.id && t.billMonth)) if (!Object.hasOwn(monthlyAmounts, t.billMonth)) monthlyAmounts[t.billMonth] = draft.amount
        }
        setDraft({ ...draft, amountType: e.target.value, monthlyAmounts })
      }}><option value="fixed">Fixed — same amount every month</option><option value="variable">Variable — enter an amount each month</option></select></label></div>
      {draft.amountType === 'variable' ? <p className="budget-usage-note">Save the bill, then use Set amount for each billing month. Months without an amount remain pending.</p> : <BillAmountInput label="Monthly amount" value={draft.amount} onChange={amount => setDraft({ ...draft, amount })} />}
      <div className="form-group"><label>Due day of month<input required type="number" min="1" max="31" value={draft.dueDay} onChange={e => setDraft({ ...draft, dueDay: e.target.value })} /></label></div>
      <div className="form-group"><label>First billing month</label><PeriodDatePicker type="month" value={draft.startMonth} onChange={e => setDraft({ ...draft, startMonth: e.target.value })} /></div>
      <div className="form-group"><label>Expense category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.expense.map(c => <option key={c.id}>{c.name}</option>)}</select></label></div>
      <div className="export-buttons"><ActionButton icon="save" className="primary-action" type="submit" disabled={draft.amountType !== 'variable' && !Number(draft.amount)}>Save bill</ActionButton><ActionButton icon="close" className="export-btn" type="button" onClick={() => { setDraft(null); onDone?.() }}>Cancel</ActionButton></div>
    </form></AccountEditorSurface>}
    {monthAmount && <AccountEditorSurface title={`Bill amount · ${monthAmount.month}`} error={error} onClose={() => { setMonthAmount(null); setError('') }}><form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      const bill = bills.find(b => b.id === monthAmount.id)
      const paid = billStatus(bill, transactions, monthAmount.month).paid
      if (!Number.isFinite(monthAmount.amount) || monthAmount.amount < paid || monthAmount.amount < 0) { setError(`Amount cannot be below recorded payments (${money(paid)}).`); return }
      onChange(bills.map(b => b.id === bill.id ? { ...b, monthlyAmounts: { ...b.monthlyAmounts, [monthAmount.month]: monthAmount.amount } } : b))
      setMonthAmount(null); setError('')
    }}><p className="budget-usage-note">Updates this billing month only. Other months remain unchanged. Enter zero if nothing is due.</p><BillAmountInput label="Amount due this month" value={monthAmount.amount} onChange={amount => setMonthAmount({ ...monthAmount, amount })} /><div className="export-buttons"><ActionButton icon="save" className="primary-action">Save amount</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={() => setMonthAmount(null)}>Cancel</ActionButton></div></form></AccountEditorSurface>}
    {payment && <form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      const bill = bills.find(b => b.id === payment.billId)
      const amount = Math.round(Number(payment.amount) * 100) / 100
      if (!bill || !Number.isFinite(amount) || amount <= 0 || amount > billStatus(bill, transactions, month).remaining) { setError('Enter an amount up to the remaining balance.'); return }
      onPayment({ id: crypto.randomUUID(), type: 'expense', category: bill.category, description: `${bill.name} payment (${month})`, amount, date: payment.date, billId: bill.id, billMonth: month, accountId: payment.accountId || 'unassigned' })
      setPayment(null)
    }}><h3>Record payment · {bills.find(b => b.id === payment.billId)?.name}</h3><p className="budget-usage-note">Records an expense for the {month} bill. No money is transferred.</p><div className="form-group"><label>Amount<input type="number" min="0.01" step="0.01" required value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} /></label></div><div className="form-group"><label>Payment date<input type="date" required value={payment.date} onChange={e => setPayment({ ...payment, date: e.target.value })} /></label></div>{error && <p role="alert">{error}</p>}<div className="export-buttons"><ActionButton icon="save" className="primary-action" type="submit">Save payment</ActionButton><ActionButton icon="close" className="export-btn" type="button" onClick={() => setPayment(null)}>Cancel</ActionButton></div></form>}
    {payment && <div className="form-group"><label>Payment account<select value={payment.accountId || 'unassigned'} onChange={e => setPayment({ ...payment, accountId: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>}
    {movingBill && <AccountEditorSurface title="Move bill to debt" onClose={() => setMovingBill(null)}><p>Move {movingBill.name} to {providerFor(movingBill)?.id === 'tala' ? 'TALA' : 'Shopee SPayLater'} debt with {money(billStatus(movingBill, transactions, month).remaining)} principal owed? Confirm this is principal only, excluding interest and fees. The bill schedule will be removed. Earlier payments keep their existing classification in transaction history.</p><div className="export-buttons"><ActionButton icon="transfer" className="primary-action" onClick={() => { onMoveToDebt(movingBill, billStatus(movingBill, transactions, month)); setMovingBill(null) }}>Confirm move</ActionButton><ActionButton icon="close" className="export-btn" onClick={() => setMovingBill(null)}>Cancel</ActionButton></div></AccountEditorSurface>}
    {removing && <div className="backup-confirm"><p>Remove this bill? Recorded expenses will stay in your transaction history.</p><ActionButton icon="remove" className="export-btn" onClick={() => { onChange(bills.filter(b => b.id !== removing)); setRemoving(null); setDraft(null); setPayment(null) }}>Remove bill</ActionButton><ActionButton icon="close" className="export-btn" onClick={() => setRemoving(null)}>Cancel</ActionButton></div>}
  </section>
}
