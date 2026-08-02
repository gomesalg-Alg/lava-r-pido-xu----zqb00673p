import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCardRates, deleteCardRate, type CardRate } from '@/services/card-rates'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CardRateFormDialog } from '@/components/admin/CardRateFormDialog'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { SortableHeader, StaticHeader } from '@/components/admin/SortableHeader'
import { useSortableData } from '@/hooks/use-sortable-data'

export default function CardRatesPage() {
  const { user } = useAuth()
  const [rates, setRates] = useState<CardRate[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CardRate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setRates(await getCardRates())
    } catch {
      toast.error('Erro ao carregar taxas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('card_rates', () => {
    loadData()
  })

  const { sortedItems, sortState, toggleSort } = useSortableData(rates)

  if (user?.role !== 'Administrador') return <Navigate to="/admin" replace />

  const handleAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (rate: CardRate) => {
    setEditing(rate)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCardRate(deleteId)
      toast.success('Bandeira excluída!')
    } catch {
      toast.error('Erro ao excluir bandeira')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Bandeiras e Taxas</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" /> Nova Bandeira
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader columnKey="flag" sortState={sortState} onSort={toggleSort}>
                  Bandeira
                </SortableHeader>
                <SortableHeader columnKey="debit_rate" sortState={sortState} onSort={toggleSort}>
                  Débito (%)
                </SortableHeader>
                <SortableHeader
                  columnKey="credit_1x_rate"
                  sortState={sortState}
                  onSort={toggleSort}
                >
                  1x (%)
                </SortableHeader>
                <SortableHeader
                  columnKey="credit_2x_rate"
                  sortState={sortState}
                  onSort={toggleSort}
                >
                  2x (%)
                </SortableHeader>
                <SortableHeader
                  columnKey="credit_3x_rate"
                  sortState={sortState}
                  onSort={toggleSort}
                >
                  3x (%)
                </SortableHeader>
                <SortableHeader
                  columnKey="credit_4x_rate"
                  sortState={sortState}
                  onSort={toggleSort}
                >
                  4x (%)
                </SortableHeader>
                <SortableHeader
                  columnKey="max_installments"
                  sortState={sortState}
                  onSort={toggleSort}
                >
                  Parc. Máx.
                </SortableHeader>
                <SortableHeader columnKey="is_active" sortState={sortState} onSort={toggleSort}>
                  Status
                </SortableHeader>
                <StaticHeader className="text-right">Ações</StaticHeader>
              </TableRow>{' '}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Nenhuma bandeira encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.flag}</TableCell>
                    <TableCell>{rate.debit_rate?.toFixed(2)}</TableCell>
                    <TableCell>{rate.credit_1x_rate?.toFixed(2)}</TableCell>
                    <TableCell>{rate.credit_2x_rate?.toFixed(2)}</TableCell>
                    <TableCell>{rate.credit_3x_rate?.toFixed(2)}</TableCell>
                    <TableCell>{rate.credit_4x_rate?.toFixed(2)}</TableCell>
                    <TableCell>{rate.max_installments ?? 4}x</TableCell>
                    <TableCell>
                      <span
                        className={rate.is_active ? 'text-green-600 font-medium' : 'text-slate-400'}
                      >
                        {rate.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => setDeleteId(rate.id)}
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
        </CardContent>
      </Card>
      <CardRateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rate={editing}
        onSaved={loadData}
      />
      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={handleDelete}
        description="Tem certeza que deseja excluir esta bandeira? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
