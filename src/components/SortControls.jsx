// Available sort options
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date (Newest)' },
  { value: 'date-asc', label: 'Date (Oldest)' },
  { value: 'amount-desc', label: 'Amount (Highest)' },
  { value: 'amount-asc', label: 'Amount (Lowest)' },
  { value: 'category-asc', label: 'Category (A-Z)' },
  { value: 'category-desc', label: 'Category (Z-A)' },
]

function SortControls({ sortBy, onChange }) {
  return (
    <div className="sort-controls">
      <label>Sort by</label>
      <select value={sortBy} onChange={(e) => onChange(e.target.value)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SortControls