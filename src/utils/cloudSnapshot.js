import { validateBackup } from './backupValidation'

export const SNAPSHOT_FIELDS = ['transactions', 'accounts', 'transfers', 'budgets', 'categories', 'bills', 'debts', 'schedules', 'goals', 'incomePlans', 'spendingBuffer']
export function financialSnapshot(data) {
  return { version: 10, ...Object.fromEntries(SNAPSHOT_FIELDS.map(key => [key, data[key]])) }
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}
export const snapshotKey = data => JSON.stringify(canonical(financialSnapshot(data)))
export function validateCloudSnapshot(data) {
  if (!data || SNAPSHOT_FIELDS.some(key => data[key] === undefined)) throw new Error('Cloud data is incomplete. Export your local backup before retrying.')
  validateBackup(data)
  return financialSnapshot(data)
}

// A single request at a time plus server-side compare-and-swap protects other devices.
export function createSyncEngine({ read, write, getLocal, apply, canApply = () => true }) {
  let base = null, revision = 0, busy = false, stopped = false
  let latest = null
  const accept = row => { base = snapshotKey(row.payload); revision = row.revision; latest = row }
  async function run(choice, expectedRevision) {
    if (busy || stopped) return { status: 'busy' }
    busy = true
    try {
      const startingKey = snapshotKey(getLocal())
      const remote = await read()
      if (stopped) return { status: 'stopped' }
      latest = remote
      const local = validateCloudSnapshot(getLocal())
      const localKey = snapshotKey(local)
      if (remote) validateCloudSnapshot(remote.payload)
      if (choice && (remote?.revision || 0) !== expectedRevision) return { status: 'conflict', remote }
      if (choice && localKey !== startingKey) return { status: 'conflict', remote }
      if (choice === 'download') {
        if (!remote) return { status: 'choose', remote: null }
        // Never replace changes made while the request was in flight.
        if (!canApply()) return { status: 'waiting' }
        apply(remote.payload); accept(remote)
        return { status: 'synced', updatedAt: remote.updated_at }
      }
      if (remote && localKey === snapshotKey(remote.payload)) {
        accept(remote)
        return { status: 'synced', updatedAt: remote.updated_at }
      }
      if (!base && choice !== 'upload') return { status: 'choose', remote }
      if (choice !== 'upload' && (remote?.revision || 0) !== revision) {
        if (localKey !== base || !remote) return { status: 'conflict', remote }
        if (!canApply()) return { status: 'waiting' }
        apply(remote.payload); accept(remote)
        return { status: 'synced', updatedAt: remote.updated_at }
      }
      if (choice === 'upload' || localKey !== base) {
        const row = await write(local, remote?.revision || 0)
        if (stopped) return { status: 'stopped' }
        if (!row) return { status: 'conflict', remote: await read() }
        accept(row)
        return { status: snapshotKey(getLocal()) === base ? 'synced' : 'pending', updatedAt: row.updated_at }
      }
      return { status: 'synced', updatedAt: remote?.updated_at }
    } finally { busy = false }
  }
  return { run, stop: () => { stopped = true }, get remote() { return latest } }
}
