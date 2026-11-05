import { accountBalance } from '../utils/accounts'
import { billStatus, localMonth } from '../utils/bills'
import { useStoredState } from '../hooks/useStoredState'

const money = amount => amount === null ? 'Amount pending' : amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
export default function DashboardSnapshot({ accounts, transactions, transfers, bills, reminders = [] }) {
  const [walletDesign, setWalletDesign] = useStoredState('walletDesign', 'cognac')
  const [balanceHidden, setBalanceHidden] = useStoredState('netBalanceHidden', false)
  const month = localMonth()
  const outstanding = bills.filter(b => b.startMonth <= month).map(bill => ({ bill, ...billStatus(bill, transactions, month) })).filter(b => b.pending || b.remaining > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const next = outstanding[0]
  const balance = accounts.reduce((sum, account) => sum + Math.round(accountBalance(account, transactions, transfers) * 100), 0) / 100
  return <section className="snapshot-grid" aria-label="Current financial position">
    <div className={`snapshot-tile snapshot-balance leather-balance ${walletDesign === 'teal' ? 'leather-teal' : 'leather-cognac'}`}>
      <span className="snapshot-label">NET BALANCE</span><strong>{balanceHidden ? '₱******' : money(balance)}</strong><p>Current balance across all accounts</p>
      <button type="button" className="wallet-design-button wallet-eye-button" aria-label={balanceHidden ? 'Show net balance' : 'Hide net balance'} aria-pressed={balanceHidden} title={balanceHidden ? 'Show balance' : 'Hide balance'} onClick={() => setBalanceHidden(!balanceHidden)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{balanceHidden && <path d="m3 3 18 18" />}</svg></button>
      <button type="button" className="wallet-design-button" title="Change wallet design" onClick={() => setWalletDesign(walletDesign === 'teal' ? 'cognac' : 'teal')} aria-label={`Change wallet design. Current design: ${walletDesign === 'teal' ? 'Teal leather' : 'Cognac wallet'}`}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></svg></button>
    </div>
    <div className="snapshot-tile"><span className="snapshot-label">NEXT BILL DUE</span><strong>{next ? money(next.remaining) : 'All clear'}</strong><p>{next ? `${next.bill.name} · ${next.dueDate}` : 'No unpaid bills this month'}</p></div>
    <div className="snapshot-tile"><span className="snapshot-label">LEFT TO PAY</span><strong>{money(outstanding.reduce((sum, b) => sum + Math.round((b.remaining || 0) * 100), 0) / 100)}</strong><p>{outstanding.length} unpaid bills{outstanding.some(b => b.pending) ? ` · ${outstanding.filter(b => b.pending).length} amounts pending` : ' this month'}</p></div>
    <div className="snapshot-tile"><span className="snapshot-label">PAYMENT ATTENTION <span className="reminder-count">{reminders.length}</span></span><strong>{reminders.filter(b => b.overdue).length} overdue</strong><p>{reminders.filter(b => !b.overdue).length} bills or debts due within 7 days</p></div>
  </section>
}
