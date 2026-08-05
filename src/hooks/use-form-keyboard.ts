import { useCallback, useEffect, useRef } from 'react'

export function useFormKeyboard<T extends HTMLElement = HTMLDivElement>() {
  const cleanupRef = useRef<(() => void) | null>(null)

  const setRef = useCallback((el: T | null) => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    if (!el) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA') return
      if (target.tagName === 'BUTTON') return
      if (target.getAttribute('role') === 'combobox') return

      e.preventDefault()
      const focusable = el.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), button:not([disabled]):not([type="submit"]), [tabindex]:not([tabindex="-1"])',
      )
      const list = Array.from(focusable)
      const index = list.indexOf(target)
      if (index >= 0 && index < list.length - 1) {
        list[index + 1].focus()
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

    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('focusin', handleFocusIn)
    cleanupRef.current = () => {
      el.removeEventListener('keydown', handleKeyDown)
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
