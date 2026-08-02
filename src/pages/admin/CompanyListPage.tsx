import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCompany, deleteCompany, type Company } from '@/services/company'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
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
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const { sortedItems, sortState, toggleSort } = useSortableData(companies)

  const loadData = async () => {
    try {
      const c = await getCompany()
      setCompanies(c ? [c] : [])
    } catch {
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('company', () => {
    loadData()
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCompany(deleteTarget.id)
      toast.success('Empresa excluída com sucesso!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir empresa')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Empresa</h1>
        <Button asChild>
          <Link to="/admin/empresa/novo">
            <Plus className="w-4 h-4 mr-2" /> Nova Empresa
          </Link>
        </Button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader columnKey="name" sortState={sortState} onSort={toggleSort}>
                Razão Social
              </SortableHeader>
              <SortableHeader columnKey="trading_name" sortState={sortState} onSort={toggleSort}>
                Nome Fantasia
              </SortableHeader>
              <SortableHeader columnKey="cnpj" sortState={sortState} onSort={toggleSort}>
                CNPJ
              </SortableHeader>
              <SortableHeader columnKey="phone" sortState={sortState} onSort={toggleSort}>
                Telefone
              </SortableHeader>
              <SortableHeader columnKey="home_page" sortState={sortState} onSort={toggleSort}>
                Home Page
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
                  Nenhuma empresa cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((c) => (
                <TableRow key={c.id} className="even:bg-slate-50">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-slate-600">{c.trading_name || '-'}</TableCell>
                  <TableCell className="text-slate-600">{c.cnpj || '-'}</TableCell>
                  <TableCell className="text-slate-600">{c.phone || '-'}</TableCell>
                  <TableCell className="text-slate-600">
                    {c.home_page ? (
                      <a
                        href={c.home_page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {c.home_page}
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/empresa/${c.id}/editar`}>
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
