import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SafeToSpend from './SafeToSpend'
afterEach(cleanup)
const props = { accounts: [{ id: 'bank', openingBalance: 10000 }], transactions: [], transfers: [], goals: [], bills: [], debts: [], today: '2026-11-08', buffer: 0, onBufferChange: vi.fn() }
it('edits the buffer only on save', () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  render(<SafeToSpend {...props} />)
  fireEvent.click(screen.getByText('View calculation'))
  fireEvent.click(screen.getByRole('button', { name: 'Set buffer' }))
  for (const key of '50000') fireEvent.keyDown(screen.getByLabelText('Buffer amount'), { key })
  expect(props.onBufferChange).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Save buffer' }))
  expect(props.onBufferChange).toHaveBeenCalledWith(500)
})
it('withholds an estimate for unknown amounts and respects masking', () => {
  const { rerender } = render(<SafeToSpend {...props} bills={[{ id: 'power', name: 'Power', dueDay: 12, startMonth: '2026-11', amountType: 'variable' }]} />)
  expect(screen.getByText('Estimate pending')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('payment amounts are unknown')
  rerender(<SafeToSpend {...props} hidden />)
  expect(screen.queryByText('₱10,000.00')).not.toBeInTheDocument()
})
