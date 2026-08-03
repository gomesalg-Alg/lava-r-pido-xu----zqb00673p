import { useState, useMemo, useEffect } from 'react'
import { PosProductGrid } from '@/components/admin/PosProductGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { createVendaAvulsa } from '@/services/vendas-avulsas'
import { getCustomers } from '@/services/customers'
import { toast } from 'sonner'
import type { Product } from '@/services/products'

interface SaleItem {
  product_id: string
  name: string
  unit_price: number
  quantity: number
  total_price: number
}

const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Pix',
  'Cortesia',
  'Outros',
]

export function PosVendaAvulsa() {
  const [items, setItems] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [customerDoc, setCustomerDoc] = useState('')
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro')
  const [amountReceived, setAmountReceived] = useState('')
  const [saving, setSaving] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(() => {})
  }, [])

  const total = useMemo(() => items.reduce((s, i) => s + i.total_price, 0), [items])

  const handleAddProduct = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
            : i,
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          unit_price: product.price || 0,
          quantity: 1,
          total_price: product.price || 0,
        },
      ]
    })
  }

  const updateQty = (pid: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product_id === pid
            ? {
                ...i,
                quantity: i.quantity + delta,
                total_price: (i.quantity + delta) * i.unit_price,
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }

  const change = useMemo(
    () => Math.max(0, (parseFloat(amountReceived) || 0) - total),
    [amountReceived, total],
  )

  const handleCheckout = async () => {
    if (!items.length) return
    setSaving(true)
    try {
      await createVendaAvulsa({
        customer_id: customerId || null,
        customer_document: customerDoc || null,
        items,
        total_amount: total,
        payment_method: paymentMethod,
        change_amount: change,
      })
      toast.success('Venda registrada!')
      setItems([])
      setCustomerId('')
      setCustomerDoc('')
      setAmountReceived('')
      setCheckoutOpen(false)
    } catch {
      toast.error('Erro ao registrar venda')
    } finally {
      setSaving(false)
    }
  }

  const customerOpts = [
    { value: '', label: 'Consumidor Final' },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <PosProductGrid onAdd={handleAddProduct} />
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <Label>Cliente (opcional)</Label>
              <SearchableSelect
                options={customerOpts}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Selecionar..."
                searchPlaceholder="Buscar..."
              />
            </div>
            <div className="space-y-1">
              <Label>Documento</Label>
              <Input
                value={customerDoc}
                onChange={(e) => setCustomerDoc(e.target.value)}
                placeholder="CPF/CNPJ..."
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Itens</h3>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            {items.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">Nenhum item adicionado.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-2 p-2 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQty(item.product_id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQty(item.product_id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-600"
                      onClick={() =>
                        setItems((p) => p.filter((i) => i.product_id !== item.product_id))
                      }
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <span className="w-20 text-right text-sm font-bold">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {items.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
              <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="space-y-1">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valor Recebido</Label>
              <Input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0,00"
              />
            </div>
            {change > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Troco:</span>
                <span className="font-medium">{formatCurrency(change)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={saving}>
              {saving ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
