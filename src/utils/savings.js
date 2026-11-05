import { accountBalance } from './accounts'
export const cents = value => Math.round(Number(value) * 100)
export function savingsAvailable(account, transactions, transfers, goals) {
  if (!account || account.archived) return 0
  const reserved = goals.filter(g => g.accountId === account.id).reduce((sum, g) => sum + cents(g.saved), 0)
  return Math.max(0, cents(accountBalance(account, transactions, transfers)) - reserved) / 100
}
export function validGoal(goal) {
  return goal && typeof goal.id === 'string' && goal.id && typeof goal.name === 'string' && goal.name.trim() && typeof goal.accountId === 'string' && Number.isFinite(goal.target) && goal.target > 0 && Number.isFinite(goal.saved) && goal.saved >= 0 && goal.saved <= goal.target && (!goal.deadline || (/^\d{4}-\d{2}-\d{2}$/.test(goal.deadline) && Number.isFinite(Date.parse(goal.deadline)) && new Date(goal.deadline).toISOString().slice(0, 10) === goal.deadline))
}
export function allocationError(goal, amount, available, releasing = false) {
  if (!Number.isFinite(amount) || cents(amount) <= 0) return 'Enter a positive amount.'
  if (releasing) return cents(amount) > cents(goal.saved) ? 'Amount exceeds the money allocated to this goal.' : ''
  if (cents(amount) > cents(goal.target) - cents(goal.saved)) return 'Amount exceeds the remaining target.'
  return cents(amount) > cents(available) ? 'Amount exceeds the available unallocated account balance.' : ''
}
