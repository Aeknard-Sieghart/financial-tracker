import { billStatus, localMonth } from './bills'
import { todayDate } from './recurring'

// Include overdue billing months and next month's bills when the window crosses a month boundary.
export function billReminders(bills, transactions, today = new Date(), days = 7) {
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
  const endMonth = localMonth(last)
  const endDate = todayDate(last)
  const result = []
  for (const bill of bills) {
    let [year, month] = bill.startMonth.split('-').map(Number)
    while (`${year}-${String(month).padStart(2, '0')}` <= endMonth) {
      const period = `${year}-${String(month).padStart(2, '0')}`
      const state = billStatus(bill, transactions, period, today)
      if ((state.pending || state.remaining > 0) && state.dueDate <= endDate) result.push({ ...state, bill, month: period, key: `${bill.id}:${period}` })
      month++
      if (month > 12) { month = 1; year++ }
    }
  }
  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.bill.name.localeCompare(b.bill.name))
}
