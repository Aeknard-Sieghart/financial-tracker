import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PeriodDatePicker from './PeriodDatePicker'
import { todayDate } from '../utils/recurring'
import { lineHistory } from '../utils/lineHistory'

const money = n => Number(n).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
const compact = n => `₱${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
const label = date => date.length === 4 ? date : new Date(`${date}${date.length === 7 ? '-01' : ''}T12:00:00`).toLocaleDateString('en', date.length === 7 ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' })

function HistoryChart({ points, field, name, color, grouping }) {
  return <div className="line-history-chart" role="img" aria-label={`${name}, ${grouping === 'day' ? 'daily' : grouping === 'month' ? 'monthly' : 'yearly'} line chart. ${points.length} periods.`}>
    <ResponsiveContainer width="100%" height={280}><LineChart data={points} margin={{ top: 15, right: 16, left: 0, bottom: 5 }}>
      <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" />
      <XAxis dataKey="date" tickFormatter={label} axisLine={false} tickLine={false} minTickGap={35} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
      <YAxis width={72} tickFormatter={compact} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
      <Tooltip formatter={value => [money(value), name]} labelFormatter={label} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
      <Line type="linear" dataKey={field} name={name} stroke={color} strokeWidth={2.5} dot={points.length <= 31 ? { r: 3, fill: color, stroke: 'var(--bg-card)' } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
    </LineChart></ResponsiveContainer>
  </div>
}

export default function LineInsights({ transactions, accounts, categories }) {
  const [from, setFrom] = useState(() => `${todayDate().slice(0, 7)}-01`)
  const [to, setTo] = useState(todayDate)
  const [selection, setSelection] = useState('income:Salary')
  const options = ['income', 'expense'].flatMap(type => [...new Set([...(categories[type] || []).map(c => c.name), ...transactions.filter(t => t.type === type).map(t => t.category)])].map(name => ({ value: `${type}:${name}`, type, name, color: categories[type]?.find(c => c.name === name)?.color })))
  const selected = options.find(o => o.value === selection) || options[0]
  const { points, grouping, opening } = lineHistory(transactions, accounts, from, to, selected?.type, selected?.name)
  const total = points.reduce((sum, p) => sum + Math.round(p.categoryAmount * 100), 0) / 100
  const end = points.at(-1)?.balance ?? opening
  return <section className="line-insights-panel">
    <div className="line-insights-heading"><div><h2>Financial trends</h2><p>Explore category activity and your net balance over time.</p></div><div className="line-range-controls"><div><label>From</label><PeriodDatePicker type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></div><div><label>To</label><PeriodDatePicker type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></div></div></div>
    <div className="line-insights-grid"><section><div className="line-chart-heading"><h3>Category activity</h3><select aria-label="Chart category" value={selected?.value || ''} onChange={e => setSelection(e.target.value)}>{['income', 'expense'].map(type => <optgroup label={type === 'income' ? 'Income' : 'Expenses'} key={type}>{options.filter(o => o.type === type).map(o => <option key={o.value} value={o.value}>{o.name}</option>)}</optgroup>)}</select></div><p className="line-chart-value">{money(total)} <span>total in range</span></p><HistoryChart points={points} field="categoryAmount" name={selected?.name || 'Category'} color={selected?.color || 'var(--accent)'} grouping={grouping} />{total === 0 && <p className="budget-usage-note">No activity in this category for the selected dates.</p>}</section>
    <section><div className="line-chart-heading"><h3>Net balance history</h3></div><p className="line-chart-value">{money(end)} <span>end of range</span></p><HistoryChart points={points} field="balance" name="Net balance" color="var(--accent)" grouping={grouping} /><p className="budget-usage-note">Opening balance: {money(opening)}. Includes activity before the range. Internal transfers have no effect. History is reconstructed using your current opening balances.</p></section></div>
    <p className="budget-usage-note line-grouping">{grouping === 'day' ? 'Daily totals and end-of-day balances.' : grouping === 'month' ? 'Monthly totals and end-of-month balances (within selected dates).' : 'Yearly totals and end-of-year balances (within selected dates).'}</p>
  </section>
}
