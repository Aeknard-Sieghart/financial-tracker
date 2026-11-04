// Named slots keep layout independent from each feature's state and forms.
export default function DashboardLayout({ onManage, snapshot, accounts, bills, budgets, charts, transactions, backup, monthControl }) {
  return <main className="dashboard-shell">
    <header className="dashboard-intro"><div><p className="dashboard-eyebrow">YOUR MONEY, AT A GLANCE</p><h2>Your financial overview</h2><p>A clear view of your money, all in one place.</p></div><button className="primary-action" onClick={onManage}>+ Manage finances</button></header>
    <div className="bento-grid">
      <div className="bento-slot bento-snapshot">{snapshot}</div>
      <section className="bento-slot bento-accounts" aria-label="Accounts and transfers">{accounts}</section>
      <section className="bento-slot bento-transactions" aria-label="Recent activity">{monthControl}{transactions}</section>
      <section className="bento-slot bento-bills" aria-label="Monthly bills">{bills}</section>
      <details className="bento-slot bento-insights"><summary>Spending insights <span>Charts and monthly budgets</span></summary><div className="insights-grid"><section aria-label="Charts">{charts}</section><section aria-label="Spending budgets">{budgets}</section></div></details>
      <section className="bento-slot bento-backup" aria-label="Backup and restore">{backup}</section>
    </div>
  </main>
}
