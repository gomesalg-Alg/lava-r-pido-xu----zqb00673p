import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { getServices, type Service } from '@/services/services'
import { getUsers, type User } from '@/services/users'
import { formatCurrency } from '@/lib/format'

const parseLocalFloat = (val: string) => {
  const clean = val.replace(/[^0-9.,-]/g, '')
  if (!clean) return 0
  const lastComma = clean.lastIndexOf(',')
  const lastDot = clean.lastIndexOf('.')
  const lastSep = Math.max(lastComma, lastDot)

  if (lastSep === -1) return parseFloat(clean) || 0

  const integerPart = clean.substring(0, lastSep).replace(/[.,]/g, '')
  const decimalPart = clean.substring(lastSep + 1)
  return parseFloat(`${integerPart}.${decimalPart}`) || 0
}

function LocalNumberInput({
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
    if (parseLocalFloat(str) !== value) {
      setStr((value || 0).toFixed(2).replace('.', ','))
    }
  }, [value])

  const handleBlur = () => {
    const parsed = parseLocalFloat(str)
    setStr(parsed.toFixed(2).replace('.', ','))
    onChange(parsed)
  }

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        className={prefix ? 'pl-9' : ''}
        value={str}
        onChange={(e) => setStr(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  )
}

export type ItemRow = {
  id?: string
  service_id: string
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
  const subtotal = rows.reduce((sum, r) => sum + calcItemTotal(r), 0)
  const discounts = rows.reduce((sum, r) => sum + (r.discount_amount || 0), 0)
  const surcharges = rows.reduce((sum, r) => sum + (r.surcharge_amount || 0), 0)
  return subtotal - discounts + surcharges
}

export const emptyItemRow = (): ItemRow => ({
  service_id: '',
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
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {})
    getUsers()
      .then(setUsers)
      .catch(() => {})
  }, [])

  const addRow = () => onChange([...items, emptyItemRow()])
  const removeRow = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const updateRow = (i: number, patch: Partial<ItemRow>) =>
    onChange(items.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const handleServiceSelect = (i: number, serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId)
    updateRow(i, { service_id: serviceId, unit_price: svc?.price || 0 })
  }

  return (
    <div className="space-y-3">
      {items.map((row, i) => (
        <div
          key={i}
          className={`p-4 border rounded-lg space-y-3 ${i % 2 === 1 ? 'bg-slate-100/70' : 'bg-slate-50/50'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Item {i + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => removeRow(i)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Serviço *</Label>
              <Select value={row.service_id} onValueChange={(v) => handleServiceSelect(i, v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Operador *</Label>
              <Select
                value={row.operator_id}
                onValueChange={(v) => updateRow(i, { operator_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <LocalNumberInput
                value={row.quantity}
                onChange={(v) => updateRow(i, { quantity: v })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço Unit. (R$)</Label>
              <LocalNumberInput
                prefix="R$"
                value={row.unit_price}
                onChange={(v) => updateRow(i, { unit_price: v })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desconto (R$)</Label>
              <LocalNumberInput
                prefix="R$"
                value={row.discount_amount}
                onChange={(v) => updateRow(i, { discount_amount: v })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Acréscimo (R$)</Label>
              <LocalNumberInput
                prefix="R$"
                value={row.surcharge_amount}
                onChange={(v) => updateRow(i, { surcharge_amount: v })}
              />
            </div>
          </div>
          {row.discount_amount > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Motivo do Desconto</Label>
              <Input
                value={row.discount_reason}
                onChange={(e) => updateRow(i, { discount_reason: e.target.value })}
              />
            </div>
          )}
          {row.surcharge_amount > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Motivo do Acréscimo</Label>
              <Input
                value={row.surcharge_reason}
                onChange={(e) => updateRow(i, { surcharge_reason: e.target.value })}
              />
            </div>
          )}
          <div className="flex justify-end">
            <span className="text-sm font-bold text-slate-700">
              Total: {formatCurrency((row.quantity || 0) * (row.unit_price || 0))}
            </span>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" type="button" onClick={addRow}>
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
