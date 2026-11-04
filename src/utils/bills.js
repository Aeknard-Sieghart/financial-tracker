export function localMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function billStatus(bill, transactions, month, today = new Date()) {
  const [year, number] = month.split('-').map(Number)
  const day = Math.min(bill.dueDay, new Date(year, number, 0).getDate())
  const dueDate = `${month}-${String(day).padStart(2, '0')}`
  const paidCents = transactions.filter(t => t.type === 'expense' && t.billId === bill.id && t.billMonth === month)
    .reduce((total, t) => total + Math.round(t.amount * 100), 0)
  const remaining = Math.max(0, Math.round(bill.amount * 100) - paidCents) / 100
  const date = `${localMonth(today)}-${String(today.getDate()).padStart(2, '0')}`
  return { dueDate, paid: paidCents / 100, remaining, status: remaining === 0 ? 'Paid' : paidCents > 0 ? 'Partially paid' : 'Unpaid', overdue: remaining > 0 && dueDate < date }
}
