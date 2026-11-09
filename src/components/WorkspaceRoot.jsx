import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { supabase, workspaceProject, createWorkspaceClient } from '../lib/supabase'
import { WorkspaceContext } from '../hooks/workspaceContext'
import { createWorkspaceLifetime, prepareLegacyWorkspace, resolveLegacyWorkspace, scopedStorage } from '../utils/workspaceStorage'
import SignInForm from './SignInForm'
import ActionButton from './ActionButton'

function SignedInWorkspace({ session, clientFactory, project, signOut, boundaryRef, children }) {
  const [lifetime] = useState(createWorkspaceLifetime)
  const dataClient = useMemo(() => clientFactory(session, lifetime), [session, lifetime, clientFactory])
  const context = useMemo(() => ({ session, dataClient, signOut, storage: scopedStorage(project, session.user.id), sessionStorage: scopedStorage(project, session.user.id, sessionStorage) }), [session, dataClient, signOut, project])
  useLayoutEffect(() => {
    lifetime.reset()
    boundaryRef.current = () => lifetime.abort()
    return () => { lifetime.abort(); boundaryRef.current = null }
  }, [boundaryRef, lifetime])
  return <WorkspaceContext.Provider value={context}><div className="workspace-session-bar"><span>Signed in as <strong>{session.user.email}</strong></span><ActionButton icon="close" className="export-btn" onClick={signOut}>Sign out</ActionButton></div>{children}</WorkspaceContext.Provider>
}

export default function WorkspaceRoot({ children, client = supabase, project = workspaceProject, clientFactory = createWorkspaceClient }) {
  const [auth, setAuth] = useState({ loading: true, session: null, migration: null, error: '' })
  const [retry, setRetry] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const boundaryRef = useRef(null)
  const currentUser = useRef(null)
  const revokeBoundary = useCallback(() => boundaryRef.current?.(), [])
  useEffect(() => {
    if (!client) return
    let alive = true, ready = false, eventSeen = false, eventSession = null
    const transition = next => {
      if (!alive) return
      if (currentUser.current !== next?.user.id) boundaryRef.current?.()
      currentUser.current = next?.user.id || null
      setAuth(prev => prev.session?.user.id === next?.user.id && prev.session?.access_token === next?.access_token && prev.session?.user.email === next?.user.email ? prev : { ...prev, loading: false, session: next })
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      eventSeen = true; eventSession = next
      if (ready) transition(next)
    })
    client.auth.getSession().then(({ data, error }) => {
      if (!alive) return
      if (error) throw error
      const session = eventSeen ? eventSession : data.session
      const initialOwner = !eventSeen || eventSession?.user.id === data.session?.user.id ? data.session?.user.id : null
      const migration = prepareLegacyWorkspace(project, initialOwner)
      sessionStorage.removeItem('billReminderDismissed')
      ready = true
      currentUser.current = session?.user.id || null
      setAuth({ loading: false, session, migration, error: '' })
    }).catch(error => { if (alive) setAuth({ loading: false, session: null, migration: null, error: error.message }) })
    return () => { alive = false; revokeBoundary(); subscription.unsubscribe() }
  }, [client, project, retry, revokeBoundary])

  const signOut = useCallback(async () => {
    setSigningOut(true)
    boundaryRef.current?.()
    currentUser.current = null
    setAuth(prev => ({ ...prev, session: null, error: '' }))
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (error) { setAuth(prev => ({ ...prev, error: `Workspace locked. ${error.message}` })) }
    finally { setSigningOut(false) }
  }, [client])

  if (!client) return children
  if (signingOut || auth.loading) return <main className="auth-screen"><section className="auth-panel" role="status" aria-busy="true"><span className="action-spinner" aria-hidden="true" /> {signingOut ? 'Signing out…' : 'Opening your workspace…'}</section></main>
  if (auth.error && !auth.migration) return <main className="auth-screen"><section className="auth-panel"><h1>Unable to open workspace</h1><p role="alert">{auth.error}</p><ActionButton icon="restore" className="primary-action" onClick={() => { setAuth(prev => ({ ...prev, loading: true })); setRetry(value => value + 1) }}>Retry</ActionButton></section></main>
  if (!auth.session) return <>{auth.error && <p role="alert">{auth.error}</p>}<SignInForm client={client} /></>
  const userId = auth.session.user.id
  if (auth.migration?.pending && auth.migration.ownerId === userId) return <main className="auth-screen"><section className="auth-panel"><h1>Keep your previous browser data?</h1><p>You are signed in as <strong>{auth.session.user.email}</strong>. A recovery copy of the old shared workspace has been saved on this browser. Only this account can restore it.</p><p>If the old records belong to you, keep them here. Otherwise start a separate workspace and load your own cloud copy.</p><div className="export-buttons">{[true, false].map(restore => <ActionButton key={String(restore)} icon={restore ? 'restore' : 'add'} className={restore ? 'primary-action' : 'export-btn'} onClick={() => {
    try { resolveLegacyWorkspace(project, userId, restore); setAuth(prev => ({ ...prev, migration: { ...prev.migration, pending: false }, error: '' })) }
    catch (error) { setAuth(prev => ({ ...prev, error: error.message })) }
  }}>{restore ? 'Keep my previous browser data' : 'Start a separate workspace'}</ActionButton>)}</div>{auth.error && <p role="alert">{auth.error}</p>}<ActionButton icon="close" className="export-btn" onClick={signOut}>Sign out</ActionButton></section></main>
  return <SignedInWorkspace key={userId} session={auth.session} project={project} signOut={signOut} boundaryRef={boundaryRef} clientFactory={clientFactory}>{children}</SignedInWorkspace>
}
