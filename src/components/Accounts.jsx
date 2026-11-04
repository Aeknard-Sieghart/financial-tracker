import { useState } from 'react'
import { accountBalance } from '../utils/accounts'
import { todayDate } from '../utils/recurring'
import PeriodDatePicker from './PeriodDatePicker'
import { BANK_THEMES, bankTheme } from '../constants/bankThemes'

const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
const BANKS = BANK_THEMES.map(theme => theme.name)
const CARD_COLORS = ['#245c72', '#294878', '#52613f', '#744b69', '#9c593e', '#374151']
function cardText(color) {
  const rgb = color.match(/[a-f\d]{2}/gi).map(hex => {
    const value = parseInt(hex, 16) / 255
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
  })
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 > .179 ? '#14212b' : '#ffffff'
}
export default function Accounts({ accounts, transfers, transactions, onAccountsChange, onTransfersChange }) {
  const [draft, setDraft] = useState(null)
  const [transfer, setTransfer] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState('')
  const sourceAccount = transfer && accounts.find(a => a.id === transfer.fromAccountId)
  const available = sourceAccount ? Math.max(0, accountBalance(sourceAccount, transactions, transfers)) : 0
  const exceedsBalance = transfer && Math.round(Number(transfer.amount) * 100) > Math.round(available * 100)
  return <section className="bills-panel accounts-panel"><div className="transaction-list-header"><div><h2>Accounts & transfers</h2><p className="budget-usage-note">Opening balances plus all recorded activity. Transfers move money between accounts without changing income or expenses.</p></div></div>
    <div className="account-grid">{accounts.filter(account => account.id !== 'unassigned' || accountBalance(account, transactions, transfers) !== 0).map(account => {
      const theme = bankTheme(account)
      const color = /^#[a-f\d]{6}$/i.test(account.color || '') ? account.color : theme?.color || '#245c72'
      return <div className={`account-card account-colored-card${theme ? ` account-bank-themed bank-pattern-${theme.pattern}` : ''}`} style={{ backgroundColor: color, color: cardText(color), '--bank-accent': theme?.accent }} key={account.id}>
        {theme?.logo ? <div className="account-bank-logo" style={{ backgroundColor: theme.logoSurface || '#ffffff' }}><img src={theme.logo} alt={theme.name} /></div> : theme ? <p className="account-bank-wordmark">{theme.name}<span>BANK ACCOUNT</span></p> : <p className="account-provider">{account.type === 'bank' ? account.bank || 'Bank account' : account.type === 'ewallet' ? 'E-wallet' : account.type === 'cash' ? 'Cash' : 'Other'}</p>}
        <strong>{account.name}</strong><p className="account-balance">{money(accountBalance(account, transactions, transfers))}</p>
        {theme && <span className="account-brand-caption">CURRENT BALANCE</span>}
        {account.id !== 'unassigned' && <button className="account-edit-icon" aria-label={`Edit ${account.name} account`} title="Edit account" onClick={() => { setDraft({ ...account }); setTransfer(null); setError('') }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/></svg></button>}
      </div>
    })}</div>
    <p className="budget-usage-note">Existing transactions stay in Unassigned until you edit their account. Opening balances represent funds before your recorded transactions.</p>
    <div className="export-buttons"><button className="primary-action" onClick={() => { setDraft({ id: crypto.randomUUID(), name: '', type: 'cash', openingBalance: 0 }); setTransfer(null); setError('') }}>+ Add account</button><button className="export-btn" disabled={accounts.length < 2} onClick={() => { setTransfer({ id: crypto.randomUUID(), fromAccountId: accounts[0].id, toAccountId: accounts[1].id, amount: '', date: todayDate(), description: '' }); setDraft(null); setError('') }}>Transfer money</button></div>
    {draft && <form className="bill-editor" onSubmit={event => { event.preventDefault(); const account = { ...draft, name: draft.name.trim(), openingBalance: Math.round(Number(draft.openingBalance) * 100) / 100 }; if (!account.name || !Number.isFinite(account.openingBalance)) return; if (accounts.some(a => a.id !== account.id && a.name.toLowerCase() === account.name.toLowerCase())) { setError('Choose a unique account name.'); return } onAccountsChange([...accounts.filter(a => a.id !== account.id), account]); setDraft(null); setError('') }}>
      {draft.type === 'bank' && <div className="form-group"><label>Bank<input required list="account-bank-options" placeholder="Select or enter your bank" value={draft.bank || ''} onChange={e => setDraft({ ...draft, bank: e.target.value })} /></label><datalist id="account-bank-options">{BANKS.map(bank => <option key={bank} value={bank} />)}</datalist><p className="budget-usage-note">Choose a bank or type another bank name.</p></div>}
      <div className="form-group"><label>Card color</label><div className="account-color-options">{CARD_COLORS.map(color => <button type="button" key={color} aria-label={`Card color ${color}`} aria-pressed={(draft.color || '#245c72') === color} style={{ backgroundColor: color }} onClick={() => setDraft({ ...draft, color })} />)}<input aria-label="Custom card color" type="color" value={draft.color || '#245c72'} onChange={e => setDraft({ ...draft, color: e.target.value })} /></div></div>
      {bankTheme(draft) && <button type="button" className="export-btn" onClick={() => setDraft({ ...draft, color: undefined })}>Use bank color</button>}
      <div className="form-group"><label>Account name<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label></div><div className="form-group"><label>Type<select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}><option value="cash">Cash</option><option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="other">Other</option></select></label></div><div className="form-group"><label>Opening balance (₱)<input required type="number" step="0.01" value={draft.openingBalance} onChange={e => setDraft({ ...draft, openingBalance: e.target.value })} /></label></div><button className="primary-action">Save account</button><button type="button" className="export-btn" onClick={() => setDraft(null)}>Cancel</button>
    </form>}
    {transfer && <form className="bill-editor" onSubmit={event => { event.preventDefault(); const amount = Math.round(Number(transfer.amount) * 100) / 100; if (transfer.fromAccountId === transfer.toAccountId || !Number.isFinite(amount) || amount <= 0) { setError('Choose different accounts and a positive amount.'); return } if (Math.round(amount * 100) > Math.round(available * 100)) { setError(`The maximum transfer amount is ${money(available)}.`); return } onTransfersChange([{ ...transfer, amount }, ...transfers]); setTransfer(null); setError('') }}>
      {['fromAccountId', 'toAccountId'].map((field, index) => <div className="form-group" key={field}><label>{index === 0 ? 'From account' : 'To account'}<select value={transfer[field]} onChange={e => setTransfer({ ...transfer, [field]: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>)}
      <div className="form-group"><label>Transfer amount<input inputMode="numeric" value={money(Number(transfer.amount))} aria-invalid={Boolean(exceedsBalance)} aria-describedby="transfer-available" onChange={() => {}} onKeyDown={e => {
        const cents = Math.round(Number(transfer.amount) * 100)
        if (/^\d$/.test(e.key)) { e.preventDefault(); if (cents < 10000000000) setTransfer({ ...transfer, amount: (cents * 10 + Number(e.key)) / 100 }) }
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); setTransfer({ ...transfer, amount: e.key === 'Delete' ? 0 : Math.floor(cents / 10) / 100 }) }
        setError('')
      }} /></label><p id="transfer-available" className="budget-usage-note">Available to transfer: {money(available)}</p>{exceedsBalance && <p className="bill-overdue" role="alert">Amount exceeds the available balance.</p>}</div><div className="form-group"><label>Date</label><PeriodDatePicker type="date" value={transfer.date} onChange={e => setTransfer({ ...transfer, date: e.target.value })} /></div><div className="form-group"><label>Note<input value={transfer.description} onChange={e => setTransfer({ ...transfer, description: e.target.value })} /></label></div><p className="budget-usage-note">This records a transfer only. It does not move money through a bank.</p><button className="primary-action" disabled={Boolean(exceedsBalance) || available <= 0 || Number(transfer.amount) <= 0 || transfer.fromAccountId === transfer.toAccountId}>Record transfer</button><button type="button" className="export-btn" onClick={() => setTransfer(null)}>Cancel</button>
    </form>}
    {error && <p role="alert">{error}</p>}
    {transfers.length > 0 && <h3 className="transfer-heading">Transfer history</h3>}{transfers.map(t => <div className="bill-row" key={t.id}><div><strong>{accounts.find(a => a.id === t.fromAccountId)?.name} → {accounts.find(a => a.id === t.toAccountId)?.name}</strong><p className="budget-usage-note">{t.date} · {t.description}</p></div><div className="budget-amount-actions">{money(t.amount)}<button className="export-btn" onClick={() => setRemoving(t.id)}>Delete</button></div></div>)}
    {removing && <div className="backup-confirm"><p>Delete this transfer? Both account balances will be recalculated.</p><button className="export-btn" onClick={() => { onTransfersChange(transfers.filter(t => t.id !== removing)); setRemoving(null) }}>Delete transfer</button><button className="export-btn" onClick={() => setRemoving(null)}>Cancel</button></div>}
  </section>
}
