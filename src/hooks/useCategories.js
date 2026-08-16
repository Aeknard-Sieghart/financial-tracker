import { useState, useEffect } from 'react'
import { FALLBACK_CATEGORY } from '../constants/categoryIcons'

// The categories the app ships with. `builtin: true` only affects the
// "Default / Custom" label in the manager — built-ins are still editable.
export const DEFAULT_CATEGORIES = {
  expense: [
    { id: 'e1', name: 'Rent', color: '#4f46e5', icon: 'home', builtin: true },
    { id: 'e2', name: 'Food', color: '#f59e0b', icon: 'food', builtin: true },
    { id: 'e3', name: 'Transport', color: '#0ea5e9', icon: 'car', builtin: true },
    { id: 'e4', name: 'Utilities', color: '#14b8a6', icon: 'bolt', builtin: true },
    { id: 'e5', name: 'Entertainment', color: '#ec4899', icon: 'film', builtin: true },
    { id: 'e6', name: 'Shopping', color: '#8b5cf6', icon: 'cart', builtin: true },
    { id: 'e7', name: 'Other', color: '#64748b', icon: 'tag', builtin: true },
  ],
  income: [
    { id: 'i1', name: 'Salary', color: '#16a34a', icon: 'wallet', builtin: true },
    { id: 'i2', name: 'Freelance', color: '#0ea5e9', icon: 'work', builtin: true },
    { id: 'i3', name: 'Bonus', color: '#f59e0b', icon: 'gift', builtin: true },
    { id: 'i4', name: 'Investment', color: '#8b5cf6', icon: 'growth', builtin: true },
    { id: 'i5', name: 'Other', color: '#64748b', icon: 'tag', builtin: true },
  ],
}

// "Other" is the landing spot for transactions whose category gets deleted,
// so it can't itself be deleted.
export const FALLBACK_NAME = FALLBACK_CATEGORY.name

// Short, collision-resistant id for user-created categories.
export function makeCategoryId() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// Find the category a transaction belongs to. Falls back to a grey tag so
// older transactions with a since-deleted category still render.
export function findCategory(categories, type, name) {
  const list = (categories && categories[type]) || []
  return list.find((c) => c.name === name) || { ...FALLBACK_CATEGORY, name }
}

// Every category name, both types, de-duplicated and sorted — for filter menus.
export function allCategoryNames(categories) {
  const names = [
    ...(categories.expense || []).map((c) => c.name),
    ...(categories.income || []).map((c) => c.name),
  ]
  return [...new Set(names)].sort()
}

// Pull in any category names that exist on saved transactions but aren't in
// the list yet, so upgrading from the hardcoded version doesn't orphan data.
function adoptOrphans(categories) {
  let transactions = []
  try {
    transactions = JSON.parse(localStorage.getItem('transactions')) || []
  } catch {
    transactions = []
  }

  const merged = {
    expense: [...categories.expense],
    income: [...categories.income],
  }

  transactions.forEach((t) => {
    const type = t.type === 'income' ? 'income' : 'expense'

    if (!t.category) 
      return

    if (merged[type].some((c) => c.name === t.category)) 
      return

    merged[type].push({
      id: makeCategoryId(),
      name: t.category, 
      color: '#64748b',
      icon: 'tag',
      builtin: false,
    })
  })

  return merged
}

export function useCategories() {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.expense && parsed.income) 
          return parsed
      } catch {
        // Corrupt value — fall through to defaults.
      }
    }
    return adoptOrphans(DEFAULT_CATEGORIES)
  })

  // Persist on every change.
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  return { categories, setCategories }
}