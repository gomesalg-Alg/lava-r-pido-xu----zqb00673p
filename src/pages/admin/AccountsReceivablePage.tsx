import { useEffect, useState, useMemo } from 'react'
import {
  getAccountsReceivable,
  updateAccountsReceivable,
  type AccountsReceivable,
} from '@/services/accounts-receivable'
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
import { formatCurrency } from '@/lib/format'
import { Search, CheckCircle, XCircle, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteVendaAvulsa } from '@/services/vendas-avulsas'
import { getCompany, type Company } from '@/services/company'
import { WhatsAppReceiptButton } from '@/components/admin/WhatsAppReceiptButton'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Recebido', label: 'Recebido' },
  { value: 'Cancelado', label: 'Cancelado' },
]

export default function AccountsReceivablePage() {
  const [records, setRecords] = useState<AccountsReceivable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [company, setCompany] = useState<Company | null>(null)

  const loadData = async () => {
    try {
      const [recs, comp] = await Promise.all([getAccountsReceivable(), getCompany()])
      setRecords(recs)
      setCompany(comp)
    } catch {
      toast.error('Erro ao carregar contas a receber')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('accounts_receivable', () => {
    loadData()
  })

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      const q = search.toLowerCase()
      return (
        r.description.toLowerCase().includes(q) ||
        (r.expand?.customer_id?.name || '').toLowerCase().includes(q)
      )
    })
  }, [records, search, statusFilter])

  const summary = useMemo(() => {
    const pendente = records.filter((r) => r.status === 'Pendente')
    const recebido = records.filter((r) => r.status === 'Recebido')
    const cancelado = records.filter((r) => r.status === 'Cancelado')
    return {
      pendenteTotal: pendente.reduce((s, r) => s + (r.amount || 0), 0),
      recebidoTotal: recebido.reduce((s, r) => s + (r.amount || 0), 0),
      canceladoTotal: cancelado.reduce((s, r) => s + (r.amount || 0), 0),
    }
  }, [records])

  const handleMarkReceived = async (id: string) => {
    try {
      await updateAccountsReceivable(id, {
        status: 'Recebido',
        received_at: new Date().toISOString(),
      })
      toast.success('Conta marcada como recebida!')
    } catch {
      toast.error('Erro ao atualizar conta')
    }
  }

  const handleCancel = async (r: AccountsReceivable) => {
    try {
      await updateAccountsReceivable(r.id, { status: 'Cancelado' })
      if (r.venda_avulsa_id) {
        await deleteVendaAvulsa(r.venda_avulsa_id)
      }
      toast.success('Conta cancelada!')
    } catch {
      toast.error('Erro ao cancelar conta')
    }
  }

  const statusBadge = (s: string) => {
    if (s === 'Recebido')
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Recebido</Badge>
    if (s === 'Cancelado') return <Badge variant="destructive">Cancelado</Badge>
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Pendente
      </Badge>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Contas a Receber</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-slate-500">Pendente</p>
          <p className="text-xl font-bold text-amber-600">
            {formatCurrency(summary.pendenteTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-slate-500">Recebido</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(summary.recebidoTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-slate-500">Cancelado</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(summary.canceladoTotal)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por descrição ou cliente..."
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
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>OS</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{r.description || '-'}</TableCell>
                  <TableCell>{r.expand?.customer_id?.name || '-'}</TableCell>
                  <TableCell>
                    {r.expand?.order_id
                      ? `#${String(r.expand.order_id.ticket_number).padStart(4, '0')}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(r.amount)}
                  </TableCell>
                  <TableCell>
                    {r.due_date ? new Date(r.due_date).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {r.payment_method || '-'}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/recibo/${r.id}`}>
                          <Printer className="w-4 h-4" />
                        </Link>
                      </Button>
                      <WhatsAppReceiptButton
                        customerName={r.expand?.customer_id?.name || 'Cliente'}
                        customerPhone={r.expand?.customer_id?.phone || ''}
                        receiptId={r.id}
                      />
                      {r.status === 'Pendente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkReceived(r.id)}
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Receber
                        </Button>
                      )}
                      {(r.status === 'Pendente' || r.status === 'Recebido') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(r)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Cancelar
                        </Button>
                      )}
                    </div>
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
