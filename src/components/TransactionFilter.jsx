import ActionButton from './ActionButton'
import { useState } from 'react'
import PeriodDatePicker from './PeriodDatePicker'
import { todayDate } from '../utils/recurring'
import { activityFilterError, EMPTY_ACTIVITY_FILTERS } from '../utils/activity'

function TransactionFilter({
  onFilterChange, accounts = [], filters = {},
  categories,
  selectedCategory,
  selectedType,
  searchQuery,
}) {
  // Track whether filter settings are expanded or collapsed
  const [isOpen, setIsOpen] = useState(false)

  // Check if any filter is currently active
  const hasActiveFilters = searchQuery || selectedType || selectedCategory || filters.accountId || filters.fromDate || filters.toDate || filters.minAmount !== undefined && filters.minAmount !== '' || filters.maxAmount !== undefined && filters.maxAmount !== ''

  return (
    <div className="transaction-filter">

      {/* Toggle header — clicking opens/closes filter settings */}
      <button
        className="filter-toggle-btn"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="filter-toggle-left">
          <span className="filter-toggle-label">Filter activity</span>
          {/* Show a dot indicator when filters are active */}
          {hasActiveFilters && (
            <span className="filter-active-dot" title="Filters active" />
          )}
        </span>
        <span aria-hidden="true" className={`filter-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {/* Collapsible filter settings */}
      {isOpen && (
        <div className="filter-settings">

          {/* Search by description or category */}
          <div className="filter-group">
            <label htmlFor="activity-search">Search</label>
            <input
              id="activity-search"
              type="text"
              placeholder="e.g. Groceries, Salary..."
              value={searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="search-input"
            />
          </div>

          {/* Filter by type */}
          <div className="filter-group">
            <label htmlFor="activity-type">Type</label>
            <select
              id="activity-type" value={selectedType}
              onChange={(e) => onFilterChange({ type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
              <option value="debt-payment">Debt repayment (principal)</option>
            </select>
          </div>

          {/* Filter by category */}
          <div className="filter-group">
            <label htmlFor="activity-category">Category</label>
            <select
              id="activity-category" value={selectedCategory}
              onChange={(e) => onFilterChange({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group"><label htmlFor="activity-account">Account</label><select id="activity-account" value={filters.accountId || ''} onChange={e => onFilterChange({ accountId: e.target.value })}><option value="">All accounts</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.id === 'unassigned' ? 'Other / Unassigned' : a.name}{a.archived ? ' (archived)' : ''}</option>)}</select></div>
          {['fromDate', 'toDate'].map((field, index) => <div className="filter-group" key={field}><span>{index ? 'To date' : 'From date'}</span><label className="activity-date-toggle"><input type="checkbox" checked={Boolean(filters[field])} onChange={e => onFilterChange({ [field]: e.target.checked ? todayDate() : '' })} />{index ? 'Set end date' : 'Set start date'}</label>{filters[field] && <PeriodDatePicker type="date" value={filters[field]} onChange={e => onFilterChange({ [field]: e.target.value })} />}</div>)}
          {['minAmount', 'maxAmount'].map((field, index) => <div className="filter-group" key={field}><label htmlFor={'activity-' + field}>{index ? 'Maximum amount (₱)' : 'Minimum amount (₱)'}</label><input id={'activity-' + field} type="number" min="0" step="0.01" inputMode="decimal" placeholder="No limit" value={filters[field] ?? ''} onChange={e => onFilterChange({ [field]: e.target.value })} /></div>)}
          {(filters.fromDate || filters.toDate) && <p className="activity-filter-note">Custom dates apply across all months. Transfers match either the sending or receiving account.</p>}
          {activityFilterError(filters) && <p className="activity-filter-note" role="alert">{activityFilterError(filters)}</p>}
          {/* Clear all filters */}
          <ActionButton icon="close"
            className="clear-filters-btn"
            onClick={() => onFilterChange({ ...EMPTY_ACTIVITY_FILTERS })}
          >
            Clear Filters
          </ActionButton>

        </div>
      )}
    </div>
  )
}

export default TransactionFilter
