import { useState } from 'react'
import CategoryIcon from './CategoryIcon'
import { CATEGORY_ICONS, CATEGORY_COLORS, iconPath, tint } from '../constants/categoryIcons'
import { FALLBACK_NAME } from '../hooks/useCategories'

const EMPTY_DRAFT = { name: '', color: '#4f46e5', icon: 'home' }

function CategoryManager({ categories, transactions, onAdd, onEdit, onDelete }) {
  // Which type is being managed
  const [tab, setTab] = useState('expense')
  // What mode
  // -- 'list' shows the category rows, 
  // -- 'form' shows add/edit
  const [mode, setMode] = useState('list')
  
  // Category id being edited (null means adding a new one)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [error, setError] = useState('')
  // Category id queued for deletion (drives the confirm dialog)
  const [deleteId, setDeleteId] = useState(null)

  const list = categories[tab] || []

  // How many transactions currently use a given category name
  function countTransactionsFor(name) {
    return transactions.filter((t) => t.type === tab && t.category === name).length
  }

  // Switch type tab and drop back to the list
  function switchTab(nextTab) {
    setTab(nextTab)
    setMode('list')
    setEditingId(null)
    setError('')
  }

  function startAdd() {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
    setError('')
    setMode('form')
  }

  function startEdit(category) {
    setDraft({ name: category.name, color: category.color, icon: category.icon })
    setEditingId(category.id)
    setError('')
    setMode('form')
  }

  function cancelForm() {
    setMode('list')
    setEditingId(null)
    setError('')
  }

  // Merge a change into the draft and clear any stale error
  function patchDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }))
    setError('')
  }

  function handleSave() {
    const name = draft.name.trim()

    if (!name) {
      setError('Give the category a name.')
      return
    }

    // Names must be unique within a type (case-insensitive)
    const alreadyExist = list.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingId
    )
    if (alreadyExist) {
      setError(`A category named “${name}” already exists.`)
      return
    }

    const payload = { name, color: draft.color, icon: draft.icon }
      if (editingId) {
        onEdit(tab, editingId, payload)
      } else {
        onAdd(tab, payload)
      }
    cancelForm()
  }

  const deleteTarget = deleteId ? list.find((c) => c.id === deleteId) : null
  const deleteCount = deleteTarget ? countTransactionsFor(deleteTarget.name) : 0

  function confirmDelete() {
    if (deleteTarget) 
      onDelete(tab, deleteTarget)
    setDeleteId(null)
  }

  // Preview object for the draft, shaped like a real category
  const draftIconPreview = { color: draft.color, icon: draft.icon }

  return (
    <div className="category-manager">
      <h2>Categories</h2>
      <p className="category-subtitle">
       Categories group your income and expenses so you can see where your money goes.
      </p>

      {/* Type tabs with live counts */}
      <div className="category-tabs">category
        <button
          className={`category-tab ${tab === 'expense' ? 'active' : ''}`}
          onClick={() => switchTab('expense')}
        >
          Expense · {(categories.expense || []).length}
        </button>
        <button
          className={`category-tab ${tab === 'income' ? 'active' : ''}`}
          onClick={() => switchTab('income')}
        >
          Income · {(categories.income || []).length}
        </button>
      </div>

      {/* ── LIST VIEW ── */}
      {mode === 'list' && (
        <>
          {list.length > 0 ? (
            <div className="category-list">
              {list.map((category) => {
                const transactionCount = countTransactionsFor(category.name)
                return (
                  <div key={category.id} className="category-row">
                    <CategoryIcon category={category} size={34} radius={9} />

                    <span className="category-row-text">
                      <span className="category-row-name">{category.name}</span>
                      <span className="category-row-meta">
                        {transactionCount} {' '}
                        {transactionCount === 1 ? 'transaction' : 'transactions'}
                      </span> 
                    </span>

                    <span className="category-row-actions">
                      <button
                        className="category-edit-btn"
                        onClick={() => startEdit(category)}
                      >   
                        Edit
                      </button>
                      {/* "Other" is the fallback for deleted categories, so it stays */}
                      {category.name !== FALLBACK_NAME && (
                        <button
                          className="category-delete-btn"
                          onClick={() => setDeleteId(category.id)}
                        >
                          Delete
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="category-empty">
              <span className="category-empty-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={iconPath('tag')} />
                </svg>
              </span>
              <p className="category-empty-title">No categories yet</p>
              <p className="category-empty-hint">
                Add your first one to start tagging transactions.
              </p>
            </div>
          )}

          <button className="category-add-btn" onClick={startAdd}>
            <span className="category-add-plus">+</span>New category
          </button>
        </>
      )}

      {/* ── ADD / EDIT FORM ── */}
      {mode === 'form' && (
        <div className="category-form">
          <div className="category-form-header">
            <span className="category-form-title">
              {editingId ? 'Edit category' : 'New category'}
            </span>
            <button className="category-form-close" onClick={cancelForm} title="Cancel">
              ✕
            </button>
          </div>

          {/* Live preview of the colour + icon combination */}
          <div className="category-preview">
            <CategoryIcon category={draftIconPreview} size={40} radius={10} />
            <span className="category-preview-text">
              <span className="category-preview-name">
                {draft.name || 'Category name'}
              </span>
              <span className="category-preview-meta">
                 {tab === 'expense' ? 'Expense' : 'Income'}
              </span>
            </span>
          </div>

          <div className="category-field">
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. Groceries"
              value={draft.name}
              onChange={(e) => patchDraft({ name: e.target.value })}
              className={error ? 'has-error' : ''}
              autoFocus
            />
            {error && <p className="category-error">{error}</p>}
          </div>

          <div className="category-field">
            <label>Color</label>
            <div className="category-swatches">
              {CATEGORY_COLORS.map((hex) => (
                <button
                  key={hex}
                  className={`category-swatch ${hex === draft.color ? 'selected' : ''}`}
                  style={{ background: hex }}
                  title={hex}
                  onClick={() => patchDraft({ color: hex })}
                />
              ))}
            </div>
          </div>

          <div className="category-field">
            <label>Icon</label>
            <div className="category-icon-grid">
              {CATEGORY_ICONS.map((icon) => {
                const selected = icon.id === draft.icon
                return (
                  <button
                    key={icon.id}
                    className="category-icon-option"
                    style={{
                      background: selected ? tint(draft.color, 0.14) : 'var(--bg-card)',
                      borderColor: selected ? draft.color : 'var(--border-color)',
                    }}
                    title={icon.id}
                    onClick={() => patchDraft({ icon: icon.id })}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={selected ? draft.color : 'var(--text-secondary)'}
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={icon.d} />
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="category-form-buttons">
            <button className="category-save-btn" onClick={handleSave}>
              {editingId ? 'Save changes' : 'Add category'}
            </button>
            <button className="category-cancel-btn" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deleteTarget && (
        <div className="dialog-overlay" onClick={() => setDeleteId(null)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="category-dialog-header">
              <CategoryIcon category={deleteTarget} size={38} radius={10} />
              <span className="category-dialog-title">
                Delete “{deleteTarget.name}”?
              </span>
            </div>
            <p className="dialog-message">
              {deleteCount > 0
                ? `${deleteCount} ${deleteCount === 1 ? 'transaction' : 'transactions'} still use this category. They will be moved to “${FALLBACK_NAME}” and its budget limit will be removed.`
                : 'Nothing uses this category yet, so it is safe to remove.'}
            </p>
            <div className="dialog-buttons">
              <button className="dialog-cancel" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="dialog-confirm" onClick={confirmDelete}>
                Delete category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryManager