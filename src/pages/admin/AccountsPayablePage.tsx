import { useEffect, useState, useMemo } from 'react'
import {
  getAccountsPayable,
  deleteAccountsPayable,
  cancelAccountsPayable,
  cancelGestorAccountsPayable,
  type AccountsPayable,
} from '@/services/accounts-payable'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
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
import { formatCurrency, formatDateOnlyBR } from '@/lib/format'
import {
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { DigitalDocumentDialog } from '@/components/admin/DigitalDocumentDialog'
import { AdobeReaderIcon } from '@/components/admin/AdobeReaderIcon'
import { PayAccountDialog } from '@/components/admin/PayAccountDialog'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { AccountsPayableFormDialog } from '@/components/admin/AccountsPayableFormDialog'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { SortableHeader, StaticHeader } from '@/components/admin/SortableHeader'
import { useSortableData } from '@/hooks/use-sortable-data'

const PDF_FIELDS: Array<{ key: keyof AccountsPayable; label: string }> = [
  { key: 'nota_compra', label: 'Nota de Compra' },
  { key: 'boleto_pagamento', label: 'Boleto de Pagamento' },
  { key: 'comprovante_pagamento', label: 'Comprovante de Pagamento' },
]

function hasPdf(r: AccountsPayable) {
  return PDF_FIELDS.some((f) => r[f.key])
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Pago', label: 'Pago' },
  { value: 'Cancelado', label: 'Cancelado' },
]
const PAGE_SIZE = 20

export default function AccountsPayablePage() {
  const { user } = useAuth()
  const isGestorCompras = user?.role === 'Gestor de Compras'
  const [records, setRecords] = useState<AccountsPayable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AccountsPayable | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AccountsPayable | null>(null)
  const [page, setPage] = useState(1)
  const [docDialogRecord, setDocDialogRecord] = useState<AccountsPayable | null>(null)
  const [payTarget, setPayTarget] = useState<AccountsPayable | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AccountsPayable | null>(null)
  const [gestorDeleteTarget, setGestorDeleteTarget] = useState<AccountsPayable | null>(null)

  const loadData = async () => {
    try {
      setRecords(await getAccountsPayable())
    } catch {
      toast.error('Erro ao carregar contas a pagar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('accounts_payable', () => {
    loadData()
  })

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      const q = search.toLowerCase()
      return (
        r.description.toLowerCase().includes(q) ||
        (r.expand?.supplier_id?.name || '').toLowerCase().includes(q)
      )
    })
  }, [records, search, statusFilter])

  const summary = useMemo(
    () => ({
      pendente: records
        .filter((r) => r.status === 'Pendente')
        .reduce((s, r) => s + (r.amount || 0), 0),
      pago: records.filter((r) => r.status === 'Pago').reduce((s, r) => s + (r.amount || 0), 0),
      cancelado: records
        .filter((r) => r.status === 'Cancelado')
        .reduce((s, r) => s + (r.amount || 0), 0),
    }),
    [records],
  )

  const { sortedItems, sortState, toggleSort } = useSortableData(filtered)
  const totalPages = Math.ceil(sortedItems.length / PAGE_SIZE)
  const paginated = sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    try {
      await cancelAccountsPayable(cancelTarget.id)
      toast.success('Conta cancelada com sucesso!')
      setCancelTarget(null)
      loadData()
    } catch (err) {
      toast.error(
        getErrorMessage(err) ||
          'Não foi possível cancelar esta conta. Tente novamente ou contate o suporte.',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAccountsPayable(deleteTarget.id)
      toast.success('Conta excluída!')
      setDeleteTarget(null)
    } catch {
      toast.error('Erro ao excluir conta')
    }
  }

  const handleGestorDelete = async () => {
    if (!gestorDeleteTarget) return
    try {
      await cancelGestorAccountsPayable(gestorDeleteTarget.id)
      toast.success('Conta excluída e quantidades devolvidas ao pedido de compra!')
      setGestorDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error(
        getErrorMessage(err) ||
          'Não foi possível excluir esta conta. Verifique se você tem permissão e tente novamente.',
      )
      setGestorDeleteTarget(null)
    }
  }

  const openEdit = (r: AccountsPayable) => {
    if (r.status === 'Pago' && !(isGestorCompras && r.purchase_order_id)) return
    setEditingRecord(r)
    setFormOpen(true)
  }
  const openCreate = () => {
    setEditingRecord(null)
    setFormOpen(true)
  }

  const statusBadge = (s: string) => {
    if (s === 'Pago')
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>
    if (s === 'Cancelado') return <Badge variant="destructive">Cancelado</Badge>
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Pendente
      </Badge>
    )
  }

  const cancelDescription = cancelTarget?.purchase_order_id
    ? 'Tem certeza que deseja cancelar esta conta a pagar gerada por recebimento? As quantidades recebidas serão devolvidas ao pedido de compra, o status do pedido será recalculado e a conta a pagar será excluída.'
    : 'Tem certeza que deseja cancelar esta conta a pagar? O status será alterado para "Cancelado".'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Contas a Pagar</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nova Conta
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-slate-500">Pendente</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.pendente)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-slate-500">Pago</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(summary.pago)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-slate-500">Cancelado</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(summary.cancelado)}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por fornecedor ou descrição..."
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
              <SortableHeader
                columnKey="expand.supplier_id.name"
                sortState={sortState}
                onSort={toggleSort}
              >
                Fornecedor
              </SortableHeader>
              <SortableHeader columnKey="description" sortState={sortState} onSort={toggleSort}>
                Descrição
              </SortableHeader>
              <SortableHeader
                columnKey="amount"
                sortState={sortState}
                onSort={toggleSort}
                className="text-right"
              >
                Valor
              </SortableHeader>
              <SortableHeader columnKey="emission_date" sortState={sortState} onSort={toggleSort}>
                Data de Emissão
              </SortableHeader>
              <SortableHeader columnKey="due_date" sortState={sortState} onSort={toggleSort}>
                Vencimento
              </SortableHeader>
              <SortableHeader columnKey="status" sortState={sortState} onSort={toggleSort}>
                Status
              </SortableHeader>
              <SortableHeader
                columnKey="expand.bank_account_id.name"
                sortState={sortState}
                onSort={toggleSort}
              >
                Banco
              </SortableHeader>
              <StaticHeader className="text-right">Ações</StaticHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => {
                return (
                  <TableRow key={r.id} className="even:bg-slate-50">
                    <TableCell>{r.expand?.supplier_id?.name || '-'}</TableCell>
                    <TableCell className="font-medium">{r.description || '-'}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(r.amount)}
                    </TableCell>
                    <TableCell>
                      {r.emission_date ? formatDateOnlyBR(r.emission_date) : '-'}
                    </TableCell>
                    <TableCell>{r.due_date ? formatDateOnlyBR(r.due_date) : '-'}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {r.expand?.bank_account_id?.trading_name ||
                        r.expand?.bank_account_id?.name ||
                        '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPdf(r) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100"
                            onClick={() => setDocDialogRecord(r)}
                            title="Objeto Digitalizado"
                          >
                            <AdobeReaderIcon className="w-5 h-5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={
                            r.status === 'Pago' && !(isGestorCompras && r.purchase_order_id)
                          }
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          disabled={
                            r.status === 'Pago' && !(isGestorCompras && r.purchase_order_id)
                          }
                          onClick={() => {
                            if (r.status === 'Pago' && isGestorCompras && r.purchase_order_id) {
                              setGestorDeleteTarget(r)
                            } else {
                              setDeleteTarget(r)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {r.status === 'Pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPayTarget(r)}
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                        {r.status === 'Pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelTarget(r)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Página {page} de {totalPages} ({sortedItems.length} registros)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      <AccountsPayableFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editingRecord}
        onSuccess={loadData}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        description="Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita."
      />
      <DigitalDocumentDialog
        open={!!docDialogRecord}
        onOpenChange={(o) => !o && setDocDialogRecord(null)}
        record={docDialogRecord}
        readOnly
      />
      <PayAccountDialog
        open={!!payTarget}
        onOpenChange={(o) => !o && setPayTarget(null)}
        record={payTarget}
        onSuccess={loadData}
      />
      <DeleteDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        description={cancelDescription}
      />
      <DeleteDialog
        open={!!gestorDeleteTarget}
        onOpenChange={(o) => !o && setGestorDeleteTarget(null)}
        onConfirm={handleGestorDelete}
        description="Tem certeza que deseja excluir esta conta a pagar? As quantidades recebidas serão devolvidas ao pedido de compra, o status do pedido será recalculado e a conta a pagar será excluída. Esta ação não pode ser desfeita."
      />
    </div>
  )
}
