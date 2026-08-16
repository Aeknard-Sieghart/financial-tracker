import TransactionForm from './TransactionForm'
import BudgetManager from './BudgetManager'
import CategoryManager from './CategoryManager'

function Sidebar({
  isOpen,
  onClose,
  // TransactionForm props
  onAdd,
  onUpdate,
  editingTransaction,
  onCancelEdit,
  // BudgetManager props
  budgets,
  onBudgetUpdate,
  // CategoryManager props
  categories,
  transactions,
  onCategoryAdd,
  onCategoryEdit,
  onCategoryDelete,
}) {
  // Remount BudgetManager when the expense category names change, so its
  // internal cents state always matches the categories on screen.
  const budgetKey = (categories.expense || []).map((c) => c.name).join('|')

  return (
    <>
      {/* Backdrop overlay — clicking it closes the sidebar */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar panel */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>

        {/* Sidebar header */}
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="sidebar-close" onClick={onClose} title="Close menu">
            ✕
          </button>
        </div>

        {/* Sidebar content — scrollable */}
        <div className="sidebar-content">

          {/* Add / Edit Transaction Form */}
          <TransactionForm
            key={editingTransaction ? editingTransaction.id : 'new'}
            onAdd={onAdd}
            onUpdate={onUpdate}
            editingTransaction={editingTransaction}
            onCancelEdit={onCancelEdit}
            categories={categories}
          />

          {/* Budget Manager */}
          <BudgetManager
            key={budgetKey}
            budgets={budgets}
            onUpdate={onBudgetUpdate}
            categories={categories}
          />

          {/* Category Manager */}
          <CategoryManager
            categories={categories}
            transactions={transactions}
            onAdd={onCategoryAdd}
            onEdit={onCategoryEdit}
            onDelete={onCategoryDelete}
          />

        </div>
      </div>
    </>
  )
}

export default Sidebar