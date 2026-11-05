import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { findCategory } from '../hooks/useCategories'

// Fallback colors for any category without one of its own
const PIE_COLORS = [
  '#43839a', '#63a69b', '#c28a73', '#b2a16a',
  '#789ab7', '#8b8fae', '#b68496', '#79b9bb',
]

// Format large numbers compactly (e.g. 15000 -> 15K)
function formatShortAmount(value) {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}K`
  return `₱${value.toFixed(2)}`
}

// Format full amount for tooltips
function formatFullAmount(value) {
  return `₱${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Get short month label from YYYY-MM-DD date string
function getMonthLabel(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

// Shared tooltip style
const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(8px)',
    fontSize: '0.85rem',
    boxShadow: '0 8px 24px #10263720',
  },
  labelStyle: { color: 'var(--text-primary)' },
  itemStyle: { color: 'var(--text-primary)' },
}

function Charts({ transactions, categories }) {
  // ── PIE CHART DATA ──────────────────────────────────────────────
  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  // Keep chart slices consistent with the colors saved in Categories.
  const pieData = Object.entries(expenseByCategory).map(([name, value], index) => ({
    name,
    value,
    color:
      findCategory(categories, 'expense', name).color ||
      PIE_COLORS[index % PIE_COLORS.length],
  }))

  // ── BAR CHART DATA ───────────────────────────────────────────────
  const monthlyData = transactions.reduce((acc, t) => {
    const month = getMonthLabel(t.date)
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 }
    if (t.type === 'income') acc[month].income += t.amount
    else if (t.type === 'expense') acc[month].expenses += t.amount
    return acc
  }, {})

  const barData = Object.values(monthlyData).sort(
    (a, b) => new Date(a.month) - new Date(b.month)
  )

  // Don't render if no transactions
  if (transactions.length === 0) return null

  return (
    <div className="charts-container">
      <h2>Overview</h2>

      <div className="charts-grid">

        {/* ── PIE CHART ── */}
        {pieData.length > 0 && (
          <div className="chart-card">
            <h3>Expenses by Category</h3>
            {/* Wrap in a div with explicit width to fix mobile rendering */}
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatFullAmount(value)}
                    {...tooltipStyle}
                  />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    formatter={value => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── BAR CHART ── */}
        {barData.length > 0 && (
          <div className="chart-card">
            <h3>Income vs Expenses by Month</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                  />
                  <XAxis
                    axisLine={false}
                    tickLine={false}
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatShortAmount}
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    width={65}
                  />
                  <Tooltip
                    formatter={(value) => formatFullAmount(value)}
                    cursor={{ fill: 'var(--accent-soft)' }}
                    {...tooltipStyle}
                  />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: '0.8rem' }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#63a69b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#c28a73"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Charts
