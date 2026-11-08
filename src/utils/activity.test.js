import { expect, it } from 'vitest'
import { activityEntries, activityTotals, activityFilterError } from './activity'
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
it('finds legacy unassigned transactions and transfers involving either selected account', () => {
  expect(activityEntries(transactions, transfers, accounts, 'all', { ...filters, accountId: 'unassigned' }, 'date-desc').map(t => t.type)).toEqual(['expense'])
  for (const id of ['bank', 'cash']) expect(activityEntries(transactions, transfers, accounts, 'all', { ...filters, accountId: id }, 'date-desc').map(t => t.type)).toEqual(['transfer'])
})
it('combines inclusive custom dates and amount limits across months without mutation', () => {
  const entries = [...transactions, { ...transactions[0], id: '2', date: '2026-12-01', amount: 20.01, accountId: 'bank' }]
  const custom = { ...filters, accountId: 'bank', type: 'expense', fromDate: '2026-11-30', toDate: '2026-12-01', minAmount: '20.01', maxAmount: '20.01' }
  expect(activityEntries(entries, transfers, accounts, '2026-11', custom, 'date-asc').map(t => t.id)).toEqual(['2'])
  expect(entries).toHaveLength(2)
  expect(activityEntries(entries, transfers, accounts, 'all', { ...custom, maxAmount: '20' }, 'date-asc')).toEqual([])
})
it('validates inverted ranges, negative amounts, and preserves zero as an active limit', () => {
  expect(activityFilterError({ fromDate: '2026-12-01', toDate: '2026-11-01' })).toContain('From date')
  expect(activityFilterError({ minAmount: '100', maxAmount: '20' })).toContain('Minimum amount')
  expect(activityFilterError({ minAmount: '-1' })).toContain('non-negative')
  expect(activityEntries(transactions, [], accounts, 'all', { ...filters, maxAmount: '0' }, 'date-desc')).toEqual([])
})
it('totals debt principal separately and counts transfers only in selected-account net activity', () => {
  const entries = [{ type: 'income', amount: 100.10 }, { type: 'expense', amount: 20.20 }, { type: 'debt-payment', amount: 30 }, { ...transfers[0], type: 'transfer' }]
  expect(activityTotals(entries)).toEqual({ income: 100.1, expense: 20.2, principal: 30, transfers: 100, net: 49.9 })
  expect(activityTotals(entries, 'bank').net).toBe(-50.1)
  expect(activityTotals(entries, 'cash').net).toBe(149.9)
  expect(activityTotals([]).net).toBe(0)
})
