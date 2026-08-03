import { useState, useEffect } from 'react'
import { CheckCircle, Wallet, Package, Trash2, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentLines } from '@/components/admin/PaymentLines'
import { PosProductGrid } from '@/components/admin/PosProductGrid'
import { CurrencyInput } from '@/components/admin/CurrencyInput'
import { Label } from '@/components/ui/label'
import { getCardRates, getRateForPayment, type CardRate } from '@/services/card-rates'
import { createOrderPayment, buildPaymentData, type PaymentLine } from '@/services/order-payments'
import { createVendaAvulsa, type VendaAvulsaItem } from '@/services/vendas-avulsas'
import { createAccountsReceivable } from '@/services/accounts-receivable'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Product } from '@/services/products'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'
import { Input } from '@/components/ui/input'
import { maskCPFCNPJ, validateCPFCNPJ } from '@/lib/masks'

interface CartItem {
  product: Product
  quantity: number
}

export function PosVendaAvulsa() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cardRates, setCardRates] = useState<CardRate[]>([])
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([])
  const [discount, setDiscount] = useState(0)
  const [surcharge, setSurcharge] = useState(0)
  const [finalizing, setFinalizing] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState('')
  const [customerDocument, setCustomerDocument] = useState('')
  const [docError, setDocError] = useState('')

  useEffect(() => {
    getCardRates()
      .then(setCardRates)
      .catch(() => {})
    getActiveBankAccounts()
      .then(setBankAccounts)
      .catch(() => {})
  }, [])

  const addProduct = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const finalTotal = subtotal - discount + surcharge
  const totalPaid = paymentLines
    .filter((l) => l.method && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0)
  const remaining = finalTotal - totalPaid
  const troco = Math.max(0, totalPaid - finalTotal)
  const canFinalize =
    remaining <= 0.01 && paymentLines.length > 0 && cart.length > 0 && !!selectedBankId

  const handleFinalize = async () => {
    if (!canFinalize) return
    setFinalizing(true)
    try {
      const items: VendaAvulsaItem[] = cart.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unit_price: Math.round(i.product.price * 100) / 100,
        total_price: Math.round(i.product.price * i.quantity * 100) / 100,
      }))

      const vendaData: Record<string, unknown> = {
        items,
        total_amount: Math.round(finalTotal * 100) / 100,
        payment_method: paymentLines.map((l) => l.method).join(' + '),
        change_amount: Math.round(troco * 100) / 100,
      }
      if (customerDocument.trim()) vendaData.customer_document = customerDocument.trim()
      const venda = await createVendaAvulsa(vendaData)

      const validLines = paymentLines.filter((l) => l.method && l.amount > 0)
      const nowIso = new Date().toISOString()
      const today = nowIso.split('T')[0]

      for (const line of validLines) {
        const isCard = line.method === 'Cartão de Crédito' || line.method === 'Cartão de Débito'
        const appliedRate =
          isCard && line.card_flag
            ? getRateForPayment(cardRates, line.card_flag, line.method, line.installments)
            : 0
        const feeAmount = line.amount > 0 ? (line.amount * appliedRate) / 100 : 0

        await createOrderPayment(
          buildPaymentData({
            venda_avulsa_id: venda.id,
            method: line.method,
            amount: line.amount,
            card_flag: line.card_flag,
            installments: line.installments,
            applied_rate: appliedRate,
            fee_amount: feeAmount,
            bank_account_id: selectedBankId,
          }),
        )
      }

      const paymentDescriptions = validLines.map((line) => {
        let desc = line.method
        if (line.card_flag) desc += ` – ${line.card_flag}`
        if (line.method === 'Cartão de Crédito' && line.installments > 1) {
          desc += ` – ${line.installments}x`
        }
        desc += `: ${formatCurrency(line.amount)}`
        return desc
      })
      const paymentMethodStr = paymentDescriptions.join(', ')

      const arData: Record<string, unknown> = {
        venda_avulsa_id: venda.id,
        description: 'Venda Avulsa',
        amount: Math.round(finalTotal * 100) / 100,
        discount_amount: Math.round(discount * 100) / 100,
        surcharge_amount: Math.round(surcharge * 100) / 100,
        due_date: today,
        status: 'Recebido',
        payment_method: paymentMethodStr,
        received_at: nowIso,
      }
      if (venda.customer_id) arData.customer_id = venda.customer_id
      await createAccountsReceivable(arData)

      toast.success('Venda finalizada com sucesso!')
      setCart([])
      setPaymentLines([])
      setDiscount(0)
      setSurcharge(0)
      setSelectedBankId('')
      setCustomerDocument('')
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Erro ao finalizar venda')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Carrinho</h2>
          {cart.length === 0 ? (
            <p className="text-center text-slate-400 py-4">Adicione produtos ao carrinho.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(item.product.price)} cada
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQty(item.product.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="min-w-[1.5rem] text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQty(item.product.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-bold ml-2">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 p-1 h-auto"
                      onClick={() => updateQty(item.product.id, -item.quantity)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cart.length > 0 && (
            <div className="flex flex-col items-end gap-1 mt-4 text-sm">
              <div className="flex gap-8">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-medium w-28 text-right tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex gap-8 text-base">
                <span className="font-bold">Total Geral:</span>
                <span className="font-bold w-28 text-right tabular-nums">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="products">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="products">
                <Package className="w-4 h-4 mr-1" /> Produtos
              </TabsTrigger>
              <TabsTrigger value="payment">
                <Wallet className="w-4 h-4 mr-1" /> Pagamento
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-3">
              <PosProductGrid onAdd={addProduct} />
            </TabsContent>
            <TabsContent value="payment" className="mt-3 space-y-3">
              <PaymentLines
                total={finalTotal}
                lines={paymentLines}
                onLinesChange={setPaymentLines}
                cardRates={cardRates}
              />
              <div className="space-y-1">
                <Label className="text-xs">Banco *</Label>
                <SearchableSelect
                  options={bankAccounts
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((b) => ({
                      value: b.id,
                      label: `${b.name} - Ag ${b.agency} - CC ${b.account_number}`,
                    }))}
                  value={selectedBankId}
                  onChange={setSelectedBankId}
                  placeholder="Selecionar banco..."
                  searchPlaceholder="Buscar banco..."
                />
                {!selectedBankId && (
                  <p className="text-sm text-red-500">Selecione uma conta bancária</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CPF/CNPJ (Consumidor Final)</Label>
                <Input
                  value={customerDocument}
                  onChange={(e) => {
                    const masked = maskCPFCNPJ(e.target.value)
                    setCustomerDocument(masked)
                    if (masked.trim() && !validateCPFCNPJ(masked)) {
                      setDocError('CPF/CNPJ inválido')
                    } else {
                      setDocError('')
                    }
                  }}
                  placeholder="000.000.000-00"
                />
                {docError && <p className="text-sm text-red-500">{docError}</p>}
              </div>
              <div className="space-y-1.5 border-t pt-3">
                <div
                  className={cn(
                    'flex items-center gap-2 transition-opacity duration-200',
                    discount > 0 ? 'opacity-100' : 'opacity-40 focus-within:opacity-100',
                  )}
                >
                  <span className="text-red-600 font-bold text-sm w-7 shrink-0">(-)</span>
                  <Label className="text-xs whitespace-nowrap">Desconto</Label>
                  <CurrencyInput
                    value={discount}
                    onChange={setDiscount}
                    className="text-right"
                    placeholder="0,00"
                  />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 transition-opacity duration-200',
                    surcharge > 0 ? 'opacity-100' : 'opacity-40 focus-within:opacity-100',
                  )}
                >
                  <span className="text-green-600 font-bold text-sm w-7 shrink-0">(+)</span>
                  <Label className="text-xs whitespace-nowrap">Acréscimo</Label>
                  <CurrencyInput
                    value={surcharge}
                    onChange={setSurcharge}
                    className="text-right"
                    placeholder="0,00"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold pt-1 border-t">
                  <span>Total Geral</span>
                  <span className="text-blue-600 tabular-nums">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
              {troco > 0 && (
                <div className="flex justify-between text-base font-bold p-3 bg-green-50 rounded-md">
                  <span>Troco</span>
                  <span className="text-green-700">{formatCurrency(troco)}</span>
                </div>
              )}
              <Button
                className="w-full"
                size="lg"
                disabled={!canFinalize || finalizing}
                onClick={handleFinalize}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {finalizing ? 'Finalizando...' : 'Finalizar Venda'}
              </Button>
              {!canFinalize && paymentLines.length > 0 && remaining > 0.01 && (
                <p className="text-center text-sm text-red-500">
                  Saldo restante: {formatCurrency(remaining)}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
