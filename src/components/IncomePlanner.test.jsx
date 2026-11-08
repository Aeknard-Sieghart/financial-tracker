import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import IncomePlanner from './IncomePlanner'
const plan = { id: 'salary', name: 'Salary', active: true, days: [15, 30], amount: 15000, category: 'Salary', accountId: 'bank', startDate: '2026-11-01' }
const props = { plans: [plan], transactions: [], accounts: [{ id: 'bank', name: 'Savings', openingBalance: 100 }], categories: { income: [{ name: 'Salary' }] }, bills: [], debts: [], today: '2026-11-08', onChange: vi.fn(), onReceive: vi.fn() }
beforeEach(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') } })
afterEach(() => { cleanup(); vi.clearAllMocks() })
it('requires confirmation before recording income and allows changing the received amount', () => {
  render(<IncomePlanner {...props} />)
  expect(props.onReceive).not.toHaveBeenCalled()
  fireEvent.click(screen.getAllByRole('button', { name: 'Confirm received' })[0])
  expect(props.onReceive).not.toHaveBeenCalled()
  const amount = screen.getByLabelText('Amount received')
  expect(amount).toHaveValue('₱0.00')
  fireEvent.keyDown(amount, { key: 'Delete' })
  for (const key of '1450000') fireEvent.keyDown(amount, { key })
  fireEvent.click(screen.getByRole('button', { name: 'Record income' }))
  expect(props.onReceive).toHaveBeenCalledWith(expect.objectContaining({ amount: 14500, accountId: 'bank', occurrence: expect.objectContaining({ date: '2026-11-15' }) }))
})
it('saves a multiple-payday schedule without recording income', () => {
  render(<IncomePlanner {...props} plans={[]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Add income' }))
  fireEvent.change(screen.getByLabelText('Income name'), { target: { value: 'Salary' } })
  expect(screen.queryByLabelText('Expected amount per payday')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save income' }))
  expect(props.onChange).toHaveBeenCalledWith([expect.objectContaining({ days: [15, 30], accountId: 'bank' })])
  expect(props.onReceive).not.toHaveBeenCalled()
})
