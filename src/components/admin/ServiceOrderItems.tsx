import { useState, useEffect } from 'react'
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
import { Plus, Trash2 } from 'lucide-react'
import { getServices, type Service } from '@/services/services'
import { getUsers, type User } from '@/services/users'
import { getProducts, type Product } from '@/services/products'
import { formatCurrency } from '@/lib/format'

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
  return (row.quantity || 0) * (row.unit_price || 0)
}

export function calcGrandTotal(rows: ItemRow[]): number {
  const subtotal = rows.reduce((s, r) => s + calcItemTotal(r), 0)
  const discounts = rows.reduce((s, r) => s + (r.discount_amount || 0), 0)
  const surcharges = rows.reduce((s, r) => s + (r.surcharge_amount || 0), 0)
  return subtotal - discounts + surcharges
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

interface Props {
  items: ItemRow[]
  onChange: (items: ItemRow[]) => void
}

export function ServiceOrderItems({ items, onChange }: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {})
    getProducts()
      .then(setProducts)
      .catch(() => {})
    getUsers()
      .then(setUsers)
      .catch(() => {})
  }, [])

  const updateRow = (i: number, patch: Partial<ItemRow>) =>
    onChange(items.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const getItemValue = (row: ItemRow) =>
    row.service_id ? `svc-${row.service_id}` : row.product_id ? `prod-${row.product_id}` : ''

  const handleItemSelect = (i: number, val: string) => {
    if (val.startsWith('svc-')) {
      const id = val.slice(4)
      const svc = services.find((s) => s.id === id)
      updateRow(i, { service_id: id, product_id: '', unit_price: svc?.price || 0 })
    } else {
      const id = val.slice(5)
      const prod = products.find((p) => p.id === id)
      updateRow(i, { service_id: '', product_id: id, unit_price: prod?.price || 0 })
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
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
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-28">Desconto</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-28">Acréscimo</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600 w-24">Total</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </td>
              </tr>
            ) : (
              items.map((row, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
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
                        {products.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-xs">Produtos</SelectLabel>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={`prod-${p.id}`} className="text-xs">
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
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
                  <td className="px-3 py-2">
                    <NumCell
                      value={row.discount_amount}
                      onChange={(v) => updateRow(i, { discount_amount: v })}
                      prefix="R$"
                    />
                    {row.discount_amount > 0 && (
                      <Input
                        value={row.discount_reason}
                        onChange={(e) => updateRow(i, { discount_reason: e.target.value })}
                        className="h-7 text-[10px] mt-1"
                        placeholder="Motivo"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <NumCell
                      value={row.surcharge_amount}
                      onChange={(v) => updateRow(i, { surcharge_amount: v })}
                      prefix="R$"
                    />
                    {row.surcharge_amount > 0 && (
                      <Input
                        value={row.surcharge_reason}
                        onChange={(e) => updateRow(i, { surcharge_reason: e.target.value })}
                        className="h-7 text-[10px] mt-1"
                        placeholder="Motivo"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-700 whitespace-nowrap">
                    {formatCurrency(calcItemTotal(row))}
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
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => onChange([...items, emptyItemRow()])}
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
