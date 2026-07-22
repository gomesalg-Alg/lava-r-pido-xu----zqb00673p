import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

const parseLocalFloat = (val: string): number => {
  const clean = val.replace(/[^0-9.,-]/g, '')
  if (!clean) return 0
  const lastSep = Math.max(clean.lastIndexOf(','), clean.lastIndexOf('.'))
  if (lastSep === -1) return parseFloat(clean) || 0
  return (
    parseFloat(
      `${clean.substring(0, lastSep).replace(/[.,]/g, '')}.${clean.substring(lastSep + 1)}`,
    ) || 0
  )
}

interface Props {
  value: number
  onChange: (v: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function CurrencyInput({ value, onChange, className, placeholder, disabled }: Props) {
  const [str, setStr] = useState(() => (value || 0).toFixed(2).replace('.', ','))

  useEffect(() => {
    if (parseLocalFloat(str) !== value) {
      setStr((value || 0).toFixed(2).replace('.', ','))
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      type="text"
      inputMode="decimal"
      className={className}
      value={str}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setStr(e.target.value)}
      onBlur={() => {
        const p = parseLocalFloat(str)
        setStr(p.toFixed(2).replace('.', ','))
        onChange(p)
      }}
    />
  )
}
