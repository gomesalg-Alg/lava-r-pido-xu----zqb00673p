import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSuppliers, deleteSupplier, type Supplier } from '@/services/suppliers'
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
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

  const loadData = async () => {
    try {
      const data = await getSuppliers()
      setSuppliers(data)
    } catch {
      toast.error('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('suppliers', () => {
    loadData()
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSupplier(deleteTarget.id)
      toast.success('Fornecedor excluído com sucesso!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir fornecedor')
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.cnpj.includes(search) ||
      s.phone.includes(search),
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
        <Button asChild>
          <Link to="/admin/fornecedores/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
          </Link>
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CNPJ ou telefone..."
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
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.cnpj || '-'}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{s.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/fornecedores/${s.id}/editar`}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(s)}
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
        description="Tem certeza que deseja excluir este fornecedor?"
      />
    </div>
  )
}
