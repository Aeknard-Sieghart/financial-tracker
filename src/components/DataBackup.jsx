import { useRef, useState } from 'react'
import { validSchedule } from '../utils/recurring'
import { validAccount, validTransfer } from '../utils/accounts'

function validateBackup(data) {
  const backup = Array.isArray(data) ? { transactions: data } : data
  if (!backup || !Array.isArray(backup.transactions)) throw new Error('Choose a financial tracker JSON backup.')
  const ids = new Set()
  for (const t of backup.transactions) {
    if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || !['expense', 'income'].includes(t.type) || typeof t.amount !== 'number' || !Number.isFinite(t.amount) || t.amount <= 0 || typeof t.category !== 'string' || !t.category.trim() || typeof t.description !== 'string' || typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !Number.isFinite(Date.parse(t.date)) || new Date(t.date).toISOString().slice(0, 10) !== t.date) throw new Error('The backup contains invalid or duplicate transactions.')
    ids.add(t.id)
  }
  if (backup.budgets !== undefined && (!backup.budgets || Array.isArray(backup.budgets) || typeof backup.budgets !== 'object' || Object.values(backup.budgets).some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0))) throw new Error('The backup contains invalid budget limits.')
  if (backup.categories !== undefined) {
    for (const type of ['expense', 'income']) {
      const list = backup.categories?.[type]
      if (!Array.isArray(list) || !list.some(c => c?.name === 'Other') || list.some(c => !c || typeof c.id !== 'string' || typeof c.name !== 'string' || !c.name.trim() || typeof c.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(c.color) || typeof c.icon !== 'string') || new Set(list.map(c => c.id)).size !== list.length || new Set(list.map(c => c.name)).size !== list.length) throw new Error('The backup contains invalid categories.')
    }
  }
  if (backup.bills !== undefined && (!Array.isArray(backup.bills) || backup.bills.some(b => !b || typeof b.id !== 'string' || !b.id || typeof b.name !== 'string' || !b.name.trim() || typeof b.category !== 'string' || typeof b.amount !== 'number' || !Number.isFinite(b.amount) || b.amount <= 0 || !Number.isInteger(b.dueDay) || b.dueDay < 1 || b.dueDay > 31 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.startMonth)) || new Set(backup.bills.map(b => b.id)).size !== backup.bills.length)) throw new Error('The backup contains invalid bills.')
  if (backup.schedules !== undefined && (!Array.isArray(backup.schedules) || backup.schedules.some(r => !validSchedule(r)) || new Set(backup.schedules.map(r => r.id)).size !== backup.schedules.length)) throw new Error('The backup contains invalid recurring schedules.')
  if (backup.accounts !== undefined) {
    if (!Array.isArray(backup.accounts) || backup.accounts.some(a => !validAccount(a)) || !backup.accounts.some(a => a.id === 'unassigned') || new Set(backup.accounts.map(a => a.id)).size !== backup.accounts.length || !Array.isArray(backup.transfers) || backup.transfers.some(t => !validTransfer(t, backup.accounts)) || new Set(backup.transfers.map(t => t.id)).size !== backup.transfers.length) throw new Error('The backup contains invalid accounts or transfers.')
    if (backup.transactions.some(t => t.accountId && !backup.accounts.some(a => a.id === t.accountId)) || backup.schedules?.some(r => r.accountId && !backup.accounts.some(a => a.id === r.accountId))) throw new Error('The backup references an unknown account.')
  } else if (backup.transfers !== undefined) throw new Error('Transfers require accounts in the backup.')
  if (backup.version !== undefined && ![1, 2, 3, 4].includes(backup.version)) throw new Error('This backup version is not supported.')
  return backup
}

export default function DataBackup({ transactions, budgets, categories, bills, schedules, accounts, transfers, onRestore }) {
  const input = useRef(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  function download() {
    const data = { version: 4, exportedAt: new Date().toISOString(), transactions, budgets, categories, bills, schedules, accounts, transfers }
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
    <div><h2>Backup & restore</h2><p>Keep a copy of your transactions, bills, budgets, and categories.</p></div>
    <div className="export-buttons"><button className="export-btn" onClick={download}>Export data</button><button className="export-btn" onClick={() => input.current.click()}>Import data</button></div>
    <input ref={input} type="file" accept=".json,application/json" hidden onChange={readFile} />
    {error && <p role="alert">{error}</p>}
    {pending && <div className="backup-confirm" role="region" aria-label="Confirm import"><p>Restore {pending.transactions.length} transactions{pending.budgets ? `, ${Object.keys(pending.budgets).length} budgets` : ''}{pending.categories ? ', and categories' : ''}? This replaces the corresponding saved data. Export a backup first if you want to keep your current data. Older transaction-only backups leave budgets and categories unchanged.</p><div className="export-buttons"><button className="primary-action" onClick={() => { onRestore(pending); setPending(null) }}>Restore backup</button><button className="export-btn" onClick={() => setPending(null)}>Cancel</button></div></div>}
  </section>
}
