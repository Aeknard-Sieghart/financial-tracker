import ActionButton from './ActionButton'
import TransactionItem from './TransactionItem'
import TransferActivity from './TransferActivity'
import SortControls from './SortControls'
import TransactionFilter from './TransactionFilter'
import { activityTotals } from '../utils/activity'

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
  accounts,
  allTransactions,
  onDelete,
  onEdit,
  sortBy,
  onSortChange,
  // Filter props (now lives inside TransactionList)
  filters,
  onFilterChange,
  allCategories,
  // Category definitions, for the row icons
  categories,
}) {
  const totals = activityTotals(transactions, filters.accountId)
  const money = n => n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  return (
    <div className="transaction-list">

      {/* Section header */}
      <div className="transaction-list-header">
        <h2>Activity ({transactions.length})</h2>
        {/* Export buttons */}
        {allTransactions.length > 0 && (
          <div className="export-buttons">
            <ActionButton icon="download"
              className="export-btn"
              onClick={() => exportCSV(allTransactions)}
              title="Download all transactions as CSV"
            >
              CSV
            </ActionButton>
            <ActionButton icon="download"
              className="export-btn"
              onClick={() => exportJSON(allTransactions)}
              title="Download all transactions as JSON"
            >
              JSON
            </ActionButton>
          </div>
        )}
      </div>

      {/* Filter — lives inside the transaction list */}
      <TransactionFilter
        accounts={accounts}
        filters={filters}
        onFilterChange={onFilterChange}
        categories={allCategories}
        selectedCategory={filters.category}
        selectedType={filters.type}
        searchQuery={filters.searchQuery}
      />

      <div className="activity-totals" aria-label="Filtered activity totals"><p><strong>{transactions.length} matching records</strong></p><dl><div><dt>Income</dt><dd>{money(totals.income)}</dd></div><div><dt>Expenses</dt><dd>{money(totals.expense)}</dd></div><div><dt>Debt principal</dt><dd>{money(totals.principal)}</dd></div><div><dt>Transfers</dt><dd>{money(totals.transfers)}</dd></div><div><dt>{filters.accountId ? 'Net account activity' : 'Net transaction flow'}</dt><dd>{money(totals.net)}</dd></div></dl><p>Totals cover the matching records only. {filters.accountId ? 'Transfers into this account add to net activity; transfers out subtract.' : 'Transfers between your accounts are excluded from net flow.'} Opening balances are excluded. CSV and JSON export all transactions; use Backup & restore for a full backup.</p></div>
      {/* Sort controls */}
      <SortControls sortBy={sortBy} onChange={onSortChange} />

      {/* Empty state or transaction items */}
      {transactions.length === 0 ? (
        <p className="empty-message">No activity found for these filters</p>
      ) : (
        transactions.map((transaction) => transaction.type === 'transfer' ? <TransferActivity key={`transfer-${transaction.id}`} transfer={transaction} accounts={accounts} onDelete={onDelete} /> : (
          <TransactionItem
            accounts={accounts}
            key={transaction.id}
            transaction={transaction}
            onDelete={onDelete}
            onEdit={onEdit}
            categories={categories}
          />
        ))
      )}
    </div>
  )
}

export default TransactionList
