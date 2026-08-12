import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Package, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDateBR } from '@/lib/format'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAYMENT_METHOD_CODES } from '@/services/accounts-payable'
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  receivePurchaseOrderItems,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from '@/services/purchase-orders'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Aberto: 'outline',
  Recebido: 'default',
  Parcial: 'secondary',
  Cancelado: 'destructive',
}

const PAYMENT_CODE_OPTS = PAYMENT_METHOD_CODES.map((code) => ({ value: code, label: code }))

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [receiving, setReceiving] = useState(false)
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>('')

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const [po, poItems] = await Promise.all([getPurchaseOrder(id), getPurchaseOrderItems(id)])
      setOrder(po)
      setItems(poItems)
    } catch {
      toast.error('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleQtyChange = (itemId: string, value: string) => {
    if (value === '' || /^[\d]*[.,]?[\d]*$/.test(value)) {
      setReceiveQty((prev) => ({ ...prev, [itemId]: value }))
    }
  }

  const parseQty = (val: string): number => {
    const cleaned = (val || '0').replace(',', '.').trim()
    return parseFloat(cleaned) || 0
  }

  const isFullyReceived = (item: PurchaseOrderItem) =>
    (item.received_quantity || 0) >= (item.quantity || 0) && (item.quantity || 0) > 0

  const canReceive = (item: PurchaseOrderItem) => {
    const qty = parseQty(receiveQty[item.id] || '0')
    const remaining = (item.quantity || 0) - (item.received_quantity || 0)
    return qty > 0 && qty <= remaining + 0.000001
  }

  const hasValidItems = items.some((item) => !isFullyReceived(item) && canReceive(item))

  const handleReceive = async () => {
    if (!id || !order) return
    const toReceive = items
      .filter((item) => !isFullyReceived(item) && canReceive(item))
      .map((item) => ({
        id: item.id,
        received_quantity: parseQty(receiveQty[item.id] || '0'),
      }))

    if (toReceive.length === 0) {
      setErrorMsg('Nenhum item válido para receber. Verifique as quantidades informadas.')
      return
    }

    setReceiving(true)
    setErrorMsg(null)
    try {
      await receivePurchaseOrderItems(id, toReceive, paymentMethodCode)
      toast.success('Itens recebidos com sucesso!')
      setReceiveQty({})
      setPaymentMethodCode('')
      await loadData()
    } catch (err) {
      setErrorMsg(getErrorMessage(err) || 'Erro ao receber itens')
    } finally {
      setReceiving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Pedido não encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/admin/pedidos-compra">Voltar</Link>
        </Button>
      </div>
    )
  }

  const isCancelled = order.status === 'Cancelado'
  const allFullyReceived = items.length > 0 && items.every(isFullyReceived)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pedidos-compra')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
        <Badge variant={STATUS_VARIANT[order.status] || 'outline'}>{order.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Fornecedor</p>
              <p className="font-medium">{order.expand?.supplier_id?.name || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data de Emissão</p>
              <p className="font-medium">{formatDateBR(order.emission_date) || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Prevista</p>
              <p className="font-medium">{formatDateBR(order.expected_date) || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor Total</p>
              <p className="font-medium">{formatCurrency(order.total_amount || 0)}</p>
            </div>
          </div>
          {order.observation && (
            <div className="mt-4">
              <p className="text-muted-foreground text-sm">Observação</p>
              <p className="text-sm">{order.observation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens do Pedido
            </CardTitle>
            {!isCancelled && !allFullyReceived && (
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Select value={paymentMethodCode} onValueChange={setPaymentMethodCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_CODE_OPTS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleReceive} disabled={receiving || !hasValidItems}>
                  {receiving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Receber Itens
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">Produto</th>
                  <th className="text-right py-2 px-2 font-medium">Qtd. Pedida</th>
                  <th className="text-right py-2 px-2 font-medium">Qtd. Recebida</th>
                  <th className="text-right py-2 px-2 font-medium">Restante</th>
                  <th className="text-right py-2 px-2 font-medium">Valor Unit.</th>
                  <th className="text-right py-2 px-2 font-medium">Total</th>
                  <th className="text-center py-2 px-2 font-medium">Receber</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const fullyReceived = isFullyReceived(item)
                  const remaining = (item.quantity || 0) - (item.received_quantity || 0)
                  const inputQty = parseQty(receiveQty[item.id] || '0')
                  const exceedsMax = inputQty > 0 && inputQty > remaining + 0.000001
                  return (
                    <tr
                      key={item.id}
                      className={`border-b ${fullyReceived ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {fullyReceived && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                          <span>{item.expand?.product_id?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-2">{item.quantity}</td>
                      <td className="text-right py-2 px-2">
                        <span className={fullyReceived ? 'text-green-600 font-medium' : ''}>
                          {item.received_quantity || 0}
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className={remaining > 0 ? 'text-orange-600 font-medium' : ''}>
                          {remaining > 0 ? remaining : 0}
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        {formatCurrency(item.unit_price || 0)}
                      </td>
                      <td className="text-right py-2 px-2">
                        {formatCurrency(item.total_price || 0)}
                      </td>
                      <td className="text-center py-2 px-2">
                        {fullyReceived ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Recebido
                          </Badge>
                        ) : isCancelled ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              className={`w-24 text-center ${exceedsMax ? 'border-red-500' : ''}`}
                              placeholder={`Max: ${remaining}`}
                              value={receiveQty[item.id] || ''}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              disabled={receiving}
                            />
                            {exceedsMax && (
                              <span className="text-xs text-red-500">Excede o máximo</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {allFullyReceived && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Todos os itens foram recebidos</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!errorMsg} onOpenChange={(open) => !open && setErrorMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Receber
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {errorMsg}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorMsg(null)}>Tentar novamente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
