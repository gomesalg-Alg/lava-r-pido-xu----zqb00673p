import { useState, useMemo, useEffect } from 'react'
import { PosProductGrid } from '@/components/admin/PosProductGrid'
import { PosServiceGrid } from '@/components/admin/PosServiceGrid'
import { PaymentLines } from '@/components/admin/PaymentLines'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { Trash2, Minus, Plus, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { createVendaAvulsa } from '@/services/vendas-avulsas'
import { getCustomers } from '@/services/customers'
import { createOrderPayment, buildPaymentData, type PaymentLine } from '@/services/order-payments'
import { createAccountsReceivable } from '@/services/accounts-receivable'
import { getCardRates, type CardRate } from '@/services/card-rates'
import { getCashRegisterBankAccount, type BankAccount } from '@/services/bank-accounts'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import type { Product } from '@/services/products'

interface SaleItem {
  product_id?: string
  service_id?: string
  type: 'product' | 'service'
  name: string
  unit_price: number
  quantity: number
  total_price: number
}

export function PosVendaAvulsa() {
  const [items, setItems] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [customerDoc, setCustomerDoc] = useState('')
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([])
  const [cardRates, setCardRates] = useState<CardRate[]>([])
  const [cashRegisterBank, setCashRegisterBank] = useState<BankAccount | null>(null)
  const [selectedBankId, setSelectedBankId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(() => {})
    getCardRates()
      .then(setCardRates)
      .catch(() => {})
    getCashRegisterBankAccount()
      .then((bank) => {
        setCashRegisterBank(bank)
        if (bank) setSelectedBankId(bank.id)
      })
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
          type: 'product' as const,
          product_id: product.id,
          name: product.name,
          unit_price: product.price || 0,
          quantity: 1,
          total_price: product.price || 0,
        },
      ]
    })
  }

  const handleAddService = (svc: { id: string; name: string; price: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.service_id === svc.id)
      if (existing) {
        return prev.map((i) =>
          i.service_id === svc.id
            ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
            : i,
        )
      }
      return [
        ...prev,
        {
          type: 'service' as const,
          service_id: svc.id,
          name: svc.name,
          unit_price: svc.price || 0,
          quantity: 1,
          total_price: svc.price || 0,
        },
      ]
    })
  }

  const itemKey = (i: SaleItem) =>
    i.type === 'service' ? `svc-${i.service_id}` : `prod-${i.product_id}`

  const updateQty = (key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          itemKey(i) === key
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

  const validLines = paymentLines.filter((l) => l.method && l.amount > 0)
  const totalPaid = validLines.reduce((s, l) => s + l.amount, 0)
  const changeAmount = totalPaid > total ? totalPaid - total : 0

  const handleFinalize = async () => {
    if (!items.length || !selectedBankId || validLines.length === 0) return
    setSaving(true)
    try {
      const pmSummary = validLines
        .map((l) => {
          let label = l.method
          if (l.card_flag) label += ` – ${l.card_flag}`
          if (l.method === 'Cartão de Crédito' && l.installments > 1)
            label += ` – ${l.installments}x`
          return `${label}: ${formatCurrency(l.amount)}`
        })
        .join(' | ')

      const vendaData: Record<string, unknown> = {
        items: items.map((i) => ({
          type: i.type,
          product_id: i.product_id || undefined,
          service_id: i.service_id || undefined,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
        })),
        total_amount: total,
        payment_method: pmSummary,
        change_amount: changeAmount,
      }
      if (customerId) vendaData.customer_id = customerId
      if (customerDoc) vendaData.customer_document = customerDoc

      const venda = await createVendaAvulsa(vendaData)

      for (const line of validLines) {
        await createOrderPayment(
          buildPaymentData({
            venda_avulsa_id: venda.id,
            method: line.method,
            amount: line.amount,
            card_flag: line.card_flag || undefined,
            installments: line.installments || undefined,
            applied_rate: line.applied_rate,
            fee_amount: line.fee_amount,
            bank_account_id: selectedBankId,
          }),
        )
      }

      const customerName = customers.find((c) => c.id === customerId)?.name || 'Consumidor Final'

      const arData: Record<string, unknown> = {
        venda_avulsa_id: venda.id,
        description: `Venda Avulsa – ${customerName}`,
        amount: total,
        due_date: new Date().toISOString().split('T')[0],
        status: 'Recebido',
        payment_method: pmSummary,
        received_at: new Date().toISOString(),
        bank_account_id: selectedBankId,
      }
      if (customerId) arData.customer_id = customerId
      await createAccountsReceivable(arData)

      toast.success('Venda registrada!')
      setItems([])
      setCustomerId('')
      setCustomerDoc('')
      setPaymentLines([])
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Erro ao registrar venda')
    } finally {
      setSaving(false)
    }
  }

  const customerOpts = [
    { value: '', label: 'Consumidor Final' },
    ...customers
      .filter((c) => c.name !== 'Consumidor Final')
      .map((c) => ({ value: c.id, label: c.name })),
  ]

  const canFinalize = items.length > 0 && !!selectedBankId && validLines.length > 0 && !saving

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Tabs defaultValue="products">
        <TabsList className="w-full">
          <TabsTrigger value="products" className="flex-1">
            Produtos
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1">
            Serviços
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-3">
          <PosProductGrid onAdd={handleAddProduct} />
        </TabsContent>
        <TabsContent value="services" className="mt-3">
          <PosServiceGrid onAdd={handleAddService} />
        </TabsContent>
      </Tabs>
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
                    key={itemKey(item)}
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
                      onClick={() => updateQty(itemKey(item), -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQty(itemKey(item), 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-600"
                      onClick={() => setItems((p) => p.filter((i) => itemKey(i) !== itemKey(item)))}
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
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
              <div className="space-y-1">
                <Label>Banco (Frente de Caixa)</Label>
                <div className="rounded-md border px-3 py-2 text-sm bg-slate-50">
                  {cashRegisterBank
                    ? `${cashRegisterBank.name} - Ag ${cashRegisterBank.agency} - CC ${cashRegisterBank.account_number}`
                    : 'Nenhuma conta configurada'}
                </div>
                {!selectedBankId && (
                  <p className="text-sm text-red-500">
                    Configure uma conta bancária para o Frente de Caixa
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Pagamentos</Label>
                <PaymentLines
                  total={total}
                  lines={paymentLines}
                  onLinesChange={setPaymentLines}
                  cardRates={cardRates}
                />
              </div>
              <Button className="w-full" size="lg" onClick={handleFinalize} disabled={!canFinalize}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {saving ? 'Processando...' : 'Finalizar Venda'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
