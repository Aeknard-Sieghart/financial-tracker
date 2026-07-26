// Available period view options (By Date removed)
const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'date-range', label: 'Date Range' },
  { value: 'by-month', label: 'By Month' },
  { value: 'month-range', label: 'Month Range' },
  { value: 'by-year', label: 'By Year' },
  { value: 'year-range', label: 'Year Range' },
]

// Generate a list of available years from transactions
function getAvailableYears(transactions) {
  const years = transactions.map((t) => t.date.slice(0, 4))
  return [...new Set(years)].sort((a, b) => b - a)
}

function PeriodFilter({ period, onChange, transactions }) {
  const years = getAvailableYears(transactions)
  const currentYear = new Date().getFullYear().toString()
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  // Get today's date in YYYY-MM-DD format
  const today = new Date()
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="period-filter">

      {/* Section label — matches Transactions, Summary style */}
      <h2>Period Filter</h2>

      {/* Period type selector */}
      <div className="period-type-selector">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`period-btn ${period.type === option.value ? 'active' : ''}`}
            onClick={() => onChange({ type: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Dynamic inputs based on selected period type */}
      <div className="period-inputs">

        {/* Date range picker — defaults to today for both from and to */}
        {period.type === 'date-range' && (
          <>
            <div className="period-input-group">
              <label>From</label>
              <input
                type="date"
                value={period.dateFrom || todayString}
                max={period.dateTo || todayString}
                onChange={(e) => onChange({ ...period, dateFrom: e.target.value })}
              />
            </div>
            <div className="period-input-group">
              <label>To</label>
              <input
                type="date"
                value={period.dateTo || todayString}
                min={period.dateFrom || ''}
                onChange={(e) => onChange({ ...period, dateTo: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Single month picker */}
        {period.type === 'by-month' && (
          <div className="period-input-group">
            <label>Select Month</label>
            <input
              type="month"
              value={period.month || currentMonth}
              onChange={(e) => onChange({ ...period, month: e.target.value })}
            />
          </div>
        )}

        {/* Month range picker — defaults to current month for both from and to */}
        {period.type === 'month-range' && (
          <>
            <div className="period-input-group">
              <label>From</label>
              <input
                type="month"
                value={period.monthFrom || currentMonth}
                max={period.monthTo || currentMonth}
                onChange={(e) => onChange({ ...period, monthFrom: e.target.value })}
              />
            </div>
            <div className="period-input-group">
              <label>To</label>
              <input
                type="month"
                value={period.monthTo || currentMonth}
                min={period.monthFrom || ''}
                onChange={(e) => onChange({ ...period, monthTo: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Single year selector */}
        {period.type === 'by-year' && (
          <div className="period-input-group">
            <label>Select Year</label>
            <select
              value={period.year || currentYear}
              onChange={(e) => onChange({ ...period, year: e.target.value })}
            >
              {years.length > 0 ? (
                years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))
              ) : (
                <option value={currentYear}>{currentYear}</option>
              )}
            </select>
          </div>
        )}

        {/* Year range selector — defaults to current year for both from and to */}
        {period.type === 'year-range' && (
          <>
            <div className="period-input-group">
              <label>From Year</label>
              <select
                value={period.yearFrom || currentYear}
                onChange={(e) => {
                  // If new "From" is later than "To", reset "To" to match "From"
                  const newFrom = e.target.value
                  const newTo = period.yearTo && period.yearTo < newFrom
                    ? newFrom
                    : period.yearTo || currentYear
                  onChange({ ...period, yearFrom: newFrom, yearTo: newTo })
                }}
              >
                {years.length > 0 ? (
                  years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))
                ) : (
                  <option value={currentYear}>{currentYear}</option>
                )}
              </select>
            </div>
            <div className="period-input-group">
              <label>To Year</label>
              <select
                value={period.yearTo || currentYear}
                onChange={(e) => {
                  // If new "To" is earlier than "From", reset "From" to match "To"
                  const newTo = e.target.value
                  const newFrom = period.yearFrom && period.yearFrom > newTo
                    ? newTo
                    : period.yearFrom || currentYear
                  onChange({ ...period, yearFrom: newFrom, yearTo: newTo })
                }}
              >
                {/* Only show years that are >= From year */}
                {years.length > 0 ? (
                  years
                    .filter((y) => y >= (period.yearFrom || currentYear))
                    .map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))
                ) : (
                  <option value={currentYear}>{currentYear}</option>
                )}
              </select>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default PeriodFilter