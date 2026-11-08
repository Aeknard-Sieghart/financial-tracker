import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import TransactionList from './TransactionList'
import { EMPTY_ACTIVITY_FILTERS } from '../utils/activity'
afterEach(cleanup)
it('renders totals and a zero count for an empty filtered result', () => {
  render(<TransactionList transactions={[]} accounts={[]} allTransactions={[]} filters={EMPTY_ACTIVITY_FILTERS} allCategories={[]} categories={{ income: [], expense: [] }} onFilterChange={vi.fn()} sortBy="date-desc" onSortChange={vi.fn()} />)
  const totals = screen.getByLabelText('Filtered activity totals')
  expect(within(totals).getByText('0 matching records')).toBeInTheDocument()
  expect(within(totals).getAllByText('₱0.00')).toHaveLength(5)
  expect(screen.getByText('No activity found for these filters')).toBeInTheDocument()
})
