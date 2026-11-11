import { todayDate } from './recurring'
import { billStatus } from './bills'
import { debtBalance, debtMonthStatus } from './debts'

export function validIncomePlan(plan) {
  return !!plan && typeof plan.id === 'string' && !!plan.id && typeof plan.name === 'string' && !!plan.name.trim() && (plan.amount === undefined || (Number.isFinite(plan.amount) && plan.amount > 0)) && typeof plan.accountId === 'string' && !!plan.accountId && typeof plan.category === 'string' && !!plan.category.trim() && typeof plan.active === 'boolean' && /^\d{4}-\d{2}-\d{2}$/.test(plan.startDate) && Number.isFinite(Date.parse(plan.startDate)) && new Date(plan.startDate).toISOString().slice(0, 10) === plan.startDate && Array.isArray(plan.days) && plan.days.length > 0 && plan.days.length <= 31 && new Set(plan.days).size === plan.days.length && plan.days.every(day => Number.isInteger(day) && day >= 1 && day <= 31)
}

// Generate outstanding paydays through next month, including missed confirmations.
// Clamped dates are deduplicated (e.g. the 30th and 31st in February).
export function incomeOccurrences(plans, transactions, today = todayDate()) {
  const [currentYear, currentMonth] = today.split('-').map(Number)
  const end = currentYear * 12 + currentMonth
  const received = new Set(transactions.filter(t => t.type === 'income' && t.incomePlanId && t.incomeDueDate).map(t => `${t.incomePlanId}:${t.incomeDueDate}`))
  const result = []
  for (const plan of plans.filter(p => p.active && validIncomePlan(p))) {
    const [year, month] = plan.startDate.split('-').map(Number)
    for (let index = year * 12 + month - 1; index <= Math.max(end, year * 12 + month); index++) {
      const y = Math.floor(index / 12), m = index % 12 + 1
      const dates = new Set(plan.days.map(day => `${y}-${String(m).padStart(2, '0')}-${String(Math.min(day, new Date(y, m, 0).getDate())).padStart(2, '0')}`))
      for (const date of dates) {
        if (date >= plan.startDate && !received.has(`${plan.id}:${date}`)) result.push({ plan, date, key: `${plan.id}:${date}` })
      }
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.plan.name.localeCompare(b.plan.name))
}

export function incomeReceipt(occurrence, amount, accountId, date) {
  return { id: `income:${occurrence.key}`, type: 'income', category: occurrence.plan.category, description: occurrence.plan.name, amount, accountId, date, incomePlanId: occurrence.plan.id, incomeDueDate: occurrence.date }
}

export function paymentsBeforePayday(bills, debts, transactions, payday) {
  if (!payday) return []
  const result = []
  for (const [kind, records] of [['Bill', bills], ['Debt', debts]]) {
    for (const record of records) {
      if (kind === 'Debt' && !record.amountType) {
        const remaining = debtBalance(record, transactions)
        if (record.dueDate < payday && remaining > 0) result.push({ name: record.name, kind, key: `Debt:${record.id}`, dueDate: record.dueDate, remaining, pending: false })
        continue
      }
      const start = kind === 'Bill' ? record.startMonth : record.dueDate.slice(0, 7)
      let [year, month] = start.split('-').map(Number)
      while (`${year}-${String(month).padStart(2, '0')}` <= payday.slice(0, 7) && (kind !== 'Debt' || !record.finalDueDate || `${year}-${String(month).padStart(2, '0')}` <= record.finalDueDate.slice(0, 7))) {
        const period = `${year}-${String(month).padStart(2, '0')}`
        const state = kind === 'Bill' ? billStatus(record, transactions, period) : debtMonthStatus(record, transactions, period)
        if (state.dueDate < payday && (state.pending || state.remaining > 0)) result.push({ ...state, name: record.name, kind, key: `${kind}:${record.id}:${period}` })
        if (kind === 'Debt' && !record.amountType) break
        if (++month > 12) { year++; month = 1 }
      }
    }
  }
  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}
