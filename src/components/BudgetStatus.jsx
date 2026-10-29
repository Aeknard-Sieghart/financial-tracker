import { useState } from 'react'
import CategoryIcon from './CategoryIcon'
import { findCategory } from '../hooks/useCategories'

// Format number with thousand separators
function formatAmount(num) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Get the current month in YYYY-MM format
function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function BudgetStatus({ transactions, budgets, categories, onPay }) {
  // Hidden by default
  const [isOpen, setIsOpen] = useState(false)

  // Only show if at least one budget is set
  const hasBudgets = Object.keys(budgets).some(
    (key) => budgets[key] !== undefined
  )
  if (!hasBudgets) return null

  // Get current month's expense transactions only
  const currentMonth = getCurrentMonth()
  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.slice(0, 7) === currentMonth
  )

  // Calculate total spent per category this month
  const spentByCategory = monthlyExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})

  // Only show categories that have a budget set
  const budgetedCategories = Object.keys(budgets).filter(
    (cat) => budgets[cat] !== undefined
  )

  // Count how many categories are over budget (for indicator dot)
  const overBudgetCount = budgetedCategories.filter((cat) => {
    const spent = spentByCategory[cat] || 0
    return spent > budgets[cat]
  }).length

  return (
    <div className="budget-status">

      {/* Toggle header */}
      <button
        className="filter-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="filter-toggle-left">
          <span className="filter-toggle-label">Budget Status</span>
          {/* Red dot if any category is over budget */}
          {overBudgetCount > 0 && (
            <span
              className="filter-active-dot over-budget-dot"
              title={`${overBudgetCount} category over budget`}
            />
          )}
        </span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="budget-status-content">
          <p className="budget-month">
            {new Date().toLocaleString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>

          <div className="budget-status-list">
            {budgetedCategories.map((category) => {
              const limit = budgets[category]
              const spent = spentByCategory[category] || 0
              const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
              const isOver = spent > limit
              const cat = findCategory(categories, 'expense', category)
              const isBill = /^(rent|wi-?fi|internet|utilities|electricity|water|phone|bills)$/i.test(category) || transactions.some((t) => t.category === category && t.budgetPayment)
              const paymentTotal = monthlyExpenses.filter((t) => t.category === category && t.budgetPayment).reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100
              // Recognize older bill entries, while keeping ordinary spending separate.
              const paid = isBill ? Math.max(paymentTotal, spent) : paymentTotal
              const remaining = Math.max(0, Math.round((limit - paid) * 100) / 100)
              const isPaid = isBill && limit > 0 && remaining === 0
              const isPartial = isBill && paid > 0 && !isPaid
              const isWarning = !isBill && percentage >= 80 && !isOver

              return (
                <div key={category} className="budget-status-item">
                  {/* Category name and amounts */}
                  <div className="budget-status-header">
                    <span className="budget-status-category">
                      <CategoryIcon
                        category={cat}
                        size={22}
                        radius={6}
                        strokeWidth={1.9}
                      />
                      {isOver && (
                        <span className="budget-icon over">⚠</span>
                      )}
                      {isWarning && (
                        <span className="budget-icon warning">!</span>
                      )}
                      {category}
                      {isPaid && <span className="budget-paid-status">Paid</span>}
                      {isPartial && <span className="budget-partial-status">Partially paid</span>}
                      {isBill && !isPaid && !isPartial && <span className="budget-usage-note">Unpaid</span>}
                    </span>
                    <div className="budget-amount-actions"><span
                      className={`budget-status-amount ${isOver ? 'over' : ''}`}
                    >
                      ₱{formatAmount(spent)} / ₱{formatAmount(limit)}
                    </span>
                    {!isPaid && limit > 0 && <button type="button" className="budget-pay-btn" aria-label={`${isPartial ? 'Pay remaining' : 'Pay'} ${category}`} onClick={() => onPay(category, remaining)}>{isPartial ? 'Pay remaining' : 'Pay'}</button>}</div>
                  </div>

                  {/* Progress bar */}
                  <div className="budget-progress-track">
                    <div
                      className={`budget-progress-bar ${
                        isOver ? 'over' : isWarning ? 'warning' : 'normal'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Over budget message */}
                  {isWarning && <p className="budget-usage-note">{spent >= limit ? 'Monthly budget fully used.' : 'At least 80% of your monthly budget used.'}</p>}
                  {isOver && (
                    <p className="budget-over-message">
                      Over by ₱{formatAmount(spent - limit)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetStatus
