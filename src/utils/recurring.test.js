import { describe, it, expect } from 'vitest'
import { applyRecurring } from './recurring'

const rule = { id: 'salary', type: 'income', category: 'Salary', description: 'Monthly salary', amount: 1000, startDate: '2026-01-31', active: true }
describe('monthly recurring transactions', () => {
  it('catches up missed months and clamps shorter months without drifting', () => {
    const result = applyRecurring([], [rule], '2026-03-31')
    expect(result.transactions.map(t => t.date)).toEqual(['2026-03-31', '2026-02-28', '2026-01-31'])
  })
  it('does not create future entries or duplicate entries', () => {
    const result = applyRecurring([], [rule], '2026-02-27')
    expect(result.transactions).toHaveLength(1)
    expect(applyRecurring(result.transactions, result.schedules, '2026-02-27').transactions).toHaveLength(1)
  })
  it('does not recreate a deleted occurrence', () => {
    const result = applyRecurring([], [rule], '2026-01-31')
    expect(applyRecurring([], result.schedules, '2026-01-31').transactions).toHaveLength(0)
  })
  it('skips paused occurrences and resumes with the next due month', () => {
    const paused = applyRecurring([], [{ ...rule, active: false }], '2026-02-28')
    expect(paused.transactions).toHaveLength(0)
    const resumed = applyRecurring([], paused.schedules.map(r => ({ ...r, active: true })), '2026-03-31')
    expect(resumed.transactions.map(t => t.date)).toEqual(['2026-03-31'])
  })
})
