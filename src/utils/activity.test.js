import { expect, it } from 'vitest'
import { activityEntries } from './activity'
const accounts = [{ id: 'bank', name: 'Savings' }, { id: 'cash', name: 'Wallet' }]
const transactions = [{ id: '1', date: '2026-11-02', amount: 20, type: 'expense', category: 'Food', description: 'Lunch' }]
const transfers = [{ id: '1', date: '2026-11-03', amount: 100, fromAccountId: 'bank', toAccountId: 'cash', description: 'Cash withdrawal' }]
const filters = { searchQuery: '', type: '', category: '' }
it('merges and orders activity without mutating financial records', () => {
  expect(activityEntries(transactions, transfers, accounts, '2026-11', filters, 'date-desc').map(t => t.type)).toEqual(['transfer', 'expense'])
  expect(transfers[0].type).toBeUndefined()
  expect(transactions).toHaveLength(1)
})
it('filters transfers by month, type, account names and category', () => {
  expect(activityEntries(transactions, transfers, accounts, '2026-10', filters, 'date-desc')).toHaveLength(0)
  expect(activityEntries(transactions, transfers, accounts, 'all', { ...filters, type: 'transfer', searchQuery: 'Savings', category: 'Transfer' }, 'date-desc')).toHaveLength(1)
  expect(activityEntries(transactions, transfers, accounts, 'all', { ...filters, type: 'income' }, 'date-desc')).toHaveLength(0)
})
