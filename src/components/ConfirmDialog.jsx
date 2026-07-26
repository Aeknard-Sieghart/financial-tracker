function ConfirmDialog({ isOpen, message, onConfirm, onCancel }) {
  // Don't render anything if dialog is not open
  if (!isOpen) return null

  return (
    // Backdrop overlay
    <div className="dialog-overlay" onClick={onCancel}>
      {/* Stop click from closing when clicking inside dialog */}
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <p className="dialog-message">{message}</p>
        <div className="dialog-buttons">
          <button className="dialog-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="dialog-confirm" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog