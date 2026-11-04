export function todayDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function validSchedule(rule) {
  return rule && typeof rule.id === 'string' && rule.id && ['income', 'expense'].includes(rule.type) && typeof rule.category === 'string' && rule.category && typeof rule.description === 'string' && Number.isFinite(rule.amount) && rule.amount > 0 && typeof rule.active === 'boolean' && /^\d{4}-\d{2}-\d{2}$/.test(rule.startDate) && Number.isFinite(Date.parse(rule.startDate)) && new Date(rule.startDate).toISOString().slice(0, 10) === rule.startDate && (!rule.processedThrough || /^\d{4}-\d{2}$/.test(rule.processedThrough))
}

// A month checkpoint prevents deleted or edited generated entries being recreated.
export function applyRecurring(transactions, schedules, today = todayDate()) {
  const additions = []
  const ids = new Set(transactions.map(t => t.id))
  const updated = schedules.map(rule => {
    if (!validSchedule(rule)) return rule
    let checkpoint = rule.processedThrough || ''
    const [startYear, startMonth, day] = rule.startDate.split('-').map(Number)
    const [endYear, endMonth] = today.split('-').map(Number)
    for (let index = startYear * 12 + startMonth - 1; index <= endYear * 12 + endMonth - 1; index++) {
      const year = Math.floor(index / 12)
      const month = index % 12 + 1
      const period = `${year}-${String(month).padStart(2, '0')}`
      if (period <= checkpoint) continue
      const date = `${period}-${String(Math.min(day, new Date(year, month, 0).getDate())).padStart(2, '0')}`
      if (date > today) continue
      checkpoint = period
      const id = `recurring:${rule.id}:${period}`
      if (rule.active && !ids.has(id)) {
        additions.push({ id, type: rule.type, amount: rule.amount, category: rule.category, description: rule.description, date, recurringId: rule.id, accountId: rule.accountId || 'unassigned' })
        ids.add(id)
      }
    }
    return { ...rule, processedThrough: checkpoint }
  })
  return { transactions: [...additions.reverse(), ...transactions], schedules: updated }
}
