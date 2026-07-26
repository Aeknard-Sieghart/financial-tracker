import { useState, useEffect, useCallback } from 'react'
import Summary from './components/Summary'
import TransactionList from './components/TransactionList'
import Charts from './components/Charts'
import PeriodFilter from './components/PeriodFilter'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import BudgetStatus from './components/BudgetStatus'
import Sidebar from './components/Sidebar'
import { filterByPeriod } from './utils/filterByPeriod'
import { sortTransactions } from './utils/sortTransactions'
import { useToast } from './hooks/useToast'
import './App.css'

// Get current month in YYYY-MM format
function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function App() {
  // Load transactions from localStorage or start with empty array
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
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

  // Load period filter preference from localStorage or default to all time
  const [period, setPeriod] = useState(() => {
    const saved = localStorage.getItem('period')
    return saved ? JSON.parse(saved) : { type: 'all' }
  })

  // Sort state for transaction list (default: newest first)
  const [sortBy, setSortBy] = useState('date-desc')

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    transactionId: null,
  })

  // Toast notification system
  const { toasts, addToast, removeToast } = useToast()

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

  // Update period filter and save preference to localStorage
  function handlePeriodChange(newPeriod) {
    setPeriod(newPeriod)
    localStorage.setItem('period', JSON.stringify(newPeriod))
  }

  // Update budgets and show toast
  function handleBudgetUpdate(newBudgets) {
    setBudgets(newBudgets)
    addToast('Budgets saved!')
  }

  // Memoized removeToast to prevent re-renders
  const handleRemoveToast = useCallback((id) => {
    removeToast(id)
  }, [removeToast])

  // Transactions filtered by period (used by Summary and Charts)
  const periodTransactions = filterByPeriod(transactions, period)

  // Transactions filtered by search/type/category then sorted
  const filteredTransactions = sortTransactions(
    transactions.filter((t) => {
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

  // Get all unique categories from existing transactions
  const allCategories = [...new Set(transactions.map((t) => t.category))].sort()

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

      {/* Sidebar — Add Transaction + Budget Manager */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAdd={(t) => { addTransaction(t); setSidebarOpen(false) }}
        onUpdate={updateTransaction}
        editingTransaction={editingTransaction}
        onCancelEdit={handleCancelEdit}
        budgets={budgets}
        onBudgetUpdate={handleBudgetUpdate}
      />

      {/* Header */}
      <div className="app-header">
        <div className="app-header-left">
          {/* Hamburger menu button */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            title="Open menu"
          >
            <span /><span /><span />
          </button>
          <h1>Financial Tracker</h1>
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
      <div className="main-content">

        {/* Period filter */}
        <PeriodFilter
          period={period}
          onChange={handlePeriodChange}
          transactions={transactions}
        />

        {/* Summary cards */}
        <Summary transactions={periodTransactions} />

        {/* Budget status */}
        <BudgetStatus transactions={transactions} budgets={budgets} />

        {/* Overview charts */}
        <Charts transactions={periodTransactions} />

        {/* Transaction list with filter inside */}
        <TransactionList
          transactions={filteredTransactions}
          allTransactions={transactions}
          onDelete={handleDeleteClick}
          onEdit={handleEdit}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filters={filters}
          onFilterChange={handleFilterChange}
          allCategories={allCategories}
        />

      </div>
    </div>
  )
}

export default App