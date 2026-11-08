export const LEGACY_KEYS = ['transactions', 'accounts', 'transfers', 'budgets', 'categories', 'bills', 'debts', 'recurring', 'savingsGoals', 'incomePlans', 'spendingBuffer', 'darkMode', 'netBalanceHidden', 'walletDesign', 'activityMonth']
export function createWorkspaceLifetime() {
  let controller = new AbortController()
  return {
    get signal() { return controller.signal },
    reset: () => { if (controller.signal.aborted) controller = new AbortController() },
    abort: () => controller.abort(),
  }
}
const projectPrefix = project => `financial-tracker:v2:${encodeURIComponent(project)}:`
export const workspacePrefix = (project, userId) => `${projectPrefix(project)}user:${encodeURIComponent(userId)}:`
export function scopedStorage(project, userId, storage = localStorage) {
  if (!userId) throw new Error('A signed-in user is required for a workspace.')
  const prefix = workspacePrefix(project, userId)
  return {
    getItem: key => storage.getItem(prefix + key),
    setItem: (key, value) => storage.setItem(prefix + key, value),
    removeItem: key => storage.removeItem(prefix + key),
  }
}
const migrationKey = project => `${projectPrefix(project)}legacy-migration`
export const legacyBackupKey = project => `${projectPrefix(project)}legacy-backup`

// Run once at startup, before new sign-ins are permitted. No new login can claim
// the previous shared workspace. Raw JSON strings preserve even damaged records.
export function prepareLegacyWorkspace(project, initialUserId, storage = localStorage) {
  const existing = storage.getItem(migrationKey(project))
  if (existing) return JSON.parse(existing)
  const values = Object.fromEntries(LEGACY_KEYS.map(key => [key, storage.getItem(key)]).filter(([, value]) => value !== null))
  const hasData = Object.keys(values).length > 0
  const migration = { ownerId: initialUserId || null, pending: hasData && !!initialUserId, backedUp: hasData }
  if (hasData) storage.setItem(legacyBackupKey(project), JSON.stringify({ createdAt: new Date().toISOString(), ownerId: migration.ownerId, values }))
  storage.setItem(migrationKey(project), JSON.stringify(migration))
  if (hasData) for (const key of LEGACY_KEYS) storage.removeItem(key)
  return migration
}
export function resolveLegacyWorkspace(project, userId, restore, storage = localStorage) {
  const migration = JSON.parse(storage.getItem(migrationKey(project)) || 'null')
  if (!migration || migration.ownerId !== userId || !migration.pending) throw new Error('Previous browser data is not assigned to this account.')
  if (restore) {
    const backup = JSON.parse(storage.getItem(legacyBackupKey(project)) || 'null')
    if (!backup || backup.ownerId !== userId) throw new Error('Previous browser backup is unavailable.')
    const target = scopedStorage(project, userId, storage)
    if (LEGACY_KEYS.some(key => target.getItem(key) !== null)) throw new Error('This account already has local data. Use your cloud copy or import a JSON backup instead.')
    const written = []
    try {
      for (const [key, value] of Object.entries(backup.values)) {
        if (!LEGACY_KEYS.includes(key)) continue
        target.setItem(key, value); written.push(key)
      }
      storage.setItem(migrationKey(project), JSON.stringify({ ...migration, pending: false }))
    } catch (error) {
      for (const key of written) target.removeItem(key)
      throw error
    }
  } else storage.setItem(migrationKey(project), JSON.stringify({ ...migration, pending: false }))
}
