import { useEffect, useState } from 'react'
import { getPageViewsStats, type PageView } from '@/services/analytics'
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
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ total: number; today: number; recent: PageView[] } | null>(
    null,
  )
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getPageViewsStats()
      setStats(data)
    } catch {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Monitoramento</h1>
        <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={loading ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
          Atualizar
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total de Visitas</h3>
            <p className="text-4xl font-bold text-slate-900">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Visitas nas últimas 24h</h3>
            <p className="text-4xl font-bold text-slate-900">{stats?.today || 0}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data / Hora</TableHead>
                <TableHead>Caminho</TableHead>
                <TableHead>Navegador (User Agent)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recent && stats.recent.length > 0 ? (
                stats.recent.map((view) => (
                  <TableRow key={view.id} className="even:bg-slate-50">
                    <TableCell className="font-medium">
                      {new Date(view.created).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{view.path}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={view.user_agent}>
                      {view.user_agent || 'Desconhecido'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-slate-500">
                    Nenhuma visita registrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
