import { useState } from 'react'

// Format number with thousand separators
function formatAmount(num) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Get the current month in YYYY-MM format
function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function BudgetStatus({ transactions, budgets }) {
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
              const percentage = Math.min((spent / limit) * 100, 100)
              const isOver = spent > limit
              const isWarning = percentage >= 80 && !isOver

              return (
                <div key={category} className="budget-status-item">
                  {/* Category name and amounts */}
                  <div className="budget-status-header">
                    <span className="budget-status-category">
                      {isOver && (
                        <span className="budget-icon over">⚠</span>
                      )}
                      {isWarning && (
                        <span className="budget-icon warning">!</span>
                      )}
                      {category}
                    </span>
                    <span
                      className={`budget-status-amount ${isOver ? 'over' : ''}`}
                    >
                      ₱{formatAmount(spent)} / ₱{formatAmount(limit)}
                    </span>
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