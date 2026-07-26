import { useState } from 'react'

function TransactionFilter({
  onFilterChange,
  categories,
  selectedCategory,
  selectedType,
  searchQuery,
}) {
  // Track whether filter settings are expanded or collapsed
  const [isOpen, setIsOpen] = useState(false)

  // Check if any filter is currently active
  const hasActiveFilters = searchQuery || selectedType || selectedCategory

  return (
    <div className="transaction-filter">

      {/* Toggle header — clicking opens/closes filter settings */}
      <button
        className="filter-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="filter-toggle-left">
          <span className="filter-toggle-label">Filter Transactions</span>
          {/* Show a dot indicator when filters are active */}
          {hasActiveFilters && (
            <span className="filter-active-dot" title="Filters active" />
          )}
        </span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {/* Collapsible filter settings */}
      {isOpen && (
        <div className="filter-settings">

          {/* Search by description or category */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="e.g. Groceries, Salary..."
              value={searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="search-input"
            />
          </div>

          {/* Filter by type */}
          <div className="filter-group">
            <label>Type</label>
            <select
              value={selectedType}
              onChange={(e) => onFilterChange({ type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Filter by category */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => onFilterChange({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Clear all filters */}
          <button
            className="clear-filters-btn"
            onClick={() => onFilterChange({ searchQuery: '', type: '', category: '' })}
          >
            Clear Filters
          </button>

        </div>
      )}
    </div>
  )
}

export default TransactionFilter