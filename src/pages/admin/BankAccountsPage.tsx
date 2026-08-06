import { useEffect, useState, useMemo } from 'react'
import { getBankAccounts, deleteBankAccount, type BankAccount } from '@/services/bank-accounts'
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
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { BankAccountFormDialog } from '@/components/admin/BankAccountFormDialog'
import { SortableHeader, StaticHeader } from '@/components/admin/SortableHeader'
import { useSortableData } from '@/hooks/use-sortable-data'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function BankAccountsPage() {
  const [records, setRecords] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<BankAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null)

  const loadData = async () => {
    try {
      setRecords(await getBankAccounts())
    } catch {
      toast.error('Erro ao carregar contas bancárias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('bank_accounts', () => {
    loadData()
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.agency.toLowerCase().includes(q) ||
        r.account_number.toLowerCase().includes(q),
    )
  }, [records, search])

  const { sortedItems, sortState, toggleSort } = useSortableData(filtered)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const [arList, apList] = await Promise.all([
        pb.collection('accounts_receivable').getList(1, 1, {
          filter: `bank_account_id = "${deleteTarget.id}"`,
        }),
        pb.collection('accounts_payable').getList(1, 1, {
          filter: `bank_account_id = "${deleteTarget.id}"`,
        }),
      ])
      if (arList.totalItems > 0 || apList.totalItems > 0) {
        toast.error('Não é possível excluir: existem movimentações associadas a esta conta.')
        setDeleteTarget(null)
        return
      }
      await deleteBankAccount(deleteTarget.id)
      toast.success('Conta bancária excluída!')
      setDeleteTarget(null)
    } catch {
      toast.error('Erro ao excluir conta bancária')
    }
  }

  const openEdit = (r: BankAccount) => {
    setEditingRecord(r)
    setFormOpen(true)
  }
  const openCreate = () => {
    setEditingRecord(null)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Contas Bancárias</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nova Conta
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por banco, agência ou conta..."
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
              <SortableHeader columnKey="name" sortState={sortState} onSort={toggleSort}>
                Nome do Banco
              </SortableHeader>
              <SortableHeader columnKey="trading_name" sortState={sortState} onSort={toggleSort}>
                Nome Fantasia
              </SortableHeader>
              <SortableHeader columnKey="agency" sortState={sortState} onSort={toggleSort}>
                Agência
              </SortableHeader>
              <SortableHeader columnKey="account_number" sortState={sortState} onSort={toggleSort}>
                Número da Conta
              </SortableHeader>
              <SortableHeader columnKey="account_type" sortState={sortState} onSort={toggleSort}>
                Tipo de Conta
              </SortableHeader>
              <SortableHeader columnKey="is_active" sortState={sortState} onSort={toggleSort}>
                Ativo
              </SortableHeader>
              <StaticHeader className="text-right">Ações</StaticHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Nenhuma conta bancária encontrada.
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((r) => (
                <TableRow key={r.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-slate-600">{r.trading_name || '-'}</TableCell>
                  <TableCell className="text-slate-600">{r.agency}</TableCell>
                  <TableCell className="text-slate-600">{r.account_number}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                    >
                      {r.account_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.is_active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-500 hover:bg-slate-100"
                      >
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <BankAccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editingRecord}
        onSuccess={loadData}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        description={`Tem certeza que deseja excluir a conta "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
