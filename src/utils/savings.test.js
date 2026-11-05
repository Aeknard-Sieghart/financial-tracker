import { expect, it } from 'vitest'
import { allocationError, savingsAvailable, validGoal } from './savings'
const account = { id: 'cash', openingBalance: 1000 }
const goal = { id: 'laptop', name: 'Laptop', target: 5000, saved: 200, accountId: 'cash', deadline: '' }
it('subtracts all allocations from account funds without changing the account', () => {
  expect(savingsAvailable(account, [{ accountId: 'cash', type: 'expense', amount: 100 }], [], [goal, { ...goal, id: 'other', saved: 300 }])).toBe(400)
  expect(account.openingBalance).toBe(1000)
})
it('rejects allocating beyond available funds or target', () => {
  expect(allocationError(goal, 801, 800)).toContain('available')
  expect(allocationError(goal, 4801, 10000)).toContain('target')
  expect(allocationError(goal, 800, 800)).toBe('')
})
it('releases only money already allocated', () => {
  expect(allocationError(goal, 201, 0, true)).toContain('exceeds')
  expect(allocationError(goal, 200, 0, true)).toBe('')
})
it('clamps availability after spending and validates target changes', () => {
  expect(savingsAvailable({ ...account, openingBalance: 100 }, [], [], [goal])).toBe(0)
  expect(validGoal(goal)).toBeTruthy()
  expect(validGoal({ ...goal, target: 100 })).toBeFalsy()
  expect(validGoal({ ...goal, deadline: '2026-02-30' })).toBeFalsy()
})
