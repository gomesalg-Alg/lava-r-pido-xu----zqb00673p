import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PosProductGrid } from '@/components/admin/PosProductGrid'
import { CurrencyInput } from '@/components/admin/CurrencyInput'
import { getCustomers, type Customer } from '@/services/customers'
import { createVendaAvulsa } from '@/services/vendas-avulsas'
import { createOrderPayment } from '@/services/order-payments'
import { createAccountsReceivable } from '@/services/accounts-receivable'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { Trash2, CheckCircle, Search, ArrowLeft, Plus, Minus } from 'lucide-react'

type CartItem = { product_id: string; name: string; quantity: number; unit_price: number }
const PAYMENTS = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Cortesia', 'Outros']
const FLAGS = ['Visa', 'Mastercard', 'Elo']
const isCard = (m: string) => m === 'Cartão de Crédito' || m === 'Cartão de Débito'

export function VendaAvulsaForm({ onBack }: { onBack: () => void }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [method, setMethod] = useState('')
  const [amountPaid, setAmountPaid] = useState(0)
  const [cardFlag, setCardFlag] = useState('')
  const [installments, setInstallments] = useState(1)
  const [custSearch, setCustSearch] = useState('')
  const [custResults, setCustResults] = useState<Customer[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [surcharge, setSurcharge] = useState(0)

  useEffect(() => {
    if (!custSearch.trim()) return setCustResults([])
    const t = setTimeout(async () => {
      try {
        const all = await getCustomers()
        setCustResults(
          all
            .filter(
              (c) =>
                c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
                (c.cpf || '').includes(custSearch),
            )
            .slice(0, 5),
        )
      } catch {
        /* intentionally ignored */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [custSearch])

  const addProduct = (p: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product_id === p.id)
      if (ex)
        return prev.map((i) => (i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
      return [...prev, { product_id: p.id, name: p.name, quantity: 1, unit_price: p.price }]
    })
  }

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const total = subtotal - discount + surcharge
  const change = amountPaid - total
  const isCortesia = method === 'Cortesia'

  const handleFinalize = async () => {
    if (!method || cart.length === 0) return
    setFinalizing(true)
    try {
      const items = cart.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.quantity * i.unit_price,
      }))
      let pmStr = method
      if (isCard(method) && cardFlag) pmStr += ` – ${cardFlag}`
      if (method === 'Cartão de Crédito' && installments > 1) pmStr += ` – ${installments}x`
      const changeAmt = isCortesia ? 0 : Math.max(0, change)

      const venda = await createVendaAvulsa({
        customer_id: customer?.id || null,
        items,
        total_amount: total,
        payment_method: pmStr,
        change_amount: changeAmt,
      })

      await createOrderPayment({
        method,
        amount: isCortesia ? 0 : Math.max(total, amountPaid),
        card_flag: isCard(method) ? cardFlag : '',
        installments: method === 'Cartão de Crédito' ? installments : 1,
      })

      await createAccountsReceivable({
        customer_id: customer?.id || null,
        order_id: null,
        venda_avulsa_id: venda.id,
        description: `Venda Avulsa – ${customer?.name || 'Cliente Avulso'}`,
        amount: total,
        due_date: new Date().toISOString().split('T')[0],
        status: 'Recebido',
        payment_method: pmStr,
        received_at: new Date().toISOString(),
      })

      toast.success('Venda avulsa finalizada!')
      onBack()
    } catch {
      toast.error('Erro ao finalizar venda avulsa')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">Venda Avulsa</h1>
      </div>

      {customer ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-sm">
          <span className="font-medium text-sm">{customer.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCustomer(null)
              setCustSearch('')
            }}
          >
            Remover
          </Button>
        </div>
      ) : (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar cliente (opcional)..."
            value={custSearch}
            onChange={(e) => setCustSearch(e.target.value)}
            className="pl-9"
          />
          {custResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {custResults.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                  onClick={() => {
                    setCustomer(c)
                    setCustSearch('')
                    setCustResults([])
                  }}
                >
                  {c.name}
                  {c.cpf && <span className="text-slate-400 ml-2">CPF: {c.cpf}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <PosProductGrid onAdd={(p) => addProduct(p)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold">Carrinho</h2>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {cart.length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm">
                  Nenhum produto adicionado.
                </p>
              )}
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.unit_price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setCart((prev) =>
                          prev.map((i) =>
                            i.product_id === item.product_id
                              ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                              : i,
                          ),
                        )
                      }
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setCart((prev) =>
                          prev.map((i) =>
                            i.product_id === item.product_id
                              ? { ...i, quantity: i.quantity + 1 }
                              : i,
                          ),
                        )
                      }
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-bold w-20 text-right">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 p-1 h-auto"
                      onClick={() =>
                        setCart((prev) => prev.filter((i) => i.product_id !== item.product_id))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Desconto (R$)</Label>
                <CurrencyInput
                  value={discount}
                  onChange={setDiscount}
                  className="text-right"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Acréscimo (R$)</Label>
                <CurrencyInput
                  value={surcharge}
                  onChange={setSurcharge}
                  className="text-right"
                  placeholder="0,00"
                />
              </div>
            </div>
            {(discount > 0 || surcharge > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pagamento *</Label>
                <Select value={method} onValueChange={setMethod}>
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
                <CurrencyInput
                  value={amountPaid}
                  onChange={setAmountPaid}
                  disabled={isCortesia}
                  placeholder={isCortesia ? 'Cortesia' : '0,00'}
                />
              </div>
            </div>
            {isCard(method) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bandeira</Label>
                  <Select value={cardFlag} onValueChange={setCardFlag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bandeira" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLAGS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {method === 'Cartão de Crédito' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Parcelas</Label>
                    <Select
                      value={String(installments)}
                      onValueChange={(v) => setInstallments(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            {!isCortesia && amountPaid > 0 && change > 0 && (
              <div className="flex justify-between text-base font-bold p-3 bg-green-50 rounded-md">
                <span>Troco</span>
                <span className="text-green-700">{formatCurrency(change)}</span>
              </div>
            )}
            <Button
              onClick={handleFinalize}
              disabled={finalizing || !method || cart.length === 0}
              className="w-full h-12"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {finalizing ? 'Finalizando...' : 'Finalizar Venda'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
