import ActionButton from './ActionButton'
// Named slots keep layout independent from each feature's state and forms.
export default function DashboardLayout({ onManage, snapshot, accounts, bills, budgets, charts, transactions, backup, monthControl, trends, reminders, goals, debts, income, safeToSpend }) {
  return <main className="dashboard-shell">
    <header className="dashboard-intro"><div><p className="dashboard-eyebrow">YOUR MONEY, AT A GLANCE</p><h2>Your financial overview</h2><p>A clear view of your money, all in one place.</p></div><ActionButton icon="settings" className="primary-action" onClick={onManage}>Manage finances</ActionButton></header>
    <div className="bento-grid">
      <div className="bento-slot bento-snapshot">{snapshot}</div>
      <section className="bento-slot bento-safe-to-spend" aria-label="Safe to spend">{safeToSpend}</section>
      <section className="bento-slot bento-accounts" aria-label="Accounts and transfers">{accounts}</section>
      <section className="bento-slot bento-transactions" aria-label="Recent activity">{monthControl}{transactions}</section>
      {reminders && <div className="bento-slot bento-reminders">{reminders}</div>}
      <div className="bento-slot bento-income">{income}</div>
      <section id="monthly-bills" className="bento-slot bento-bills" aria-label="Monthly bills">{bills}</section>
      <section id="debts" className="bento-slot bento-debts" aria-label="Debt">{debts}</section>
      <div className="bento-slot bento-trends">{trends}</div>
      <div className="bento-slot bento-goals">{goals}</div>
      <details className="bento-slot bento-insights"><summary>Spending insights <span>Charts and monthly budgets</span></summary><div className="insights-grid"><section aria-label="Charts">{charts}</section><section aria-label="Spending budgets">{budgets}</section></div></details>
      <section className="bento-slot bento-backup" aria-label="Backup and restore">{backup}</section>
    </div>
  </main>
}
