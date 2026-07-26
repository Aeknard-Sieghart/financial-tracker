// Filter transactions based on the selected period type and values
export function filterByPeriod(transactions, period) {
  // Return all transactions if no period filter is set
  if (!period || period.type === 'all') return transactions

  return transactions.filter((t) => {
    const date = t.date         // "YYYY-MM-DD"
    const month = date.slice(0, 7) // "YYYY-MM"
    const year = date.slice(0, 4)  // "YYYY"

    switch (period.type) {

      // Match a range of dates (inclusive)
      case 'date-range':
        if (!period.dateFrom && !period.dateTo) return true
        if (period.dateFrom && !period.dateTo) return date >= period.dateFrom
        if (!period.dateFrom && period.dateTo) return date <= period.dateTo
        return date >= period.dateFrom && date <= period.dateTo

      // Match a single specific month (YYYY-MM)
      case 'by-month':
        return period.month ? month === period.month : true

      // Match a range of months (inclusive)
      case 'month-range':
        if (!period.monthFrom && !period.monthTo) return true
        if (period.monthFrom && !period.monthTo) return month >= period.monthFrom
        if (!period.monthFrom && period.monthTo) return month <= period.monthTo
        return month >= period.monthFrom && month <= period.monthTo

      // Match a single specific year
      case 'by-year':
        return period.year ? year === period.year : true

      // Match a range of years (inclusive)
      case 'year-range':
        if (!period.yearFrom && !period.yearTo) return true
        if (period.yearFrom && !period.yearTo) return year >= period.yearFrom
        if (!period.yearFrom && period.yearTo) return year <= period.yearTo
        return year >= period.yearFrom && year <= period.yearTo

      default:
        return true
    }
  })
}