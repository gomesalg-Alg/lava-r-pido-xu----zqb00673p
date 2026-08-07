import { useCallback, useEffect, useRef } from 'react'

export function useFormKeyboard<T extends HTMLElement = HTMLDivElement>() {
  const cleanupRef = useRef<(() => void) | null>(null)

  const setRef = useCallback((el: T | null) => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    if (!el) return

    const FOCUSABLE_SELECTOR =
      'input:not([disabled]):not([type="hidden"]):not([readonly]), ' +
      'select:not([disabled]):not([readonly]), ' +
      'textarea:not([disabled]):not([readonly]), ' +
      'button:not([disabled]):not([type="submit"]), ' +
      '[tabindex]:not([tabindex="-1"])'

    const getFocusableList = (): HTMLElement[] => {
      const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      return Array.from(focusable).filter(
        (node) => node.offsetParent !== null || node.getClientRects().length > 0,
      )
    }

    const focusRelative = (target: HTMLElement, direction: 1 | -1) => {
      const list = getFocusableList()
      const index = list.indexOf(target)
      if (index === -1) return
      const nextIndex = index + direction
      if (nextIndex >= 0 && nextIndex < list.length) {
        list[nextIndex].focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTextarea = target.tagName === 'TEXTAREA'
      const isNativeSelect = target.tagName === 'SELECT'
      const isCombobox = target.getAttribute('role') === 'combobox'
      const comboboxOpen = target.getAttribute('aria-expanded') === 'true'
      const isPlainButton = target.tagName === 'BUTTON' && !isCombobox

      if (e.key === 'Enter') {
        if (isTextarea || isPlainButton || comboboxOpen) return
        e.preventDefault()
        e.stopPropagation()
        focusRelative(target, 1)
      } else if (e.key === 'ArrowDown') {
        if (isTextarea || comboboxOpen || isNativeSelect) return
        e.preventDefault()
        e.stopPropagation()
        focusRelative(target, 1)
      } else if (e.key === 'ArrowUp') {
        if (isTextarea || comboboxOpen || isNativeSelect) return
        e.preventDefault()
        e.stopPropagation()
        focusRelative(target, -1)
      }
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement
      if (
        target.tagName === 'INPUT' &&
        (target.type === 'number' || target.inputMode === 'decimal')
      ) {
        requestAnimationFrame(() => target.select())
      }
    }

    el.addEventListener('keydown', handleKeyDown, true)
    el.addEventListener('focusin', handleFocusIn)
    cleanupRef.current = () => {
      el.removeEventListener('keydown', handleKeyDown, true)
      el.removeEventListener('focusin', handleFocusIn)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current()
    }
  }, [])

  return setRef
}
