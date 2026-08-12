import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/format'
import type { ExecDashboardData } from '@/services/executive-dashboard'
import { ClipboardList, Tag, Car, Users } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  'Em Andamento': 'bg-blue-100 text-blue-700',
  Finalizado: 'bg-green-100 text-green-700',
  Pago: 'bg-emerald-100 text-emerald-700',
  Orçamento: 'bg-amber-100 text-amber-700',
  Cancelado: 'bg-red-100 text-red-700',
}

function EmptyMsg({ msg }: { msg: string }) {
  return <p className="text-sm text-slate-400 text-center py-6">{msg}</p>
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function StatusAndServices({
  data,
  loading,
}: {
  data: ExecDashboardData | null
  loading: boolean
}) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard
        icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
        title="Status das Ordens"
      >
        {data.osStatusDist.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.osStatusDist.map((s) => (
              <div
                key={s.status}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-700'}`}
              >
                {s.status}: <span className="font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyMsg msg="Nenhuma ordem no período" />
        )}
      </SectionCard>

      <SectionCard icon={<Tag className="w-5 h-5 text-purple-600" />} title="Top 5 Serviços">
        {data.topServices.length > 0 ? (
          <div className="space-y-2">
            {data.topServices.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{s.name}</span>
                <span className="text-sm text-slate-500">{s.quantity}x</span>
                <span className="text-sm font-medium text-slate-700">
                  {formatCurrency(s.revenue)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyMsg msg="Nenhum serviço vendido" />
        )}
      </SectionCard>

      <SectionCard
        icon={<Car className="w-5 h-5 text-green-600" />}
        title="Veículos por Tipo / Uso"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Tipo</p>
            <div className="space-y-1.5">
              {data.vehiclesByType.map((v) => (
                <div key={v.type} className="flex justify-between text-sm">
                  <span className="text-slate-600">{v.type}</span>
                  <span className="font-medium text-slate-800">{v.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Uso</p>
            <div className="space-y-1.5">
              {data.vehiclesByUse.map((v) => (
                <div key={v.uso} className="flex justify-between text-sm">
                  <span className="text-slate-600">{v.uso}</span>
                  <span className="font-medium text-slate-800">{v.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Users className="w-5 h-5 text-orange-600" />}
        title="Performance dos Operadores"
      >
        {data.operatorPerformance.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Operador</TableHead>
                <TableHead className="text-xs text-right">Itens</TableHead>
                <TableHead className="text-xs text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.operatorPerformance.map((op, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{op.name}</TableCell>
                  <TableCell className="text-sm text-right">{op.itemCount}</TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    {formatCurrency(op.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyMsg msg="Nenhum operador com atividade" />
        )}
      </SectionCard>
    </div>
  )
}
