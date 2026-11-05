import BillAmountInput from './BillAmountInput'
export default function DebtAmountSettings({ draft, onChange }) {
  return <><div className="form-group"><label>Amount type<select value={draft.amountType || 'fixed'} onChange={e => onChange({ ...draft, amountType: e.target.value, paymentAmount: e.target.value === 'variable' ? undefined : draft.paymentAmount || draft.openingPrincipal || undefined })}><option value="fixed">Fixed — same monthly payment</option><option value="variable">Variable — set amount each month</option></select></label></div>
    {draft.amountType === 'variable' ? <p className="budget-usage-note">Set the statement amount for each billing month after saving. Amounts include principal, interest and fees; your total debt principal remains separate.</p> : <BillAmountInput label="Fixed monthly payment (including fees)" value={draft.paymentAmount ?? draft.openingPrincipal} onChange={paymentAmount => onChange({ ...draft, amountType: 'fixed', paymentAmount })} />}
  </>
}
