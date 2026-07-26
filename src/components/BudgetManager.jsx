import { useState } from 'react'

// Expense categories (must match TransactionForm)
const EXPENSE_CATEGORIES = [
  'Rent', 'Food', 'Transport', 'Utilities',
  'Entertainment', 'Shopping', 'Other'
]

// Format cents to display string (e.g. 100000 -> "1,000.00")
function displayAmount(cents) {
  if (cents === 0) return ''
  const pesos = Math.floor(cents / 100)
  const centsPart = cents % 100
  return (pesos || 0).toLocaleString('en-US') + '.' + String(centsPart).padStart(2, '0')
}

// Convert cents to decimal number (e.g. 100000 -> 1000.00)
function centsToAmount(cents) {
  return cents / 100
}

function BudgetManager({ budgets, onUpdate }) {
  // Store each category's budget as cents internally for calculator behavior
  // Initialize from existing budgets (convert from decimal to cents)
  const [localCents, setLocalCents] = useState(() => {
    const initial = {}
    EXPENSE_CATEGORIES.forEach((cat) => {
      initial[cat] = budgets[cat] ? Math.round(budgets[cat] * 100) : 0
    })
    return initial
  })

  // Handle calculator-style keydown per category
  function handleKeyDown(e, category) {
    const key = e.key

    if (key >= '0' && key <= '9') {
      e.preventDefault()
      setLocalCents((prev) => ({
        ...prev,
        [category]: prev[category] * 10 + parseInt(key),
      }))
    } else if (key === 'Backspace') {
      e.preventDefault()
      setLocalCents((prev) => ({
        ...prev,
        [category]: Math.floor(prev[category] / 10),
      }))
    }
  }

  // Save all budgets at once — only called when user clicks Save
  function handleSave() {
    const newBudgets = {}
    EXPENSE_CATEGORIES.forEach((cat) => {
      if (localCents[cat] > 0) {
        newBudgets[cat] = centsToAmount(localCents[cat])
      }
    })
    onUpdate(newBudgets)
  }

  // Clear a single category's budget
  function handleClear(category) {
    setLocalCents((prev) => ({ ...prev, [category]: 0 }))
  }

  return (
    <div className="budget-manager">
      <h2>Monthly Budgets</h2>
      <p className="budget-subtitle">
        Set a monthly spending limit per category. Leave blank for no limit.
      </p>

      <div className="budget-list">
        {EXPENSE_CATEGORIES.map((category) => (
          <div key={category} className="budget-item">
            <label className="budget-label">{category}</label>
            <div className="budget-input-wrapper">
              {/* Currency symbol prefix */}
              <span className="budget-currency">₱</span>

              {/* Calculator-style input — controlled by onKeyDown */}
              <input
                type="text"
                className="budget-input"
                placeholder="0.00"
                value={displayAmount(localCents[category])}
                onKeyDown={(e) => handleKeyDown(e, category)}
                onChange={() => {}} // Controlled by onKeyDown only
                inputMode="decimal"
              />

              {/* Clear button — only show if a value is set */}
              {localCents[category] > 0 && (
                <button
                  className="budget-clear-btn"
                  onClick={() => handleClear(category)}
                  title="Clear budget"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Single save button — toast only fires when this is clicked */}
      <button className="budget-save-btn" onClick={handleSave}>
        Save Budgets
      </button>
    </div>
  )
}

export default BudgetManager