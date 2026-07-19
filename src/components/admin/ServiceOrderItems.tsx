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
  return (
    (row.quantity || 0) * (row.unit_price || 0) -
    (row.discount_amount || 0) +
    (row.surcharge_amount || 0)
  )
}

export function calcGrandTotal(rows: ItemRow[]): number {
  return rows.reduce((sum, r) => sum + calcItemTotal(r), 0)
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
        <div key={i} className="p-4 border rounded-lg space-y-3 bg-slate-50/50">
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
              <Input
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço Unit. (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={row.unit_price}
                onChange={(e) => updateRow(i, { unit_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desconto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={row.discount_amount}
                onChange={(e) => updateRow(i, { discount_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Acréscimo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={row.surcharge_amount}
                onChange={(e) =>
                  updateRow(i, { surcharge_amount: parseFloat(e.target.value) || 0 })
                }
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
              Total: {formatCurrency(calcItemTotal(row))}
            </span>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" type="button" onClick={addRow}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Item
      </Button>
      {items.length > 0 && (
        <div className="flex justify-end pt-2 border-t">
          <span className="text-base font-bold">
            Total Geral: {formatCurrency(calcGrandTotal(items))}
          </span>
        </div>
      )}
    </div>
  )
}
