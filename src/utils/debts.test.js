import { it, expect } from 'vitest'
import { debtBalance, debtMonthStatus, debtReminders, repaymentEntries, repaymentError, validDebt, DEBT_PROVIDERS, fixedPaymentCalculation, debtScheduleMonths, debtScheduleEditError, canDeleteDebt } from './debts'
import { accountBalance } from './accounts'
import { lineHistory } from './lineHistory'
const debt = { id: 'loan', name: 'Maya loan', provider: 'maya-credit', openingPrincipal: 1000, dueDate: '2026-11-20' }
const account = { id: 'bank', openingBalance: 2000 }
it('allows deleting only debts without linked transactions, including fees', () => {
  expect(canDeleteDebt(debt, [])).toBe(true)
  expect(canDeleteDebt(undefined, [])).toBe(false)
  expect(canDeleteDebt(debt, repaymentEntries(debt, 100, 25, 'bank', '2026-11-05', 'p1'))).toBe(false)
  expect(canDeleteDebt(debt, [{ debtId: debt.id, type: 'expense', amount: 25 }])).toBe(false)
  expect(validDebt({ ...debt, archived: true })).toBeTruthy()
  expect(validDebt({ ...debt, archived: 'yes' })).toBeFalsy()
})
it('keeps archived unpaid debts in reminders and retains their principal', () => {
  const archived = { ...debt, archived: true }
  expect(debtBalance(archived, [])).toBe(1000)
  expect(debtReminders([archived], [], '2026-11-21')).toHaveLength(1)
})
it('ends variable schedules without creating new pending months or erasing outstanding principal', () => {
  const variable = { ...debt, amountType: 'variable', dueDate: '2026-12-05', finalDueDate: '2027-01-05', openingPrincipal: 5161.24, monthlyAmounts: { '2026-12': 3402.37, '2027-01': 1758.87 } }
  const entries = repaymentEntries(variable, 3402.37, 0, 'bank', '2026-12-05', 'p1', '2026-12')
  expect(debtMonthStatus(variable, entries, '2027-02')).toMatchObject({ ended: true, pending: false, remaining: 0, status: 'Schedule ended' })
  expect(debtBalance(variable, entries)).toBe(1758.87)
  expect(debtReminders([variable], entries, '2027-02-10').map(r => r.month)).toEqual(['2027-01'])
  expect(debtMonthStatus({ ...variable, finalDueDate: '2027-01-03' }, entries, '2027-01').dueDate).toBe('2027-01-03')
})
it('preserves missing statement reminders inside a variable payment period only', () => {
  const variable = { ...debt, amountType: 'variable', dueDate: '2026-12-05', finalDueDate: '2027-01-05' }
  expect(debtReminders([variable], [], '2027-03-10').map(r => r.month)).toEqual(['2026-12', '2027-01'])
  expect(debtMonthStatus(variable, [], '2026-11').status).toBe('Not started')
})
it('divides a total inclusively and allocates rounding to the final payment', () => {
  const fixed = { ...debt, openingPrincipal: 90, amountType: 'fixed', paymentMode: 'calculated', totalRepayment: 100, dueDate: '2026-12-31', finalDueDate: '2027-02-28' }
  expect(validDebt(fixed)).toBeTruthy()
  expect(fixedPaymentCalculation(fixed)).toMatchObject({ count: 3, monthlyAmount: 33.33, finalAmount: 33.34 })
  expect(debtScheduleMonths(fixed)).toEqual(['2026-12', '2027-01', '2027-02'])
  const states = debtScheduleMonths(fixed).map(m => debtMonthStatus(fixed, [], m))
  expect(states.map(s => s.dueDate)).toEqual(['2026-12-31', '2027-01-31', '2027-02-28'])
  expect(states.reduce((sum, s) => sum + Math.round(s.amount * 100), 0)).toBe(10000)
  expect(debtMonthStatus(fixed, [], '2027-03').status).toBe('Schedule ended')
})
it('rejects invalid end dates and calculated totals without changing old manual schedules', () => {
  expect(validDebt({ ...debt, finalDueDate: '2026-10-01' })).toBeFalsy()
  expect(validDebt({ ...debt, finalDueDate: '2026-11-30' })).toBeFalsy()
  expect(validDebt({ ...debt, finalDueDate: '2027-02-30' })).toBeFalsy()
  expect(validDebt({ ...debt, amountType: 'fixed', paymentMode: 'calculated', totalRepayment: 999, finalDueDate: '2027-02-20' })).toBeFalsy()
  expect(debtMonthStatus({ ...debt, amountType: 'fixed', paymentAmount: 200 }, [], '2027-12').amount).toBe(200)
})
it('prevents edits that exclude recorded months or reduce installments below recorded payments', () => {
  const fixed = { ...debt, amountType: 'fixed', paymentMode: 'calculated', totalRepayment: 1000, dueDate: '2026-11-20', finalDueDate: '2027-01-20' }
  const entries = repaymentEntries(fixed, 400, 0, 'bank', '2026-11-20', 'p1', '2026-11')
  expect(debtScheduleEditError(fixed, entries)).toContain('cannot be less')
  expect(debtScheduleEditError({ ...fixed, dueDate: '2026-12-20' }, entries)).toContain('cannot exclude')
  expect(debtScheduleEditError({ ...fixed, monthlyAmounts: { '2027-02': 100 } }, [])).toContain('cannot exclude')
})
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
