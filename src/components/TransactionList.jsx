import TransactionItem from './TransactionItem'
import SortControls from './SortControls'
import TransactionFilter from './TransactionFilter'

// Convert transactions array to CSV format and trigger download
function exportCSV(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount']
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    `"${t.description || ''}"`,
    t.amount.toFixed(2),
  ])
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Convert transactions array to JSON format and trigger download
function exportJSON(transactions) {
  const jsonContent = JSON.stringify(transactions, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function TransactionList({
  transactions,
  allTransactions,
  onDelete,
  onEdit,
  sortBy,
  onSortChange,
  // Filter props (now lives inside TransactionList)
  filters,
  onFilterChange,
  allCategories,
}) {
  return (
    <div className="transaction-list">

      {/* Section header */}
      <div className="transaction-list-header">
        <h2>Transactions ({transactions.length})</h2>
        {/* Export buttons */}
        {allTransactions.length > 0 && (
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={() => exportCSV(allTransactions)}
              title="Download all transactions as CSV"
            >
              ⬇ CSV
            </button>
            <button
              className="export-btn"
              onClick={() => exportJSON(allTransactions)}
              title="Download all transactions as JSON"
            >
              ⬇ JSON
            </button>
          </div>
        )}
      </div>

      {/* Filter — lives inside the transaction list */}
      <TransactionFilter
        onFilterChange={onFilterChange}
        categories={allCategories}
        selectedCategory={filters.category}
        selectedType={filters.type}
        searchQuery={filters.searchQuery}
      />

      {/* Sort controls */}
      <SortControls sortBy={sortBy} onChange={onSortChange} />

      {/* Empty state or transaction items */}
      {transactions.length === 0 ? (
        <p className="empty-message">No transactions found</p>
      ) : (
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