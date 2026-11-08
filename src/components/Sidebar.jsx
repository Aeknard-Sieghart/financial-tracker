import ActionButton, { ActionIcon } from './ActionButton'
import { useEffect, useRef, useState } from 'react'
import TransactionForm from './TransactionForm'
import BudgetManager from './BudgetManager'
import CategoryManager from './CategoryManager'
import Bills from './Bills'
import RecurringManager from './RecurringManager'
import Accounts from './Accounts'
import SavingsGoals from './SavingsGoals'
import Debts from './Debts'
import IncomePlanner from './IncomePlanner'

function Sidebar({
  isOpen, incomePlans, onIncomePlansChange, onIncomeReceive, today,
  debts,
  onDebtsChange,
  onDebtRepay,
  goals,
  onGoalsChange,
  accounts,
  transfers,
  onAccountsChange,
  onTransfersChange,
  schedules,
  onSchedulesChange,
  bills,
  onBillsChange,
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
  const titles = { transaction: 'Add transaction', budgets: 'Monthly budgets', categories: 'Categories', bills: 'Add bill', recurring: 'Recurring transactions', accounts: 'Add account' }

  return (
    <>
      {/* Backdrop overlay — clicking it closes the sidebar */}

      {/* Sidebar panel */}
      <dialog ref={dialog} className="workspace-modal" onCancel={close} onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div className="workspace-modal-inner">

        {/* Sidebar header */}
        <div className="sidebar-header">
          <h2>{editingTransaction ? 'Edit transaction' : active === 'income' ? 'Add scheduled income' : active === 'debts' ? 'Add debt' : active === 'goals' ? 'Add savings goal' : titles[active] || 'Workspace menu'}</h2>
          <button className="sidebar-close" onClick={close} title="Close menu">
            ✕
          </button>
        </div>

        {/* Sidebar content — scrollable */}
        <div className="sidebar-content">
          {!active && <nav className="workspace-menu" aria-label="Workspace">
            <p>Manage your finances</p>
            {Object.entries(titles).map(([id, title], index) => <button key={id} onClick={() => setSelected(id)}><span className="menu-symbol"><ActionIcon name={['add', 'pay', 'palette', 'add', 'restore', 'add'][index]} /></span><span><strong>{title}</strong><small>{['Record income or an expense', 'Plan your spending limits', 'Organize income and expenses', 'Set an amount and monthly due date', 'Automatically record monthly entries', 'Set up a bank, cash, or e-wallet account'][index]}</small></span><span aria-hidden="true">›</span></button>)}
            <button onClick={() => setSelected('income')}><span className="menu-symbol"><ActionIcon name="add" /></span><span><strong>Scheduled income</strong><small>Plan paydays and confirm received income</small></span><span aria-hidden="true">›</span></button>
            <button onClick={() => setSelected('goals')}><span className="menu-symbol"><ActionIcon name="add" /></span><span><strong>Add savings goal</strong><small>Save toward a purchase or personal target</small></span><span aria-hidden="true">›</span></button>
            <button onClick={() => setSelected('debts')}><span className="menu-symbol"><ActionIcon name="pay" /></span><span><strong>Add debt</strong><small>Track loans, credit, and repayments</small></span><span aria-hidden="true">›</span></button>
          </nav>}
          {active && !editingTransaction && <ActionButton icon="back" className="menu-back" onClick={() => setSelected(null)}>Back to menu</ActionButton>}

          {/* Add / Edit Transaction Form */}
          {active === 'transaction' && <TransactionForm
            accounts={accounts}
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
          {active === 'income' && <IncomePlanner editorOnly plans={incomePlans} transactions={transactions} accounts={accounts} categories={categories} bills={bills} debts={debts} today={today} onChange={onIncomePlansChange} onReceive={onIncomeReceive} onDone={close} />}
          {active === 'debts' && <Debts editorOnly debts={debts} transactions={transactions} accounts={accounts} transfers={transfers} onChange={onDebtsChange} onRepay={onDebtRepay} onDone={close} />}
          {active === 'goals' && <SavingsGoals editorOnly goals={goals} accounts={accounts} transactions={transactions} transfers={transfers} onChange={onGoalsChange} onDone={close} />}
          {active === 'accounts' && <Accounts editorOnly accounts={accounts} transactions={transactions} transfers={transfers} onAccountsChange={onAccountsChange} onTransfersChange={onTransfersChange} onDone={close} />}
          {active === 'recurring' && <RecurringManager accounts={accounts} schedules={schedules} categories={categories} onChange={onSchedulesChange} />}
          {active === 'bills' && <Bills editorOnly bills={bills} transactions={transactions} categories={categories} onChange={onBillsChange} onDone={close} />}
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
