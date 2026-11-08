import { useState } from 'react'
import { safeToSpend } from '../utils/safeToSpend'
import ActionButton from './ActionButton'
import AccountEditorSurface from './AccountEditorSurface'
import BillAmountInput from './BillAmountInput'

const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
export default function SafeToSpend({ accounts, transactions, transfers, goals, bills, debts, nextPayday, today, buffer, onBufferChange, hidden }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(buffer)
  const value = safeToSpend({ accounts, transactions, transfers, goals, bills, debts, nextPayday, today, buffer })
  const amount = n => hidden ? '₱******' : money(n)
  return <div className="snapshot-tile safe-to-spend"><h2>Safe to spend</h2><strong>{value.pending ? 'Estimate pending' : amount(value.available)}</strong><p>{value.usesPayday ? `Before payday · ${nextPayday}` : 'Through the end of this month'}</p><details><summary>View calculation</summary><dl><div><dt>Current balance</dt><dd>{amount(value.balance)}</dd></div><div><dt>Bills & debt due</dt><dd>−{amount(value.due)}</dd></div><div><dt>Allocated savings</dt><dd>−{amount(value.savings)}</dd></div><div><dt>Keep as buffer</dt><dd>−{amount(value.buffer)}</dd></div><div><dt>{value.pending ? 'Before unknown amounts' : 'Available to spend'}</dt><dd>{amount(value.available)}</dd></div></dl>{value.pending > 0 && <p role="status">{value.pending} payment amounts are unknown. Set these amounts before relying on this estimate.</p>}{value.shortfall > 0 && <p role="status">Known commitments exceed your balance by {amount(value.shortfall)}.</p>}<p>Includes overdue payments. Expected income is excluded until received. Payments on payday are outside this window.</p>{!value.usesPayday && <p>No upcoming payday is set, so this estimate uses the rest of this month.</p>}<details><summary>Reserved payments ({value.payments.length})</summary>{value.payments.length ? value.payments.map(p => <p key={p.key}>{p.name} · {p.dueDate} · {p.pending ? 'Amount pending' : amount(p.remaining)}</p>) : <p>No unpaid bills or debt payments in this window.</p>}</details><ActionButton icon="edit" className="export-btn" onClick={() => { setDraft(buffer); setEditing(true) }}>Set buffer</ActionButton></details>
    {editing && <AccountEditorSurface title="Set spending buffer" onClose={() => setEditing(false)}><form onSubmit={e => { e.preventDefault(); if (!Number.isFinite(draft) || draft < 0) return; onBufferChange(draft); setEditing(false) }}><p>Keep this amount aside in addition to your savings goals and payments. It does not move money or change your balance.</p><BillAmountInput label="Buffer amount" value={draft} onChange={setDraft} /><div className="export-buttons"><ActionButton icon="save" className="primary-action">Save buffer</ActionButton><ActionButton icon="close" type="button" className="export-btn" onClick={() => setEditing(false)}>Cancel</ActionButton></div></form></AccountEditorSurface>}
  </div>
}
