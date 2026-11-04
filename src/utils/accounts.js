export const UNASSIGNED_ACCOUNT = { id: 'unassigned', name: 'Unassigned', type: 'other', openingBalance: 0 }
export function accountBalance(account, transactions, transfers) {
  let cents = Math.round(account.openingBalance * 100)
  for (const t of transactions) {
    if ((t.accountId || 'unassigned') === account.id) cents += Math.round(t.amount * 100) * (t.type === 'income' ? 1 : -1)
  }
  for (const t of transfers) {
    if (t.fromAccountId === account.id) cents -= Math.round(t.amount * 100)
    if (t.toAccountId === account.id) cents += Math.round(t.amount * 100)
  }
  return cents / 100
}
export function validAccount(a) {
  return a && typeof a.id === 'string' && a.id && typeof a.name === 'string' && a.name.trim() && ['cash', 'bank', 'ewallet', 'other'].includes(a.type) && Number.isFinite(a.openingBalance) && (a.bank === undefined || typeof a.bank === 'string') && (a.color === undefined || /^#[a-f\d]{6}$/i.test(a.color))
}
export function validTransfer(t, accounts) {
  return t && typeof t.id === 'string' && t.id && Number.isFinite(t.amount) && t.amount > 0 && t.fromAccountId !== t.toAccountId && accounts.some(a => a.id === t.fromAccountId) && accounts.some(a => a.id === t.toAccountId) && typeof t.description === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(Date.parse(t.date)) && new Date(t.date).toISOString().slice(0, 10) === t.date
}
