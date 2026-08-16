import { useState } from 'react'
import CategoryIcon from './CategoryIcon'

// Format cents to display string (e.g. 100000 -> "1,000.00")
function displayAmount(cents) {
  if (!cents) return ''
  const pesos = Math.floor(cents / 100)
  const centsPart = cents % 100
  return (pesos || 0).toLocaleString('en-US') + '.' + String(centsPart).padStart(2, '0')
}

// Convert cents to decimal number (e.g. 100000 -> 1000.00)
function centsToAmount(cents) {
  return cents / 100
}

function BudgetManager({ budgets, onUpdate, categories }) {
  // Expense categories come from the category manager
  const expenseCategories = categories.expense || []

  // Store each category's budget as cents internally for calculator behavior
  const [localCents, setLocalCents] = useState(() => {
    const initial = {}
    expenseCategories.forEach((category) => {
      initial[category.name] = budgets[category.name] ? Math.round(budgets[category.name] * 100) : 0
    })
    return initial
  })

  // Handle calculator-style keydown per category
  function handleKeyDown(e, name) {
    const key = e.key

    if (key >= '0' && key <= '9') {
      e.preventDefault()
      setLocalCents((prev) => ({
        ...prev,
        [name]: (prev[name] || 0) * 10 + parseInt(key),
      }))
    } else if (key === 'Backspace') {
      e.preventDefault()
      setLocalCents((prev) => ({
        ...prev,
        [name]: Math.floor((prev[name] || 0) / 10),
      }))
    }
  }

  // Save all budgets at once — only called when user clicks Save
  function handleSave() {
    const newBudgets = {}
    expenseCategories.forEach((category) => {
      if (localCents[category.name] > 0) {
        newBudgets[category.name] = centsToAmount(localCents[category.name])
      }
    })
    onUpdate(newBudgets)
  }

  // Clear a single category's budget
  function handleClear(name) {
    setLocalCents((prev) => ({ ...prev, [name]: 0 }))
  }

  return (
    <div className="budget-manager">
      <h2>Monthly Budgets</h2>
      <p className="budget-subtitle">
        Set a monthly spending limit per category. Leave blank for no limit.
      </p>

      <div className="budget-list">
        {expenseCategories.map((category) => (
          <div key={category.id} className="budget-item">
            <label className="budget-label">
              <CategoryIcon category={category} size={20} radius={6} strokeWidth={2} />
              {category.name}
            </label>
            <div className="budget-input-wrapper">
              {/* Currency symbol prefix */}
              <span className="budget-currency">₱</span>

              {/* Calculator-style input — controlled by onKeyDown */}
              <input
                type="text"
                className="budget-input"
                placeholder="0.00"
                value={displayAmount(localCents[category.name])}
                onKeyDown={(e) => handleKeyDown(e, category.name)}
                onChange={() => {}} // Controlled by onKeyDown only
                inputMode="decimal"
              />

              {/* Clear button — only show if a value is set */}
              {localCents[category.name] > 0 && (
                <button
                  className="budget-clear-btn"
                  onClick={() => handleClear(category.name)}
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