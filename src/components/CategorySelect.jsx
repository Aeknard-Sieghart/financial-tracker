import { useState, useRef, useEffect } from 'react'
import CategoryIcon from './CategoryIcon'
import { FALLBACK_CATEGORY } from '../constants/categoryIcons'

// Category picker that shows the colour + icon alongside the name.
function CategorySelect({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  const selected =
    options.find((c) => c.name === value) || { ...FALLBACK_CATEGORY, name: value }

  // Close when clicking anywhere outside the picker
  useEffect(() => {

    if (!isOpen)
      return

    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function pick(name) {
    onChange(name)
    setIsOpen(false)
  }

  return (
    <div className="category-select" ref={wrapperRef}>
      <button
        type="button"
        className="category-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <CategoryIcon category={selected} size={26} radius={7} strokeWidth={1.8} />
        <span className="category-select-name">{selected.name}</span>
        <span className={`category-select-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div className="category-select-panel">
          {options.map((category) => (
            <button
              key={category.id || category.name}
              type="button"
              className={`category-select-option ${category.name === value ? 'selected' : ''}`}
              onClick={() => pick(category.name)}
            >
              <CategoryIcon category={category} size={26} radius={7} strokeWidth={1.8} />
              <span className="category-select-name">{category.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CategorySelect