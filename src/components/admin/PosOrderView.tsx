import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Wallet,
  Lock,
  Minus,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaymentLines } from '@/components/admin/PaymentLines'
import { PosProductGrid } from '@/components/admin/PosProductGrid'
import { CurrencyInput } from '@/components/admin/CurrencyInput'
import { Label } from '@/components/ui/label'
import { getCardRates, getRateForPayment, type CardRate } from '@/services/card-rates'
import { createOrderPayment, buildPaymentData, type PaymentLine } from '@/services/order-payments'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getServiceOrderItems,
  updateServiceOrder,
  createServiceOrderItem,
  updateServiceOrderItem,
  deleteServiceOrderItem,
  type ServiceOrder,
  type ServiceOrderItem,
} from '@/services/service-orders'
import { calculateOrderTotals } from '@/lib/order-calculations'
import { createAccountsReceivable } from '@/services/accounts-receivable'
import { formatCurrency } from '@/lib/format'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { PosItemEditDialog } from '@/components/admin/PosItemEditDialog'
import { cn } from '@/lib/utils'
import type { Product } from '@/services/products'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'

interface Props {
  order: ServiceOrder
  onBack: () => void
}

export function PosOrderView({ order, onBack }: Props) {
  const [items, setItems] = useState<ServiceOrderItem[]>([])
  const [cardRates, setCardRates] = useState<CardRate[]>([])
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [surcharge, setSurcharge] = useState(0)
  const [editingItem, setEditingItem] = useState<ServiceOrderItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState('')
  const { user } = useAuth()

  const allItems = items

  const loadItems = useCallback(async () => {
    try {
      const fetched = await getServiceOrderItems(order.id)
      setItems(fetched)
    } catch {
      /* ignore */
    } finally {
      setLoadingItems(false)
    }
  }, [order.id])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    getCardRates()
      .then(setCardRates)
      .catch(() => {})
    getActiveBankAccounts()
      .then(setBankAccounts)
      .catch(() => {})
  }, [])

  useRealtime('service_order_items', () => {
    loadItems()
  })

  const totals = useMemo(() => calculateOrderTotals(items), [items])
  const finalTotal = totals.grandTotal - discount + surcharge
  const totalPaid = paymentLines
    .filter((l) => l.method && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0)
  const remaining = finalTotal - totalPaid
  const troco = Math.max(0, totalPaid - finalTotal)
  const canFinalize = remaining <= 0.01 && paymentLines.length > 0 && !!selectedBankId

  const isLocked = (item: ServiceOrderItem) => !!item.service_id

  const handleQtyChange = async (item: ServiceOrderItem, delta: number) => {
    const newQty = Math.max(1, (item.quantity || 1) + delta)
    const newTotal = newQty * (item.unit_price || 0)
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, total_price: newTotal } : i)),
    )
    try {
      await updateServiceOrderItem(item.id, {
        quantity: newQty,
        total_price: newTotal,
      })
    } catch {
      toast.error('Erro ao atualizar quantidade')
      await loadItems()
    }
  }

  const handleRemoveItem = async (item: ServiceOrderItem) => {
    try {
      await deleteServiceOrderItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success('Item removido')
    } catch {
      toast.error('Erro ao remover item')
    }
  }

  const handleEditSave = async (data: {
    quantity: number
    unit_price: number
    discount_amount: number
    discount_reason: string
    surcharge_amount: number
    surcharge_reason: string
    total_price: number
  }) => {
    if (!editingItem) return
    try {
      await updateServiceOrderItem(editingItem.id, data)
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...data } : i)))
      toast.success('Item atualizado')
    } catch {
      toast.error('Erro ao atualizar item')
      await loadItems()
    } finally {
      setEditingItem(null)
    }
  }

  const addProduct = async (product: Product) => {
    setAddingProduct(true)
    try {
      await createServiceOrderItem({
        order_id: order.id,
        product_id: product.id,
        operator_id: user?.id || '',
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      })
      toast.success(`${product.name} adicionado`)
      await loadItems()
    } catch {
      toast.error('Erro ao adicionar produto')
    } finally {
      setAddingProduct(false)
    }
  }

  const handleFinalize = async () => {
    if (!canFinalize) return
    setFinalizing(true)
    try {
      const validLines = paymentLines.filter((l) => l.method && l.amount > 0)
      for (const line of validLines) {
        const isCard = line.method === 'Cartão de Crédito' || line.method === 'Cartão de Débito'
        const appliedRate =
          isCard && line.card_flag
            ? getRateForPayment(cardRates, line.card_flag, line.method, line.installments)
            : 0
        const feeAmount = line.amount > 0 ? (line.amount * appliedRate) / 100 : 0
        await createOrderPayment(
          buildPaymentData({
            order_id: order.id,
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

      await updateServiceOrder(order.id, {
        status: 'Pago',
        amount_paid: Math.round(finalTotal * 100) / 100,
        total_discount: Math.round(discount * 100) / 100,
        total_surcharge: Math.round(surcharge * 100) / 100,
        exit_at: new Date().toISOString(),
      })

      const nowIso = new Date().toISOString()
      const today = nowIso.split('T')[0]
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
        order_id: order.id,
        description: `Venda PDV - OS #${order.ticket_number}`,
        amount: Math.round(finalTotal * 100) / 100,
        discount_amount: Math.round(discount * 100) / 100,
        surcharge_amount: Math.round(surcharge * 100) / 100,
        due_date: today,
        status: 'Recebido',
        payment_method: paymentMethodStr,
        received_at: nowIso,
      }
      if (order.customer_id) arData.customer_id = order.customer_id
      await createAccountsReceivable(arData)

      toast.success('Venda finalizada com sucesso!')
      onBack()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Erro ao finalizar venda')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 px-4 py-3 text-center rounded-lg">
        <h1 className="text-3xl font-bold text-white">Frente de Caixa</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">OS #{order.ticket_number}</h2>
          <p className="text-sm text-slate-500">
            {order.expand?.customer_id?.name} · {order.expand?.vehicle_id?.placa} ·{' '}
            {order.expand?.vehicle_id?.brand} {order.expand?.vehicle_id?.model}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Itens da Ordem</h2>
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2">Item</TableHead>
                    <TableHead className="px-2 text-center">Qtd</TableHead>
                    <TableHead className="px-2 text-right">Preço</TableHead>
                    <TableHead className="px-2 text-right pr-4 tabular-nums">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingItems ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-slate-400">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-slate-400">
                        Nenhum item adicionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => {
                      const locked = isLocked(item)
                      return (
                        <TableRow
                          key={item.id}
                          className={cn('hover:bg-slate-100/50', idx % 2 === 1 && 'bg-slate-50')}
                        >
                          <TableCell className="px-2 py-3">
                            <div className="flex items-start gap-1.5">
                              {locked && (
                                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <span
                                className={cn(
                                  'line-clamp-2 leading-tight',
                                  locked && 'text-slate-500',
                                )}
                              >
                                {item.expand?.service_id?.name ||
                                  item.expand?.product_id?.name ||
                                  '-'}
                              </span>
                              {!locked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 ml-1 text-slate-400 hover:text-slate-600"
                                  onClick={() => {
                                    setEditingItem(item)
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center whitespace-nowrap">
                            {locked ? (
                              <span className="inline-block min-w-[2rem] text-slate-500">
                                {item.quantity}
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleQtyChange(item, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="inline-block min-w-[1.5rem] text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleQtyChange(item, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 ml-1"
                                  onClick={() => handleRemoveItem(item)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right whitespace-nowrap">
                            {formatCurrency(item.unit_price || 0)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right font-medium whitespace-nowrap pr-4 tabular-nums">
                            {formatCurrency(item.total_price || 0)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col items-end gap-1 mt-4 text-sm">
              <div className="flex gap-8">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-medium w-28 text-right tabular-nums">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex gap-8 text-base">
                <span className="font-bold">Total Geral:</span>
                <span className="font-bold w-28 text-right tabular-nums">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
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
                {addingProduct && (
                  <p className="text-center text-sm text-slate-400 mt-2">Adicionando...</p>
                )}
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
                  <div className="flex justify-between items-center text-sm pt-1 border-t">
                    <span className="text-slate-600 font-medium">
                      <span className="text-slate-400 mr-1">(=)</span> Subtotal
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(totals.subtotal)}
                    </span>
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
                  <CheckCircle className="w-5 h-5 mr-2" />{' '}
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
      <PosItemEditDialog
        item={editingItem}
        open={editDialogOpen}
        onOpenChange={(v) => {
          setEditDialogOpen(v)
          if (!v) setEditingItem(null)
        }}
        onSave={handleEditSave}
      />
    </div>
  )
}
