import { useEffect, useId, useRef } from 'react'

export default function AccountEditorSurface({ embedded, title, onClose, error, children }) {
  const dialog = useRef(null)
  const titleId = useId()
  useEffect(() => {
    if (!embedded) dialog.current.showModal()
  }, [embedded])
  const content = <div className="accounts-panel account-modal-content">{children}{error && <p role="alert">{error}</p>}</div>
  if (embedded) return content
  return <dialog ref={dialog} className="workspace-modal" aria-labelledby={titleId} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="workspace-modal-inner"><div className="sidebar-header"><h2 id={titleId}>{title}</h2><button type="button" className="sidebar-close" aria-label={`Close ${title}`} onClick={onClose}>✕</button></div><div className="sidebar-content">{content}</div></div>
  </dialog>
}
