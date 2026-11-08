import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TransactionFilter from './TransactionFilter'
import { EMPTY_ACTIVITY_FILTERS } from '../utils/activity'
afterEach(cleanup)
const props = { accounts: [{ id: 'unassigned', name: 'Unassigned' }, { id: 'bank', name: 'Old bank', archived: true }], categories: ['Food'], filters: EMPTY_ACTIVITY_FILTERS, searchQuery: '', selectedType: '', selectedCategory: '' }
it('offers archived and unassigned accounts, emits changes, and clears all filter fields', () => {
  const change = vi.fn()
  render(<TransactionFilter {...props} onFilterChange={change} />)
  fireEvent.click(screen.getByRole('button', { name: 'Filter activity' }))
  expect(screen.getByRole('option', { name: 'Other / Unassigned' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Old bank (archived)' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Account'), { target: { value: 'unassigned' } })
  expect(change).toHaveBeenLastCalledWith({ accountId: 'unassigned' })
  fireEvent.change(screen.getByLabelText('Minimum amount (₱)'), { target: { value: '100' } })
  expect(change).toHaveBeenLastCalledWith({ minAmount: '100' })
  fireEvent.click(screen.getByLabelText('Set start date'))
  expect(change.mock.lastCall[0].fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'lunch' } })
  expect(change).toHaveBeenLastCalledWith({ searchQuery: 'lunch' })
  fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
  expect(change).toHaveBeenLastCalledWith(EMPTY_ACTIVITY_FILTERS)
})
it('shows invalid range feedback and custom date scope', () => {
  render(<TransactionFilter {...props} onFilterChange={vi.fn()} filters={{ ...EMPTY_ACTIVITY_FILTERS, fromDate: '2026-12-01', toDate: '2026-11-01' }} />)
  fireEvent.click(screen.getByRole('button', { name: 'Filter activity' }))
  expect(screen.getByRole('alert')).toHaveTextContent('From date')
  expect(screen.getByText(/Custom dates apply across all months/)).toBeInTheDocument()
})
