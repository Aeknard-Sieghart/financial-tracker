import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import CloudSync from './CloudSync'
import { financialSnapshot } from '../utils/cloudSnapshot'
import { DEFAULT_CATEGORIES } from '../hooks/useCategories'
afterEach(() => { cleanup(); vi.restoreAllMocks() })
const snapshot = financialSnapshot({ transactions: [], accounts: [{ id: 'unassigned', name: 'Unassigned', type: 'other', openingBalance: 0 }], transfers: [], budgets: {}, categories: DEFAULT_CATEGORIES, bills: [], debts: [], schedules: [], goals: [], incomePlans: [], spendingBuffer: 0 })
function clientMock(remote = null, session = { user: { id: 'user-a', email: 'user@example.com' } }) {
  const single = vi.fn(async () => ({ data: remote, error: null }))
  return {
    auth: { onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })), getSession: vi.fn(async () => ({ data: { session } })), signInWithOtp: vi.fn(async () => ({ error: null })), verifyOtp: vi.fn(async () => ({ error: null })), signOut: vi.fn(async () => ({ error: null })) },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: single }) }) })),
    rpc: vi.fn(async (_name, args) => ({ data: [{ payload: args.new_payload, revision: args.expected_revision + 1, updated_at: '2026-11-08T00:00:00Z' }], error: null })),
  }
}
it('keeps local mode usable without configuration', () => {
  render(<CloudSync client={null} snapshot={snapshot} onApply={vi.fn()} />)
  expect(screen.getByText('Setup required')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Send sign-in code' })).not.toBeInTheDocument()
})
it('requires explicit upload confirmation instead of uploading just after sign-in', async () => {
  const client = clientMock(), apply = vi.fn()
  render(<CloudSync client={client} snapshot={snapshot} onApply={apply} />)
  await screen.findByRole('button', { name: 'Use this device’s data' })
  expect(client.rpc).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Use this device’s data' }))
  expect(client.rpc).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm upload' }))
  await waitFor(() => expect(client.rpc).toHaveBeenCalledWith('save_tracker_snapshot', { expected_revision: 0, new_payload: snapshot }))
  expect(apply).not.toHaveBeenCalled()
})
it('requires confirmation to replace local data and never uploads during download', async () => {
  const remote = { payload: { ...snapshot, spendingBuffer: 100 }, revision: 1, updated_at: '2026-11-08T00:00:00Z' }
  const client = clientMock(remote), apply = vi.fn()
  render(<CloudSync client={client} snapshot={snapshot} onApply={apply} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Use cloud data' }))
  expect(apply).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm download' }))
  await waitFor(() => expect(apply).toHaveBeenCalledWith(remote.payload))
  expect(client.rpc).not.toHaveBeenCalled()
})
it('requests a code only when the user submits an email', async () => {
  const client = clientMock(null, null)
  render(<CloudSync client={client} snapshot={snapshot} onApply={vi.fn()} />)
  expect(client.auth.signInWithOtp).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send sign-in code' }))
  await waitFor(() => expect(client.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'user@example.com' }))
  expect(await screen.findByLabelText('Email code')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Email code'), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
  await waitFor(() => expect(client.auth.verifyOtp).toHaveBeenCalledWith({ email: 'user@example.com', token: '123456', type: 'email' }))
})
