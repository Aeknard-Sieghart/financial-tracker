import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DataBackup from './DataBackup'
import { debtBalance, debtMonthStatus, repaymentEntries } from '../utils/debts'
import { incomeOccurrences, incomeReceipt } from '../utils/incomePlans'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('shows a loading state while reading a backup file', async () => {
  let finish
  const { container } = render(<DataBackup transactions={[]} onRestore={vi.fn()} />)
  fireEvent.change(container.querySelector('input[type=file]'), { target: { files: [{ size: 20, text: () => new Promise(resolve => { finish = resolve }) }] } })
  expect(screen.getByRole('button', { name: 'Reading backup…' })).toBeDisabled()
  await act(async () => finish('{"transactions":[]}'))
  expect(screen.getByRole('button', { name: 'Import data' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Restore backup' })).toBeInTheDocument()
})

it('requires explicit confirmation before clearing and allows cancellation', () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  const onClear = vi.fn()
  render(<DataBackup transactions={[]} onClear={onClear} />)
  fireEvent.click(screen.getByRole('button', { name: 'Clear all data' }))
  expect(onClear).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Clear all data permanently' })).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Type CLEAR to confirm'), { target: { value: 'clear' } })
  expect(screen.getByRole('button', { name: 'Clear all data permanently' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onClear).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Clear all data' }))
  fireEvent.change(screen.getByLabelText('Type CLEAR to confirm'), { target: { value: 'CLEAR' } })
  fireEvent.click(screen.getByRole('button', { name: 'Clear all data permanently' }))
  expect(onClear).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('round trips settled principal, fees and the billing month through export and import', async () => {
  const debt = { id: 'sp', name: 'SPayLater', provider: 'spaylater', openingPrincipal: 5000, dueDate: '2026-11-05', amountType: 'variable', monthlyAmounts: { '2026-11': 2200, '2026-12': 3000 } }
  // Paid in December against the November statement: both dates must survive.
  const plan = { id: 'salary', name: 'Salary', active: true, days: [15, 30], amount: 15000, category: 'Salary', accountId: 'unassigned', startDate: '2026-11-01' }
  const receipt = incomeReceipt(incomeOccurrences([plan], [], '2026-11-08')[0], 14500, 'unassigned', '2026-11-15')
  const transactions = [...repaymentEntries(debt, 2000, 200, 'unassigned', '2026-12-01', 'payment-1', '2026-11'), receipt]
  const onRestore = vi.fn()
  let exported
  vi.stubGlobal('URL', { createObjectURL: vi.fn(blob => { exported = blob; return 'blob:backup' }), revokeObjectURL: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const { container } = render(<DataBackup spendingBuffer={500} incomePlans={[plan]} transactions={transactions} debts={[debt]} accounts={[{ id: 'unassigned', name: 'Unassigned', type: 'cash', openingBalance: 6000 }]} transfers={[]} goals={[]} bills={[]} schedules={[]} budgets={{}} onRestore={onRestore} />)
  fireEvent.click(screen.getByRole('button', { name: 'Export data' }))
  const json = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(exported)
  })
  fireEvent.change(container.querySelector('input[type=file]'), { target: { files: [{ size: json.length, text: async () => json }] } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Restore backup' })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }))
  const restored = onRestore.mock.calls[0][0]
  expect(restored.transactions).toEqual(transactions)
  expect(restored.incomePlans).toEqual([plan])
  expect(restored.spendingBuffer).toBe(500)
  expect(incomeOccurrences(restored.incomePlans, restored.transactions, '2026-11-16').some(o => o.date === '2026-11-15')).toBe(false)
  expect(debtBalance(restored.debts[0], restored.transactions)).toBe(3000)
  expect(debtMonthStatus(restored.debts[0], restored.transactions, '2026-11')).toMatchObject({ paid: 2200, remaining: 0, status: 'Paid this month' })
  expect(debtMonthStatus(restored.debts[0], restored.transactions, '2026-12')).toMatchObject({ paid: 0, remaining: 3000 })
})
