import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
// Only public keys are accepted. Invalid setup must not break local-only use.
let client = null
if (url && key?.startsWith('sb_publishable_') && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_PUBLIC_KEY')) {
  try {
    if (new URL(url).protocol === 'https:') client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  } catch { /* Keep the local app available until configuration is corrected. */ }
}
export const supabase = client
export const workspaceProject = client ? new URL(url).hostname : 'local'

// A request is bound to the token of the workspace that created it. It can never
// pick up a different user's token from the global Auth client during a switch.
export function createWorkspaceClient(session, scope) {
  return createClient(url, key, {
    accessToken: async () => {
      if (scope.signal.aborted) throw new Error('Workspace closed.')
      return session.access_token
    },
    global: {
      fetch: (input, init = {}) => fetch(input, { ...init, signal: init.signal ? AbortSignal.any([init.signal, scope.signal]) : scope.signal }),
    },
  })
}
