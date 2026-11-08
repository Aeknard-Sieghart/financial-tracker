import { expect, it } from 'vitest'
import { safeToSpend } from './safeToSpend'
const base = { accounts: [{ id: 'bank', openingBalance: 10000 }], transactions: [], transfers: [], goals: [{ saved: 2000 }], bills: [{ id: 'wifi', name: 'Wifi', amount: 1000, dueDay: 10, startMonth: '2026-11' }], debts: [], buffer: 500, today: '2026-11-08', nextPayday: '2026-11-15' }
it('subtracts commitments, allocated savings and buffer without counting expected income', () => {
  expect(safeToSpend(base)).toMatchObject({ balance: 10000, due: 1000, savings: 2000, buffer: 500, available: 6500, pending: 0, shortfall: 0 })
})
it('does not deduct paid bills twice and leaves internal transfers neutral', () => {
  const result = safeToSpend({ ...base, accounts: [...base.accounts, { id: 'cash', openingBalance: 0 }], transactions: [{ type: 'expense', amount: 1000, accountId: 'bank', billId: 'wifi', billMonth: '2026-11' }], transfers: [{ fromAccountId: 'bank', toAccountId: 'cash', amount: 100 }] })
  expect(result).toMatchObject({ balance: 9000, due: 0, available: 6500 })
})
it('flags unknown amounts and retains the known calculation', () => {
  expect(safeToSpend({ ...base, bills: [{ ...base.bills[0], amountType: 'variable' }] })).toMatchObject({ pending: 1, due: 0, available: 7500 })
})
it('includes overdue debt balances and excludes payments on payday', () => {
  const result = safeToSpend({ ...base, bills: [{ ...base.bills[0], dueDay: 15 }], debts: [{ id: 'loan', name: 'Loan', dueDate: '2026-10-05', openingPrincipal: 3000 }], transactions: [{ type: 'debt-payment', debtId: 'loan', amount: 1000, accountId: 'bank' }] })
  expect(result).toMatchObject({ due: 2000, available: 4500 })
})
it('uses month end without payday and reports shortfalls without negative allowances', () => {
  expect(safeToSpend({ ...base, nextPayday: undefined, buffer: 12000, bills: [{ ...base.bills[0], dueDay: 30 }] })).toMatchObject({ usesPayday: false, horizon: '2026-12-01', due: 1000, available: 0, shortfall: 5000 })
  expect(safeToSpend({ ...base, today: '2026-12-08', nextPayday: undefined }).horizon).toBe('2027-01-01')
})
