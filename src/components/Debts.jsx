import { useState } from 'react'
import ActionButton from './ActionButton'
import AccountEditorSurface from './AccountEditorSurface'
import BillAmountInput from './BillAmountInput'
import PeriodDatePicker from './PeriodDatePicker'
import { todayDate } from '../utils/recurring'
import { accountBalance } from '../utils/accounts'
import { DEBT_PROVIDERS, debtBalance, debtMonthStatus, repaymentError, repaymentEntries, validDebt } from '../utils/debts'
import { localMonth } from '../utils/bills'
import DebtAmountSettings from './DebtAmountSettings'

const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
export default function Debts({ debts, transactions, accounts: allAccounts, transfers, onChange, onRepay, editorOnly = false, onDone }) {
  const accounts = allAccounts.filter(a => !a.archived)
  const create = () => ({ id: crypto.randomUUID(), name: '', provider: 'tala', openingPrincipal: 0, amountType: 'fixed', dueDate: todayDate() })
  const [draft, setDraft] = useState(() => editorOnly ? create() : null)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(localMonth())
  const [amountEditor, setAmountEditor] = useState(null)
  const close = () => { setDraft(null); setPayment(null); setAmountEditor(null); setError(''); onDone?.() }
  const selected = payment && debts.find(d => d.id === payment.debtId)
  const account = payment && accounts.find(a => a.id === payment.accountId)
  const available = account ? accountBalance(account, transactions, transfers) : 0
  return <section className={editorOnly ? 'debt-panel' : 'bills-panel debt-panel'}>
    {!editorOnly && <><div className="transaction-list-header"><div><h2>Debt</h2><p className="budget-usage-note">Loans and credit balances. Principal reduces debt; interest and fees count as expenses.</p></div><ActionButton icon="add" className="export-btn" onClick={() => { setDraft(create()); setError('') }}>Add debt</ActionButton></div>
      <div className="bill-month">Billing month <PeriodDatePicker type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
      {!debts.length && <p className="empty-message">Track TALA, SPayLater, Maya Credit, GLoan, GCredit, or another debt here.</p>}
      {debts.map(debt => {
        const provider = DEBT_PROVIDERS.find(p => p.id === debt.provider)
        const remaining = debtBalance(debt, transactions)
        const state = debtMonthStatus(debt, transactions, month)
        const scheduled = Boolean(debt.amountType)
        return <div className="bill-row" key={debt.id}><div className="bill-identity"><span className="bill-provider-icon" style={{ color: provider?.color }}>{provider?.logo ? <img src={provider.logo} alt={provider.name} /> : <strong>{provider?.initials}</strong>}</span><div><strong>{debt.name}</strong> <span className={remaining === 0 || (scheduled && state.remaining === 0) ? 'budget-paid-status' : 'budget-partial-status'}>{scheduled ? state.status : remaining === 0 ? 'Paid off' : 'Outstanding'}</span>{state.overdue && <span className="bill-overdue"> Overdue</span>}<p className="budget-usage-note">{provider?.name} · Due {scheduled ? state.dueDate : debt.dueDate} · {debt.amountType === 'variable' ? 'Variable' : scheduled ? 'Fixed' : 'Legacy balance'}</p></div></div><div className="budget-amount-actions"><div><span>{money(remaining)} principal remaining</span>{scheduled && <p className="budget-usage-note">{state.pending ? 'Amount pending' : `${money(state.paid)} / ${money(state.amount ?? 0)} paid this month`}</p>}</div>{debt.amountType === 'variable' && month >= debt.dueDate.slice(0, 7) && <ActionButton icon="edit" className="export-btn" onClick={() => { setAmountEditor({ id: debt.id, amount: state.amount ?? 0, month }); setError('') }}>{state.pending ? 'Set amount' : 'Edit month amount'}</ActionButton>}{remaining > 0 && (!scheduled || state.remaining > 0) && <ActionButton icon="pay" className="budget-pay-btn" onClick={() => { setPayment({ debtId: debt.id, principal: 0, fees: 0, date: todayDate(), debtMonth: month, accountId: accounts.find(a => a.id !== 'unassigned')?.id || 'unassigned', nextDueDate: debt.dueDate }); setError('') }}>Repay</ActionButton>}<ActionButton icon="edit" className="export-btn" onClick={() => { setDraft({ ...debt }); setError('') }}>Edit</ActionButton></div></div>
      })}</>}
    {draft && <AccountEditorSurface embedded={editorOnly} title={debts.some(d => d.id === draft.id) ? 'Edit debt' : 'Add debt'} onClose={close} error={error}><form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      if (!validDebt(draft)) { setError('Enter the debt name, amount owed, and due date.'); return }
      const paid = transactions.filter(t => t.type === 'debt-payment' && t.debtId === draft.id).reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100
      if (draft.openingPrincipal < paid) { setError('Opening principal cannot be less than principal already repaid.'); return }
      onChange([...debts.filter(d => d.id !== draft.id), { ...draft, name: draft.name.trim(), amountType: draft.amountType || 'fixed', paymentAmount: draft.paymentAmount ?? draft.openingPrincipal }]); close()
    }}>
      <div className="form-group"><label>Provider<select value={draft.provider} onChange={e => setDraft({ ...draft, provider: e.target.value })}>{DEBT_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
      <div className="form-group"><label>Debt name<input required placeholder="e.g. SPayLater installments" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label></div>
      <BillAmountInput label="Opening principal owed" value={draft.openingPrincipal} onChange={openingPrincipal => setDraft({ ...draft, openingPrincipal })} />
      <p className="budget-usage-note">Total principal owed, excluding fees. This is separate from each month's payment due.</p>
      <DebtAmountSettings draft={draft} onChange={setDraft} />
      <div className="form-group"><label>First monthly due date</label><PeriodDatePicker type="date" value={draft.dueDate} onChange={e => setDraft({ ...draft, dueDate: e.target.value })} /></div>
      <div className="export-buttons"><ActionButton icon="save" className="primary-action">Save debt</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={close}>Cancel</ActionButton></div>
    </form></AccountEditorSurface>}
    {amountEditor && <AccountEditorSurface title={`Debt amount · ${amountEditor.month}`} error={error} onClose={close}><form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      const debt = debts.find(d => d.id === amountEditor.id)
      const state = debtMonthStatus(debt, transactions, amountEditor.month)
      if (!Number.isFinite(amountEditor.amount) || amountEditor.amount < 0 || Math.round(amountEditor.amount * 100) < Math.round(state.paid * 100)) { setError('Amount cannot be below payments already recorded for this month.'); return }
      onChange(debts.map(d => d.id === debt.id ? { ...d, monthlyAmounts: { ...d.monthlyAmounts, [amountEditor.month]: amountEditor.amount } } : d)); close()
    }}><p className="budget-usage-note">Enter this month's total statement amount, including interest and fees. Other months and the outstanding principal remain unchanged. Zero means no payment due.</p><BillAmountInput label="Monthly amount due" value={amountEditor.amount} onChange={amount => setAmountEditor({ ...amountEditor, amount })} /><div className="export-buttons"><ActionButton icon="save" className="primary-action">Save amount</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={close}>Cancel</ActionButton></div></form></AccountEditorSurface>}
    {selected && <AccountEditorSurface title={`Repay · ${selected.name}`} onClose={close} error={error}><form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      const message = repaymentError(payment.principal, payment.fees, debtBalance(selected, transactions), available)
      if (message) { setError(message); return }
      const state = debtMonthStatus(selected, transactions, payment.debtMonth)
      if (selected.amountType && (state.pending || Math.round((payment.principal + payment.fees) * 100) > Math.round(state.remaining * 100))) { setError('Payment exceeds the remaining amount due for this billing month.'); return }
      const entries = repaymentEntries(selected, payment.principal, payment.fees, payment.accountId, payment.date, crypto.randomUUID(), payment.debtMonth)
      onRepay(entries)
      if (!selected.amountType) onChange(debts.map(d => d.id === selected.id ? { ...d, dueDate: payment.nextDueDate } : d))
      close()
    }}><p className="budget-usage-note">Outstanding principal: {money(debtBalance(selected, transactions))}{selected.amountType ? ` · ${payment.debtMonth} remaining due: ${money(debtMonthStatus(selected, transactions, payment.debtMonth).remaining || 0)}` : ''}</p>
      <div className="form-group"><label>Payment account<select value={payment.accountId} onChange={e => setPayment({ ...payment, accountId: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><p className="budget-usage-note">Available balance: {money(available)}</p></div>
      <BillAmountInput label="Principal repayment" value={payment.principal} onChange={principal => setPayment({ ...payment, principal })} /><BillAmountInput label="Interest and fees (expense)" value={payment.fees} onChange={fees => setPayment({ ...payment, fees })} />
      <p>Total deducted: {money(payment.principal + payment.fees)}</p><div className="form-group"><label>Payment date</label><PeriodDatePicker type="date" value={payment.date} onChange={e => setPayment({ ...payment, date: e.target.value })} /></div>
      {!selected.amountType && <div className="form-group"><label>Next due date after this payment</label><PeriodDatePicker type="date" value={payment.nextDueDate} onChange={e => setPayment({ ...payment, nextDueDate: e.target.value })} /></div>}
      <p className="budget-usage-note">Recorded for billing month {payment.debtMonth}. No money is transferred by this app. Deleting either entry reverses the whole repayment.</p><div className="export-buttons"><ActionButton icon="save" className="primary-action">Save repayment</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={close}>Cancel</ActionButton></div></form></AccountEditorSurface>}
  </section>
}
