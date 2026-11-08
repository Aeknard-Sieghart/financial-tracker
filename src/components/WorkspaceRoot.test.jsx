import { StrictMode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import WorkspaceRoot from './WorkspaceRoot'
import { useWorkspace } from '../hooks/useWorkspace'
import { useStoredState } from '../hooks/useStoredState'
import { useCategories } from '../hooks/useCategories'
import { scopedStorage, legacyBackupKey } from '../utils/workspaceStorage'

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(cleanup)
const session = id => ({ user: { id, email: `${id}@example.com` }, access_token: `token-${id}` })
function authMock(initial) {
  const callbacks = new Set()
  const client = { auth: {
    getSession: vi.fn(async () => ({ data: { session: initial } })),
    onAuthStateChange: vi.fn(cb => { callbacks.add(cb); return { data: { subscription: { unsubscribe: () => callbacks.delete(cb) } } } }),
    signOut: vi.fn(async () => { client.emit(null); return { error: null } }),
  }, emit: next => { for (const cb of callbacks) cb(next ? 'SIGNED_IN' : 'SIGNED_OUT', next) } }
  return client
}
function Probe() {
  const workspace = useWorkspace()
  const [transactions, setTransactions] = useStoredState('transactions', [])
  const { categories } = useCategories()
  return <div><h2>Private dashboard</h2><p>{transactions.map(t => t.description).join(', ') || 'No transactions'}</p><p>{categories.expense.map(c => c.name).join(', ')}</p><button onClick={() => setTransactions([{ description: `Record for ${workspace.session.user.id}` }])}>Add private record</button></div>
}
const factory = (authSession, lifetime) => ({ userId: authSession.user.id, lifetime })
it('does not mount financial components while signed out', async () => {
  const client = authMock(null)
  render(<WorkspaceRoot client={client} project="test" clientFactory={factory}><Probe /></WorkspaceRoot>)
  expect(await screen.findByText('Your finances, your workspace')).toBeInTheDocument()
  expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument()
  expect(client.auth.signOut).not.toHaveBeenCalled()
})
it('keeps A and B records separate, locks on sign-out, and restores only the returning user', async () => {
  const client = authMock(session('a'))
  render(<StrictMode><WorkspaceRoot client={client} project="test" clientFactory={factory}><Probe /></WorkspaceRoot></StrictMode>)
  await screen.findByText('Private dashboard')
  fireEvent.click(screen.getByText('Add private record'))
  expect(screen.getByText('Record for a')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  await screen.findByText('Your finances, your workspace')
  expect(screen.queryByText('Record for a')).not.toBeInTheDocument()
  expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  act(() => client.emit(session('b')))
  await screen.findByText('Private dashboard')
  expect(screen.queryByText('Record for a')).not.toBeInTheDocument()
  expect(screen.getByText('No transactions')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Add private record'))
  expect(screen.getByText('Record for b')).toBeInTheDocument()
  act(() => client.emit(session('a')))
  expect(await screen.findByText('Record for a')).toBeInTheDocument()
  expect(screen.queryByText('Record for b')).not.toBeInTheDocument()
  expect(localStorage.getItem('transactions')).toBeNull()
})
it('offers backed-up shared data only to the account already signed in during upgrade', async () => {
  localStorage.setItem('transactions', JSON.stringify([{ description: 'Old private salary' }]))
  const client = authMock(session('a'))
  render(<WorkspaceRoot client={client} project="test" clientFactory={factory}><Probe /></WorkspaceRoot>)
  await screen.findByText('Keep your previous browser data?')
  expect(screen.queryByText('Old private salary')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Keep my previous browser data' }))
  expect(await screen.findByText('Old private salary')).toBeInTheDocument()
  expect(localStorage.getItem(legacyBackupKey('test'))).toContain('Old private salary')
  act(() => client.emit(session('b')))
  expect(await screen.findByText('No transactions')).toBeInTheDocument()
  expect(screen.queryByText('Keep your previous browser data?')).not.toBeInTheDocument()
  expect(screen.queryByText('Old private salary')).not.toBeInTheDocument()
})
it('starts a new login empty if legacy data has no known owner', async () => {
  localStorage.setItem('transactions', JSON.stringify([{ description: 'Someone else' }]))
  const client = authMock(null)
  render(<WorkspaceRoot client={client} project="test" clientFactory={factory}><Probe /></WorkspaceRoot>)
  await screen.findByText('Your finances, your workspace')
  act(() => client.emit(session('b')))
  expect(await screen.findByText('No transactions')).toBeInTheDocument()
  expect(screen.queryByText('Someone else')).not.toBeInTheDocument()
  expect(scopedStorage('test', 'b').getItem('transactions')).toBe('[]')
})
it('aborts the previous user lifetime before opening another workspace', async () => {
  const client = authMock(session('a')), lifetimes = new Map()
  const dataFactory = (authSession, lifetime) => { lifetimes.set(authSession.user.id, lifetime); return factory(authSession, lifetime) }
  render(<WorkspaceRoot client={client} project="test" clientFactory={dataFactory}><Probe /></WorkspaceRoot>)
  await screen.findByText('Private dashboard')
  expect(lifetimes.get('a').signal.aborted).toBe(false)
  act(() => client.emit(session('b')))
  await waitFor(() => expect(lifetimes.has('b')).toBe(true))
  expect(lifetimes.get('a').signal.aborted).toBe(true)
  expect(lifetimes.get('b').signal.aborted).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(lifetimes.get('b').signal.aborted).toBe(true)
})
