import { accountBalance } from '../utils/accounts'
import { billStatus, localMonth } from '../utils/bills'

const money = amount => amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
export default function DashboardSnapshot({ accounts, transactions, transfers, bills }) {
  const month = localMonth()
  const outstanding = bills.filter(b => b.startMonth <= month).map(bill => ({ bill, ...billStatus(bill, transactions, month) })).filter(b => b.remaining > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const next = outstanding[0]
  const balance = accounts.reduce((sum, account) => sum + Math.round(accountBalance(account, transactions, transfers) * 100), 0) / 100
  return <section className="snapshot-grid" aria-label="Current financial position">
    <div className="snapshot-tile snapshot-balance"><span className="snapshot-label">NET BALANCE</span><strong>{money(balance)}</strong><p>Current balance across all accounts</p><div className="snapshot-decoration" aria-hidden="true" /></div>
    <div className="snapshot-tile"><span className="snapshot-label">NEXT BILL DUE</span><strong>{next ? money(next.remaining) : 'All clear'}</strong><p>{next ? `${next.bill.name} · ${next.dueDate}` : 'No unpaid bills this month'}</p></div>
    <div className="snapshot-tile"><span className="snapshot-label">LEFT TO PAY</span><strong>{money(outstanding.reduce((sum, b) => sum + Math.round(b.remaining * 100), 0) / 100)}</strong><p>{outstanding.length} unpaid {outstanding.length === 1 ? 'bill' : 'bills'} this month</p></div>
    <div className="snapshot-tile"><span className="snapshot-label">NEEDS ATTENTION</span><strong>{outstanding.filter(b => b.overdue).length} overdue</strong><p>{new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p></div>
  </section>
}
