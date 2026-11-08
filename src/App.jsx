import { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardSnapshot from './components/DashboardSnapshot'
import ThemeControl from './components/ThemeControl'
import LineInsights from './components/LineInsights'
import SavingsGoals from './components/SavingsGoals'
import Debts from './components/Debts'
import IncomePlanner from './components/IncomePlanner'
import SafeToSpend from './components/SafeToSpend'
import { incomeOccurrences, incomeReceipt } from './utils/incomePlans'
import { debtReminders } from './utils/debts'
import { providerFor } from './constants/billProviders'
import BillReminders from './components/BillReminders'
import { billReminders } from './utils/billReminders'
import { useToday } from './hooks/useToday'
import TransactionList from './components/TransactionList'
import Charts from './components/Charts'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import BudgetStatus from './components/BudgetStatus'
import Sidebar from './components/Sidebar'
import DataBackup from './components/DataBackup'
import CloudSync from './components/CloudSync'
import { financialSnapshot } from './utils/cloudSnapshot'
import Bills from './components/Bills'
import Accounts from './components/Accounts'
import DashboardLayout from './components/DashboardLayout'
import { useStoredState } from './hooks/useStoredState'
import { UNASSIGNED_ACCOUNT } from './utils/accounts'
import { applyRecurring } from './utils/recurring'
import PeriodDatePicker from './components/PeriodDatePicker'
import { localMonth } from './utils/bills'
import { activityEntries, EMPTY_ACTIVITY_FILTERS } from './utils/activity'
import { useToast } from './hooks/useToast'
import {
  useCategories,
  DEFAULT_CATEGORIES,
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
  const today = useToday()
  const [reminderMonth, setReminderMonth] = useState(() => ({ month: localMonth(), version: 0 }))
  const [accounts, setAccounts] = useStoredState('accounts', [UNASSIGNED_ACCOUNT])
  const [goals, setGoals] = useStoredState('savingsGoals', [])
  const [debts, setDebts] = useStoredState('debts', [])
  const [incomePlans, setIncomePlans] = useStoredState('incomePlans', [])
  const [spendingBuffer, setSpendingBuffer] = useStoredState('spendingBuffer', 0)
  const [balanceHidden, setBalanceHidden] = useStoredState('netBalanceHidden', false)
  const receiveIncome = receipt => {
    const entry = incomeReceipt(receipt.occurrence, receipt.amount, receipt.accountId, receipt.date)
    setTransactions(prev => prev.some(t => t.id === entry.id || (t.type === 'income' && t.incomePlanId === entry.incomePlanId && t.incomeDueDate === entry.incomeDueDate)) ? prev : [entry, ...prev])
    addToast('Income received and recorded.')
  }
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

  const [cloudEpoch, setCloudEpoch] = useState(0)
  const cloudSnapshot = useMemo(() => financialSnapshot({ transactions, accounts, transfers, budgets, categories, bills, debts, schedules, goals, incomePlans, spendingBuffer }), [transactions, accounts, transfers, budgets, categories, bills, debts, schedules, goals, incomePlans, spendingBuffer])
  const applyCloudSnapshot = useCallback(data => {
    setTransactions(data.transactions); setAccounts(data.accounts); setTransfers(data.transfers)
    setBudgets(data.budgets); setCategories(data.categories); setBills(data.bills)
    setDebts(data.debts); setSchedules(data.schedules); setGoals(data.goals)
    setIncomePlans(data.incomePlans); setSpendingBuffer(data.spendingBuffer)
  }, [setAccounts, setTransfers, setCategories, setBills, setDebts, setGoals, setIncomePlans, setSpendingBuffer])

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
  function handleDeleteClick(id, type = 'transaction') {
    setConfirmDialog({ isOpen: true, transactionId: id, type })
  }

  // Confirmed delete — remove transaction and show toast
  function handleConfirmDelete() {
    const entry = transactions.find(t => t.id === confirmDialog.transactionId)
    if (confirmDialog.type !== 'transfer' && entry?.debtPaymentId) {
      setTransactions(prev => prev.filter(t => t.debtPaymentId !== entry.debtPaymentId))
      setConfirmDialog({ isOpen: false, transactionId: null })
      addToast('Repayment reversed. Principal and fee entries removed.', 'warning')
      return
    }
    if (confirmDialog.type === 'transfer') {
      setTransfers(prev => prev.filter(t => t.id !== confirmDialog.transactionId))
      setConfirmDialog({ isOpen: false, transactionId: null })
      addToast('Transfer deleted. Account balances updated.', 'warning')
      return
    }
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
    if (newFilters.fromDate || newFilters.toDate) setActivityMonth('all')
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
  const reminders = [...billReminders(bills, transactions, new Date(`${today}T12:00:00`)), ...debtReminders(debts, transactions, today)].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  // Transactions filtered by search/type/category then sorted
  const filteredTransactions = activityEntries(transactions, transfers, accounts, activityMonth, filters, sortBy)

  // Filter dropdown options: every defined category, plus any legacy name
  // still attached to a transaction
  const allCategories = [
    ...new Set([
      ...allCategoryNames(categories),
      ...transactions.map((t) => t.category),
      ...(transfers.length ? ['Transfer'] : []),
    ]),
  ].sort()

  return (
    <div>
      {/* Toast notifications — fixed top right */}
      <Toast toasts={toasts} onRemove={handleRemoveToast} />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.type === 'transfer' ? 'Delete this transfer? Both account balances will be recalculated.' : transactions.find(t => t.id === confirmDialog.transactionId)?.debtPaymentId ? 'Reverse this debt repayment? Both principal and fee entries will be deleted and the debt balance restored.' : 'Are you sure you want to delete this transaction? This cannot be undone.'}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Sidebar — Add Transaction + Budgets + Categories */}
      <Sidebar incomePlans={incomePlans} onIncomePlansChange={setIncomePlans} onIncomeReceive={receiveIncome} today={today}
        debts={debts}
        onDebtsChange={setDebts}
        onDebtRepay={entries => { setTransactions(prev => [...entries, ...prev]); addToast('Repayment recorded.') }}
        goals={goals}
        onGoalsChange={setGoals}
        transfers={transfers}
        onAccountsChange={setAccounts}
        onTransfersChange={setTransfers}
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
        <ThemeControl darkMode={darkMode} onChange={setDarkMode} />
      </div>

      {/* Main content */}
      <DashboardLayout
        safeToSpend={<SafeToSpend accounts={accounts} transactions={transactions} transfers={transfers} bills={bills} debts={debts} goals={goals} today={today} nextPayday={incomeOccurrences(incomePlans, transactions, today).find(o => o.date >= today)?.date} buffer={spendingBuffer} onBufferChange={setSpendingBuffer} hidden={balanceHidden} />}
        income={<IncomePlanner plans={incomePlans} transactions={transactions} accounts={accounts} categories={categories} bills={bills} debts={debts} today={today} onChange={setIncomePlans} onReceive={receiveIncome} />}
        debts={<Debts debts={debts} transactions={transactions} accounts={accounts} transfers={transfers} onChange={setDebts} onRepay={entries => { setTransactions(prev => [...entries, ...prev]); addToast('Repayment recorded.') }} />}
        goals={<SavingsGoals goals={goals} accounts={accounts} transactions={transactions} transfers={transfers} onChange={setGoals} />}
        reminders={reminders.length > 0 ? <BillReminders reminders={reminders} today={today} onView={month => setReminderMonth(prev => ({ month, version: prev.version + 1 }))} /> : null}
        trends={<LineInsights transactions={transactions} accounts={accounts} categories={categories} />}
        onManage={() => { setEditingTransaction(null); setSidebarOpen(true) }}
        snapshot={<DashboardSnapshot balanceHidden={balanceHidden} onBalanceHiddenChange={setBalanceHidden} nextIncome={incomeOccurrences(incomePlans, transactions, today).find(o => o.date >= today)} accounts={accounts} transactions={transactions} transfers={transfers} bills={bills} reminders={reminders} />}
        monthControl={<div className="activity-toolbar"><div><p className="dashboard-eyebrow">ACCOUNT ACTIVITY</p><h2>Recent activity</h2></div><div className="activity-month-controls"><select aria-label="Activity period" value={activityMonth === 'all' ? 'all' : activityMonth === localMonth() ? 'current' : 'custom'} onChange={e => { setActivityMonth(e.target.value === 'all' ? 'all' : localMonth()); setFilters(prev => ({ ...prev, fromDate: '', toDate: '' })) }}><option value="current">This month</option><option value="custom">Choose month</option><option value="all">All time</option></select>{activityMonth !== 'all' && <PeriodDatePicker type="month" value={activityMonth} onChange={e => { setActivityMonth(e.target.value); setFilters(prev => ({ ...prev, fromDate: '', toDate: '' })) }} />}</div></div>}
        accounts={<Accounts accountReferences={[...incomePlans.map(p => p.accountId), ...goals.map(g => g.accountId), ...schedules.map(s => s.accountId)]} accounts={accounts} transfers={transfers} transactions={transactions} onAccountsChange={setAccounts} onTransfersChange={setTransfers} />}
        bills={<Bills key={reminderMonth.version} initialMonth={reminderMonth.month} accounts={accounts} bills={bills} transactions={transactions} categories={categories} onChange={setBills} onPayment={addTransaction} onMoveToDebt={(bill, state) => { setDebts(prev => [...prev, { id: crypto.randomUUID(), name: bill.name, provider: providerFor(bill)?.id === 'tala' ? 'tala' : 'spaylater', openingPrincipal: state.remaining, dueDate: state.dueDate }]); setBills(prev => prev.filter(b => b.id !== bill.id)); addToast('Moved to Debt. Earlier transactions preserved.') }} />}
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
        <><CloudSync key={cloudEpoch} snapshot={cloudSnapshot} onApply={applyCloudSnapshot} />
        <DataBackup spendingBuffer={spendingBuffer} incomePlans={incomePlans} debts={debts} goals={goals} accounts={accounts} transfers={transfers} transactions={transactions} budgets={budgets} categories={categories} bills={bills} schedules={schedules} onRestore={(backup) => {
          if (backup.spendingBuffer !== undefined) setSpendingBuffer(backup.spendingBuffer)
          else if (backup.accounts) setSpendingBuffer(0)
          if (backup.incomePlans) setIncomePlans(backup.incomePlans)
          else if (backup.accounts) setIncomePlans([])
          if (backup.debts) setDebts(backup.debts)
          else if (backup.accounts) setDebts([])
          if (backup.goals) setGoals(backup.goals)
          else if (backup.accounts) setGoals([])
          if (backup.accounts) { setAccounts(backup.accounts); setTransfers(backup.transfers) }
          if (backup.schedules) setSchedules(backup.schedules)
          if (backup.bills) setBills(backup.bills)
          setTransactions(backup.transactions)
          if (backup.budgets) setBudgets(backup.budgets)
          if (backup.categories) setCategories(backup.categories)
          setFilters({ ...EMPTY_ACTIVITY_FILTERS })
          setEditingTransaction(null)
          addToast('Backup restored successfully!')
        }} onClear={() => {
          setCloudEpoch(prev => prev + 1)
          setTransactions([])
          setSchedules([])
          setIncomePlans([])
          setSpendingBuffer(0)
          setBills([])
          setDebts([])
          setGoals([])
          setTransfers([])
          setAccounts([{ ...UNASSIGNED_ACCOUNT }])
          setBudgets({})
          setCategories(structuredClone(DEFAULT_CATEGORIES))
          setFilters({ searchQuery: '', type: '', category: '' })
          setEditingTransaction(null)
          setActivityMonth(localMonth())
          setReminderMonth(prev => ({ month: localMonth(), version: prev.version + 1 }))
          setConfirmDialog({ isOpen: false, transactionId: null })
          addToast('All financial data cleared.')
        }} /></>
        }
      />
    </div>
  )
}

export default App
