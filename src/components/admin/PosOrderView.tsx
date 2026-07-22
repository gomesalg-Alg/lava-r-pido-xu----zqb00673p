import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ArrowLeft, CheckCircle, Package, Wallet, Lock, Minus, Plus, Trash2 } from 'lucide-react'
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
import { getCardRates, type CardRate } from '@/services/card-rates'
import { createOrderPayment, type PaymentLine } from '@/services/order-payments'
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
import { formatCurrency } from '@/lib/format'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Product } from '@/services/products'

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
  const originalItemIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)

  const loadItems = useCallback(async () => {
    try {
      const fetched = await getServiceOrderItems(order.id)
      if (isFirstLoad.current) {
        fetched.forEach((item) => originalItemIds.current.add(item.id))
        isFirstLoad.current = false
      }
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
  }, [])

  useRealtime('service_order_items', () => {
    loadItems()
  })

  const totals = useMemo(() => calculateOrderTotals(items), [items])
  const totalPaid = paymentLines
    .filter((l) => l.method && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0)
  const remaining = totals.grandTotal - totalPaid
  const canFinalize = remaining <= 0.01 && paymentLines.length > 0

  const isLocked = (item: ServiceOrderItem) => originalItemIds.current.has(item.id)

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

  const addProduct = async (product: Product) => {
    setAddingProduct(true)
    try {
      await createServiceOrderItem({
        order_id: order.id,
        product_id: product.id,
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
      for (const line of paymentLines) {
        if (line.method && line.amount > 0) {
          await createOrderPayment({
            order_id: order.id,
            method: line.method,
            amount: line.amount,
            card_flag: line.card_flag || '',
            installments: line.installments || 1,
          })
        }
      }
      await updateServiceOrder(order.id, {
        status: 'Finalizado',
        amount_paid: totals.grandTotal,
        total_discount: totals.totalDiscount,
        total_surcharge: totals.totalSurcharge,
        exit_at: new Date().toISOString(),
      })
      toast.success('Venda finalizada com sucesso!')
      onBack()
    } catch {
      toast.error('Erro ao finalizar venda')
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
        <div>
          <h1 className="text-xl font-bold text-slate-800">OS #{order.ticket_number}</h1>
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
                    <TableHead className="px-2 text-right">Desc.</TableHead>
                    <TableHead className="px-2 text-right">Acréc.</TableHead>
                    <TableHead className="px-2 text-right pr-4 tabular-nums">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingItems ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-slate-400">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-slate-400">
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
                          <TableCell className="px-2 py-3 text-right text-red-500 whitespace-nowrap">
                            {formatCurrency(item.discount_amount || 0)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-green-600 whitespace-nowrap">
                            {formatCurrency(item.surcharge_amount || 0)}
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
              <div className="flex gap-8">
                <span className="text-slate-500">Total Descontos:</span>
                <span className="font-medium w-28 text-right text-red-500 tabular-nums">
                  {formatCurrency(totals.totalDiscount)}
                </span>
              </div>
              <div className="flex gap-8">
                <span className="text-slate-500">Total Acréscimos:</span>
                <span className="font-medium w-28 text-right text-green-600 tabular-nums">
                  {formatCurrency(totals.totalSurcharge)}
                </span>
              </div>
              <div className="flex gap-8 text-base">
                <span className="font-bold">Total Geral:</span>
                <span className="font-bold w-28 text-right tabular-nums">
                  {formatCurrency(totals.grandTotal)}
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
                  total={totals.grandTotal}
                  lines={paymentLines}
                  onLinesChange={setPaymentLines}
                  cardRates={cardRates}
                />
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
    </div>
  )
}
