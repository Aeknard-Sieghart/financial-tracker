import { useState, useEffect } from 'react'
import Summary from './components/Summary'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import TransactionFilter from './components/TransactionFilter'
import Charts from './components/Charts'
import './App.css'

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

  // Track which transaction is being edited (null means add mode)
  const [editingTransaction, setEditingTransaction] = useState(null)

  // Filter state - search query, type filter, and category filter
  const [filters, setFilters] = useState({
    searchQuery: '',
    type: '',
    category: '',
  })

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

  // Filter transactions based on active filters
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(filters.searchQuery.toLowerCase())
    const matchesType = filters.type === '' || t.type === filters.type
    const matchesCategory = filters.category === '' || t.category === filters.category
    return matchesSearch && matchesType && matchesCategory
  })

  // Get all unique categories from existing transactions
  const allCategories = [...new Set(transactions.map((t) => t.category))].sort()

  // Add a new transaction to the top of the list
  function addTransaction(newTransaction) {
    setTransactions([newTransaction, ...transactions])
  }

  // Update an existing transaction by ID
  function updateTransaction(id, updatedData) {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, ...updatedData } : t
      )
    )
  }

  // Remove a transaction by ID
  function deleteTransaction(id) {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  // Set a transaction into edit mode and scroll to the form
  function handleEdit(transaction) {
    setEditingTransaction(transaction)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Exit edit mode
  function handleCancelEdit() {
    setEditingTransaction(null)
  }

  // Merge new filter values into existing filter state
  function handleFilterChange(newFilters) {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  return (
    <div>
      {/* Header: app title and dark mode toggle */}
      <div className="app-header">
        <h1>Financial Tracker</h1>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle dark mode"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Summary cards: balance, income, expenses */}
      <Summary transactions={transactions} />

      {/* Charts: pie (expenses by category) + bar (monthly income vs expenses) */}
      <Charts transactions={transactions} />

      {/* Add / Edit transaction form */}
      <TransactionForm
        key={editingTransaction ? editingTransaction.id : 'new'}
        onAdd={addTransaction}
        onUpdate={updateTransaction}
        editingTransaction={editingTransaction}
        onCancelEdit={handleCancelEdit}
      />

      {/* Filter controls */}
      <TransactionFilter
        onFilterChange={handleFilterChange}
        categories={allCategories}
        selectedCategory={filters.category}
        selectedType={filters.type}
        searchQuery={filters.searchQuery}
      />

      {/* Filtered transaction list */}
      <TransactionList
        transactions={filteredTransactions}
        allTransactions={transactions}
        onDelete={deleteTransaction}
        onEdit={handleEdit}
      />
    </div>
  )
}

export default App