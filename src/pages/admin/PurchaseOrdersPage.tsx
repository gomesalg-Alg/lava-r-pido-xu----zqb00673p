import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPurchaseOrders, type PurchaseOrder } from '@/services/purchase-orders'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SortableHeader, StaticHeader } from '@/components/admin/SortableHeader'
import { useSortableData } from '@/hooks/use-sortable-data'
import { Plus, Search, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDateBR } from '@/lib/format'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Aberto', label: 'Aberto' },
  { value: 'Parcial', label: 'Parcial' },
  { value: 'Recebido', label: 'Recebido' },
  { value: 'Cancelado', label: 'Cancelado' },
]

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Aberto: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    Recebido: 'bg-green-100 text-green-700 hover:bg-green-100',
    Parcial: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    Cancelado: 'bg-red-100 text-red-700 hover:bg-red-100',
  }
  return <Badge className={map[s] || ''}>{s || '-'}</Badge>
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = async () => {
    try {
      setOrders(await getPurchaseOrders())
    } catch {
      toast.error('Erro ao carregar pedidos de compra')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('purchase_orders', loadData)

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      const q = search.toLowerCase()
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.expand?.supplier_id?.name || '').toLowerCase().includes(q)
      )
    })
  }, [orders, search, statusFilter])

  const { sortedItems, sortState, toggleSort } = useSortableData(filtered)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pedidos de Compra</h1>
        <Button asChild>
          <Link to="/admin/pedidos-compra/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo Pedido
          </Link>
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por número ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader columnKey="order_number" sortState={sortState} onSort={toggleSort}>
                Número
              </SortableHeader>
              <SortableHeader
                columnKey="expand.supplier_id.name"
                sortState={sortState}
                onSort={toggleSort}
              >
                Fornecedor
              </SortableHeader>
              <SortableHeader columnKey="emission_date" sortState={sortState} onSort={toggleSort}>
                Emissão
              </SortableHeader>
              <SortableHeader
                columnKey="total_amount"
                sortState={sortState}
                onSort={toggleSort}
                className="text-right"
              >
                Total
              </SortableHeader>
              <SortableHeader columnKey="status" sortState={sortState} onSort={toggleSort}>
                Status
              </SortableHeader>
              <StaticHeader className="text-right">Ações</StaticHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((o) => (
                <TableRow key={o.id} className="even:bg-slate-50">
                  <TableCell className="font-bold text-blue-600">{o.order_number}</TableCell>
                  <TableCell className="font-medium">
                    {o.expand?.supplier_id?.name || '-'}
                  </TableCell>
                  <TableCell>{formatDateBR(o.emission_date) || '-'}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(o.total_amount)}
                  </TableCell>
                  <TableCell>{statusBadge(o.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/pedidos-compra/${o.id}`}>
                        <Eye className="w-4 h-4 mr-1" /> Detalhes
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
