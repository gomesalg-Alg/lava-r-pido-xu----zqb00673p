import { useState } from 'react'
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
import { formatCurrency } from '@/lib/format'
import { Trash2, CheckCircle } from 'lucide-react'

export type CartItem = {
  id?: string
  product_id?: string
  service_id?: string
  name: string
  quantity: number
  unit_price: number
  isExisting: boolean
}

const PAYMENTS = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Cortesia', 'Outros']

interface Props {
  items: CartItem[]
  onRemove: (index: number) => void
  onFinalize: (data: {
    payment_method: string
    total_discount: number
    total_surcharge: number
    amount_paid: number
  }) => void
  finalizing: boolean
}

export function PosCheckout({ items, onRemove, onFinalize, finalizing }: Props) {
  const [discount, setDiscount] = useState(0)
  const [surcharge, setSurcharge] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const grandTotal = subtotal - discount + surcharge
  const change = amountPaid - grandTotal
  const isCortesia = paymentMethod === 'Cortesia'

  const handleFinalize = () => {
    onFinalize({
      payment_method: paymentMethod,
      total_discount: discount,
      total_surcharge: surcharge,
      amount_paid: isCortesia ? 0 : amountPaid,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-center text-slate-400 py-4 text-sm">Nenhum item adicionado.</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.quantity}x {formatCurrency(item.unit_price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {formatCurrency(item.unit_price * item.quantity)}
              </span>
              {!item.isExisting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(i)}
                  className="text-red-600 p-1 h-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Desconto (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={discount || ''}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Acréscimo (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={surcharge || ''}
            onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-1 border-t pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Desconto</span>
          <span className="font-medium text-red-600">-{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Acréscimo</span>
          <span className="font-medium text-green-600">+{formatCurrency(surcharge)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-1 border-t">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Forma de Pagamento *</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor Pago (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={isCortesia ? '' : amountPaid || ''}
            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
            disabled={isCortesia}
            placeholder={isCortesia ? 'Cortesia' : ''}
          />
        </div>
      </div>

      {!isCortesia && amountPaid > 0 && (
        <div className="flex justify-between text-base font-bold p-3 bg-green-50 rounded-md">
          <span>Troco</span>
          <span className="text-green-700">{formatCurrency(Math.max(0, change))}</span>
        </div>
      )}

      <Button
        onClick={handleFinalize}
        disabled={finalizing || !paymentMethod || items.length === 0}
        className="w-full h-12 text-base"
        size="lg"
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        {finalizing ? 'Finalizando...' : 'Finalizar Venda'}
      </Button>
    </div>
  )
}
