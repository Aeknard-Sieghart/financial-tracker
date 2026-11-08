import { expect, it, vi } from 'vitest'
import { createSyncEngine, financialSnapshot, snapshotKey, validateCloudSnapshot } from './cloudSnapshot'
import { DEFAULT_CATEGORIES } from '../hooks/useCategories'
const snapshot = () => financialSnapshot({ transactions: [], accounts: [{ id: 'unassigned', name: 'Unassigned', type: 'other', openingBalance: 0 }], transfers: [], budgets: {}, categories: structuredClone(DEFAULT_CATEGORIES), bills: [], debts: [], schedules: [], goals: [], incomePlans: [], spendingBuffer: 0 })
const row = (payload, revision) => ({ payload: structuredClone(payload), revision, updated_at: '2026-11-08T00:00:00Z' })
function backend() {
  let remote = null
  return {
    read: vi.fn(async () => remote && structuredClone(remote)),
    write: vi.fn(async (payload, revision) => {
      if ((remote?.revision || 0) !== revision) return null
      remote = row(payload, revision + 1); return structuredClone(remote)
    }),
    set: value => { remote = value },
  }
}
it('requires a starting-copy choice before uploading local data', async () => {
  const store = backend(), local = snapshot()
  const engine = createSyncEngine({ ...store, getLocal: () => local, apply: vi.fn() })
  expect((await engine.run()).status).toBe('choose')
  expect(store.write).not.toHaveBeenCalled()
  expect((await engine.run('upload', 0)).status).toBe('synced')
  expect(store.write).toHaveBeenCalledTimes(1)
  expect((await engine.run()).status).toBe('synced')
  expect(store.write).toHaveBeenCalledTimes(1)
})
it('automatically pulls a newer copy only when local data has not changed', async () => {
  const store = backend(); let local = snapshot()
  store.set(row(local, 1))
  const apply = vi.fn(data => { local = data })
  const engine = createSyncEngine({ ...store, getLocal: () => local, apply })
  await engine.run()
  store.set(row({ ...local, spendingBuffer: 100 }, 2))
  expect((await engine.run()).status).toBe('synced')
  expect(local.spendingBuffer).toBe(100)
  expect(apply).toHaveBeenCalledTimes(1)
  expect(store.write).not.toHaveBeenCalled()
})
it('pauses on two-device conflicts and requires a reviewed revision to resolve', async () => {
  const store = backend(); let local = snapshot()
  store.set(row(local, 1))
  const engine = createSyncEngine({ ...store, getLocal: () => local, apply: data => { local = data } })
  await engine.run()
  local = { ...local, spendingBuffer: 100 }
  store.set(row({ ...local, spendingBuffer: 200 }, 2))
  expect((await engine.run()).status).toBe('conflict')
  expect(store.write).not.toHaveBeenCalled()
  // Another device changes data after the user reviewed revision 2.
  store.set(row({ ...local, spendingBuffer: 300 }, 3))
  expect((await engine.run('upload', 2)).status).toBe('conflict')
  expect(store.write).not.toHaveBeenCalled()
  expect((await engine.run('download', 3)).status).toBe('synced')
  expect(local.spendingBuffer).toBe(300)
})
it('handles compare-and-swap rejection without claiming success', async () => {
  const local = snapshot(), store = backend()
  const engine = createSyncEngine({ ...store, write: async () => null, getLocal: () => local, apply: vi.fn() })
  expect((await engine.run('upload', 0)).status).toBe('conflict')
})
it('preserves changes made while saving, then uploads them on the next pass', async () => {
  const store = backend(); let local = snapshot()
  const write = async (...args) => { const result = await store.write(...args); local = { ...local, spendingBuffer: 200 }; return result }
  const engine = createSyncEngine({ ...store, write, getLocal: () => local, apply: vi.fn() })
  expect((await engine.run('upload', 0)).status).toBe('pending')
  expect((await engine.run()).status).toBe('synced')
  expect((await store.read()).payload.spendingBuffer).toBe(200)
})
it('defers remote downloads during editing and never applies incomplete data', async () => {
  const store = backend(), local = snapshot(), apply = vi.fn()
  store.set(row({ ...local, spendingBuffer: 100 }, 1))
  const engine = createSyncEngine({ ...store, getLocal: () => local, apply, canApply: () => false })
  expect((await engine.run('download', 1)).status).toBe('waiting')
  expect(apply).not.toHaveBeenCalled()
  store.set(row({ transactions: [] }, 2))
  await expect(engine.run('download', 2)).rejects.toThrow('incomplete')
  expect(apply).not.toHaveBeenCalled()
})
it('does not apply or upload after stopping an in-flight read', async () => {
  let resolve
  const local = snapshot(), apply = vi.fn(), write = vi.fn()
  const engine = createSyncEngine({ read: () => new Promise(done => { resolve = done }), write, getLocal: () => local, apply })
  const pending = engine.run('download', 1)
  engine.stop(); resolve(row({ ...local, spendingBuffer: 100 }, 1))
  expect((await pending).status).toBe('stopped')
  expect(apply).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled()
})
it('preserves local data on network failure and recovers a save whose acknowledgement was lost', async () => {
  const store = backend(), local = snapshot()
  const engine = createSyncEngine({ ...store, getLocal: () => local, apply: vi.fn(), write: async (...args) => { await store.write(...args); throw new Error('Connection lost') } })
  await expect(engine.run('upload', 0)).rejects.toThrow('Connection lost')
  expect((await engine.run()).status).toBe('synced')
  expect(store.write).toHaveBeenCalledTimes(1)
})
it('uses canonical snapshots and validates references and all financial collections', () => {
  const data = snapshot()
  expect(validateCloudSnapshot(data)).toEqual(data)
  expect(snapshotKey({ ...data, exportedAt: 'yesterday' })).toBe(snapshotKey(data))
  expect(snapshotKey({ ...data, budgets: { Food: 1, Rent: 2 } })).toBe(snapshotKey({ ...data, budgets: { Rent: 2, Food: 1 } }))
  expect(() => validateCloudSnapshot({ ...data, incomePlans: undefined })).toThrow('incomplete')
  expect(() => validateCloudSnapshot({ ...data, spendingBuffer: -1 })).toThrow('buffer')
})
