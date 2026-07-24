import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { getServices, type Service } from '@/services/services'
import { getUsers, type User } from '@/services/users'

import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const parseLocalFloat = (val: string) => {
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

function NumCell({
  value,
  onChange,
  prefix,
}: {
  value: number
  onChange: (v: number) => void
  prefix?: string
}) {
  const [str, setStr] = useState(() => (value || 0).toFixed(2).replace('.', ','))
  useEffect(() => {
    if (parseLocalFloat(str) !== value) setStr((value || 0).toFixed(2).replace('.', ','))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        className={`h-8 text-xs px-2 ${prefix ? 'pl-7' : ''}`}
        value={str}
        onChange={(e) => setStr(e.target.value)}
        onBlur={() => {
          const p = parseLocalFloat(str)
          setStr(p.toFixed(2).replace('.', ','))
          onChange(p)
        }}
      />
    </div>
  )
}

export type ItemRow = {
  id?: string
  service_id: string
  product_id: string
  operator_id: string
  quantity: number
  unit_price: number
  discount_amount: number
  discount_reason: string
  surcharge_amount: number
  surcharge_reason: string
}

export function calcItemTotal(row: ItemRow): number {
  const subtotal = (row.quantity || 0) * (row.unit_price || 0)
  return subtotal - (row.discount_amount || 0) + (row.surcharge_amount || 0)
}

export function calcGrandTotal(rows: ItemRow[]): number {
  return rows.reduce((s, r) => s + calcItemTotal(r), 0)
}

export const emptyItemRow = (): ItemRow => ({
  service_id: '',
  product_id: '',
  operator_id: '',
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  discount_reason: '',
  surcharge_amount: 0,
  surcharge_reason: '',
})

function isNewItemInvalid(row: ItemRow): boolean {
  if (row.id) return false
  if (!row.service_id && !row.product_id) return false
  if ((row.unit_price || 0) === 0) return true
  const total = (row.quantity || 0) * (row.unit_price || 0)
  if (total === 0) return true
  return false
}

interface Props {
  items: ItemRow[]
  onChange: (items: ItemRow[]) => void
}

export function ServiceOrderItems({ items, onChange }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {})
    getUsers()
      .then(setUsers)
      .catch(() => {})
  }, [])

  const updateRow = (i: number, patch: Partial<ItemRow>) =>
    onChange(items.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const getItemValue = (row: ItemRow) => (row.service_id ? `svc-${row.service_id}` : '')

  const handleItemSelect = (i: number, val: string) => {
    if (val.startsWith('svc-')) {
      const id = val.slice(4)
      const svc = services.find((s) => s.id === id)
      updateRow(i, { service_id: id, product_id: '', unit_price: svc?.price || 0 })
    }
  }

  const invalidNewItem = useMemo(() => items.find((row) => isNewItemInvalid(row)), [items])

  const canAddItem = !invalidNewItem

  const handleAddItem = () => {
    if (!canAddItem) return
    onChange([...items, emptyItemRow()])
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="text-left px-3 py-2 font-semibold text-slate-600 min-w-[200px]">
                Item
              </th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600 min-w-[140px]">
                Operador
              </th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-20">Qtd</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-24">Preço Unit.</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600 w-24">Total</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhum item adicionado. Clique em &quot;Adicionar Item&quot; para começar.
                </td>
              </tr>
            ) : (
              items.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'hover:bg-slate-100/50 transition-colors',
                    i % 2 === 1 ? 'bg-slate-50' : 'bg-white',
                    row.service_id && calcItemTotal(row) <= 0 && 'bg-red-50',
                  )}
                >
                  <td className="px-3 py-2">
                    <Select value={getItemValue(row)} onValueChange={(v) => handleItemSelect(i, v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-xs">Serviços</SelectLabel>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={`svc-${s.id}`} className="text-xs">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={row.operator_id}
                      onValueChange={(v) => updateRow(i, { operator_id: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="text-xs">
                            {u.name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <NumCell value={row.quantity} onChange={(v) => updateRow(i, { quantity: v })} />
                  </td>
                  <td className="px-3 py-2">
                    <NumCell
                      value={row.unit_price}
                      onChange={(v) => updateRow(i, { unit_price: v })}
                      prefix="R$"
                    />
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <div
                      className={cn(
                        'font-bold',
                        calcItemTotal(row) <= 0 && row.service_id
                          ? 'text-red-600'
                          : 'text-slate-700',
                      )}
                    >
                      {formatCurrency(calcItemTotal(row))}
                    </div>
                    {row.service_id && calcItemTotal(row) <= 0 && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        O valor do item deve ser maior que zero
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                      className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!canAddItem && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            Não é possível adicionar um novo item enquanto existir um item com preço ou total igual
            a zero. Ajuste o preço unitário e a quantidade antes de continuar.
          </p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={handleAddItem}
        disabled={!canAddItem}
      >
        <Plus className="w-4 h-4 mr-2" /> Adicionar Item
      </Button>
      {items.length > 0 && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t">
          <span className="text-sm font-medium text-slate-500">Valor Geral</span>
          <span className="text-lg font-bold text-slate-800">
            {formatCurrency(calcGrandTotal(items))}
          </span>
        </div>
      )}
    </div>
  )
}
