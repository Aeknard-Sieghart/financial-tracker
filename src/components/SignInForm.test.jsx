import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import SignInForm from './SignInForm'
afterEach(cleanup)
it('shows a spinner and blocks repeat submissions until sending finishes', async () => {
  let finish
  const client = { auth: { signInWithOtp: vi.fn(() => new Promise(resolve => { finish = resolve })) } }
  render(<SignInForm client={client} />)
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send sign-in code' }))
  const button = screen.getByRole('button', { name: 'Sending code…' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(button.querySelector('.action-spinner')).not.toBeNull()
  expect(screen.getByRole('status')).toHaveTextContent('Sending your sign-in code')
  fireEvent.click(button)
  expect(client.auth.signInWithOtp).toHaveBeenCalledTimes(1)
  await act(async () => finish({ error: null }))
  expect(screen.getByRole('button', { name: 'Send sign-in code' })).toBeEnabled()
  expect(screen.getByLabelText('Email code')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Check your inbox')
})
it('restores the send button and displays the error after a failed request', async () => {
  let fail
  const client = { auth: { signInWithOtp: vi.fn(() => new Promise((_resolve, reject) => { fail = reject })) } }
  render(<SignInForm client={client} />)
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send sign-in code' }))
  await act(async () => fail(new Error('Email could not be sent')))
  expect(screen.getByRole('button', { name: 'Send sign-in code' })).toBeEnabled()
  expect(screen.getByRole('status')).toHaveTextContent('Email could not be sent')
})
