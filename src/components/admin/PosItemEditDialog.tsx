import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/admin/CurrencyInput'
import { formatCurrency } from '@/lib/format'
import type { ServiceOrderItem } from '@/services/service-orders'
import { useFormKeyboard } from '@/hooks/use-form-keyboard'

interface EditItemData {
  quantity: number
  unit_price: number
  discount_amount: number
  discount_reason: string
  surcharge_amount: number
  surcharge_reason: string
  total_price: number
}

interface Props {
  item: ServiceOrderItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: EditItemData) => void
}

export function PosItemEditDialog({ item, open, onOpenChange, onSave }: Props) {
  const keyboardRef = useFormKeyboard<HTMLDivElement>()
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountReason, setDiscountReason] = useState('')
  const [surchargeAmount, setSurchargeAmount] = useState(0)
  const [surchargeReason, setSurchargeReason] = useState('')

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity || 1)
      setUnitPrice(item.unit_price || 0)
      setDiscountAmount(item.discount_amount || 0)
      setDiscountReason(item.discount_reason || '')
      setSurchargeAmount(item.surcharge_amount || 0)
      setSurchargeReason(item.surcharge_reason || '')
    }
  }, [item])

  const subtotal = (quantity || 0) * (unitPrice || 0)
  const total = subtotal - (discountAmount || 0) + (surchargeAmount || 0)

  const handleSave = () => {
    onSave({
      quantity,
      unit_price: unitPrice,
      discount_amount: discountAmount,
      discount_reason: discountReason,
      surcharge_amount: surchargeAmount,
      surcharge_reason: surchargeReason,
      total_price: total,
    })
    onOpenChange(false)
  }

  const itemName = item?.expand?.service_id?.name || item?.expand?.product_id?.name || '-'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={keyboardRef} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Item</Label>
            <p className="text-sm font-medium">{itemName}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço Unitário (R$)</Label>
              <CurrencyInput
                value={unitPrice}
                onChange={setUnitPrice}
                className="text-right"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Desconto (R$)</Label>
              <CurrencyInput
                value={discountAmount}
                onChange={setDiscountAmount}
                className="text-right"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motivo Desconto</Label>
              <Input
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Acréscimo (R$)</Label>
              <CurrencyInput
                value={surchargeAmount}
                onChange={setSurchargeAmount}
                className="text-right"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motivo Acréscimo</Label>
              <Input
                value={surchargeReason}
                onChange={(e) => setSurchargeReason(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Desconto</span>
                <span className="font-medium text-red-500">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {surchargeAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Acréscimo</span>
                <span className="font-medium text-green-600">
                  + {formatCurrency(surchargeAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
