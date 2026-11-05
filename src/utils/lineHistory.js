// Group long ranges to keep charts readable; all calculations use integer cents.
export function lineHistory(transactions, accounts, from, to, type, category) {
  if (!from || !to || from > to) return { points: [], grouping: 'day', opening: 0 }
  const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1
  const grouping = days <= 120 ? 'day' : days <= 1826 ? 'month' : 'year'
  const bucket = date => date.slice(0, grouping === 'day' ? 10 : grouping === 'month' ? 7 : 4)
  const buckets = new Map()
  let cursor = new Date(`${from}T00:00:00Z`)
  while (cursor.toISOString().slice(0, 10) <= to) {
    buckets.set(bucket(cursor.toISOString().slice(0, 10)), { categoryCents: 0, deltaCents: 0 })
    if (grouping === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1)
    else if (grouping === 'month') { cursor.setUTCDate(1); cursor.setUTCMonth(cursor.getUTCMonth() + 1) }
    else { cursor.setUTCMonth(0, 1); cursor.setUTCFullYear(cursor.getUTCFullYear() + 1) }
  }
  let balance = accounts.reduce((sum, a) => sum + Math.round(a.openingBalance * 100), 0)
  for (const t of transactions) {
    if (!['income', 'expense', 'debt-payment'].includes(t.type)) continue
    const cents = Math.round(t.amount * 100)
    const delta = t.type === 'income' ? cents : -cents
    if (t.date < from) balance += delta
    else if (t.date <= to) {
      const row = buckets.get(bucket(t.date))
      if (!row) continue
      row.deltaCents += delta
      if (t.type === type && t.category === category) row.categoryCents += cents
    }
  }
  const opening = balance / 100
  const points = [...buckets].map(([date, row]) => {
    balance += row.deltaCents
    return { date, categoryAmount: row.categoryCents / 100, balance: balance / 100 }
  })
  return { points, grouping, opening }
}
