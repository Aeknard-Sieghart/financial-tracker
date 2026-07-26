function TransactionFilter({ 
  onFilterChange, 
  categories, 
  selectedCategory, 
  selectedType,
  searchQuery
}) {
  return (
    <div className="transaction-filter">
      <h2>Filter Transactions</h2>
      
      {/* Search by description */}
      <div className="filter-group">
        <label>Search by description</label>
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
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Clear all filters button */}
      <button 
        className="clear-filters-btn"
        onClick={() => onFilterChange({ 
          searchQuery: '', 
          type: '', 
          category: '' 
        })}
      >
        Clear Filters
      </button>
    </div>
  )
}

export default TransactionFilter