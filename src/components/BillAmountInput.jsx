export default function BillAmountInput({ value, onChange, label = 'Amount', allowEmpty = false }) {
  const empty = allowEmpty && (value === null || value === undefined)
  return <div className="form-group"><label>{label}<input inputMode="numeric" placeholder={allowEmpty ? 'Amount pending' : undefined} value={empty ? '' : Number(value).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })} onChange={() => {}} onKeyDown={e => {
    const cents = empty ? 0 : Math.round(Number(value) * 100)
    if (/^\d$/.test(e.key)) { e.preventDefault(); if (cents < 10000000000) onChange((cents * 10 + Number(e.key)) / 100) }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onChange(allowEmpty && (e.key === 'Delete' || cents < 10) ? null : e.key === 'Delete' ? 0 : Math.floor(cents / 10) / 100) }
  }} /></label><p className="budget-usage-note">Type digits for pesos and cents. Backspace removes a digit.{allowEmpty ? ' Leave blank for pending; enter zero if nothing is due.' : ''}</p></div>
}
