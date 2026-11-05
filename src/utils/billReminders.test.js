import { expect, it } from 'vitest'
import { billReminders } from './billReminders'
const bill = { id: 'wifi', name: 'WiFi', amount: 1000, dueDay: 5, startMonth: '2026-11' }
it('reminds about due variable bills whose amount is still pending', () => {
  const reminders = billReminders([{ ...bill, amountType: 'variable' }], [], new Date(2026, 10, 5))
  expect(reminders[0]).toMatchObject({ pending: true, remaining: null, status: 'Amount pending' })
})
it('includes today and the seventh day but excludes later bills', () => {
  const bills = [bill, { ...bill, id: 'last', dueDay: 12 }, { ...bill, id: 'later', dueDay: 13 }]
  expect(billReminders(bills, [], new Date(2026, 10, 5)).map(r => r.bill.id)).toEqual(['wifi', 'last'])
})
it('includes next-month bills across year boundaries', () => {
  const b = { ...bill, startMonth: '2027-01', dueDay: 2 }
  expect(billReminders([b], [], new Date(2026, 11, 29))[0].dueDate).toBe('2027-01-02')
})
it('retains overdue earlier months and removes fully paid occurrences only', () => {
  const b = { ...bill, startMonth: '2026-10' }
  const payments = [{ type: 'expense', billId: 'wifi', billMonth: '2026-10', amount: 1000 }, { type: 'expense', billId: 'wifi', billMonth: '2026-11', amount: 400 }]
  const reminders = billReminders([b], payments, new Date(2026, 10, 6))
  expect(reminders).toHaveLength(1)
  expect(reminders[0]).toMatchObject({ month: '2026-11', remaining: 600, overdue: true })
})
it('clamps short months and excludes future-start bills', () => {
  const reminders = billReminders([{ ...bill, dueDay: 31, startMonth: '2027-02' }, { ...bill, id: 'future', startMonth: '2027-04' }], [], new Date(2027, 1, 25))
  expect(reminders.map(r => r.dueDate)).toEqual(['2027-02-28'])
})
