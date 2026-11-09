import { useState } from 'react'
import ActionButton from './ActionButton'

export default function SignInForm({ client }) {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  async function submit(action, kind) {
    if (busy) return
    setBusy(kind); setMessage(kind === 'send' ? 'Sending your sign-in code…' : 'Verifying your code…')
    try { await action() } catch (error) { setMessage(error.message || 'Unable to sign in. Please try again.') }
    finally { setBusy('') }
  }
  return <main className="auth-screen"><section className="auth-panel"><p className="dashboard-eyebrow">FINANCIAL TRACKER</p><h1>Your finances, your workspace</h1><p>Sign in to open your private workspace and sync your records across devices.</p><form onSubmit={e => { e.preventDefault(); submit(async () => {
    const address = email.trim()
    const { error } = await client.auth.signInWithOtp({ email: address })
    if (error) throw error
    setSentTo(address); setToken(''); setMessage('Check your inbox and Spam folder for the sign-in code.')
  }, 'send') }}><div className="form-group"><label>Email address<input required type="email" autoComplete="email" disabled={Boolean(busy)} value={email} onChange={e => setEmail(e.target.value)} /></label></div><ActionButton icon="save" className="primary-action" loading={busy === 'send'} disabled={Boolean(busy)}>{busy === 'send' ? 'Sending code…' : 'Send sign-in code'}</ActionButton></form>{sentTo && <form onSubmit={e => { e.preventDefault(); submit(async () => {
    const { error } = await client.auth.verifyOtp({ email: sentTo, token: token.trim(), type: 'email' })
    if (error) throw error
    setToken(''); setMessage('Code verified. Opening your workspace…')
  }, 'verify') }}><p>Code sent to {sentTo}</p><div className="form-group"><label>Email code<input required inputMode="numeric" autoComplete="one-time-code" disabled={Boolean(busy)} value={token} onChange={e => setToken(e.target.value)} /></label></div><ActionButton icon="save" className="primary-action" loading={busy === 'verify'} disabled={Boolean(busy)}>{busy === 'verify' ? 'Verifying…' : 'Verify code'}</ActionButton></form>}{message && <p role="status">{message}</p>}<p className="budget-usage-note">Only use a trusted browser. Signing out hides your records; saved local copies are separated by account.</p></section></main>
}
