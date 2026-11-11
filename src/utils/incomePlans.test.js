import { expect, it } from 'vitest'
import { incomeOccurrences, incomeReceipt, paymentsBeforePayday, validIncomePlan } from './incomePlans'
import { accountBalance } from './accounts'

const plan = { id: 'salary', name: 'Salary', active: true, days: [15, 30], amount: 15000, category: 'Salary', accountId: 'bank', startDate: '2026-11-01' }
it('plans multiple paydays without creating transactions or changing balances', () => {
  const transactions = []
  expect(incomeOccurrences([plan], transactions, '2026-11-08').map(o => o.date)).toEqual(['2026-11-15', '2026-11-30', '2026-12-15', '2026-12-30'])
  expect(transactions).toEqual([])
  expect(accountBalance({ id: 'bank', openingBalance: 100 }, transactions, [])).toBe(100)
})
it('preserves missed paydays, clamps short months and deduplicates clamped dates', () => {
  const occurrences = incomeOccurrences([{ ...plan, days: [30, 31], startDate: '2028-02-01' }], [], '2028-03-01')
  expect(occurrences.filter(o => o.date.startsWith('2028-02')).map(o => o.date)).toEqual(['2028-02-29'])
  expect(incomeOccurrences([{ ...plan, active: false }], [], '2026-11-08')).toEqual([])
  expect(incomeOccurrences([{ ...plan, startDate: '2027-05-20' }], [], '2026-11-08')[0].date).toBe('2027-05-30')
})
it('records actual receipt once against the original payday, including early or late receipts', () => {
  const occurrence = incomeOccurrences([plan], [], '2026-11-08')[0]
  const entry = incomeReceipt(occurrence, 14500, 'bank', '2026-11-16')
  expect(entry).toMatchObject({ type: 'income', amount: 14500, date: '2026-11-16', incomeDueDate: '2026-11-15' })
  expect(accountBalance({ id: 'bank', openingBalance: 100 }, [entry], [])).toBe(14600)
  expect(incomeOccurrences([plan], [entry], '2026-11-16').some(o => o.date === '2026-11-15')).toBe(false)
  expect(incomeOccurrences([plan], [], '2026-11-16')[0].date).toBe('2026-11-15')
})
it('lists unpaid bills and debt before payday, including unknown amounts and overdue payments', () => {
  const bills = [{ id: 'wifi', name: 'Wifi', startMonth: '2026-11', dueDay: 10, amount: 1000 }, { id: 'power', name: 'Power', startMonth: '2026-11', dueDay: 12, amountType: 'variable', amount: 0 }, { id: 'later', name: 'Later', startMonth: '2026-11', dueDay: 15, amount: 500 }]
  const debts = [{ id: 'loan', name: 'Loan', openingPrincipal: 2000, dueDate: '2026-11-05' }]
  const entries = [{ type: 'expense', billId: 'wifi', billMonth: '2026-11', amount: 1000 }, { type: 'debt-payment', debtId: 'loan', amount: 500 }]
  expect(paymentsBeforePayday(bills, debts, entries, '2026-11-15')).toMatchObject([{ name: 'Loan', remaining: 1500 }, { name: 'Power', pending: true }])
  expect(paymentsBeforePayday(bills, debts, entries, undefined)).toEqual([])
})
it('validates saved income plans', () => {
  expect(validIncomePlan(plan)).toBe(true)
  const dateOnly = { ...plan }; delete dateOnly.amount
  expect(validIncomePlan(dateOnly)).toBe(true)
  expect(incomeOccurrences([dateOnly], [], '2026-11-08')[0].date).toBe('2026-11-15')
  for (const invalid of [{ amount: 0 }, { days: [0] }, { days: [32] }, { days: [15, 15] }, { startDate: '2026-02-30' }, { accountId: '' }]) expect(validIncomePlan({ ...plan, ...invalid })).toBe(false)
})
it('includes outstanding scheduled payments before payday but stops at the final month', () => {
  const bounded = { id: 'loan', name: 'Loan', amountType: 'variable', openingPrincipal: 1000, dueDate: '2026-11-05', finalDueDate: '2026-12-05', monthlyAmounts: { '2026-11': 400, '2026-12': 600 } }
  const payments = paymentsBeforePayday([], [bounded], [], '2027-02-15')
  expect(payments.map(p => p.dueDate)).toEqual(['2026-11-05', '2026-12-05'])
  expect(payments.reduce((sum, p) => sum + p.remaining, 0)).toBe(1000)
})
