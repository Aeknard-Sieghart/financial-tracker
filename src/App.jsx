import { useState, useEffect, useCallback } from 'react'
import DashboardSnapshot from './components/DashboardSnapshot'
import TransactionList from './components/TransactionList'
import Charts from './components/Charts'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import BudgetStatus from './components/BudgetStatus'
import Sidebar from './components/Sidebar'
import DataBackup from './components/DataBackup'
import Bills from './components/Bills'
import Accounts from './components/Accounts'
import DashboardLayout from './components/DashboardLayout'
import { useStoredState } from './hooks/useStoredState'
import { UNASSIGNED_ACCOUNT } from './utils/accounts'
import { applyRecurring } from './utils/recurring'
import PeriodDatePicker from './components/PeriodDatePicker'
import { localMonth } from './utils/bills'
import { sortTransactions } from './utils/sortTransactions'
import { useToast } from './hooks/useToast'
import {
  useCategories,
  makeCategoryId,
  allCategoryNames,
  FALLBACK_NAME,
} from './hooks/useCategories'
import './App.css'
import './styles/categories.css'
import './styles/refined.css'
import './styles/dashboard.css'
import './styles/controls.css'

// Get current month in YYYY-MM format
function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function App() {
  const [accounts, setAccounts] = useStoredState('accounts', [UNASSIGNED_ACCOUNT])
  const [transfers, setTransfers] = useStoredState('transfers', [])
  const [initialRecurring] = useState(() => applyRecurring(JSON.parse(localStorage.getItem('transactions') || '[]'), JSON.parse(localStorage.getItem('recurring') || '[]')))
  const [schedules, setSchedules] = useState(initialRecurring.schedules)
  useEffect(() => { localStorage.setItem('recurring', JSON.stringify(schedules)) }, [schedules])
  const [bills, setBills] = useStoredState('bills', [])
  // Load transactions from localStorage or start with empty array
  const [transactions, setTransactions] = useState(() => {
    return initialRecurring.transactions
  })

  // Load dark mode preference from localStorage or default to false
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Load budgets from localStorage or start with empty object
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets')
    return saved ? JSON.parse(saved) : {}
  })

  // Categories (name + color + icon), persisted to localStorage by the hook
  const { categories, setCategories } = useCategories()

  // Track which transaction is being edited (null means add mode)
  const [editingTransaction, setEditingTransaction] = useState(null)

  // Sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter state for transaction list (search, type, category)
  const [filters, setFilters] = useState({
    searchQuery: '',
    type: '',
    category: '',
  })

  const [activityMonth, setActivityMonth] = useStoredState('activityMonth', localMonth())

  // Sort state for transaction list (default: newest first)
  const [sortBy, setSortBy] = useState('date-desc')

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    transactionId: null,
  })

  // Toast notification system
  const { toasts, addToast, removeToast } = useToast()
  function updateSchedules(next) {
    const current = applyRecurring(transactions, schedules)
    const result = applyRecurring(current.transactions, next.map(rule => ({ ...rule, processedThrough: current.schedules.find(r => r.id === rule.id)?.processedThrough || rule.processedThrough })))
    setTransactions(result.transactions)
    setSchedules(result.schedules)
  }
  useEffect(() => {
    const catchUp = () => {
      const result = applyRecurring(transactions, schedules)
      if (JSON.stringify(result.schedules) !== JSON.stringify(schedules) || result.transactions.length !== transactions.length) {
        setTransactions(result.transactions)
        setSchedules(result.schedules)
      }
    }
    window.addEventListener('focus', catchUp)
    const interval = window.setInterval(catchUp, 60000)
    return () => { window.removeEventListener('focus', catchUp); window.clearInterval(interval) }
  }, [transactions, schedules])

  // Apply dark or light theme to the document
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Save all transactions to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  // Save budgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  // Check if a new expense transaction exceeds or nears its category budget
  function checkBudgetWarning(newTransaction) {
    if (newTransaction.type !== 'expense') return
    if (newTransaction.date.slice(0, 7) !== getCurrentMonth()) return

    const category = newTransaction.category
    const limit = budgets[category]
    if (!limit) return

    const currentSpent = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === category &&
          t.date.slice(0, 7) === getCurrentMonth()
      )
      .reduce((sum, t) => sum + t.amount, 0)

    const newTotal = currentSpent + newTransaction.amount

    if (newTotal > limit) {
      addToast(
        `⚠ Over budget for ${category}! ₱${newTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ₱${limit.toLocaleString('en-US', { minimumFractionDigits: 2 })} limit.`,
        'error'
      )
    } else if (newTotal / limit >= 0.8) {
      addToast(
        `Almost at budget limit for ${category}! ₱${newTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ₱${limit.toLocaleString('en-US', { minimumFractionDigits: 2 })} used.`,
        'warning'
      )
    }
  }

  // Add a new transaction and check budget warnings
  function addTransaction(newTransaction) {
    setTransactions([newTransaction, ...transactions])
    checkBudgetWarning(newTransaction)
    addToast('Transaction added successfully!')
  }

  // Update an existing transaction by ID
  function updateTransaction(id, updatedData) {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, ...updatedData } : t
      )
    )
    addToast('Transaction updated successfully!')
    setSidebarOpen(false)
  }

  // Show confirm dialog before deleting
  function handleDeleteClick(id) {
    setConfirmDialog({ isOpen: true, transactionId: id })
  }

  // Confirmed delete — remove transaction and show toast
  function handleConfirmDelete() {
    setTransactions(
      transactions.filter((t) => t.id !== confirmDialog.transactionId)
    )
    setConfirmDialog({ isOpen: false, transactionId: null })
    addToast('Transaction deleted.', 'warning')
  }

  // Cancel delete — close dialog without deleting
  function handleCancelDelete() {
    setConfirmDialog({ isOpen: false, transactionId: null })
  }

  // Open sidebar and set transaction into edit mode
  function handleEdit(transaction) {
    setEditingTransaction(transaction)
    setSidebarOpen(true)
    setTimeout(() => {
      const formElement = document.querySelector('.transaction-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }

  // Exit edit mode
  function handleCancelEdit() {
    setEditingTransaction(null)
  }

  // Merge new filter values into existing filter state
  function handleFilterChange(newFilters) {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }


  // Update budgets and show toast
  function handleBudgetUpdate(newBudgets) {
    setBudgets(newBudgets)
    addToast('Budgets saved!')
  }

  // ── CATEGORY HANDLERS ─────────────────────────────────────────────

  // Add a new category to the given type
  function handleCategoryAdd(categoryType, draft) {
    setCategories((prev) => ({
      ...prev,
      [categoryType]: [...prev[categoryType], { id: makeCategoryId(), ...draft, builtin: false }],
    }))
    addToast(`Category "${draft.name}" added!`)
  }

  // Edit a category — a rename has to follow through everywhere it's referenced
  function handleCategoryEdit(type, id, draft) {
    const previous = categories[type].find((c) => c.id === id)

    setCategories((prev) => ({
      ...prev,
      [type]: prev[type].map((c) => (c.id === id ? { ...c, ...draft } : c)),
    }))
    if (previous && previous.name !== draft.name) {
      setSchedules(prev => prev.map(r => r.type === type && r.category === previous.name ? { ...r, category: draft.name } : r))
      if (type === 'expense') setBills(prev => prev.map(b => b.category === previous.name ? { ...b, category: draft.name } : b))
      // Re-tag every transaction that used the old name
      setTransactions((prev) =>
        prev.map((t) =>
          t.type === type && t.category === previous.name
            ? { ...t, category: draft.name }
            : t
        )
      )

      // Budgets are keyed by category name, so move the limit across
      if (type === 'expense' && budgets[previous.name] !== undefined) {
        setBudgets((prev) => {
          const newBudgets = { ...prev }
          newBudgets[draft.name] = newBudgets[previous.name]
          delete newBudgets[previous.name]
          return newBudgets
        })
      }

      // Keep the transaction filter pointing at the same category
      setFilters((prev) =>
        prev.category === previous.name ? { ...prev, category: draft.name } : prev
      )
    }

    addToast('Category updated!')
  }

  // Delete a category — its transactions fall back to "Other"
  function handleCategoryDelete(type, category) {
    setSchedules(prev => prev.map(r => r.type === type && r.category === category.name ? { ...r, category: FALLBACK_NAME } : r))
    if (type === 'expense') setBills(prev => prev.map(b => b.category === category.name ? { ...b, category: FALLBACK_NAME } : b))

    setCategories((prev) => ({
      ...prev,    
      [type]: prev[type].filter((c) => c.id !== category.id),
    }))

    setTransactions((prev) =>
      prev.map((t) =>
        t.type === type && t.category === category.name
          ? { ...t, category: FALLBACK_NAME }
          : t
      )
    )

    if (type === 'expense' && budgets[category.name] !== undefined) {
      setBudgets((prev) => {
        const newBudgets = { ...prev }
        delete newBudgets[category.name]
        return newBudgets
      })
    }

    setFilters((prev) =>
      prev.category === category.name ? { ...prev, category: '' } : prev
    )

    addToast(`Category "${category.name}" deleted.`, 'warning')
  }

  // Memoized removeToast to prevent re-renders
  const handleRemoveToast = useCallback((id) => {
    removeToast(id)
  }, [removeToast])

  // Transactions filtered by period (used by Summary and Charts)
  const periodTransactions = activityMonth === 'all' ? transactions : transactions.filter(t => t.date.slice(0, 7) === activityMonth)

  // Transactions filtered by search/type/category then sorted
  const filteredTransactions = sortTransactions(
    periodTransactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(filters.searchQuery.toLowerCase())
      const matchesType = filters.type === '' || t.type === filters.type
      const matchesCategory =
        filters.category === '' || t.category === filters.category
      return matchesSearch && matchesType && matchesCategory
    }),
    sortBy
  )

  // Filter dropdown options: every defined category, plus any legacy name
  // still attached to a transaction
  const allCategories = [
    ...new Set([
      ...allCategoryNames(categories),
      ...transactions.map((t) => t.category),
    ]),
  ].sort()

  return (
    <div>
      {/* Toast notifications — fixed top right */}
      <Toast toasts={toasts} onRemove={handleRemoveToast} />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message="Are you sure you want to delete this transaction? This cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Sidebar — Add Transaction + Budgets + Categories */}
      <Sidebar
        accounts={accounts}
        schedules={schedules}
        onSchedulesChange={updateSchedules}
        bills={bills}
        onBillsChange={setBills}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAdd={(t) => { addTransaction(t); setSidebarOpen(false) }}
        onUpdate={updateTransaction}
        editingTransaction={editingTransaction}
        onCancelEdit={handleCancelEdit}
        budgets={budgets}
        onBudgetUpdate={handleBudgetUpdate}
        categories={categories}
        transactions={transactions}
        onCategoryAdd={handleCategoryAdd}
        onCategoryEdit={handleCategoryEdit}
        onCategoryDelete={handleCategoryDelete}
      />

      {/* Header */}
      <div className="app-header">
        <div className="app-header-left">
          <div><p className="brand-eyebrow">PERSONAL FINANCE</p><h1>Financial Tracker</h1></div>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle dark mode"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Main content */}
      <DashboardLayout
        onManage={() => { setEditingTransaction(null); setSidebarOpen(true) }}
        snapshot={<DashboardSnapshot accounts={accounts} transactions={transactions} transfers={transfers} bills={bills} />}
        monthControl={<div className="activity-toolbar"><div><p className="dashboard-eyebrow">ACCOUNT ACTIVITY</p><h2>Recent transactions</h2></div><div className="activity-month-controls"><select aria-label="Activity period" value={activityMonth === 'all' ? 'all' : activityMonth === localMonth() ? 'current' : 'custom'} onChange={e => setActivityMonth(e.target.value === 'all' ? 'all' : localMonth())}><option value="current">This month</option><option value="custom">Choose month</option><option value="all">All time</option></select>{activityMonth !== 'all' && <PeriodDatePicker type="month" value={activityMonth} onChange={e => setActivityMonth(e.target.value)} />}</div></div>}
        accounts={<Accounts accounts={accounts} transfers={transfers} transactions={transactions} onAccountsChange={setAccounts} onTransfersChange={setTransfers} />}
        bills={<Bills accounts={accounts} bills={bills} transactions={transactions} categories={categories} onChange={setBills} onPayment={addTransaction} />}
        budgets={Object.values(budgets).some(value => value !== undefined) ?
        <BudgetStatus
          transactions={transactions}
          budgets={budgets}
          categories={categories}
        />
        : <div className="dashboard-empty"><h2>Spending budgets</h2><p>Set monthly category limits in Manage finances to track your spending here.</p></div>}
        charts={periodTransactions.length ? <Charts transactions={periodTransactions} categories={categories} /> : <div className="dashboard-empty"><h2>Overview</h2><p>Your income and expense charts will appear here once you add transactions for this period.</p></div>}
        transactions={
        <TransactionList
          accounts={accounts}
          transactions={filteredTransactions}
          allTransactions={transactions}
          onDelete={handleDeleteClick}
          onEdit={handleEdit}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filters={filters}
          onFilterChange={handleFilterChange}
          allCategories={allCategories}
          categories={categories}
        />
        }
        backup={
        <DataBackup accounts={accounts} transfers={transfers} transactions={transactions} budgets={budgets} categories={categories} bills={bills} schedules={schedules} onRestore={(backup) => {
          if (backup.accounts) { setAccounts(backup.accounts); setTransfers(backup.transfers) }
          if (backup.schedules) setSchedules(backup.schedules)
          if (backup.bills) setBills(backup.bills)
          setTransactions(backup.transactions)
          if (backup.budgets) setBudgets(backup.budgets)
          if (backup.categories) setCategories(backup.categories)
          setFilters({ searchQuery: '', type: '', category: '' })
          setEditingTransaction(null)
          addToast('Backup restored successfully!')
        }} />
        }
      />
    </div>
  )
}

export default App
