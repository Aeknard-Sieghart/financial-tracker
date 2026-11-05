import { describe, it, expect } from 'vitest'
import { billStatus, validBill } from './bills'

const bill = { id: 'wifi', amount: 1399, dueDay: 31 }
const payment = { type: 'expense', billId: 'wifi', billMonth: '2026-02', amount: 500 }
it('keeps variable amounts independent and marks unknown months pending', () => {
  const b = { ...bill, amountType: 'variable', monthlyAmounts: { '2026-02': 900, '2026-03': 1100 } }
  expect(billStatus(b, [payment], '2026-02').remaining).toBe(400)
  expect(billStatus(b, [], '2026-03').amount).toBe(1100)
  expect(billStatus(b, [], '2026-04')).toMatchObject({ pending: true, remaining: null, status: 'Amount pending' })
  expect(billStatus({ ...b, monthlyAmounts: { '2026-04': 0 } }, [], '2026-04').status).toBe('Paid')
})
it('validates legacy fixed bills and variable bill backups', () => {
  const base = { ...bill, name: 'WiFi', category: 'Utilities', startMonth: '2026-02' }
  expect(validBill(base)).toBeTruthy()
  expect(validBill({ ...base, amountType: 'variable', amount: 0, monthlyAmounts: { '2026-02': 800 } })).toBeTruthy()
  expect(validBill({ ...base, amountType: 'variable', monthlyAmounts: { '2026-13': 10 } })).toBeFalsy()
})
describe('monthly bill payments', () => {
  it('clamps the due day to the end of a short month', () => {
    expect(billStatus(bill, [], '2026-02', new Date(2026, 1, 28)).dueDate).toBe('2026-02-28')
  })
  it('counts linked payments only and supports partial payments', () => {
    const state = billStatus(bill, [payment, { ...payment, billId: 'other', amount: 1000 }, { type: 'expense', category: 'WiFi', amount: 1399 }], '2026-02')
    expect(state.status).toBe('Partially paid')
    expect(state.remaining).toBe(899)
  })
  it('marks a fully paid bill paid and starts a new month unpaid', () => {
    const transactions = [payment, { ...payment, amount: 899 }]
    expect(billStatus(bill, transactions, '2026-02').status).toBe('Paid')
    expect(billStatus(bill, transactions, '2026-03').status).toBe('Unpaid')
  })
  it('marks outstanding bills overdue after the due date only', () => {
    expect(billStatus(bill, [], '2026-02', new Date(2026, 2, 1)).overdue).toBe(true)
    expect(billStatus(bill, [{ ...payment, amount: 1399 }], '2026-02', new Date(2026, 2, 1)).overdue).toBe(false)
  })
})
