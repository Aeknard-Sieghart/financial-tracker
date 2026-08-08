// Shared icon + color vocabulary for categories.

export const CATEGORY_ICONS = [
  { id: 'home', d: 'M3 10.8 12 3.5l9 7.3M5.6 9.6V20h12.8V9.6M9.8 20v-5.4h4.4V20' },
  { id: 'cart', d: 'M2.8 4h2.2l2.3 9.8h9.9l2-7H6.6M8.8 18.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8M17 18.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8' },
  { id: 'food', d: 'M7 3.2v7.2M10.2 3.2v7.2M8.6 10.4V20.8M16.4 3.2v17.6M16.4 3.2c2.2 1.2 2.2 5.4 0 6.6' },
  { id: 'car', d: 'M4 16.4v-2.2l1.9-5.2h12.2l1.9 5.2v2.2H4zM7.2 16.4v1.8H4.8v-1.8M19.2 16.4v1.8h-2.4v-1.8M7.4 13.4h9.2' },
  { id: 'bolt', d: 'M13.4 3 5.6 13.8h5.4l-.8 7.2 7.8-10.8h-5.2z' },
  { id: 'wifi', d: 'M3 9.4a13 13 0 0 1 18 0M6.4 13a8.4 8.4 0 0 1 11.2 0M9.8 16.6a4 4 0 0 1 4.4 0M12 20.2h.1' },
  { id: 'film', d: 'M4 4.4h16v15.2H4zM4 9h16M4 15h16M8.4 4.4v15.2M15.6 4.4v15.2' },
  { id: 'gift', d: 'M3.6 8.8h16.8v3.6H3.6zM5.2 12.4v7.8h13.6v-7.8M12 8.8v11.4M12 8.8C10.6 8.8 7.6 8.6 7.6 6.4A2.2 2.2 0 0 1 12 8.8M12 8.8c1.4 0 4.4-.2 4.4-2.4A2.2 2.2 0 0 0 12 8.8' },
  { id: 'shirt', d: 'M8.6 3.4 12 6l3.4-2.6 4.4 2.6-2 4-2-1v12H6.2V8.4l-2 1-2-4z' },
  { id: 'heart', d: 'M12 20.4S3.8 15.6 3.8 9.9A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 8.2 2.3c0 5.7-8.2 10.5-8.2 10.5z' },
  { id: 'health', d: 'M9.6 3.6h4.8v5.6H20v4.8h-5.6v5.6H9.6v-5.6H4V9.2h5.6z' },
  { id: 'book', d: 'M4 4.4h6.4A2.6 2.6 0 0 1 12 6.8v13a2.2 2.2 0 0 0-1.8-1.2H4zM20 4.4h-6.4A2.6 2.6 0 0 0 12 6.8v13a2.2 2.2 0 0 1 1.8-1.2H20z' },
  { id: 'school', d: 'M2.6 8.6 12 4.4l9.4 4.2L12 12.8zM6.6 10.8v5.4c0 1.6 2.4 2.8 5.4 2.8s5.4-1.2 5.4-2.8v-5.4M20.4 9.6v6' },
  { id: 'work', d: 'M3.4 8h17.2v11.6H3.4zM8.8 8V5.6h6.4V8M3.4 13h17.2' },
  { id: 'plane', d: 'M2.6 13.4 21.4 6l-4 6 1.4 6.6-3.4-1.6-2.6 2.8-1-4.6z' },
  { id: 'coffee', d: 'M4.4 6.6h12v6.8a4.4 4.4 0 0 1-8.8 0zM16.4 8h2a2.4 2.4 0 0 1 0 4.8h-2M4.4 20.4h12' },
  { id: 'gym', d: 'M4 8.4v7.2M7 6.4v11.2M17 6.4v11.2M20 8.4v7.2M7 12h10' },
  { id: 'phone', d: 'M7.4 3.4h9.2v17.2H7.4zM10.8 18h2.4' },
  { id: 'pet', d: 'M8 13.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4M16 13.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4M12 20.4c-2.4 0-4.4-1.6-4.4-3.4S9.6 14 12 14s4.4 1.2 4.4 3-2 3.4-4.4 3.4' },
  { id: 'repair', d: 'M14.6 3.4a4.6 4.6 0 0 0 5 7.4l-9.8 9.8-3.4-3.4L16.2 7.4a4.6 4.6 0 0 1-1.6-4z' },
  { id: 'savings', d: 'M4 12.6C4 9.8 7.6 8 12 8s8 1.8 8 4.6v1.6c0 2.8-3.6 4.6-8 4.6s-8-1.8-8-4.6zM4.4 11 2.8 9.4M15.4 12.4h.1M9 8.2 8.2 5.4' },
  { id: 'wallet', d: 'M3.6 6.8h16.8v12.4H3.6zM3.6 11.6h6a2.4 2.4 0 0 0 4.8 0h6M17 4.6H6.4' },
  { id: 'growth', d: 'M3.6 17.4 9.4 11l3.6 3.4 7.4-7.6M15.4 6.8h5v5' },
  { id: 'tag', d: 'M12.4 3.6H20v7.6l-9 9-8.4-8.4zM16.4 7.6h.1' },
]

// Swatches offered in the category form.
export const CATEGORY_COLORS = [
  '#4f46e5', '#16a34a', '#dc2626', '#f59e0b', '#0ea5e9',
  '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#64748b',
]

// Used when a transaction points at a category that no longer exists.
export const FALLBACK_CATEGORY = { name: 'Other', color: '#64748b', icon: 'tag' }

// Look up an icon path by id, falling back to the generic tag icon.
export function iconPath(id) {
  const found = CATEGORY_ICONS.find((i) => i.id === id)
  return found ? found.d : CATEGORY_ICONS[CATEGORY_ICONS.length - 1].d
}

// Turn a hex colour into a translucent rgba() for icon backgrounds.
export function tint(hex, alpha = 0.14) {
  const value = String(hex).slice(1);
  const n = parseInt(value, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}
