import { it, expect } from 'vitest'
import { debtBalance, debtMonthStatus, debtReminders, repaymentEntries, repaymentError, validDebt, DEBT_PROVIDERS } from './debts'
import { accountBalance } from './accounts'
import { lineHistory } from './lineHistory'
const debt = { id: 'loan', name: 'Maya loan', provider: 'maya-credit', openingPrincipal: 1000, dueDate: '2026-11-20' }
const account = { id: 'bank', openingBalance: 2000 }
it('keeps variable statements independent from principal and other months', () => {
  const variable = { ...debt, openingPrincipal: 10000, amountType: 'variable', monthlyAmounts: { '2026-11': 2200, '2026-12': 1800 } }
  const entries = repaymentEntries(variable, 2000, 200, 'bank', '2026-12-01', 'p1', '2026-11')
  expect(debtMonthStatus(variable, entries, '2026-11').status).toBe('Paid this month')
  expect(debtBalance(variable, entries)).toBe(8000)
  expect(debtMonthStatus(variable, entries, '2026-12').remaining).toBe(1800)
  expect(debtMonthStatus(variable, entries, '2027-01').pending).toBe(true)
})
it('includes pending statements in reminders and retains fixed monthly amounts', () => {
  const variable = { ...debt, amountType: 'variable' }
  expect(debtReminders([variable], [], '2026-11-15')[0]).toMatchObject({ pending: true, month: '2026-11' })
  const fixed = { ...debt, amountType: 'fixed', paymentAmount: 200 }
  expect(debtMonthStatus(fixed, [], '2026-12').amount).toBe(200)
  expect(debtMonthStatus(fixed, [], '2026-10').status).toBe('Not started')
})
it('validates monthly amounts and treats a zero statement as no payment due', () => {
  const variable = { ...debt, amountType: 'variable', monthlyAmounts: { '2026-11': 0 } }
  expect(validDebt(variable)).toBeTruthy()
  expect(debtMonthStatus(variable, [], '2026-11').remaining).toBe(0)
  expect(validDebt({ ...variable, monthlyAmounts: { '2026-13': 100 } })).toBeFalsy()
})
it('separates principal and expense while deducting the full account payment', () => {
  const entries = repaymentEntries(debt, 400, 50, 'bank', '2026-11-05', 'p1')
  expect(debtBalance(debt, entries)).toBe(600)
  expect(accountBalance(account, entries, [])).toBe(1550)
  expect(entries.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)).toBe(50)
  expect(entries.every(t => t.debtPaymentId === 'p1')).toBe(true)
})
it('reflects principal repayments in balance history without making them category expenses', () => {
  const entries = repaymentEntries(debt, 400, 50, 'bank', '2026-11-05', 'p1')
  const result = lineHistory(entries, [account], '2026-11-05', '2026-11-05', 'expense', 'Other')
  expect(result.points[0]).toMatchObject({ balance: 1550, categoryAmount: 50 })
})
it('prevents overpaying principal or overdrawing an account', () => {
  expect(repaymentError(1001, 0, 1000, 2000)).toContain('outstanding')
  expect(repaymentError(900, 150, 1000, 1000)).toContain('account balance')
  expect(repaymentError(1000, 0, 1000, 1000)).toBe('')
  expect(repaymentError(0, 0, 1000, 1000)).not.toBe('')
})
it('restores outstanding debt when repayment entries are removed', () => {
  const entries = repaymentEntries(debt, 1000, 0, 'bank', '2026-11-05', 'p1')
  expect(debtBalance(debt, entries)).toBe(0)
  expect(debtBalance(debt, entries.filter(t => t.debtPaymentId !== 'p1'))).toBe(1000)
})
it('supports all requested providers and validates backup data', () => {
  for (const provider of ['tala', 'spaylater', 'maya-credit', 'gloan', 'gcredit']) expect(DEBT_PROVIDERS.some(p => p.id === provider)).toBe(true)
  expect(validDebt(debt)).toBeTruthy()
  expect(validDebt({ ...debt, openingPrincipal: -1 })).toBeFalsy()
  expect(validDebt({ ...debt, dueDate: '2026-02-30' })).toBeFalsy()
})
