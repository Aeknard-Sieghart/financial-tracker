import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createSyncEngine, financialSnapshot } from '../utils/cloudSnapshot'
import ActionButton from './ActionButton'

const labels = { loading: 'Checking cloud…', choose: 'Choose your starting copy', synced: 'Up to date', pending: 'Changes waiting to sync', conflict: 'Sync paused: both copies changed', waiting: 'Waiting for you to finish editing', offline: 'Offline — changes stay on this device', error: 'Sync needs attention', paused: 'Automatic sync paused' }
export default function CloudSync({ snapshot, onApply, client = supabase }) {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sync, setSync] = useState({ status: 'loading' })
  const [choice, setChoice] = useState(null)
  const [cycle, setCycle] = useState(0)
  const engine = useRef(null)
  const active = useRef(false)
  const latest = useRef({ snapshot, onApply })
  useEffect(() => { latest.current = { snapshot, onApply } }, [snapshot, onApply])

  const tick = useCallback(async (direction, expectedRevision) => {
    const current = engine.current
    if (!current || (!direction && !active.current)) return
    if (!navigator.onLine) { setSync(prev => ({ ...prev, status: 'offline' })); return }
    try {
      const result = await current.run(direction, expectedRevision)
      if (engine.current !== current || ['busy', 'stopped'].includes(result.status)) return
      if (['choose', 'conflict'].includes(result.status)) active.current = false
      else if (direction) active.current = true
      setSync(prev => ({ ...prev, ...result, error: '' }))
    } catch (error) {
      if (engine.current === current) setSync(prev => ({ ...prev, status: navigator.onLine ? 'error' : 'offline', error: error.message || 'Unable to sync. Your local data is still available.' }))
    }
  }, [])

  useEffect(() => {
    if (!client) return
    let alive = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => { if (alive) setSession(next) })
    client.auth.getSession().then(({ data, error }) => {
      if (!alive) return
      if (error) setMessage(error.message)
      else setSession(data.session)
    }).catch(error => { if (alive) setMessage(error.message) })
    return () => { alive = false; subscription.unsubscribe() }
  }, [client])

  const userId = session?.user.id
  useEffect(() => {
    if (!client || !userId) return
    let alive = true
    const current = createSyncEngine({
      getLocal: () => financialSnapshot(latest.current.snapshot),
      canApply: () => !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName),
      apply: data => latest.current.onApply(data),
      read: async () => {
        const { data, error } = await client.from('tracker_snapshots').select('payload,revision,updated_at').eq('user_id', userId).maybeSingle()
        if (error) throw error
        return data
      },
      write: async (payload, revision) => {
        const { data, error } = await client.rpc('save_tracker_snapshot', { expected_revision: revision, new_payload: payload })
        if (error) throw error
        return data?.[0] || null
      },
    })
    engine.current = current
    active.current = false
    current.run().then(result => {
      if (!alive || engine.current !== current || result.status === 'stopped') return
      active.current = result.status === 'synced'
      setSync(result)
    }).catch(error => { if (alive) setSync({ status: 'error', error: error.message }) })
    const check = () => { if (document.visibilityState !== 'hidden') tick() }
    const interval = window.setInterval(check, 20000)
    window.addEventListener('online', check)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      alive = false; current.stop(); engine.current = null; active.current = false
      clearInterval(interval)
      window.removeEventListener('online', check)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [client, userId, tick, cycle])

  const serialized = JSON.stringify(snapshot)
  useEffect(() => {
    if (!userId) return
    const timer = setTimeout(() => tick(), 1200)
    return () => clearTimeout(timer)
  }, [serialized, userId, tick])

  async function authAction(action) {
    setAuthBusy(true); setMessage('')
    try { await action() } catch (error) { setMessage(error.message) }
    finally { setAuthBusy(false) }
  }
  return <section className="data-backup cloud-sync" aria-label="Cloud sync"><div><h2>Cloud sync</h2><p>Keep your financial records in sync across devices. Local backups remain available below.</p></div>
    {!client ? <div className="cloud-setup"><strong>Setup required</strong><p>Supabase is not connected yet. Your data is saved only in this browser. Follow docs/cloud-sync.md in the project to connect your Supabase project.</p></div> : !session ? <><p>Sign in using an email code. Connecting shares your financial records with your configured Supabase project after you choose a starting copy.</p><form onSubmit={e => { e.preventDefault(); authAction(async () => { const address = email.trim(); const { error } = await client.auth.signInWithOtp({ email: address }); if (error) throw error; setSentTo(address); setMessage('Check your email for the sign-in code.') }) }}><div className="form-group"><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label></div><ActionButton icon="save" className="primary-action" disabled={authBusy}>Send sign-in code</ActionButton></form>{sentTo && <form onSubmit={e => { e.preventDefault(); authAction(async () => { const { error } = await client.auth.verifyOtp({ email: sentTo, token: token.trim(), type: 'email' }); if (error) throw error; setToken(''); setSentTo(''); setMessage('Signed in. Choose which copy to use.') }) }}><p>Code sent to {sentTo}</p><div className="form-group"><label>Email code<input required autoComplete="one-time-code" inputMode="numeric" value={token} onChange={e => setToken(e.target.value)} /></label></div><ActionButton icon="save" className="primary-action" disabled={authBusy}>Verify code</ActionButton></form>}</> : <>
      <p>Signed in as <strong>{session.user.email}</strong></p><p role="status">{labels[sync.status] || 'Connecting…'}</p>{sync.updatedAt && <p>Last synced: {new Date(sync.updatedAt).toLocaleString()}</p>}
      <p>This browser keeps a local copy, including after sign-out. Use a trusted browser. Clear data is local only and pauses automatic sync until you choose a starting copy again.</p>
      {['choose', 'conflict'].includes(sync.status) && <div className="backup-confirm"><p>{sync.status === 'conflict' ? 'Changes were made on both devices. No copy was overwritten. Export a local backup before choosing which complete copy to keep.' : 'Choose your starting copy. Nothing is uploaded automatically on first connection.'}</p><p>This device: {snapshot.transactions.length} transactions · {snapshot.accounts.length} accounts{sync.remote ? ` · Cloud: ${sync.remote.payload.transactions.length} transactions, ${sync.remote.payload.accounts.length} accounts` : ' · No cloud copy yet'}</p><div className="export-buttons"><ActionButton icon="upload" className="export-btn" onClick={() => setChoice({ direction: 'upload', revision: sync.remote?.revision || 0 })}>Use this device’s data</ActionButton>{sync.remote && <ActionButton icon="download" className="export-btn" onClick={() => setChoice({ direction: 'download', revision: sync.remote.revision })}>Use cloud data</ActionButton>}</div></div>}
      {choice && <div className="backup-confirm"><p>{choice.direction === 'upload' ? 'Replace the cloud copy with all financial data from this browser? Other connected devices will receive this copy.' : 'Replace financial data in this browser with the cloud copy? Export a local backup below first if you want to keep both.'}</p><div className="export-buttons"><ActionButton icon="save" className="primary-action" onClick={() => { const selected = choice; setChoice(null); tick(selected.direction, selected.revision) }}>Confirm {choice.direction === 'upload' ? 'upload' : 'download'}</ActionButton><ActionButton icon="close" className="export-btn" onClick={() => setChoice(null)}>Cancel</ActionButton></div></div>}
      <div className="export-buttons"><ActionButton icon="restore" className="export-btn" onClick={() => { if (!engine.current) setCycle(value => value + 1); else { active.current = true; tick() } }}>Sync now</ActionButton><ActionButton icon="pause" className="export-btn" onClick={() => { active.current = false; engine.current?.stop(); engine.current = null; setChoice(null); setSync(prev => ({ ...prev, status: 'paused' })) }}>Pause sync</ActionButton><ActionButton icon="close" className="export-btn" disabled={authBusy} onClick={() => authAction(async () => { active.current = false; engine.current?.stop(); engine.current = null; const { error } = await client.auth.signOut({ scope: 'local' }); if (error) throw error; setChoice(null); setMessage('Signed out. Your local financial data remains on this browser.') })}>Sign out</ActionButton></div>
    </>}
    {sync.error && session && <p role="alert">{sync.error}</p>}{message && <p role="status">{message}</p>}
  </section>
}
