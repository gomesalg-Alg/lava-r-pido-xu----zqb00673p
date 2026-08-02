import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomers, deleteCustomer, type Customer } from '@/services/customers'
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
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { SortableHeader, StaticHeader } from '@/components/admin/SortableHeader'
import { useSortableData } from '@/hooks/use-sortable-data'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const loadData = async () => {
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('customers', () => {
    loadData()
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCustomer(deleteTarget.id)
      toast.success('Cliente excluído com sucesso!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir cliente')
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search) ||
      c.phone.includes(search),
  )
  const { sortedItems, sortState, toggleSort } = useSortableData(filtered)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <Button asChild>
          <Link to="/admin/clientes/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Link>
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
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
                Nome
              </SortableHeader>
              <SortableHeader columnKey="cpf" sortState={sortState} onSort={toggleSort}>
                CPF
              </SortableHeader>
              <SortableHeader columnKey="phone" sortState={sortState} onSort={toggleSort}>
                Telefone
              </SortableHeader>
              <SortableHeader columnKey="email" sortState={sortState} onSort={toggleSort}>
                Email
              </SortableHeader>
              <SortableHeader columnKey="city" sortState={sortState} onSort={toggleSort}>
                Cidade
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
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((c) => (
                <TableRow key={c.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.cpf}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.email || '-'}</TableCell>
                  <TableCell>{c.city ? `${c.city}/${c.state}` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/clientes/${c.id}/editar`}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(c)}
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
