import { sortTransactions } from './sortTransactions'

export function activityEntries(transactions, transfers, accounts, month, filters, sortBy) {
  const name = id => accounts.find(a => a.id === id)?.name || 'Unassigned'
  const entries = [...transactions, ...transfers.map(t => ({ ...t, type: 'transfer', category: 'Transfer', searchText: `${name(t.fromAccountId)} ${name(t.toAccountId)} ${t.description}` }))]
  return sortTransactions(entries.filter(t =>
    (month === 'all' || t.date.slice(0, 7) === month) &&
    (!filters.type || t.type === filters.type) &&
    (!filters.category || t.category === filters.category) &&
    `${t.description} ${t.category} ${t.searchText || ''}`.toLowerCase().includes(filters.searchQuery.toLowerCase())
  ), sortBy)
}
