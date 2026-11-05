import { describe, it, expect } from 'vitest'
import { accountBalance, UNASSIGNED_ACCOUNT, validTransfer, canDeleteAccount, reorderAccounts } from './accounts'
const cash = { id: 'cash', name: 'Cash', type: 'cash', openingBalance: 100 }
const bank = { id: 'bank', name: 'Bank', type: 'bank', openingBalance: 500 }
const transfer = { id: 't', fromAccountId: 'bank', toAccountId: 'cash', amount: 50, date: '2026-11-04', description: '' }
it('reorders accounts without changing balances or identifiers', () => {
  const original = [cash, bank, UNASSIGNED_ACCOUNT]
  expect(reorderAccounts(original, 'bank', 'cash').map(a => a.id)).toEqual(['bank', 'cash', 'unassigned'])
  expect(original[0]).toBe(cash)
  expect(reorderAccounts(original, 'missing', 'cash')).toBe(original)
})
it('allows deletion only for unused zero-balance accounts', () => {
  const empty = { ...cash, openingBalance: 0 }
  expect(canDeleteAccount(empty, [], [])).toBe(true)
  expect(canDeleteAccount(cash, [], [])).toBe(false)
  expect(canDeleteAccount(empty, [{ accountId: 'cash', type: 'expense', amount: 1 }], [])).toBe(false)
  expect(canDeleteAccount(empty, [], [transfer])).toBe(false)
  expect(canDeleteAccount(empty, [], [], ['cash'])).toBe(false)
  expect(canDeleteAccount(UNASSIGNED_ACCOUNT, [], [])).toBe(false)
})
describe('accounts and transfers', () => {
  it('moves money without changing combined balances', () => {
    expect(accountBalance(cash, [], [transfer])).toBe(150)
    expect(accountBalance(bank, [], [transfer])).toBe(450)
    expect(accountBalance(cash, [], [transfer]) + accountBalance(bank, [], [transfer])).toBe(600)
  })
  it('assigns legacy transactions to Unassigned only', () => {
    const entries = [{ type: 'income', amount: 10.1 }, { type: 'expense', amount: 0.2 }]
    expect(accountBalance(UNASSIGNED_ACCOUNT, entries, [])).toBe(9.9)
    expect(accountBalance(cash, entries, [])).toBe(100)
  })
  it('counts only transactions assigned to an account', () => {
    expect(accountBalance(cash, [{ type: 'expense', amount: 20, accountId: 'cash' }, { type: 'income', amount: 300, accountId: 'bank' }], [])).toBe(80)
  })
  it('rejects same-account and missing-account transfers', () => {
    expect(validTransfer(transfer, [cash, bank])).toBe(true)
    expect(validTransfer({ ...transfer, toAccountId: 'bank' }, [cash, bank])).toBe(false)
    expect(validTransfer(transfer, [bank])).toBe(false)
  })
})
