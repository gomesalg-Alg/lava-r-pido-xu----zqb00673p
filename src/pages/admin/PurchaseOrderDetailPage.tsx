import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import { ArrowLeft, Ban, CheckCircle, Pencil, AlertCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDateBR } from '@/lib/format'
import { getActiveBankAccounts, type BankAccount } from '@/services/bank-accounts'
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  updatePurchaseOrder,
  receivePurchaseOrder,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from '@/services/purchase-orders'
import { useRealtime } from '@/hooks/use-realtime'

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Aberto: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    Recebido: 'bg-green-100 text-green-700 hover:bg-green-100',
    Parcial: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    Cancelado: 'bg-red-100 text-red-700 hover:bg-red-100',
  }
  return <Badge className={map[s] || ''}>{s}</Badge>
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({})
  const [dueDate, setDueDate] = useState('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankId, setBankId] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [receiveError, setReceiveError] = useState<string | null>(null)

  const loadData = async () => {
    if (!id) return
    try {
      const [o, i] = await Promise.all([getPurchaseOrder(id), getPurchaseOrderItems(id)])
      setOrder(o)
      setItems(i)
      const init: Record<string, number> = {}
      i.forEach((item) => {
        init[item.id] = item.received_quantity || 0
      })
      setReceiveQty(init)
    } catch {
      toast.error('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    getActiveBankAccounts()
      .then(setBankAccounts)
      .catch(() => {})
  }, [id])
  useRealtime('purchase_orders', loadData)
  useRealtime('purchase_order_items', loadData)

  if (loading) return <p className="text-center py-8 text-slate-400">Carregando...</p>
  if (!order) return <p className="text-center py-8 text-slate-400">Pedido não encontrado.</p>

  const canReceive = order.status === 'Aberto' || order.status === 'Parcial'
  const canCancel = canReceive
  const canEdit = order.status === 'Aberto'

  const handleReceive = async () => {
    if (!id) return
    setReceiveError(null)
    const updates = items
      .filter((i) => (receiveQty[i.id] || 0) > (i.received_quantity || 0))
      .map((i) => ({ item_id: i.id, received_quantity: receiveQty[i.id] || 0 }))
    if (updates.length === 0) {
      toast.error('Nenhuma quantidade nova para receber')
      return
    }
    setReceiving(true)
    try {
      await receivePurchaseOrder(id, {
        items: updates,
        bank_account_id: bankId || undefined,
        due_date: dueDate || undefined,
      })
      toast.success('Recebimento registrado com sucesso!')
      setReceiveError(null)
      loadData()
    } catch (err) {
      let msg = 'Erro ao processar recebimento'
      if (err instanceof Error) {
        msg = err.message
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { message?: string } }).response
        if (resp?.message) msg = resp.message
      }
      setReceiveError(msg)
    } finally {
      setReceiving(false)
    }
  }

  const handleCancel = async () => {
    if (!id) return
    try {
      await updatePurchaseOrder(id, { status: 'Cancelado' })
      toast.success('Pedido cancelado!')
      loadData()
    } catch {
      toast.error('Erro ao cancelar pedido')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/admin/pedidos-compra">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{order.order_number}</h1>
          <p className="text-sm text-slate-500">{order.expand?.supplier_id?.name || '-'}</p>
        </div>
        {statusBadge(order.status)}
      </div>
      <div className="bg-white rounded-lg border p-6 space-y-2 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-500">Emissão</p>
            <p className="font-medium">{formatDateBR(order.emission_date) || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500">Prevista</p>
            <p className="font-medium">{formatDateBR(order.expected_date) || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500">Total</p>
            <p className="font-medium">{formatCurrency(order.total_amount)}</p>
          </div>
          <div>
            <p className="text-slate-500">Criado por</p>
            <p className="font-medium">{order.expand?.created_by?.name || '-'}</p>
          </div>
        </div>
        {order.observation && <p className="text-slate-600 pt-2 border-t">{order.observation}</p>}
      </div>
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-bold text-lg">Itens</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-slate-800 text-white">Produto</TableHead>
              <TableHead className="bg-slate-800 text-white">Qtd Pedida</TableHead>
              <TableHead className="bg-slate-800 text-white">Qtd Recebida</TableHead>
              {canReceive && <TableHead className="bg-slate-800 text-white">Receber</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.expand?.product_id?.name || '-'}</TableCell>
                <TableCell>{i.quantity}</TableCell>
                <TableCell>{i.received_quantity || 0}</TableCell>
                {canReceive && (
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-24 text-xs"
                      min={i.received_quantity || 0}
                      max={i.quantity}
                      value={receiveQty[i.id] ?? 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0
                        if (v > i.quantity) {
                          toast.error('Quantidade excede o pedido')
                          return
                        }
                        setReceiveQty((p) => ({ ...p, [i.id]: v }))
                      }}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {canReceive && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <Label>Vencimento (Contas a Pagar)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Conta Bancária</Label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Nenhum' },
                  ...bankAccounts.map((b) => ({
                    value: b.id,
                    label: b.trading_name || b.name,
                  })),
                ]}
                value={bankId}
                onChange={setBankId}
                placeholder="Opcional"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleReceive} disabled={receiving} className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                {receiving ? 'Processando...' : 'Receber'}
              </Button>
            </div>
          </div>
        )}
        {receiveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{receiveError}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={receiving}
                onClick={() => {
                  setReceiveError(null)
                  handleReceive()
                }}
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="flex gap-2">
        {canEdit && (
          <Button variant="outline" asChild>
            <Link to={`/admin/pedidos-compra/${id}/editar`}>
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </Link>
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={handleCancel} className="text-red-600 hover:bg-red-50">
            <Ban className="w-4 h-4 mr-2" /> Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
