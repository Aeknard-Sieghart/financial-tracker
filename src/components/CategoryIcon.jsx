import { iconPath, tint } from '../constants/categoryIcons'

// Tinted rounded square with the category's icon stroked in its colour.
// Used in the manager list, transaction rows, budget rows and the form preview.
function CategoryIcon(
  { category,
    size = 34, 
    radius = 9, 
    strokeWidth = 1.7
  }
) {
  const color = category?.color || '#64748b'
  const d = iconPath(category && category.icon)
  const glyph = Math.round(size * 0.53)

  return (
    <span
      className="category-icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tint(color),
      }}
    >
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"  
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
    </span>
  )
}

export default CategoryIcon