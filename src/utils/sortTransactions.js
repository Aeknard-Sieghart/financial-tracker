// Sort transactions based on the selected sort option
export function sortTransactions(transactions, sortBy) {
  // Create a shallow copy so we don't mutate the original array
  const sorted = [...transactions]

  switch (sortBy) {
    // Newest date first
    case 'date-desc':
      return sorted.sort((a, b) => b.date.localeCompare(a.date))

    // Oldest date first
    case 'date-asc':
      return sorted.sort((a, b) => a.date.localeCompare(b.date))

    // Highest amount first
    case 'amount-desc':
      return sorted.sort((a, b) => b.amount - a.amount)

    // Lowest amount first
    case 'amount-asc':
      return sorted.sort((a, b) => a.amount - b.amount)

    // Category A to Z
    case 'category-asc':
      return sorted.sort((a, b) => a.category.localeCompare(b.category))

    // Category Z to A
    case 'category-desc':
      return sorted.sort((a, b) => b.category.localeCompare(a.category))

    default:
      return sorted
  }
}