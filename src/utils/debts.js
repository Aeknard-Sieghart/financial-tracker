import { localMonth } from './bills'
import { todayDate } from './recurring'
export const DEBT_PROVIDERS = [
  { id: 'tala', name: 'TALA', logo: '/tala-logo.svg' },
  { id: 'spaylater', name: 'Shopee SPayLater', initials: 'SP', color: '#d94b20' },
  { id: 'maya-credit', name: 'Maya Credit', logo: '/maya-logo.svg' },
  { id: 'gloan', name: 'GLoan', initials: 'GL', color: '#1554cb' },
  { id: 'gcredit', name: 'GCredit', initials: 'GC', color: '#1554cb' },
  { id: 'other', name: 'Other debt', initials: '₱', color: '#245c72' },
]
const cents = n => Math.round(n * 100)
export function debtBalance(debt, transactions) {
  return Math.max(0, cents(debt.openingPrincipal) - transactions.filter(t => t.type === 'debt-payment' && t.debtId === debt.id).reduce((sum, t) => sum + cents(t.amount), 0)) / 100
}
export function validDebt(debt) {
  return debt && typeof debt.id === 'string' && debt.id && typeof debt.name === 'string' && debt.name.trim() && DEBT_PROVIDERS.some(p => p.id === debt.provider) && Number.isFinite(debt.openingPrincipal) && debt.openingPrincipal > 0 && /^\d{4}-\d{2}-\d{2}$/.test(debt.dueDate) && Number.isFinite(Date.parse(debt.dueDate)) && new Date(debt.dueDate).toISOString().slice(0, 10) === debt.dueDate && (!debt.amountType || ['fixed', 'variable'].includes(debt.amountType)) && (debt.paymentAmount === undefined || (Number.isFinite(debt.paymentAmount) && debt.paymentAmount > 0)) && (debt.monthlyAmounts === undefined || (debt.monthlyAmounts && typeof debt.monthlyAmounts === 'object' && !Array.isArray(debt.monthlyAmounts) && Object.entries(debt.monthlyAmounts).every(([m, a]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && Number.isFinite(a) && a >= 0)))
}
export function debtMonthStatus(debt, transactions, month, today = todayDate()) {
  const [year, number] = month.split('-').map(Number)
  const day = Math.min(Number(debt.dueDate.slice(-2)), new Date(year, number, 0).getDate())
  const dueDate = `${month}-${String(day).padStart(2, '0')}`
  const started = month >= debt.dueDate.slice(0, 7)
  const amount = Object.hasOwn(debt.monthlyAmounts || {}, month) ? debt.monthlyAmounts[month] : debt.amountType === 'variable' ? null : debt.paymentAmount ?? debt.openingPrincipal
  const paid = transactions.filter(t => t.debtId === debt.id && t.debtPaymentId && (t.debtMonth || t.date.slice(0, 7)) === month).reduce((sum, t) => sum + cents(t.amount), 0) / 100
  const paidOff = debtBalance(debt, transactions) === 0
  const pending = started && !paidOff && amount === null
  const remaining = !started || paidOff ? 0 : pending ? null : Math.max(0, cents(amount) - cents(paid)) / 100
  return { dueDate, amount, paid, pending, remaining, status: !started ? 'Not started' : paidOff ? 'Paid off' : pending ? 'Amount pending' : remaining === 0 ? 'Paid this month' : paid > 0 ? 'Partially paid' : 'Unpaid', overdue: started && (pending || remaining > 0) && dueDate < today }
}
export function debtReminders(debts, transactions, today) {
  const now = new Date(`${today}T12:00:00`)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const result = []
  for (const debt of debts) {
    if (!debt.amountType) {
      const remaining = debtBalance(debt, transactions)
      if (remaining > 0 && debt.dueDate <= todayDate(end)) result.push({ key: `debt:${debt.id}`, kind: 'debt', bill: debt, remaining, dueDate: debt.dueDate, overdue: debt.dueDate < today })
      continue
    }
    let [year, month] = debt.dueDate.slice(0, 7).split('-').map(Number)
    while (`${year}-${String(month).padStart(2, '0')}` <= localMonth(end)) {
      const period = `${year}-${String(month).padStart(2, '0')}`
      const status = debtMonthStatus(debt, transactions, period, today)
      if ((status.pending || status.remaining > 0) && status.dueDate <= todayDate(end)) result.push({ ...status, key: `debt:${debt.id}:${period}`, kind: 'debt', month: period, bill: debt })
      if (++month > 12) { month = 1; year++ }
    }
  }
  return result
}
export function repaymentError(principal, fees, remaining, available) {
  if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(fees) || fees < 0) return 'Enter a positive principal amount and non-negative interest/fees.'
  if (cents(principal) > cents(remaining)) return 'Principal exceeds the outstanding debt.'
  return cents(principal) + cents(fees) > cents(available) ? 'Total payment exceeds the selected account balance.' : ''
}
export function repaymentEntries(debt, principal, fees, accountId, date, paymentId, debtMonth = date.slice(0, 7)) {
  const base = { accountId, date, debtId: debt.id, debtPaymentId: paymentId, debtMonth }
  const result = [{ ...base, id: `${paymentId}:principal`, type: 'debt-payment', category: 'Debt principal', description: `${debt.name} — principal repayment`, amount: principal }]
  if (fees > 0) result.push({ ...base, id: `${paymentId}:fees`, type: 'expense', category: 'Other', description: `${debt.name} — interest and fees`, amount: fees })
  return result
}
