import CategoryIcon from './CategoryIcon'
import { findCategory } from '../hooks/useCategories'

function TransactionItem({ transaction, onDelete, onEdit, categories }) {
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
          <p className="category">{transaction.category}</p>
          <p className="date">{transaction.date}</p>
        </div>
      </div>
      <div className="transaction-amount">
        <span className={transaction.type}>
          {transaction.type === 'income' ? '+' : '-'}₱{formatAmount(transaction.amount)}
        </span>
      </div>
      <div className="transaction-actions">
        <button
          className="edit-btn"
          onClick={() => onEdit(transaction)}
        >
          Edit
        </button>
        <button
          className="delete-btn"
          onClick={() => onDelete(transaction.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default TransactionItem