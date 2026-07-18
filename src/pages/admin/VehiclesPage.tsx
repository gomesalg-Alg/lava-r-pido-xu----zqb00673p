import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getAllVehicles } from '@/services/vehicles'
import { useRealtime } from '@/hooks/use-realtime'
import type { RecordModel } from 'pocketbase'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)

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
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
              <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
              <TableHead className="font-semibold text-slate-700">Marca</TableHead>
              <TableHead className="font-semibold text-slate-700">Modelo</TableHead>
              <TableHead className="font-semibold text-slate-700">Ano</TableHead>
              <TableHead className="font-semibold text-slate-700">Combustível</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  Nenhum veículo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v, i) => (
                <TableRow key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <TableCell className="font-medium text-slate-800">
                    {v.expand?.customer_id?.name || '—'}
                  </TableCell>
                  <TableCell className="text-slate-600">{v.type}</TableCell>
                  <TableCell className="text-slate-600">{v.brand}</TableCell>
                  <TableCell className="text-slate-600">{v.model}</TableCell>
                  <TableCell className="text-slate-600">{v.year || '—'}</TableCell>
                  <TableCell className="text-slate-600">{v.fuel || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/veiculos/${v.id}/editar`}>
                        <Pencil className="w-4 h-4" />
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
