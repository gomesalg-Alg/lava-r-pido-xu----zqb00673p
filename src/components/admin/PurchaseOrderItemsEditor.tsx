import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/services/products'

export type PurchaseOrderItemRow = {
  id?: string
  product_id: string
  quantity: number
  unit_price: number
}

interface Props {
  items: PurchaseOrderItemRow[]
  products: Product[]
  onChange: (items: PurchaseOrderItemRow[]) => void
  readOnly?: boolean
}

export function PurchaseOrderItemsEditor({ items, products, onChange, readOnly }: Props) {
  const update = (i: number, patch: Partial<PurchaseOrderItemRow>) =>
    onChange(items.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Produto</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-24">Qtd</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600 w-32">Preço Unit.</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600 w-32">Total</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i} className="border-b last:border-0 even:bg-slate-50">
                <td className="px-3 py-2">
                  <Select
                    value={row.product_id}
                    onValueChange={(v) => {
                      const p = products.find((p) => p.id === v)
                      update(i, { product_id: v, unit_price: p?.price || 0 })
                    }}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={row.quantity}
                    onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                    disabled={readOnly}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    className="h-8 text-xs"
                    value={row.unit_price}
                    onChange={(e) => update(i, { unit_price: parseFloat(e.target.value) || 0 })}
                    disabled={readOnly}
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  {formatCurrency((row.quantity || 0) * (row.unit_price || 0))}
                </td>
                {!readOnly && (
                  <td className="px-2 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="text-red-600 h-8 w-8 p-0"
                      onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onChange([...items, { product_id: '', quantity: 1, unit_price: 0 }])}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Item
        </Button>
      )}
    </div>
  )
}
