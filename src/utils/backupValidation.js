import { validSchedule } from './recurring'
import { validAccount, validTransfer } from './accounts'
import { validGoal } from './savings'
import { validBill } from './bills'
import { validDebt } from './debts'
import { validIncomePlan } from './incomePlans'

export function validateBackup(data) {
  const backup = Array.isArray(data) ? { transactions: data } : data
  if (!backup || !Array.isArray(backup.transactions)) throw new Error('Choose a financial tracker JSON backup.')
  const ids = new Set()
  for (const t of backup.transactions) {
    if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || !['expense', 'income', 'debt-payment'].includes(t.type) || typeof t.amount !== 'number' || !Number.isFinite(t.amount) || t.amount <= 0 || typeof t.category !== 'string' || !t.category.trim() || typeof t.description !== 'string' || typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !Number.isFinite(Date.parse(t.date)) || new Date(t.date).toISOString().slice(0, 10) !== t.date) throw new Error('The backup contains invalid or duplicate transactions.')
    ids.add(t.id)
  }
  if (backup.budgets !== undefined && (!backup.budgets || Array.isArray(backup.budgets) || typeof backup.budgets !== 'object' || Object.values(backup.budgets).some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0))) throw new Error('The backup contains invalid budget limits.')
  if (backup.categories !== undefined) {
    for (const type of ['expense', 'income']) {
      const list = backup.categories?.[type]
      if (!Array.isArray(list) || !list.some(c => c?.name === 'Other') || list.some(c => !c || typeof c.id !== 'string' || typeof c.name !== 'string' || !c.name.trim() || typeof c.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(c.color) || typeof c.icon !== 'string') || new Set(list.map(c => c.id)).size !== list.length || new Set(list.map(c => c.name)).size !== list.length) throw new Error('The backup contains invalid categories.')
    }
  }
  if (backup.bills !== undefined && (!Array.isArray(backup.bills) || backup.bills.some(b => !validBill(b)) || new Set(backup.bills.map(b => b.id)).size !== backup.bills.length)) throw new Error('The backup contains invalid bills.')
  if (backup.schedules !== undefined && (!Array.isArray(backup.schedules) || backup.schedules.some(r => !validSchedule(r)) || new Set(backup.schedules.map(r => r.id)).size !== backup.schedules.length)) throw new Error('The backup contains invalid recurring schedules.')
  if (backup.accounts !== undefined) {
    if (!Array.isArray(backup.accounts) || backup.accounts.some(a => !validAccount(a)) || !backup.accounts.some(a => a.id === 'unassigned') || new Set(backup.accounts.map(a => a.id)).size !== backup.accounts.length || !Array.isArray(backup.transfers) || backup.transfers.some(t => !validTransfer(t, backup.accounts)) || new Set(backup.transfers.map(t => t.id)).size !== backup.transfers.length) throw new Error('The backup contains invalid accounts or transfers.')
    if (backup.transactions.some(t => t.accountId && !backup.accounts.some(a => a.id === t.accountId)) || backup.schedules?.some(r => r.accountId && !backup.accounts.some(a => a.id === r.accountId))) throw new Error('The backup references an unknown account.')
  } else if (backup.transfers !== undefined) throw new Error('Transfers require accounts in the backup.')
  if (backup.goals !== undefined && (!Array.isArray(backup.goals) || !Array.isArray(backup.accounts) || backup.goals.some(g => !validGoal(g) || !backup.accounts.some(a => a.id === g.accountId)) || new Set(backup.goals.map(g => g.id)).size !== backup.goals.length)) throw new Error('The backup contains invalid savings goals.')
  if (backup.debts !== undefined && (!Array.isArray(backup.debts) || backup.debts.some(d => !validDebt(d)) || new Set(backup.debts.map(d => d.id)).size !== backup.debts.length)) throw new Error('The backup contains invalid debts.')
  if (backup.transactions.some(t => t.type === 'debt-payment' && (!t.debtId || !t.debtPaymentId || !backup.debts?.some(d => d.id === t.debtId)))) throw new Error('Debt repayments require their debt records. Import a full data backup instead of transaction-only JSON.')
  if (backup.incomePlans !== undefined && (!Array.isArray(backup.incomePlans) || backup.incomePlans.some(p => !validIncomePlan(p) || !backup.accounts?.some(a => a.id === p.accountId)) || new Set(backup.incomePlans.map(p => p.id)).size !== backup.incomePlans.length)) throw new Error('The backup contains invalid scheduled income.')
  if (backup.spendingBuffer !== undefined && (!Number.isFinite(backup.spendingBuffer) || backup.spendingBuffer < 0)) throw new Error('The backup contains an invalid spending buffer.')
  if (backup.version !== undefined && ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(backup.version)) throw new Error('This backup version is not supported.')
  return backup
}

