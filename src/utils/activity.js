import { sortTransactions } from './sortTransactions'

export const EMPTY_ACTIVITY_FILTERS = { searchQuery: '', type: '', category: '', accountId: '', fromDate: '', toDate: '', minAmount: '', maxAmount: '' }
export function activityFilterError(filters) {
  if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) return 'From date must be on or before To date.'
  const amounts = [filters.minAmount, filters.maxAmount]
  if (amounts.some(n => n !== undefined && n !== '' && (!Number.isFinite(Number(n)) || Number(n) < 0))) return 'Enter non-negative amount limits.'
  if (amounts.every(n => n !== undefined && n !== '') && Number(amounts[0]) > Number(amounts[1])) return 'Minimum amount must not exceed maximum amount.'
  return ''
}

export function activityTotals(entries, accountId = '') {
  const totals = { income: 0, expense: 0, principal: 0, transfers: 0, net: 0 }
  for (const entry of entries) {
    const amount = Math.round(entry.amount * 100)
    if (entry.type === 'transfer') {
      totals.transfers += amount
      if (accountId) totals.net += (entry.toAccountId === accountId ? amount : 0) - (entry.fromAccountId === accountId ? amount : 0)
    } else {
      totals[entry.type === 'debt-payment' ? 'principal' : entry.type] += amount
      totals.net += entry.type === 'income' ? amount : -amount
    }
  }
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / 100]))
}

export function activityEntries(transactions, transfers, accounts, month, filters, sortBy) {
  if (activityFilterError(filters)) return []
  const name = id => accounts.find(a => a.id === id)?.name || 'Unassigned'
  const entries = [...transactions, ...transfers.map(t => ({ ...t, type: 'transfer', category: 'Transfer', searchText: `${name(t.fromAccountId)} ${name(t.toAccountId)} ${t.description}` }))]
  return sortTransactions(entries.filter(t =>
    (filters.fromDate || filters.toDate || month === 'all' || t.date.slice(0, 7) === month) &&
    (!filters.fromDate || t.date >= filters.fromDate) &&
    (!filters.toDate || t.date <= filters.toDate) &&
    (!filters.accountId || (t.type === 'transfer' ? t.fromAccountId === filters.accountId || t.toAccountId === filters.accountId : (t.accountId || 'unassigned') === filters.accountId)) &&
    (filters.minAmount === undefined || filters.minAmount === '' || Math.round(t.amount * 100) >= Math.round(Number(filters.minAmount) * 100)) &&
    (filters.maxAmount === undefined || filters.maxAmount === '' || Math.round(t.amount * 100) <= Math.round(Number(filters.maxAmount) * 100)) &&
    (!filters.type || t.type === filters.type) &&
    (!filters.category || t.category === filters.category) &&
    `${t.description} ${t.category} ${t.searchText || ''}`.toLowerCase().includes((filters.searchQuery || '').trim().toLowerCase())
  ), sortBy)
}
