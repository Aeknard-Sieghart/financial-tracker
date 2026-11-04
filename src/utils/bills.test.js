import { describe, it, expect } from 'vitest'
import { billStatus } from './bills'

const bill = { id: 'wifi', amount: 1399, dueDay: 31 }
const payment = { type: 'expense', billId: 'wifi', billMonth: '2026-02', amount: 500 }
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
