const paths = {
  add: 'M12 5v14M5 12h14',
  edit: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
  remove: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8',
  close: 'm6 6 12 12M6 18 18 6',
  pay: 'M3 5h18v14H3ZM3 10h18M7 15h3',
  transfer: 'M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  restore: 'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',
  pause: 'M8 4v16M16 4v16',
  play: 'm7 4 14 8-14 8Z',
  back: 'M20 12H4m7-7-7 7 7 7',
  view: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-3-4-6-9-6ZM7 8h.01M12 6h.01M16 8h.01M6 13h.01',
  filter: 'M4 7h16M7 12h10M10 17h4',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  release: 'M12 19V5m-5 5 5-5 5 5M4 19h16',
  allocate: 'M12 3v14m-5-5 5 5 5-5M4 21h16',
  expand: 'm6 9 6 6 6-6',
}

export function ActionIcon({ name }) {
  return <svg className="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] || paths.settings} /></svg>
}

export default function ActionButton({ icon, children, loading = false, className = '', as: Tag = 'button', ...props }) {
  return <Tag className={`action-button ${className}`} {...props} aria-busy={loading || undefined} disabled={Tag === 'button' ? loading || props.disabled : undefined}>{loading ? <span className="action-spinner" aria-hidden="true" /> : <ActionIcon name={icon} />}<span className="action-button-label">{children}</span></Tag>
}
