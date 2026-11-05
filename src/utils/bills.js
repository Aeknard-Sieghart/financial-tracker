export function localMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function billAmount(bill, month) {
  return Object.hasOwn(bill.monthlyAmounts || {}, month) ? bill.monthlyAmounts[month] : bill.amountType === 'variable' ? null : bill.amount
}

export function validBill(b) {
  return b && typeof b.id === 'string' && b.id && typeof b.name === 'string' && b.name.trim() && typeof b.category === 'string' && Number.isFinite(b.amount) && (b.amountType === 'variable' ? b.amount >= 0 : b.amount > 0) && (!b.amountType || ['fixed', 'variable'].includes(b.amountType)) && (!b.provider || typeof b.provider === 'string') && Number.isInteger(b.dueDay) && b.dueDay >= 1 && b.dueDay <= 31 && /^\d{4}-(0[1-9]|1[0-2])$/.test(b.startMonth) && (b.monthlyAmounts === undefined || (b.monthlyAmounts && typeof b.monthlyAmounts === 'object' && !Array.isArray(b.monthlyAmounts) && Object.entries(b.monthlyAmounts).every(([month, amount]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number.isFinite(amount) && amount >= 0)))
}

export function billStatus(bill, transactions, month, today = new Date()) {
  const [year, number] = month.split('-').map(Number)
  const day = Math.min(bill.dueDay, new Date(year, number, 0).getDate())
  const dueDate = `${month}-${String(day).padStart(2, '0')}`
  const paidCents = transactions.filter(t => t.type === 'expense' && t.billId === bill.id && t.billMonth === month)
    .reduce((total, t) => total + Math.round(t.amount * 100), 0)
  const amount = billAmount(bill, month)
  const pending = amount === null
  const remaining = pending ? null : Math.max(0, Math.round(amount * 100) - paidCents) / 100
  const date = `${localMonth(today)}-${String(today.getDate()).padStart(2, '0')}`
  return { dueDate, amount, pending, paid: paidCents / 100, remaining, status: pending ? 'Amount pending' : remaining === 0 ? 'Paid' : paidCents > 0 ? 'Partially paid' : 'Unpaid', overdue: (pending || remaining > 0) && dueDate < date }
}
