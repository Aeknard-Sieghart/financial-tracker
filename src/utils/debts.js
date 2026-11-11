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
const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date
const monthIndex = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
export function fixedPaymentCalculation(debt) {
  if (!validDate(debt.dueDate) || !validDate(debt.finalDueDate) || debt.finalDueDate < debt.dueDate || (debt.finalDueDate.slice(0, 7) === debt.dueDate.slice(0, 7) && debt.finalDueDate !== debt.dueDate)) return null
  const count = monthIndex(debt.finalDueDate) - monthIndex(debt.dueDate) + 1
  const total = cents(debt.totalRepayment)
  if (!Number.isFinite(total) || total < count || count > 600 || debt.totalRepayment < debt.openingPrincipal) return null
  const monthly = Math.floor(total / count)
  return { count, monthlyAmount: monthly / 100, finalAmount: (total - monthly * (count - 1)) / 100, total: total / 100 }
}
export function debtScheduleMonths(debt) {
  const result = []
  if (!validDate(debt.dueDate) || !validDate(debt.finalDueDate) || debt.finalDueDate < debt.dueDate || monthIndex(debt.finalDueDate) - monthIndex(debt.dueDate) >= 600) return result
  for (let index = monthIndex(debt.dueDate); index <= monthIndex(debt.finalDueDate); index++) result.push(`${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`)
  return result
}
export function debtBalance(debt, transactions) {
  return Math.max(0, cents(debt.openingPrincipal) - transactions.filter(t => t.type === 'debt-payment' && t.debtId === debt.id).reduce((sum, t) => sum + cents(t.amount), 0)) / 100
}
export function canDeleteDebt(debt, transactions) {
  return Boolean(debt && !transactions.some(t => t.debtId === debt.id))
}
export function validDebt(debt) {
  if (debt?.archived !== undefined && typeof debt.archived !== 'boolean') return false
  if (debt?.finalDueDate && (!validDate(debt.finalDueDate) || !validDate(debt.dueDate) || debt.finalDueDate < debt.dueDate || monthIndex(debt.finalDueDate) - monthIndex(debt.dueDate) >= 600 || (debt.finalDueDate.slice(0, 7) === debt.dueDate.slice(0, 7) && debt.finalDueDate !== debt.dueDate))) return false
  if (debt?.paymentMode && !['manual', 'calculated'].includes(debt.paymentMode)) return false
  if (debt?.paymentMode === 'calculated' && (debt.amountType !== 'fixed' || !fixedPaymentCalculation(debt))) return false
  return debt && typeof debt.id === 'string' && debt.id && typeof debt.name === 'string' && debt.name.trim() && DEBT_PROVIDERS.some(p => p.id === debt.provider) && Number.isFinite(debt.openingPrincipal) && debt.openingPrincipal > 0 && /^\d{4}-\d{2}-\d{2}$/.test(debt.dueDate) && Number.isFinite(Date.parse(debt.dueDate)) && new Date(debt.dueDate).toISOString().slice(0, 10) === debt.dueDate && (!debt.amountType || ['fixed', 'variable'].includes(debt.amountType)) && (debt.paymentAmount === undefined || (Number.isFinite(debt.paymentAmount) && debt.paymentAmount > 0)) && (debt.monthlyAmounts === undefined || (debt.monthlyAmounts && typeof debt.monthlyAmounts === 'object' && !Array.isArray(debt.monthlyAmounts) && Object.entries(debt.monthlyAmounts).every(([m, a]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && Number.isFinite(a) && a >= 0)))
}
export function debtMonthStatus(debt, transactions, month, today = todayDate()) {
  const [year, number] = month.split('-').map(Number)
  const day = Math.min(Number(debt.dueDate.slice(-2)), new Date(year, number, 0).getDate())
  const dueDate = debt.finalDueDate?.slice(0, 7) === month ? debt.finalDueDate : `${month}-${String(day).padStart(2, '0')}`
  const started = month >= debt.dueDate.slice(0, 7)
  const ended = Boolean(debt.finalDueDate && month > debt.finalDueDate.slice(0, 7))
  const calculation = debt.paymentMode === 'calculated' ? fixedPaymentCalculation(debt) : null
  const amount = ended ? 0 : calculation ? (month === debt.finalDueDate.slice(0, 7) ? calculation.finalAmount : calculation.monthlyAmount) : Object.hasOwn(debt.monthlyAmounts || {}, month) ? debt.monthlyAmounts[month] : debt.amountType === 'variable' ? null : debt.paymentAmount ?? debt.openingPrincipal
  const paid = transactions.filter(t => t.debtId === debt.id && t.debtPaymentId && (t.debtMonth || t.date.slice(0, 7)) === month).reduce((sum, t) => sum + cents(t.amount), 0) / 100
  const paidOff = debtBalance(debt, transactions) === 0
  const pending = started && !ended && !paidOff && amount === null
  const remaining = !started || ended || paidOff ? 0 : pending ? null : Math.max(0, cents(amount) - cents(paid)) / 100
  return { dueDate, amount, paid, pending, remaining, started, ended, status: paidOff ? 'Paid off' : !started ? 'Not started' : ended ? 'Schedule ended' : pending ? 'Amount pending' : remaining === 0 ? 'Paid this month' : paid > 0 ? 'Partially paid' : 'Unpaid', overdue: started && !ended && (pending || remaining > 0) && dueDate < today }
}
export function debtScheduleEditError(debt, transactions) {
  if (!debt.amountType && !debt.finalDueDate && debt.paymentMode !== 'calculated') return ''
  const linked = transactions.filter(t => t.debtId === debt.id && t.debtPaymentId)
  const months = new Set([...linked.map(t => t.debtMonth || t.date.slice(0, 7)), ...Object.entries(debt.monthlyAmounts || {}).filter(([, amount]) => amount > 0).map(([month]) => month)])
  for (const month of months) {
    if (month < debt.dueDate.slice(0, 7) || (debt.finalDueDate && month > debt.finalDueDate.slice(0, 7))) return 'The payment period cannot exclude a month with a recorded statement or repayment.'
    const state = debtMonthStatus(debt, linked, month)
    if (state.amount !== null && cents(state.amount) < cents(state.paid)) return `The amount for ${month} cannot be less than payments already recorded.`
  }
  return ''
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
    while (`${year}-${String(month).padStart(2, '0')}` <= localMonth(end) && (!debt.finalDueDate || `${year}-${String(month).padStart(2, '0')}` <= debt.finalDueDate.slice(0, 7))) {
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
