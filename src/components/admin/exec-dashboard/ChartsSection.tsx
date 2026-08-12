import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import type { ExecDashboardData } from '@/services/executive-dashboard'
import { BarChart3, CreditCard } from 'lucide-react'

const chartConfig: ChartConfig = { count: { label: 'Ordens', color: 'hsl(var(--primary))' } }

const METHOD_COLORS: Record<string, string> = {
  Dinheiro: 'bg-green-500',
  Pix: 'bg-blue-500',
  'Cartão de Crédito': 'bg-purple-500',
  'Cartão de Débito': 'bg-orange-500',
  Cortesia: 'bg-gray-400',
  Outros: 'bg-slate-400',
  '—': 'bg-slate-300',
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">{msg}</div>
  )
}

export function ChartsSection({
  data,
  loading,
}: {
  data: ExecDashboardData | null
  loading: boolean
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Volume de OS por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : data && data.osVolume.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={data.osVolume}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState msg="Nenhum dado disponível" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : data && data.paymentMethodDist.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.paymentMethodDist.map((p) => (
                <div key={p.method} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{p.method}</span>
                    <span className="text-slate-500">
                      {p.count}x · {p.percentage.toFixed(1)}% · {formatCurrency(p.amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${METHOD_COLORS[p.method] || 'bg-slate-400'}`}
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState msg="Nenhum pagamento registrado" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
