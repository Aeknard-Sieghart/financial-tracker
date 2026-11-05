import ActionButton from './ActionButton'
import AccountEditorSurface from './AccountEditorSurface'
import { useRef, useState } from 'react'
import { validSchedule } from '../utils/recurring'
import { validAccount, validTransfer } from '../utils/accounts'
import { validGoal } from '../utils/savings'
import { validBill } from '../utils/bills'
import { validDebt } from '../utils/debts'

function validateBackup(data) {
  const backup = Array.isArray(data) ? { transactions: data } : data
  if (!backup || !Array.isArray(backup.transactions)) throw new Error('Choose a financial tracker JSON backup.')
  const ids = new Set()
  for (const t of backup.transactions) {
    if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || !['expense', 'income', 'debt-payment'].includes(t.type) || typeof t.amount !== 'number' || !Number.isFinite(t.amount) || t.amount <= 0 || typeof t.category !== 'string' || !t.category.trim() || typeof t.description !== 'string' || typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !Number.isFinite(Date.parse(t.date)) || new Date(t.date).toISOString().slice(0, 10) !== t.date) throw new Error('The backup contains invalid or duplicate transactions.')
    ids.add(t.id)
  }
  if (backup.budgets !== undefined && (!backup.budgets || Array.isArray(backup.budgets) || typeof backup.budgets !== 'object' || Object.values(backup.budgets).some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0))) throw new Error('The backup contains invalid budget limits.')
  if (backup.categories !== undefined) {
    for (const type of ['expense', 'income']) {
      const list = backup.categories?.[type]
      if (!Array.isArray(list) || !list.some(c => c?.name === 'Other') || list.some(c => !c || typeof c.id !== 'string' || typeof c.name !== 'string' || !c.name.trim() || typeof c.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(c.color) || typeof c.icon !== 'string') || new Set(list.map(c => c.id)).size !== list.length || new Set(list.map(c => c.name)).size !== list.length) throw new Error('The backup contains invalid categories.')
    }
  }
  if (backup.bills !== undefined && (!Array.isArray(backup.bills) || backup.bills.some(b => !validBill(b)) || new Set(backup.bills.map(b => b.id)).size !== backup.bills.length)) throw new Error('The backup contains invalid bills.')
  if (backup.schedules !== undefined && (!Array.isArray(backup.schedules) || backup.schedules.some(r => !validSchedule(r)) || new Set(backup.schedules.map(r => r.id)).size !== backup.schedules.length)) throw new Error('The backup contains invalid recurring schedules.')
  if (backup.accounts !== undefined) {
    if (!Array.isArray(backup.accounts) || backup.accounts.some(a => !validAccount(a)) || !backup.accounts.some(a => a.id === 'unassigned') || new Set(backup.accounts.map(a => a.id)).size !== backup.accounts.length || !Array.isArray(backup.transfers) || backup.transfers.some(t => !validTransfer(t, backup.accounts)) || new Set(backup.transfers.map(t => t.id)).size !== backup.transfers.length) throw new Error('The backup contains invalid accounts or transfers.')
    if (backup.transactions.some(t => t.accountId && !backup.accounts.some(a => a.id === t.accountId)) || backup.schedules?.some(r => r.accountId && !backup.accounts.some(a => a.id === r.accountId))) throw new Error('The backup references an unknown account.')
  } else if (backup.transfers !== undefined) throw new Error('Transfers require accounts in the backup.')
  if (backup.goals !== undefined && (!Array.isArray(backup.goals) || !Array.isArray(backup.accounts) || backup.goals.some(g => !validGoal(g) || !backup.accounts.some(a => a.id === g.accountId)) || new Set(backup.goals.map(g => g.id)).size !== backup.goals.length)) throw new Error('The backup contains invalid savings goals.')
  if (backup.debts !== undefined && (!Array.isArray(backup.debts) || backup.debts.some(d => !validDebt(d)) || new Set(backup.debts.map(d => d.id)).size !== backup.debts.length)) throw new Error('The backup contains invalid debts.')
  if (backup.transactions.some(t => t.type === 'debt-payment' && (!t.debtId || !t.debtPaymentId || !backup.debts?.some(d => d.id === t.debtId)))) throw new Error('Debt repayments require their debt records. Import a full data backup instead of transaction-only JSON.')
  if (backup.version !== undefined && ![1, 2, 3, 4, 5, 6, 7, 8].includes(backup.version)) throw new Error('This backup version is not supported.')
  return backup
}

export default function DataBackup({ transactions, budgets, categories, bills, schedules, accounts, transfers, goals, debts, onRestore, onClear }) {
  const input = useRef(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  function download() {
    const data = { version: 8, exportedAt: new Date().toISOString(), transactions, budgets, categories, bills, schedules, accounts, transfers, goals, debts }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `financial-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function readFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setError('')
    setPending(null)
    if (!file) return
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a backup smaller than 10 MB.')
      setPending(validateBackup(JSON.parse(await file.text())))
    } catch (err) { setError(err instanceof SyntaxError ? 'This file is not valid JSON.' : err.message) }
  }
  return <section className="data-backup">
    <div><h2>Backup & restore</h2><p>Back up transactions, accounts, transfers, bills, schedules, savings goals, budgets, and categories.</p></div>
    <div className="export-buttons"><ActionButton icon="download" className="export-btn" onClick={download}>Export data</ActionButton><ActionButton icon="upload" className="export-btn" onClick={() => input.current.click()}>Import data</ActionButton></div>
    <input ref={input} type="file" accept=".json,application/json" hidden onChange={readFile} />
    {error && <p role="alert">{error}</p>}
    {pending && pending.accounts && !pending.debts && debts?.length > 0 && <p role="alert">This older backup has no debt records. Restoring it will clear current debts. Export a full backup first to keep them.</p>}
    {pending && pending.accounts && !pending.goals && goals?.length > 0 && <p role="alert">This older account backup has no savings goals. Restoring it will clear your current goals. Export a backup first to keep them.</p>}
    {pending && <div className="backup-confirm" role="region" aria-label="Confirm import"><p>Restore {pending.transactions.length} transactions{pending.budgets ? `, ${Object.keys(pending.budgets).length} budgets` : ''}{pending.categories ? ', and categories' : ''}? This replaces the corresponding saved data. Export a backup first if you want to keep your current data. Older transaction-only backups leave budgets and categories unchanged.</p><div className="export-buttons"><ActionButton icon="restore" className="primary-action" onClick={() => { onRestore(pending); setPending(null) }}>Restore backup</ActionButton><ActionButton icon="close" className="export-btn" onClick={() => setPending(null)}>Cancel</ActionButton></div></div>}
    {onClear && <div className="backup-clear"><div><h3>Clear financial data</h3><p>Start fresh on this browser. Export a backup first if you want to keep your records.</p></div><ActionButton icon="remove" className="dialog-confirm" onClick={() => { setConfirmation(''); setClearing(true) }}>Clear all data</ActionButton></div>}
    {clearing && <AccountEditorSurface title="Clear all financial data?" onClose={() => setClearing(false)}><form onSubmit={event => {
      event.preventDefault()
      if (confirmation !== 'CLEAR') return
      onClear()
      setPending(null)
      setError('')
      setClearing(false)
    }}><p>This permanently removes transactions, accounts, transfers, bills, debts and repayments, recurring schedules, savings goals, budgets, and custom categories from this browser. Display preferences are kept. This cannot be undone without a backup.</p><div className="form-group"><label htmlFor="clear-data-confirmation">Type CLEAR to confirm</label><input id="clear-data-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" /></div><div className="export-buttons"><ActionButton icon="download" className="export-btn" type="button" onClick={download}>Export backup first</ActionButton><ActionButton icon="close" className="export-btn" type="button" onClick={() => setClearing(false)}>Cancel</ActionButton><ActionButton icon="remove" className="dialog-confirm" type="submit" disabled={confirmation !== 'CLEAR'}>Clear all data permanently</ActionButton></div></form></AccountEditorSurface>}
  </section>
}
