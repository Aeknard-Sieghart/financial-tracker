import { useState } from 'react'
import ActionButton from './ActionButton'

export default function SignInForm({ client }) {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(action) {
    setBusy(true); setMessage('')
    try { await action() } catch (error) { setMessage(error.message || 'Unable to sign in. Please try again.') }
    finally { setBusy(false) }
  }
  return <main className="auth-screen"><section className="auth-panel"><p className="dashboard-eyebrow">FINANCIAL TRACKER</p><h1>Your finances, your workspace</h1><p>Sign in to open your private workspace and sync your records across devices.</p><form onSubmit={e => { e.preventDefault(); submit(async () => {
    const address = email.trim()
    const { error } = await client.auth.signInWithOtp({ email: address })
    if (error) throw error
    setSentTo(address); setToken(''); setMessage('Check your inbox and Spam folder for the sign-in code.')
  }) }}><div className="form-group"><label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label></div><ActionButton icon="save" className="primary-action" disabled={busy}>Send sign-in code</ActionButton></form>{sentTo && <form onSubmit={e => { e.preventDefault(); submit(async () => {
    const { error } = await client.auth.verifyOtp({ email: sentTo, token: token.trim(), type: 'email' })
    if (error) throw error
    setToken('')
  }) }}><p>Code sent to {sentTo}</p><div className="form-group"><label>Email code<input required inputMode="numeric" autoComplete="one-time-code" value={token} onChange={e => setToken(e.target.value)} /></label></div><ActionButton icon="save" className="primary-action" disabled={busy}>Verify code</ActionButton></form>}{message && <p role="status">{message}</p>}<p className="budget-usage-note">Only use a trusted browser. Signing out hides your records; saved local copies are separated by account.</p></section></main>
}
