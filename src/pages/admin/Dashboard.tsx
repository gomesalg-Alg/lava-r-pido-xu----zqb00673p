import { useEffect, useState, useCallback } from 'react'
import {
  fetchExecDashboardData,
  type ExecPeriod,
  type ExecDashboardData,
} from '@/services/executive-dashboard'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { SummaryCards } from '@/components/admin/exec-dashboard/SummaryCards'
import { ChartsSection } from '@/components/admin/exec-dashboard/ChartsSection'
import { StatusAndServices } from '@/components/admin/exec-dashboard/StatusAndServices'
import { AlertsSection } from '@/components/admin/exec-dashboard/AlertsSection'

const periods: { value: ExecPeriod; label: string }[] = [
  { value: 'today', label: 'Dia' },
  { value: '7days', label: '7 dias' },
  { value: '30days', label: '30 dias' },
  { value: 'month', label: 'Mês' },
]

export default function AdminDashboard() {
  const [period, setPeriod] = useState<ExecPeriod>('today')
  const [data, setData] = useState<ExecDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchExecDashboardData(period)
      setData(result)
    } catch {
      toast.error('Erro ao carregar dados do painel')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('service_orders', () => loadData())
  useRealtime('service_order_items', () => loadData())
  useRealtime('order_payments', () => loadData())
  useRealtime('customers', () => loadData())
  useRealtime('vehicles', () => loadData())
  useRealtime('products', () => loadData())
  useRealtime('accounts_payable', () => loadData())
  useRealtime('accounts_receivable', () => loadData())

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Painel Executivo</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={loading ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
            Atualizar
          </Button>
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <SummaryCards
        todayRevenue={data?.todayRevenue || 0}
        todayOSCount={data?.todayOSCount || 0}
        averageTicket={data?.averageTicket || 0}
        newCustomersCount={data?.newCustomersCount || 0}
        loading={loading}
      />

      {loading && !data ? (
        <Skeleton className="h-[300px] w-full" />
      ) : (
        <>
          <ChartsSection data={data} loading={loading} />
          <StatusAndServices data={data} loading={loading} />
          <AlertsSection data={data} loading={loading} />
        </>
      )}
    </div>
  )
}
