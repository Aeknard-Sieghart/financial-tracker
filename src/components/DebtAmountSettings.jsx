import BillAmountInput from './BillAmountInput'
import PeriodDatePicker from './PeriodDatePicker'
import { fixedPaymentCalculation, debtScheduleMonths, debtMonthStatus } from '../utils/debts'
const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
export default function DebtAmountSettings({ draft, onChange }) {
  const calculated = draft.amountType !== 'variable' && draft.paymentMode === 'calculated'
  const calculation = calculated ? fixedPaymentCalculation(draft) : null
  const months = debtScheduleMonths(draft)
  return <><div className="form-group"><label>Amount type<select value={draft.amountType || 'fixed'} onChange={e => onChange({ ...draft, amountType: e.target.value, paymentMode: 'manual', paymentAmount: e.target.value === 'variable' ? undefined : draft.paymentAmount || draft.openingPrincipal || undefined })}><option value="fixed">Fixed — same monthly payment</option><option value="variable">Variable — set amount each month</option></select></label></div>
    <div className="form-group"><label>First monthly due date</label><PeriodDatePicker type="date" value={draft.dueDate} onChange={e => onChange({ ...draft, dueDate: e.target.value })} /></div>
    <div className="form-group"><label className="debt-schedule-toggle"><input type="checkbox" checked={Boolean(draft.finalDueDate)} disabled={calculated} onChange={e => onChange({ ...draft, finalDueDate: e.target.checked ? draft.dueDate : undefined })} />Set final payment due date</label></div>
    {draft.finalDueDate && <div className="form-group"><label>Final payment due date</label><PeriodDatePicker type="date" value={draft.finalDueDate} min={draft.dueDate} onChange={e => onChange({ ...draft, finalDueDate: e.target.value })} /><p className="budget-usage-note">Monthly payments follow the first due day; the last payment uses this exact date. For one payment, use the same first and final date. Maximum period: 50 years.</p></div>}
    {draft.amountType === 'variable' ? <><p className="budget-usage-note">{draft.finalDueDate ? 'Enter the statement amount for each month below, or leave it blank until known. No new payments are scheduled after the final month; unpaid balances remain visible.' : 'Set statement amounts month by month after saving, or add a final date to enter the schedule here.'} Amounts are not divided automatically. Statements include principal, interest and fees; principal remains separate.</p>{draft.finalDueDate && months.length > 0 && <fieldset className="debt-monthly-amounts"><legend>Monthly payment amounts</legend><div className="debt-monthly-grid">{months.map(month => {
      const due = debtMonthStatus(draft, [], month).dueDate
      const title = new Date(`${month}-01T12:00:00`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
      return <BillAmountInput key={month} label={`${title} · due ${due}`} allowEmpty value={draft.monthlyAmounts?.[month] ?? null} onChange={amount => {
        const monthlyAmounts = { ...draft.monthlyAmounts }
        if (amount === null) delete monthlyAmounts[month]
        else monthlyAmounts[month] = amount
        onChange({ ...draft, monthlyAmounts })
      }} />
    })}</div></fieldset>}</> : <>
      <div className="form-group"><label>Monthly payment setup<select value={draft.paymentMode || 'manual'} onChange={e => onChange({ ...draft, paymentMode: e.target.value, finalDueDate: e.target.value === 'calculated' ? draft.finalDueDate || draft.dueDate : draft.finalDueDate, totalRepayment: draft.totalRepayment || draft.openingPrincipal })}><option value="manual">Enter monthly payment</option><option value="calculated">Calculate from total repayment</option></select></label></div>
      {calculated ? <><BillAmountInput label="Total repayment (including fees)" value={draft.totalRepayment || 0} onChange={totalRepayment => onChange({ ...draft, totalRepayment })} />{calculation ? <div className="account-balance-breakdown" role="status"><p>{calculation.count} monthly payment{calculation.count === 1 ? '' : 's'}</p><p>Monthly payment: <strong>{money(calculation.monthlyAmount)}</strong></p><p>Final payment: <strong>{money(calculation.finalAmount)}</strong></p><p>Total: {money(calculation.total)}. Any rounding difference goes into the final payment.</p><details><summary>View payment schedule</summary>{debtScheduleMonths(draft).map(month => { const state = debtMonthStatus(draft, [], month); return <p key={month}>{state.dueDate} · {money(state.amount)}</p> })}</details></div> : <p role="status">Enter a total at least equal to the opening principal and a valid first/final payment period to calculate installments.</p>}<p className="budget-usage-note">This divides the total you enter; it does not calculate lender interest. Saving replaces any monthly amount overrides within this fixed schedule.</p></> : <BillAmountInput label="Fixed monthly payment (including fees)" value={draft.paymentAmount ?? draft.openingPrincipal} onChange={paymentAmount => onChange({ ...draft, amountType: 'fixed', paymentAmount })} />}
    </>}
  </>
}
