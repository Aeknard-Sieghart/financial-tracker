import ActionButton from './ActionButton'
export default function TransferActivity({ transfer, accounts, onDelete }) {
  const name = id => accounts.find(a => a.id === id)?.name || 'Unassigned'
  return <div className="transaction-item transfer-activity">
    <div className="transaction-main"><span className="transfer-activity-icon" aria-hidden="true">⇄</span><div className="transaction-info"><p className="description">{name(transfer.fromAccountId)} → {name(transfer.toAccountId)}</p><p className="category">Transfer{transfer.description ? ` · ${transfer.description}` : ''}</p><p className="date">{transfer.date}</p></div></div>
    <div className="transaction-amount"><span>{transfer.amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span></div>
    <div className="transaction-actions"><ActionButton icon="remove" className="delete-btn" aria-label={`Delete transfer from ${name(transfer.fromAccountId)} to ${name(transfer.toAccountId)}`} onClick={() => onDelete(transfer.id, 'transfer')}>Delete</ActionButton></div>
  </div>
}
