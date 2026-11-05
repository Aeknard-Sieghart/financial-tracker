export default function ThemeControl({ darkMode, onChange }) {
  return <div className="theme-control" role="group" aria-label="Appearance">
    <span className={`theme-control-indicator ${darkMode ? 'is-dark' : ''}`} aria-hidden="true" />
    <button type="button" aria-pressed={!darkMode} onClick={() => onChange(false)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg><span>Light</span></button>
    <button type="button" aria-pressed={darkMode} onClick={() => onChange(true)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14a8.8 8.8 0 0 1-10.5-10.5A9 9 0 1 0 20.5 14Z" /></svg><span>Dark</span></button>
  </div>
}
