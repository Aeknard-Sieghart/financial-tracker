import ActionButton from './ActionButton'
import CategoryIcon from './CategoryIcon'
import { findCategory } from '../hooks/useCategories'

function TransactionItem({ transaction, onDelete, onEdit, categories, accounts = [] }) {
  const formatAmount = (num) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const category = findCategory(categories, transaction.type, transaction.category)

  return (
    <div className="transaction-item">
      <div className="transaction-main">
        <CategoryIcon category={category} size={38} radius={10} />
        <div className="transaction-info">
          <p className="description">{transaction.description || transaction.category}</p>
          <p className="category">{transaction.category} · {accounts.find(a => a.id === (transaction.accountId || 'unassigned'))?.name || 'Unassigned'}</p>
          <p className="date">{transaction.date}</p>
        </div>
      </div>
      <div className="transaction-amount">
        <span className={transaction.type}>
          {transaction.type === 'income' ? '+' : '-'}₱{formatAmount(transaction.amount)}
        </span>
      </div>
      <div className="transaction-actions">
        {!transaction.debtPaymentId && <ActionButton icon="edit"
          className="edit-btn"
          onClick={() => onEdit(transaction)}
        >
          Edit
        </ActionButton>}
        <ActionButton icon="remove"
          className="delete-btn"
          onClick={() => onDelete(transaction.id)}
        >
          Delete
        </ActionButton>
      </div>
    </div>
  )
}

export default TransactionItem
