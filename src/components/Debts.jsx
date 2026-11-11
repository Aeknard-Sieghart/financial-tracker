import { useState } from 'react'
import ActionButton from './ActionButton'
import AccountEditorSurface from './AccountEditorSurface'
import BillAmountInput from './BillAmountInput'
import PeriodDatePicker from './PeriodDatePicker'
import { todayDate } from '../utils/recurring'
import { accountBalance } from '../utils/accounts'
import { DEBT_PROVIDERS, debtBalance, debtMonthStatus, repaymentError, repaymentEntries, validDebt, fixedPaymentCalculation, debtScheduleEditError, canDeleteDebt } from '../utils/debts'
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
  const [showArchived, setShowArchived] = useState(false)
  const [debtAction, setDebtAction] = useState(null)
  const visibleDebts = debts.filter(debt => !debt.archived || showArchived)
  const close = () => { setDraft(null); setPayment(null); setAmountEditor(null); setDebtAction(null); setError(''); onDone?.() }
  const selected = payment && debts.find(d => d.id === payment.debtId)
  const account = payment && accounts.find(a => a.id === payment.accountId)
  const available = account ? accountBalance(account, transactions, transfers) : 0
  return <section className={editorOnly ? 'debt-panel' : 'bills-panel debt-panel'}>
    {!editorOnly && <><div className="transaction-list-header"><div><h2>Debt</h2><p className="budget-usage-note">Loans and credit balances. Principal reduces debt; interest and fees count as expenses.</p></div><ActionButton icon="add" className="export-btn" onClick={() => { setDraft(create()); setError('') }}>Add debt</ActionButton></div>
      <div className="bill-month">Billing month <PeriodDatePicker type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
      {debts.some(debt => debt.archived) && <label className="archived-account-toggle"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} /> Show archived debts</label>}
      {debts.length > 0 && !visibleDebts.length && <p className="empty-message">No active debts. Turn on Show archived debts to view or restore archived records.</p>}
      {debts.some(debt => debt.archived && debtBalance(debt, transactions) > 0) && <p className="budget-usage-note">Archived debts with unpaid balances still count toward payment reminders and Safe to spend.</p>}
      {!debts.length && <p className="empty-message">Track TALA, SPayLater, Maya Credit, GLoan, GCredit, or another debt here.</p>}
      {visibleDebts.map(debt => {
        const provider = DEBT_PROVIDERS.find(p => p.id === debt.provider)
        const remaining = debtBalance(debt, transactions)
        const state = debtMonthStatus(debt, transactions, month)
        const scheduled = Boolean(debt.amountType)
        return <div className="bill-row" key={debt.id}><div className="bill-identity"><span className="bill-provider-icon" style={{ color: provider?.color }}>{provider?.logo ? <img src={provider.logo} alt={provider.name} /> : <strong>{provider?.initials}</strong>}</span><div><strong>{debt.name}</strong>{debt.archived && <span className="budget-partial-status"> Archived</span>} <span className={remaining === 0 || (scheduled && state.remaining === 0 && state.started && !state.ended) ? 'budget-paid-status' : 'budget-partial-status'}>{scheduled ? state.status : remaining === 0 ? 'Paid off' : 'Outstanding'}</span>{state.overdue && <span className="bill-overdue"> Overdue</span>}<p className="budget-usage-note">{provider?.name} · {state.ended ? 'Final due' : 'Due'} {state.ended ? debt.finalDueDate : scheduled ? state.dueDate : debt.dueDate} · {debt.amountType === 'variable' ? 'Variable' : scheduled ? 'Fixed' : 'Legacy balance'}</p></div></div><div className="budget-amount-actions"><div className="debt-balance-summary"><span>{money(remaining)} principal remaining</span>{scheduled && <p className="budget-usage-note">{state.ended ? 'Schedule ended; review unpaid principal or earlier billing months.' : state.pending ? 'Amount pending' : `${money(state.paid)} / ${money(state.amount ?? 0)} paid this month`}</p>}</div>{debt.amountType === 'variable' && state.started && !state.ended && <ActionButton icon="edit" className="export-btn" onClick={() => { setAmountEditor({ id: debt.id, amount: state.amount ?? 0, month }); setError('') }}>{state.pending ? 'Set amount' : 'Edit month amount'}</ActionButton>}{remaining > 0 && (!scheduled || state.remaining > 0) && <ActionButton icon="pay" className="budget-pay-btn" onClick={() => { setPayment({ debtId: debt.id, principal: 0, fees: 0, date: todayDate(), debtMonth: month, accountId: accounts.find(a => a.id !== 'unassigned')?.id || 'unassigned', nextDueDate: debt.dueDate }); setError('') }}>Repay</ActionButton>}{state.ended && remaining > 0 && <ActionButton icon="view" className="export-btn" onClick={() => setMonth(debt.finalDueDate.slice(0, 7))}>View final month</ActionButton>}<ActionButton icon="edit" className="export-btn" onClick={() => { setDraft({ ...debt }); setError('') }}>Edit</ActionButton></div></div>
      })}</>}
    {draft && <AccountEditorSurface embedded={editorOnly} title={debts.some(d => d.id === draft.id) ? 'Edit debt' : 'Add debt'} onClose={close} error={error}><form className="bill-editor" onSubmit={e => {
      e.preventDefault()
      if (!validDebt(draft)) { setError('Enter a debt name, positive principal and monthly amount, and valid payment dates. Calculated totals must cover the principal; a single payment needs matching first/final dates.'); return }
      const paid = transactions.filter(t => t.type === 'debt-payment' && t.debtId === draft.id).reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100
      if (draft.openingPrincipal < paid) { setError('Opening principal cannot be less than principal already repaid.'); return }
      const scheduleError = debtScheduleEditError(draft, transactions)
      if (scheduleError) { setError(scheduleError); return }
      const calculation = draft.paymentMode === 'calculated' ? fixedPaymentCalculation(draft) : null
      const saved = { ...draft, name: draft.name.trim(), amountType: draft.amountType || 'fixed', paymentAmount: calculation?.monthlyAmount ?? draft.paymentAmount ?? draft.openingPrincipal }
      if (calculation) saved.monthlyAmounts = undefined
      onChange(debts.some(d => d.id === draft.id) ? debts.map(d => d.id === draft.id ? saved : d) : [...debts, saved]); close()
    }}>
      <div className="form-group"><label>Provider<select value={draft.provider} onChange={e => setDraft({ ...draft, provider: e.target.value })}>{DEBT_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
      <div className="form-group"><label>Debt name<input required placeholder="e.g. SPayLater installments" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label></div>
      <BillAmountInput label="Opening principal owed" value={draft.openingPrincipal} onChange={openingPrincipal => setDraft({ ...draft, openingPrincipal })} />
      <p className="budget-usage-note">Total principal owed, excluding fees. This is separate from each month's payment due.</p>
      <DebtAmountSettings draft={draft} onChange={setDraft} />

      <div className="export-buttons"><ActionButton icon="save" className="primary-action">Save debt</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={close}>Cancel</ActionButton></div>
      {debts.some(d => d.id === draft.id) && <div className="account-maintenance"><div className="export-buttons"><ActionButton icon="restore" type="button" className="export-btn" onClick={() => { setDebtAction({ id: draft.id, type: draft.archived ? 'restore' : 'archive' }); setDraft(null); setError('') }}>{draft.archived ? 'Restore debt' : 'Archive debt'}</ActionButton>{canDeleteDebt(debts.find(d => d.id === draft.id), transactions) && <ActionButton icon="remove" type="button" className="dialog-confirm" onClick={() => { setDebtAction({ id: draft.id, type: 'delete' }); setDraft(null); setError('') }}>Delete debt</ActionButton>}</div><p className="budget-usage-note">Archive hides the debt from the main list and preserves statements and repayment history. Delete is available only when no repayments or linked transactions have been recorded.</p></div>}
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
    {debtAction && <AccountEditorSurface title={debtAction.type === 'delete' ? 'Delete debt?' : debtAction.type === 'archive' ? 'Archive debt?' : 'Restore debt?'} onClose={close} error={error}><p>{debts.find(d => d.id === debtAction.id)?.name}</p><p>{debtAction.type === 'delete' ? 'Permanently remove this debt and its monthly statements? This cannot be undone without a backup. No transactions will be deleted.' : debtAction.type === 'archive' ? 'Hide this debt from the main list? Its statements, balance and repayment history are preserved. Any unpaid payments remain included in reminders and Safe to spend. You can restore the debt later.' : 'Return this debt to the active list? Its saved statements and repayment history will be kept.'}</p><div className="export-buttons"><ActionButton icon={debtAction.type === 'delete' ? 'remove' : 'restore'} className={debtAction.type === 'delete' ? 'dialog-confirm' : 'primary-action'} onClick={() => {
      const record = debts.find(d => d.id === debtAction.id)
      if (!record) { setError('This debt is no longer available. Close this window and refresh the list.'); return }
      if (debtAction.type === 'delete') {
        if (!canDeleteDebt(record, transactions)) { setError('This debt has linked repayments or transactions. Archive it instead to preserve its history.'); return }
        onChange(debts.filter(d => d.id !== record.id))
      } else onChange(debts.map(d => d.id === record.id ? { ...d, archived: debtAction.type === 'archive' } : d))
      close()
    }}>{debtAction.type === 'delete' ? 'Confirm delete' : debtAction.type === 'archive' ? 'Confirm archive' : 'Confirm restore'}</ActionButton><ActionButton icon="close" className="export-btn" onClick={close}>Cancel</ActionButton></div></AccountEditorSurface>}
  </section>
}
