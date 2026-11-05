import { expect, it } from 'vitest'
import { lineHistory } from './lineHistory'
const accounts = [{ openingBalance: 100 }, { openingBalance: 50 }]
const transactions = [
  { date: '2026-10-31', type: 'income', category: 'Salary', amount: 1000 },
  { date: '2026-11-01', type: 'expense', category: 'Food', amount: 20.1 },
  { date: '2026-11-02', type: 'income', category: 'Salary', amount: 500 },
  { date: '2026-11-02', type: 'expense', category: 'Other', amount: 0.2 },
  { date: '2026-11-04', type: 'income', category: 'Salary', amount: 999 },
]
it('carries forward opening balances and activity before the date range', () => {
  const result = lineHistory(transactions, accounts, '2026-11-01', '2026-11-03', 'income', 'Salary')
  expect(result.opening).toBe(1150)
  expect(result.points.map(p => p.balance)).toEqual([1129.9, 1629.7, 1629.7])
  expect(result.points.map(p => p.categoryAmount)).toEqual([0, 500, 0])
})
it('separates income and expense categories with identical names', () => {
  const rows = [{ date: '2026-11-01', type: 'income', category: 'Other', amount: 10 }, { date: '2026-11-01', type: 'expense', category: 'Other', amount: 5 }]
  expect(lineHistory(rows, [], '2026-11-01', '2026-11-01', 'expense', 'Other').points[0]).toMatchObject({ categoryAmount: 5, balance: 5 })
})
it('groups long ranges without counting transactions outside the bounds', () => {
  const result = lineHistory(transactions, accounts, '2026-06-15', '2026-11-01', 'income', 'Salary')
  expect(result.grouping).toBe('month')
  expect(result.points).toHaveLength(6)
  expect(result.points.at(-1).balance).toBe(1129.9)
})
it('shows a flat balance with no activity and excludes internal transfers', () => {
  const result = lineHistory([{ date: '2026-11-01', type: 'transfer', amount: 100 }], accounts, '2026-11-01', '2026-11-02', 'income', 'Salary')
  expect(result.points.map(p => p.balance)).toEqual([150, 150])
})
it('returns no points for an inverted range', () => {
  expect(lineHistory([], [], '2026-11-02', '2026-11-01', 'income', 'Salary').points).toEqual([])
})
