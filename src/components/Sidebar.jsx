import { useEffect, useRef, useState } from 'react'
import TransactionForm from './TransactionForm'
import BudgetManager from './BudgetManager'
import CategoryManager from './CategoryManager'

function Sidebar({
  isOpen,
  payCategory,
  payAmount,
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
  const [selected, setSelected] = useState(null)
  const dialog = useRef(null)
  const active = editingTransaction || payCategory ? 'transaction' : selected
  const close = () => { setSelected(null); onCancelEdit(); onClose() }
  useEffect(() => {
    if (isOpen) dialog.current.showModal()
    else dialog.current.close()
  }, [isOpen])
  const titles = { transaction: 'Add transaction', budgets: 'Monthly budgets', categories: 'Categories' }

  return (
    <>
      {/* Backdrop overlay — clicking it closes the sidebar */}

      {/* Sidebar panel */}
      <dialog ref={dialog} className="workspace-modal" onCancel={close} onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div className="workspace-modal-inner">

        {/* Sidebar header */}
        <div className="sidebar-header">
          <h2>{editingTransaction ? 'Edit transaction' : titles[active] || 'Workspace menu'}</h2>
          <button className="sidebar-close" onClick={close} title="Close menu">
            ✕
          </button>
        </div>

        {/* Sidebar content — scrollable */}
        <div className="sidebar-content">
          {!active && <nav className="workspace-menu" aria-label="Workspace">
            <p>Manage your finances</p>
            {Object.entries(titles).map(([id, title], index) => <button key={id} onClick={() => setSelected(id)}><span className="menu-symbol">{['+', '₱', '▦'][index]}</span><span><strong>{title}</strong><small>{['Record income or an expense', 'Plan your spending limits', 'Organize income and expenses'][index]}</small></span><span aria-hidden="true">›</span></button>)}
          </nav>}
          {active && !editingTransaction && <button className="menu-back" onClick={() => setSelected(null)}>← Back to menu</button>}

          {/* Add / Edit Transaction Form */}
          {active === 'transaction' && <TransactionForm
            key={editingTransaction ? editingTransaction.id : payCategory || 'new'}
            initialCategory={payCategory}
            initialAmount={payAmount}
            onAdd={onAdd}
            onUpdate={onUpdate}
            editingTransaction={editingTransaction}
            onCancelEdit={onCancelEdit}
            categories={categories}
          />}

          {/* Budget Manager */}
          {active === 'budgets' && <BudgetManager
            key={budgetKey}
            budgets={budgets}
            onUpdate={onBudgetUpdate}
            categories={categories}
          />}

          {/* Category Manager */}
          {active === 'categories' && <CategoryManager
            categories={categories}
            transactions={transactions}
            onAdd={onCategoryAdd}
            onEdit={onCategoryEdit}
            onDelete={onCategoryDelete}
          />}

        </div>
      </div>
      </dialog>
    </>
  )
}

export default Sidebar
