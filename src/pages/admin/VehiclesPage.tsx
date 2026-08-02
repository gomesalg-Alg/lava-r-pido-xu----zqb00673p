import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { getAllVehicles, deleteVehicle } from '@/services/vehicles'
import { useRealtime } from '@/hooks/use-realtime'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { SortableHeader, StaticHeader } from '@/components/admin/SortableHeader'
import { useSortableData } from '@/hooks/use-sortable-data'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<RecordModel | null>(null)
  const { sortedItems, sortState, toggleSort } = useSortableData(vehicles)

  const loadData = async () => {
    try {
      const data = await getAllVehicles()
      setVehicles(data)
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('vehicles', () => {
    loadData()
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteVehicle(deleteTarget.id)
      toast.success('Veículo excluído com sucesso!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir veículo')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Veículos</h1>
        <Button asChild size="sm">
          <Link to="/admin/clientes/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo Veículo
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                columnKey="expand.customer_id.name"
                sortState={sortState}
                onSort={toggleSort}
              >
                Cliente
              </SortableHeader>
              <SortableHeader columnKey="placa" sortState={sortState} onSort={toggleSort}>
                Placa
              </SortableHeader>
              <SortableHeader columnKey="type" sortState={sortState} onSort={toggleSort}>
                Tipo
              </SortableHeader>
              <SortableHeader columnKey="brand" sortState={sortState} onSort={toggleSort}>
                Marca
              </SortableHeader>
              <SortableHeader columnKey="model" sortState={sortState} onSort={toggleSort}>
                Modelo
              </SortableHeader>
              <SortableHeader columnKey="year" sortState={sortState} onSort={toggleSort}>
                Ano
              </SortableHeader>
              <SortableHeader columnKey="fuel" sortState={sortState} onSort={toggleSort}>
                Combustível
              </SortableHeader>
              <StaticHeader className="text-right">Ações</StaticHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  Nenhum veículo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((v) => (
                <TableRow key={v.id} className="even:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">
                    {v.expand?.customer_id?.name || '—'}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700 uppercase">
                    {v.placa || '—'}
                  </TableCell>
                  <TableCell className="text-slate-600">{v.type}</TableCell>
                  <TableCell className="text-slate-600">{v.brand}</TableCell>
                  <TableCell className="text-slate-600">{v.model}</TableCell>
                  <TableCell className="text-slate-600">{v.year || '—'}</TableCell>
                  <TableCell className="text-slate-600">{v.fuel || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/veiculos/${v.id}/editar`}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(v)}
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
