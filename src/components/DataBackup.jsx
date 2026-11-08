import ActionButton from './ActionButton'
import AccountEditorSurface from './AccountEditorSurface'
import { useRef, useState } from 'react'
import { validateBackup } from '../utils/backupValidation'

export default function DataBackup({ transactions, budgets, categories, bills, schedules, accounts, transfers, goals, debts, incomePlans, spendingBuffer, onRestore, onClear }) {
  const input = useRef(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  function download() {
    const data = { version: 10, exportedAt: new Date().toISOString(), transactions, budgets, categories, bills, schedules, accounts, transfers, goals, debts, incomePlans, spendingBuffer }
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
    <div><h2>Backup & restore</h2><p>Back up transactions, accounts, transfers, bills, debts, scheduled income, recurring schedules, savings goals, budgets, categories, and your spending buffer.</p></div>
    <div className="export-buttons"><ActionButton icon="download" className="export-btn" onClick={download}>Export data</ActionButton><ActionButton icon="upload" className="export-btn" onClick={() => input.current.click()}>Import data</ActionButton></div>
    <input ref={input} type="file" accept=".json,application/json" hidden onChange={readFile} />
    {error && <p role="alert">{error}</p>}
    {pending && pending.accounts && !pending.debts && debts?.length > 0 && <p role="alert">This older backup has no debt records. Restoring it will clear current debts. Export a full backup first to keep them.</p>}
    {pending && pending.accounts && !pending.goals && goals?.length > 0 && <p role="alert">This older account backup has no savings goals. Restoring it will clear your current goals. Export a backup first to keep them.</p>}
    {pending && pending.accounts && !pending.incomePlans && incomePlans?.length > 0 && <p role="alert">This older backup has no scheduled income. Restoring it will clear current income plans. Export a backup first to keep them.</p>}
    {pending && <div className="backup-confirm" role="region" aria-label="Confirm import"><p>Restore {pending.transactions.length} transactions{pending.budgets ? `, ${Object.keys(pending.budgets).length} budgets` : ''}{pending.categories ? ', and categories' : ''}? This replaces the corresponding saved data. If cloud sync is active, restored data will sync to your other devices. Export a backup first if you want to keep your current data. Older transaction-only backups leave budgets and categories unchanged.</p><div className="export-buttons"><ActionButton icon="restore" className="primary-action" onClick={() => { onRestore(pending); setPending(null) }}>Restore backup</ActionButton><ActionButton icon="close" className="export-btn" onClick={() => setPending(null)}>Cancel</ActionButton></div></div>}
    {onClear && <div className="backup-clear"><div><h3>Clear financial data</h3><p>Start fresh on this browser. Export a backup first if you want to keep your records.</p></div><ActionButton icon="remove" className="dialog-confirm" onClick={() => { setConfirmation(''); setClearing(true) }}>Clear all data</ActionButton></div>}
    {clearing && <AccountEditorSurface title="Clear all financial data?" onClose={() => setClearing(false)}><form onSubmit={event => {
      event.preventDefault()
      if (confirmation !== 'CLEAR') return
      onClear()
      setPending(null)
      setError('')
      setClearing(false)
    }}><p>This permanently removes transactions, accounts, transfers, bills, debts and repayments, recurring schedules, scheduled income, savings goals, budgets, custom categories, and your spending buffer from this browser. Display preferences are kept. The cloud copy is not deleted; automatic sync will pause until you choose a starting copy again. This cannot be undone without a backup.</p><div className="form-group"><label htmlFor="clear-data-confirmation">Type CLEAR to confirm</label><input id="clear-data-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" /></div><div className="export-buttons"><ActionButton icon="download" className="export-btn" type="button" onClick={download}>Export backup first</ActionButton><ActionButton icon="close" className="export-btn" type="button" onClick={() => setClearing(false)}>Cancel</ActionButton><ActionButton icon="remove" className="dialog-confirm" type="submit" disabled={confirmation !== 'CLEAR'}>Clear all data permanently</ActionButton></div></form></AccountEditorSurface>}
  </section>
}
