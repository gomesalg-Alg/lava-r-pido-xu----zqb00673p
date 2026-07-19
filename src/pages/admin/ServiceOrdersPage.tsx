import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getServiceOrders, deleteServiceOrder, type ServiceOrder } from '@/services/service-orders'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrder | null>(null)

  const loadData = async () => {
    try {
      const data = await getServiceOrders()
      setOrders(data)
    } catch {
      toast.error('Erro ao carregar ordens de serviço')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('service_orders', () => {
    loadData()
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteServiceOrder(deleteTarget.id)
      toast.success('Ordem de serviço excluída!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir ordem de serviço')
    }
  }

  const filtered = orders.filter((o) => {
    const cName = o.expand?.customer_id?.name?.toLowerCase() || ''
    const v = o.expand?.vehicle_id
    const vStr = v ? `${v.brand} ${v.model} ${v.placa || ''}`.toLowerCase() : ''
    const q = search.toLowerCase()
    return cName.includes(q) || vStr.includes(q) || String(o.ticket_number).includes(search)
  })

  const badgeVariant = (s: string): 'default' | 'secondary' | 'outline' =>
    s === 'Finalizado' ? 'default' : s === 'Em Andamento' ? 'secondary' : 'outline'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Ordens de Serviço</h1>
        <Button asChild>
          <Link to="/admin/ordem-servico/novo">
            <Plus className="w-4 h-4 mr-2" /> Nova Ordem
          </Link>
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por ticket, cliente ou veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Foto</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Nenhuma ordem de serviço encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id} className="even:bg-slate-50">
                  <TableCell className="font-bold text-blue-600">
                    #{String(o.ticket_number).padStart(4, '0')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {o.expand?.customer_id?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {o.expand?.vehicle_id
                      ? `${o.expand.vehicle_id.brand} ${o.expand.vehicle_id.model}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {o.photo ? (
                      <img
                        src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/service_orders/${o.id}/${o.photo}?thumb=100x100t`}
                        alt="Foto da Placa"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs">Sem foto</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {o.entry_at ? (
                      <div className="flex flex-col">
                        <span>{new Date(o.entry_at).toLocaleDateString('pt-BR')}</span>
                        <span className="text-slate-500 text-sm">
                          {new Date(o.entry_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(o.status)}>{o.status || '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/ordem-servico/${o.id}/editar`}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(o)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
