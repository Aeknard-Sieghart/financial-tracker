import TransactionForm from './TransactionForm'
import BudgetManager from './BudgetManager'

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
}) {
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
          />

          {/* Budget Manager */}
          <BudgetManager budgets={budgets} onUpdate={onBudgetUpdate} />

        </div>
      </div>
    </>
  )
}

export default Sidebar