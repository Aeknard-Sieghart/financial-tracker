import { useState } from 'react'

// Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

function TransactionForm({ onAdd, onUpdate, editingTransaction, onCancelEdit }) {
  // Compute the initial form values once, based on whether we're editing or adding.
  // Because the parent gives this component a `key` tied to editingTransaction,
  // React will re-run this initializer fresh whenever editing starts/stops/switches —
  // no useEffect needed to "sync" the state.
  const [formData, setFormData] = useState(() => {
    if (editingTransaction) {
      return {
        type: editingTransaction.type,
        amountCents: editingTransaction.amount * 100,
        category: editingTransaction.category,
        description: editingTransaction.description,
        date: editingTransaction.date,
      }
    }
    return {
      type: 'expense',
      amountCents: 0,
      category: 'Rent',
      description: '',
      date: getTodayDate(),
    }
  })

  // Category options mapped by transaction type
  const categories = {
    income: ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other'],
    expense: ['Rent', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'],
  }

  // Format the amount for display (e.g., 1000 cents = 1,000.00)
  function displayAmount(cents) {
    const pesos = Math.floor(cents / 100)
    const centsPart = cents % 100
    return (pesos || 0).toLocaleString('en-US') + '.' + String(centsPart).padStart(2, '0')
  }

  // Handle type change and update category to first option of new type
  function handleTypeChange(newType) {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: categories[newType][0],
    }))
  }

  // Handle amount input with calculator-style behavior
  function handleAmountInput(e) {
    const key = e.key

    if (key >= '0' && key <= '9') {
      e.preventDefault()
      const newValue = formData.amountCents * 10 + parseInt(key)
      setFormData((prev) => ({
        ...prev,
        amountCents: newValue,
      }))
    } else if (key === 'Backspace') {
      e.preventDefault()
      setFormData((prev) => ({
        ...prev,
        amountCents: Math.floor(prev.amountCents / 10),
      }))
    }
  }

  // Handle form submission (add new or update existing transaction)
  function handleSubmit(e) {
    e.preventDefault()

    if (formData.amountCents === 0 || !formData.date) {
      alert('Please fill in amount and date')
      return
    }

    const transactionData = {
      type: formData.type,
      amount: formData.amountCents / 100,
      category: formData.category,
      description: formData.description,
      date: formData.date,
    }

    if (editingTransaction) {
      onUpdate(editingTransaction.id, transactionData)
      onCancelEdit()
    } else {
      const newTransaction = {
        id: Date.now().toString(),
        ...transactionData,
      }
      onAdd(newTransaction)

      // Reset form only when adding (editing unmounts/remounts via key change instead)
      setFormData((prev) => ({
        ...prev,
        amountCents: 0,
        description: '',
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>

      <div className="form-group">
        <label>Type</label>
        <select value={formData.type} onChange={(e) => handleTypeChange(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input
          type="text"
          value={displayAmount(formData.amountCents)}
          onKeyDown={handleAmountInput}
          onChange={() => {}}
          placeholder="0.00"
          inputMode="decimal"
          readOnly={false}
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              category: e.target.value,
            }))
          }
        >
          {categories[formData.type].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="e.g. Groceries"
        />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              date: e.target.value,
            }))
          }
        />
      </div>

      <div className="form-buttons">
        <button type="submit">
          {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
        </button>
        {editingTransaction && (
          <button type="button" className="cancel-btn" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default TransactionForm