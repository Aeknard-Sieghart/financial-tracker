import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Accounts from './Accounts'

const accounts = [{ id: 'unassigned', name: 'Unassigned', type: 'other', openingBalance: 0 }, { id: 'cash', name: 'Cash', type: 'cash', openingBalance: 100 }]
const base = { accounts, transfers: [], transactions: [], onAccountsChange: vi.fn(), onTransfersChange: vi.fn() }
beforeEach(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') } })
afterEach(() => { cleanup(); vi.clearAllMocks() })
describe('account modal workflows', () => {
  it('masks a card balance without changing its amount', () => {
    render(<Accounts {...base} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hide Cash balance' }))
    expect(base.onAccountsChange.mock.calls[0][0].find(a => a.id === 'cash')).toMatchObject({ balanceHidden: true, openingBalance: 100 })
  })
  it('confirms archive and preserves the stored account', () => {
    render(<Accounts {...base} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit Cash account' }))
    expect(screen.queryByRole('button', { name: 'Delete account' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Archive account' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm archive' }))
    expect(base.onAccountsChange.mock.calls[0][0].find(a => a.id === 'cash')).toMatchObject({ archived: true, openingBalance: 100 })
  })
  it('hides archived cards until show archived is selected', () => {
    render(<Accounts {...base} accounts={accounts.map(a => a.id === 'cash' ? { ...a, archived: true } : a)} />)
    expect(screen.queryByRole('button', { name: 'Edit Cash account' })).toBeNull()
    fireEvent.click(screen.getByLabelText('Show archived accounts'))
    expect(screen.getByRole('button', { name: 'Edit Cash account' })).toBeTruthy()
  })
  it('opens editing in a dialog and cancels without changing accounts', () => {
    render(<Accounts {...base} />)
    expect(screen.queryByRole('button', { name: '+ Add account' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Cash account' }))
    expect(screen.getByRole('dialog', { name: 'Edit account' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(base.onAccountsChange).not.toHaveBeenCalled()
  })
  it('creates an account in the embedded workspace form and finishes', () => {
    const onDone = vi.fn()
    render(<Accounts {...base} editorOnly onDone={onDone} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.change(screen.getByLabelText('Account name'), { target: { value: 'Wallet' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save account' }))
    expect(base.onAccountsChange.mock.calls[0][0].some(a => a.name === 'Wallet')).toBe(true)
    expect(onDone).toHaveBeenCalled()
  })
  it('keeps balance validation inside the transfer modal', () => {
    render(<Accounts {...base} />)
    fireEvent.click(screen.getByRole('button', { name: 'Transfer money' }))
    expect(screen.getByRole('dialog', { name: 'Transfer money' })).toBeTruthy()
    fireEvent.keyDown(screen.getByLabelText('Transfer amount'), { key: '1' })
    expect(screen.getByRole('alert').textContent).toContain('exceeds')
    expect(screen.getByRole('button', { name: 'Record transfer' }).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Close Transfer money' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(base.onTransfersChange).not.toHaveBeenCalled()
  })
})
