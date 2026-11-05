import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Bills from './Bills'
const bill = { id: 'water', name: 'Water', category: 'Utilities', amount: 0, amountType: 'variable', provider: 'maynilad', dueDay: 20, startMonth: '2026-11' }
const props = { bills: [bill], transactions: [], categories: { expense: [{ id: 'utilities', name: 'Utilities' }] }, onChange: vi.fn(), onPayment: vi.fn(), initialMonth: '2026-11' }
beforeEach(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') } })
afterEach(() => { cleanup(); vi.clearAllMocks() })
it('shows provider and pending amount, then saves an amount for one month', () => {
  render(<Bills {...props} />)
  expect(screen.getByAltText('Maynilad')).toBeTruthy()
  expect(screen.getByText('Amount pending')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Pay' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Set amount' }))
  const amount = screen.getByLabelText('Amount due this month')
  for (const key of '125000') fireEvent.keyDown(amount, { key })
  fireEvent.click(screen.getByRole('button', { name: 'Save amount' }))
  expect(props.onChange.mock.calls[0][0][0].monthlyAmounts).toEqual({ '2026-11': 1250 })
})
it('blocks lowering a monthly amount below recorded payments', () => {
  render(<Bills {...props} bills={[{ ...bill, monthlyAmounts: { '2026-11': 1000 } }]} transactions={[{ billId: 'water', billMonth: '2026-11', type: 'expense', amount: 500 }]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Edit month amount' }))
  fireEvent.keyDown(screen.getByLabelText('Amount due this month'), { key: 'Delete' })
  fireEvent.click(screen.getByRole('button', { name: 'Save amount' }))
  expect(screen.getByRole('alert').textContent).toContain('below recorded payments')
  expect(props.onChange).not.toHaveBeenCalled()
})
