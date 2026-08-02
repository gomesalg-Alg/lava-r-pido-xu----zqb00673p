import { useState, useMemo, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  key: string | null
  direction: SortDirection
}

function getNestedValue(obj: any, path: string): any {
  if (!obj) return null
  const keys = path.split('.')
  let current: any = obj
  for (const key of keys) {
    if (current == null) return null
    current = current[key]
  }
  return current
}

function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === 'number' && typeof b === 'number') return a - b

  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()

  const aStr = String(a).toLowerCase().trim()
  const bStr = String(b).toLowerCase().trim()

  if (aStr < bStr) return -1
  if (aStr > bStr) return 1
  return 0
}

export function useSortableData<T>(
  items: T[],
  initialSort: SortState = { key: null, direction: null },
) {
  const [sortState, setSortState] = useState<SortState>(initialSort)

  const sortedItems = useMemo(() => {
    if (!sortState.key || !sortState.direction) return items
    return [...items].sort((a, b) => {
      const aVal = getNestedValue(a, sortState.key!)
      const bVal = getNestedValue(b, sortState.key!)
      const result = compareValues(aVal, bVal)
      return sortState.direction === 'asc' ? result : -result
    })
  }, [items, sortState])

  const toggleSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      if (prev.direction === 'desc') return { key: null, direction: null }
      return { key, direction: 'asc' }
    })
  }, [])

  return { sortedItems, sortState, toggleSort }
}
