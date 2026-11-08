import { accountBalance } from './accounts'
import { paymentsBeforePayday } from './incomePlans'

const cents = n => Math.round(n * 100)
export function safeToSpend({ accounts, transactions, transfers, goals, bills, debts, nextPayday, today, buffer = 0 }) {
  const [year, month] = today.split('-').map(Number)
  const horizon = nextPayday || `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01`
  const payments = paymentsBeforePayday(bills, debts, transactions, horizon)
  const balance = accounts.reduce((sum, a) => sum + cents(accountBalance(a, transactions, transfers)), 0)
  const reserved = goals.reduce((sum, g) => sum + cents(g.saved), 0)
  const due = payments.reduce((sum, p) => sum + cents(p.remaining || 0), 0)
  const kept = cents(buffer)
  const available = balance - reserved - due - kept
  return { balance: balance / 100, savings: reserved / 100, due: due / 100, buffer: kept / 100, available: Math.max(0, available) / 100, shortfall: Math.max(0, -available) / 100, pending: payments.filter(p => p.pending).length, payments, horizon, usesPayday: !!nextPayday }
}
