import ActionButton from './ActionButton'
import { useState } from 'react'
import AccountEditorSurface from './AccountEditorSurface'
import PeriodDatePicker from './PeriodDatePicker'
import { todayDate } from '../utils/recurring'
import { accountBalance } from '../utils/accounts'
import { allocationError, cents, savingsAvailable, validGoal } from '../utils/savings'

const money = value => Number(value).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
function GoalAmount({ label, value, onChange }) {
  return <div className="form-group"><label>{label}<input inputMode="numeric" value={money(value)} onChange={() => {}} onKeyDown={e => {
    if (/^\d$/.test(e.key)) { e.preventDefault(); if (cents(value) < 10000000000) onChange((cents(value) * 10 + Number(e.key)) / 100) }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onChange(e.key === 'Delete' ? 0 : Math.floor(cents(value) / 10) / 100) }
  }} /></label></div>
}

export default function SavingsGoals({ goals, accounts, transactions, transfers, onChange, editorOnly = false, onDone }) {
  const newGoal = () => ({ id: crypto.randomUUID(), name: '', target: 0, saved: 0, accountId: accounts.find(a => !a.archived && a.id !== 'unassigned')?.id || 'unassigned', deadline: '' })
  const [draft, setDraft] = useState(() => editorOnly ? newGoal() : null)
  const [allocation, setAllocation] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState('')
  const close = () => { setDraft(null); setAllocation(null); setRemoving(null); setError(''); onDone?.() }
  const selectedGoal = allocation && goals.find(g => g.id === allocation.id)
  const available = selectedGoal ? savingsAvailable(accounts.find(a => a.id === selectedGoal.accountId), transactions, transfers, goals) : 0
  return <section className={editorOnly ? 'savings-goals' : 'bills-panel savings-goals'}>
    {!editorOnly && <><div className="transaction-list-header"><div><h2>Savings goals</h2><p className="budget-usage-note">Set money aside for something you want. Allocations stay in your account and do not count as expenses.</p></div><ActionButton icon="add" className="export-btn" onClick={() => { setDraft(newGoal()); setError('') }}>Add goal</ActionButton></div>
      {!goals.length && <p className="empty-message">Saving for a laptop, holiday, or emergency fund? Create your first goal.</p>}
      <div className="savings-grid">{goals.map(goal => {
        const account = accounts.find(a => a.id === goal.accountId)
        const reached = cents(goal.saved) >= cents(goal.target)
        const percentage = Math.min(100, Math.round(goal.saved / goal.target * 100))
        const allocated = goals.filter(g => g.accountId === goal.accountId).reduce((sum, g) => sum + cents(g.saved), 0)
        const shortfall = account && allocated > cents(accountBalance(account, transactions, transfers))
        return <article className="savings-goal" key={goal.id}><div className="savings-title"><h3>{goal.name}</h3><span className={reached ? 'budget-paid-status' : 'budget-usage-note'}>{reached ? 'Target reached' : `${percentage}%`}</span></div><p className="budget-usage-note">{account?.name || 'Unknown account'}{goal.deadline ? ` · Target ${goal.deadline}` : ''}</p><p className="savings-value">{money(goal.saved)} <span>of {money(goal.target)}</span></p><div className="budget-progress-track" role="progressbar" aria-label={`${goal.name} savings progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="budget-progress-bar normal" style={{ width: `${percentage}%` }} /></div><p className="budget-usage-note">{money(Math.max(0, goal.target - goal.saved))} remaining{!reached && goal.deadline && goal.deadline < todayDate() ? ' · Target date passed' : ''}</p>{shortfall && <p className="bill-overdue">Account balance is below its total goal allocations. Review your allocations after spending or transfers.</p>}<div className="savings-actions">{!reached && <ActionButton icon="add" className="export-btn" onClick={() => { setAllocation({ id: goal.id, amount: 0, releasing: false }); setError('') }}>Add savings</ActionButton>}{goal.saved > 0 && <ActionButton icon="release" className="export-btn" onClick={() => { setAllocation({ id: goal.id, amount: 0, releasing: true }); setError('') }}>Release savings</ActionButton>}<ActionButton icon="edit" className="export-btn" onClick={() => { setDraft({ ...goal }); setError('') }}>Edit</ActionButton><ActionButton icon="remove" className="export-btn" onClick={() => setRemoving(goal)}>Remove</ActionButton></div></article>
      })}</div></>}
    {draft && <AccountEditorSurface embedded={editorOnly} title={goals.some(g => g.id === draft.id) ? 'Edit savings goal' : 'Add savings goal'} error={error} onClose={close}><form className="bill-editor savings-form" onSubmit={e => {
      e.preventDefault()
      const goal = { ...draft, name: draft.name.trim() }
      if (accounts.find(a => a.id === goal.accountId)?.archived && !goals.some(g => g.id === goal.id && g.accountId === goal.accountId)) { setError('Restore this account before assigning a new goal to it.'); return }
      if (!validGoal(goal)) { setError('Enter a name and a target at least as large as your allocated savings.'); return }
      onChange([...goals.filter(g => g.id !== goal.id), goal]); close()
    }}><div className="form-group"><label>Goal name<input required value={draft.name} placeholder="e.g. Buy a laptop" onChange={e => setDraft({ ...draft, name: e.target.value })} /></label></div><GoalAmount label="Target amount" value={draft.target} onChange={target => setDraft({ ...draft, target })} /><div className="form-group"><label>Saving account<select value={draft.accountId} disabled={draft.saved > 0} onChange={e => setDraft({ ...draft, accountId: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>{draft.saved > 0 && <p className="budget-usage-note">Release the goal's savings before changing its account.</p>}</div><div className="form-group"><label><input type="checkbox" checked={Boolean(draft.deadline)} onChange={e => setDraft({ ...draft, deadline: e.target.checked ? todayDate() : '' })} /> Set a target date</label>{draft.deadline && <PeriodDatePicker type="date" value={draft.deadline} onChange={e => setDraft({ ...draft, deadline: e.target.value })} />}</div><p className="budget-usage-note">When you make the purchase, release the allocation and record the actual expense in Add transaction.</p><div className="export-buttons"><ActionButton icon="save" className="primary-action" disabled={draft.target <= 0}>Save goal</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={close}>Cancel</ActionButton></div></form></AccountEditorSurface>}
    {selectedGoal && <AccountEditorSurface title={allocation.releasing ? 'Release savings' : 'Add savings'} onClose={close} error={error}><form className="bill-editor savings-form" onSubmit={e => {
      e.preventDefault()
      const message = allocationError(selectedGoal, allocation.amount, available, allocation.releasing)
      if (message) { setError(message); return }
      onChange(goals.map(g => g.id === selectedGoal.id ? { ...g, saved: (cents(g.saved) + cents(allocation.amount) * (allocation.releasing ? -1 : 1)) / 100 } : g)); close()
    }}><h3>{selectedGoal.name}</h3><p className="budget-usage-note">{allocation.releasing ? `Allocated: ${money(selectedGoal.saved)}` : `Available to allocate: ${money(available)} · Remaining target: ${money(selectedGoal.target - selectedGoal.saved)}`}</p><GoalAmount label="Amount" value={allocation.amount} onChange={amount => { setAllocation({ ...allocation, amount }); setError('') }} /><p className="budget-usage-note">This changes only the goal allocation. No money is transferred and your net balance stays the same.</p><div className="export-buttons"><ActionButton icon={allocation.releasing ? 'release' : 'allocate'} className="primary-action">{allocation.releasing ? 'Release' : 'Allocate'}</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={close}>Cancel</ActionButton></div></form></AccountEditorSurface>}
    {removing && <AccountEditorSurface title="Remove savings goal" onClose={close}><p>Remove “{removing.name}”? Its allocation will be released. Your account balance and transactions will stay unchanged.</p><div className="savings-actions"><ActionButton icon="remove" className="export-btn" onClick={() => { onChange(goals.filter(g => g.id !== removing.id)); close() }}>Remove goal</ActionButton><ActionButton icon="close" className="export-btn" onClick={close}>Cancel</ActionButton></div></AccountEditorSurface>}
  </section>
}
