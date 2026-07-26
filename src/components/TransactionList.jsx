import TransactionItem from './TransactionItem'

// Convert transactions array to CSV format and trigger download
function exportCSV(transactions) {
  // Define CSV column headers
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount']

  // Convert each transaction into a CSV row
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    // Wrap description in quotes to handle commas inside text
    `"${t.description || ''}"`,
    t.amount.toFixed(2),
  ])

  // Combine headers and rows into one CSV string
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  // Create a downloadable blob and trigger the download
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()

  // Clean up the temporary URL after download
  URL.revokeObjectURL(url)
}

// Convert transactions array to JSON format and trigger download
function exportJSON(transactions) {
  // Pretty-print JSON with 2-space indentation
  const jsonContent = JSON.stringify(transactions, null, 2)

  // Create a downloadable blob and trigger the download
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.json`
  link.click()

  // Clean up the temporary URL after download
  URL.revokeObjectURL(url)
}

function TransactionList({ transactions, allTransactions, onDelete, onEdit }) {
  return (
    <div className="transaction-list">

      {/* List header with export buttons */}
      <div className="transaction-list-header">
        <h2>Transactions ({transactions.length})</h2>

        {/* Only show export buttons if there is data to export */}
        {allTransactions.length > 0 && (
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={() => exportCSV(allTransactions)}
              title="Download all transactions as CSV (Excel)"
            >
              ⬇ CSV
            </button>
            <button
              className="export-btn"
              onClick={() => exportJSON(allTransactions)}
              title="Download all transactions as JSON (Backup)"
            >
              ⬇ JSON
            </button>
          </div>
        )}
      </div>

      {/* Empty state message */}
      {transactions.length === 0 ? (
        <p className="empty-message">No transactions found</p>
      ) : (
        // Render each transaction as a TransactionItem
        transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      )}
    </div>
  )
}

export default TransactionList