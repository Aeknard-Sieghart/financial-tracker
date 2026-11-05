import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Debts from './Debts'
import { localMonth } from '../utils/bills'
const month = localMonth()
const debt = { id: 'sp', provider: 'spaylater', name: 'My SPayLater', openingPrincipal: 10000, amountType: 'variable', dueDate: `${month}-20` }
const props = { debts: [debt], transactions: [], accounts: [{ id: 'bank', name: 'Bank', openingBalance: 5000 }], transfers: [], onChange: vi.fn(), onRepay: vi.fn() }
beforeEach(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') } })
afterEach(() => { cleanup(); vi.clearAllMocks() })
it('saves a statement amount without modifying outstanding principal', () => {
  render(<Debts {...props} />)
  expect(screen.getAllByText('Amount pending').length).toBeGreaterThan(0)
  expect(screen.queryByRole('button', { name: 'Repay' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Set amount' }))
  for (const key of '220000') fireEvent.keyDown(screen.getByLabelText('Monthly amount due'), { key })
  fireEvent.click(screen.getByRole('button', { name: 'Save amount' }))
  expect(props.onChange.mock.calls[0][0][0]).toMatchObject({ openingPrincipal: 10000, monthlyAmounts: { [month]: 2200 } })
})
