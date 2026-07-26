import { useState } from 'react'

function Summary({ transactions }) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  const formatAmount = (num) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="summary">
      <h2>Summary</h2>
      <div className="summary-cards">
        <div className="card">
          <p className="label">Balance</p>
          <p className="amount">₱{formatAmount(balance)}</p>
        </div>
        <div className="card">
          <p className="label">Income</p>
          <p className="amount income">₱{formatAmount(totalIncome)}</p>
        </div>
        <div className="card">
          <p className="label">Expenses</p>
          <p className="amount expense">₱{formatAmount(totalExpenses)}</p>
        </div>
      </div>
    </div>
  )
}

export default Summary